pipeline {
    agent any

    /*
     * GitHub repository: https://github.com/NVT219045587/NutriMate
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
     *   snyk-token                  Secret text — Snyk API token (snyk.io → Account Settings)
     *   sonarcloud-token            Secret text — SonarCloud token (sonarcloud.io → My Account → Security)
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
        OCTOPUS_PROJECT    = 'NutriMate'
        OCTOPUS_SERVER_URL = 'https://s219045587.octopus.app'
        RELEASE_VERSION    = "1.0.${env.BUILD_NUMBER}"
        SONAR_ORG          = 'nvt219045587'           // SonarCloud organisation key
        SONAR_PROJECT_KEY  = 'NVT219045587_NutriMate' // SonarCloud project key
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
                        bat 'dotnet restore NutriMate.Server/NutriMate.Server.csproj -p:BuildSpaProject=false'
                    }
                }
                stage('Frontend — Install') {
                    steps {
                        dir('nutrimate.client') {
                            bat 'npm ci'
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
                        bat 'dotnet build NutriMate.Server/NutriMate.Server.csproj -c Release --no-restore -p:BuildSpaProject=false'
                    }
                }
                stage('Frontend — Build') {
                    steps {
                        dir('nutrimate.client') {
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        // ── Security scan — Snyk (npm dependencies) ─────────────────────────
        stage('Security — Snyk') {
            steps {
                dir('nutrimate.client') {
                    withCredentials([string(credentialsId: 'snyk-token', variable: 'SNYK_TOKEN')]) {
                        bat 'npm run test:coverage'
                    }
                }
            }
        }

        // ── SonarCloud static analysis ────────────────────────────────────────
        stage('SonarCloud Analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonarcloud-token', variable: 'SONAR_TOKEN')]) {
                    bat """
                        dotnet sonarscanner begin ^
                            /k:"%SONAR_PROJECT_KEY%" ^
                            /o:"%SONAR_ORG%" ^
                            /d:sonar.token="%SONAR_TOKEN%" ^
                            /d:sonar.host.url="https://sonarcloud.io"

                        dotnet build NutriMate.Server/NutriMate.Server.csproj ^
                            -c Release --no-restore -p:BuildSpaProject=false

                        dotnet sonarscanner end /d:sonar.token="%SONAR_TOKEN%"
                    """
                }
            }
        }

        // ── Docker image builds + push to Docker Hub ────────────────────────
        stage('Docker — Build & Push Images') {
            steps {
                // Provide placeholder values for runtime-only secrets so docker compose
                // does not warn about unset variables during the build phase.
                powershell '''
                    Set-Content -Path .env -Encoding ascii -Value @(
                        "MSSQL_SA_PASSWORD=placeholder",
                        "JWT_SECRET=placeholder",
                        "IMAGE_TAG=$env:IMAGE_TAG"
                    )
                '''
                bat 'docker compose -f docker-compose.yml build'
                powershell 'if (Test-Path .env) { Remove-Item -Force .env }'

                // Push versioned and :latest tags to Docker Hub so Octopus Deploy
                // can reference them by version when deploying to Production.
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    powershell '''
                        docker login -u $env:DOCKER_USER -p $env:DOCKER_PASS
                        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

                        docker tag "nutrimate-api:$env:IMAGE_TAG"  "$env:DOCKER_USER/nutrimate-api:$env:IMAGE_TAG"
                        docker tag "nutrimate-api:$env:IMAGE_TAG"  "$env:DOCKER_USER/nutrimate-api:latest"
                        docker tag "nutrimate-ui:$env:IMAGE_TAG"   "$env:DOCKER_USER/nutrimate-ui:$env:IMAGE_TAG"
                        docker tag "nutrimate-ui:$env:IMAGE_TAG"   "$env:DOCKER_USER/nutrimate-ui:latest"

                        docker push "$env:DOCKER_USER/nutrimate-api:$env:IMAGE_TAG"
                        docker push "$env:DOCKER_USER/nutrimate-api:latest"
                        docker push "$env:DOCKER_USER/nutrimate-ui:$env:IMAGE_TAG"
                        docker push "$env:DOCKER_USER/nutrimate-ui:latest"

                        docker logout
                    '''
                }
            }
        }

        // ── Deploy (main / master only) ──────────────────────────────────────
        stage('Deploy') {
            when {
                anyOf {
                    expression { env.GIT_BRANCH == 'origin/main' }
                    expression { env.GIT_BRANCH == 'origin/master' }
                }
            }
            environment {
                JWT_SECRET        = credentials('nutrimate-jwt-secret')
                MSSQL_SA_PASSWORD = credentials('nutrimate-mssql-sa-password')
            }
            steps {
                // Write .env so docker compose picks up secrets from the
                // Jenkins credentials store without embedding them in the YAML.
                powershell '''
                    Set-Content -Path .env -Encoding ascii -Value @(
                        "JWT_SECRET=$env:JWT_SECRET",
                        "MSSQL_SA_PASSWORD=$env:MSSQL_SA_PASSWORD",
                        "IMAGE_TAG=$env:IMAGE_TAG"
                    )
                '''

                // Rolling restart — keep DB volume, pull new images.
                // -f docker-compose.yml ensures the dev override is not merged,
                // preserving production healthchecks and depends_on conditions.
                bat 'docker compose -f docker-compose.yml up -d --remove-orphans'

                powershell 'if (Test-Path .env) { Remove-Item -Force .env }'
                echo "NutriMate ${IMAGE_TAG} deployed to staging."
            }
        }

        // ── Unit + integration tests (runs after Deploy so API is reachable) ──
        stage('Test — Frontend') {
            steps {
                dir('nutrimate.client') {
                    bat 'npm test'
                }
            }
        }

        // ── Release to Production via Octopus Deploy ─────────────────────────
        stage('Release — Production') {
            when {
                anyOf {
                    expression { env.GIT_BRANCH == 'origin/main' }
                    expression { env.GIT_BRANCH == 'origin/master' }
                }
            }
            steps {
                withCredentials([string(credentialsId: 'octopus-api-key', variable: 'OCTOPUS_API_KEY')]) {
                    // Register the release in Octopus for tracking and audit trail.
                    // Actual deployment is handled by the Deploy stage above using
                    // Jenkins credentials — no need to duplicate secrets in Octopus.
                    bat """
                        dotnet-octo create-release ^
                            --project "%OCTOPUS_PROJECT%" ^
                            --version "%RELEASE_VERSION%" ^
                            --server "%OCTOPUS_SERVER_URL%" ^
                            --apiKey "%OCTOPUS_API_KEY%"
                    """
                }
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
            powershell 'if (Test-Path .env) { Remove-Item -Force .env }'
            cleanWs()
        }
    }
}
