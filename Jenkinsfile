pipeline {
    agent any

    /*
     * GitHub repository: https://github.com/NVT219045587/NutriMate
     *
     * Required Jenkins plugins:
     *   - Git Plugin
     *   - Pipeline (workflow-aggregator)
     *   - GitHub Integration Plugin  (enables githubPush() trigger)
     *   - Email Extension Plugin     (enables emailext step)
     *   - Octopus Deploy Plugin      (enables octopusCreateRelease/DeployRelease steps)
     *
     * Required Jenkins credentials (Manage Jenkins → Credentials → Global):
     *   github-pat                  Username/Password — GitHub username + PAT
     *   dockerhub-credentials       Username/Password — Docker Hub username + password
     *   octopus-api-key             Secret text — Octopus Deploy API key
     *   nutrimate-jwt-secret        Secret text — JWT signing key (≥32 chars)
     *   nutrimate-mssql-sa-password Secret text — SA password (SQL Server rules)
     *
     * Required Jenkins tools (Manage Jenkins → Tools):
     *   NodeJS-20   Node.js 20 installation
     *   dotnet-8    .NET SDK 8 installation
     *
     * Octopus server must be registered in Manage Jenkins → System → Octopus Deploy Plugin
     * with Server ID "octopus-server".
     *
     * SMTP must be configured in Manage Jenkins → System → Extended E-mail Notification.
     */

    environment {
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
        GITHUB_REPO     = 'https://github.com/NVT219045587/NutriMate'
        NOTIFY_EMAIL    = 'viettung0901+jenkinlog@gmail.com'
        OCTOPUS_PROJECT = 'NutriMate'
        OCTOPUS_SERVER  = 'octopus-server'   // Server ID from Jenkins → System → Octopus Deploy Plugin
        RELEASE_VERSION = "1.0.${env.BUILD_NUMBER}"
    }

    // Fires automatically when GitHub sends a push webhook to Jenkins.
    // Requires "GitHub hook trigger for GITScm polling" enabled on the job
    // and a webhook configured in the GitHub repo settings.
    triggers {
        githubPush()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Repo: ${GITHUB_REPO}  |  Branch: ${env.BRANCH_NAME ?: 'local'}  |  Build: ${IMAGE_TAG}"
            }
        }

        // ── Restore / Install ────────────────────────────────────────────────
        stage('Restore & Install') {
            parallel {
                stage('Backend — Restore') {
                    steps {
                        sh 'dotnet restore NutriMate.Server/NutriMate.Server.csproj -p:BuildSpaProject=false'
                    }
                }
                stage('Frontend — Install') {
                    steps {
                        dir('nutrimate.client') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        // ── Build ────────────────────────────────────────────────────────────
        stage('Build') {
            parallel {
                stage('Backend — Build') {
                    steps {
                        sh '''
                            dotnet build NutriMate.Server/NutriMate.Server.csproj \
                                -c Release --no-restore \
                                -p:BuildSpaProject=false
                        '''
                    }
                }
                stage('Frontend — Build') {
                    steps {
                        dir('nutrimate.client') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        // ── Docker image builds + push to Docker Hub ────────────────────────
        stage('Docker — Build & Push Images') {
            steps {
                // Build images. IMAGE_TAG is a docker-compose variable (used in
                // image: tag), not a Dockerfile ARG — pass as env var.
                // -f docker-compose.yml skips the override (no dev healthcheck overrides).
                sh "IMAGE_TAG=${IMAGE_TAG} docker compose -f docker-compose.yml build"

                // Push versioned and :latest tags to Docker Hub so Octopus Deploy
                // can reference them by version when deploying to Production.
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        docker tag nutrimate-api:${IMAGE_TAG}  ${DOCKER_USER}/nutrimate-api:${IMAGE_TAG}
                        docker tag nutrimate-api:${IMAGE_TAG}  ${DOCKER_USER}/nutrimate-api:latest
                        docker tag nutrimate-ui:${IMAGE_TAG}   ${DOCKER_USER}/nutrimate-ui:${IMAGE_TAG}
                        docker tag nutrimate-ui:${IMAGE_TAG}   ${DOCKER_USER}/nutrimate-ui:latest

                        docker push ${DOCKER_USER}/nutrimate-api:${IMAGE_TAG}
                        docker push ${DOCKER_USER}/nutrimate-api:latest
                        docker push ${DOCKER_USER}/nutrimate-ui:${IMAGE_TAG}
                        docker push ${DOCKER_USER}/nutrimate-ui:latest

                        docker logout
                    '''
                }
            }
        }

        // ── Deploy (main / master only) ──────────────────────────────────────
        stage('Deploy') {
            when {
                anyOf { branch 'main'; branch 'master' }
            }
            environment {
                JWT_SECRET        = credentials('nutrimate-jwt-secret')
                MSSQL_SA_PASSWORD = credentials('nutrimate-mssql-sa-password')
            }
            steps {
                // Write .env so docker compose picks up secrets from the
                // Jenkins credentials store without embedding them in the YAML.
                sh '''
                    printf "JWT_SECRET=%s\\nMSSQL_SA_PASSWORD=%s\\nIMAGE_TAG=%s\\n" \
                        "$JWT_SECRET" "$MSSQL_SA_PASSWORD" "$IMAGE_TAG" > .env
                '''

                // Rolling restart — keep DB volume, pull new images.
                // -f docker-compose.yml ensures the dev override is not merged,
                // preserving production healthchecks and depends_on conditions.
                sh 'docker compose -f docker-compose.yml up -d --remove-orphans'

                sh 'rm -f .env'
                echo "NutriMate ${IMAGE_TAG} deployed to staging."
            }
        }

        // ── Release to Production via Octopus Deploy ─────────────────────────
        stage('Release — Production') {
            when {
                anyOf { branch 'main'; branch 'master' }
            }
            steps {
                // Create a release in Octopus referencing the versioned images.
                // Octopus resolves the Docker image versions via its Docker Hub feed.
                octopusCreateRelease(
                    serverId:       "${OCTOPUS_SERVER}",
                    project:        "${OCTOPUS_PROJECT}",
                    releaseVersion: "${RELEASE_VERSION}",
                    defaultPackageVersion: "${IMAGE_TAG}"
                )

                // Promote the release to the Production environment.
                // waitForDeployment: true blocks the pipeline until Octopus
                // reports success or failure, so the post section reflects the
                // actual production deployment outcome.
                octopusDeployRelease(
                    serverId:          "${OCTOPUS_SERVER}",
                    project:           "${OCTOPUS_PROJECT}",
                    releaseVersion:    "${RELEASE_VERSION}",
                    environment:       'Production',
                    waitForDeployment: true,
                    cancelOnTimeout:   true,
                    deploymentTimeout: '00:15:00'
                )

                echo "NutriMate ${RELEASE_VERSION} released to Production."
            }
        }
    }

    post {
        success {
            emailext(
                subject: "✅ NutriMate #${IMAGE_TAG} — Build Passed [${env.BRANCH_NAME ?: 'unknown'}]",
                to: "${NOTIFY_EMAIL}",
                mimeType: 'text/html',
                attachLog: false,
                body: """
                    <html>
                    <body style="font-family:Arial,sans-serif;color:#333;">
                        <h2 style="color:#2e7d32;">&#x2705; Build Passed</h2>
                        <table cellpadding="6" style="border-collapse:collapse;">
                            <tr><td><b>Job:</b></td><td>\${JOB_NAME}</td></tr>
                            <tr><td><b>Build:</b></td><td>#\${BUILD_NUMBER}</td></tr>
                            <tr><td><b>Branch:</b></td><td>${env.BRANCH_NAME ?: 'unknown'}</td></tr>
                            <tr><td><b>Duration:</b></td><td>\${BUILD_DURATION}</td></tr>
                            <tr><td><b>URL:</b></td><td><a href="\${BUILD_URL}">\${BUILD_URL}</a></td></tr>
                        </table>
                        <h3>Console Log</h3>
                        <pre style="background:#f5f5f5;padding:10px;font-size:12px;">\${BUILD_LOG, maxLines=200, escapeHtml=true}</pre>
                    </body>
                    </html>
                """
            )
        }
        failure {
            emailext(
                subject: "❌ NutriMate #${IMAGE_TAG} — Build FAILED [${env.BRANCH_NAME ?: 'unknown'}]",
                to: "${NOTIFY_EMAIL}",
                mimeType: 'text/html',
                attachLog: true,
                body: """
                    <html>
                    <body style="font-family:Arial,sans-serif;color:#333;">
                        <h2 style="color:#c62828;">&#x274C; Build Failed</h2>
                        <table cellpadding="6" style="border-collapse:collapse;">
                            <tr><td><b>Job:</b></td><td>\${JOB_NAME}</td></tr>
                            <tr><td><b>Build:</b></td><td>#\${BUILD_NUMBER}</td></tr>
                            <tr><td><b>Branch:</b></td><td>${env.BRANCH_NAME ?: 'unknown'}</td></tr>
                            <tr><td><b>Duration:</b></td><td>\${BUILD_DURATION}</td></tr>
                            <tr><td><b>URL:</b></td><td><a href="\${BUILD_URL}">\${BUILD_URL}</a></td></tr>
                        </table>
                        <h3>Console Log</h3>
                        <pre style="background:#f5f5f5;padding:10px;font-size:12px;">\${BUILD_LOG, maxLines=200, escapeHtml=true}</pre>
                    </body>
                    </html>
                """
            )
        }
        always {
            sh 'rm -f .env'
            cleanWs()
        }
    }
}
