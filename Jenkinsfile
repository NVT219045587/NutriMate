pipeline {
    agent any

    /*
     * Required Jenkins credentials (Manage Jenkins → Credentials):
     *   nutrimate-jwt-secret        Secret text — JWT signing key (≥32 chars)
     *   nutrimate-mssql-sa-password Secret text — SA password (SQL Server rules)
     *
     * Required Jenkins tools (Global Tool Configuration):
     *   NodeJS-20   Node.js 20 installation
     *   dotnet-8    .NET SDK 8 installation
     */

    environment {
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.BRANCH_NAME ?: 'local'}  |  Build: ${IMAGE_TAG}"
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

        // ── Docker image builds (always, every branch) ───────────────────────
        stage('Docker — Build Images') {
            steps {
                sh "docker compose build --build-arg IMAGE_TAG=${IMAGE_TAG}"
            }
        }

        // ── Deploy (main / master only) ──────────────────────────────────────
        stage('Deploy') {
            when {
                anyOf { branch 'main'; branch 'master' }
            }
            environment {
                JWT_SECRET          = credentials('nutrimate-jwt-secret')
                MSSQL_SA_PASSWORD   = credentials('nutrimate-mssql-sa-password')
            }
            steps {
                // Write .env file so docker compose picks up secrets from the
                // Jenkins credentials store without embedding them in the YAML.
                sh '''
                    printf "JWT_SECRET=%s\\nMSSQL_SA_PASSWORD=%s\\nIMAGE_TAG=%s\\n" \
                        "$JWT_SECRET" "$MSSQL_SA_PASSWORD" "$IMAGE_TAG" > .env
                '''

                // Rolling restart: bring up new images, keep DB data volume.
                sh 'docker compose up -d --remove-orphans'

                // Remove .env so secrets don't persist on the agent filesystem.
                sh 'rm -f .env'

                echo "NutriMate ${IMAGE_TAG} deployed."
            }
        }
    }

    post {
        success { echo "Build ${IMAGE_TAG} succeeded." }
        failure { echo "Build ${IMAGE_TAG} failed."  }
        always  {
            // Never leave a .env with secrets behind on failure.
            sh 'rm -f .env'
            cleanWs()
        }
    }
}
