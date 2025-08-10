pipeline {
    agent { label 'docker-agent-php' }
    
    environment {
        PROD_SERVER = credentials('prod-server-host')
        PROD_USER = credentials('prod-ssh-user')
        PROD_PASSWORD = credentials('prod-ssh-password')
        APP_NAME = 'campaignprox.msz-pl.com'
        PRIMARY_DOMAIN = 'msz-pl.com'
        SUB_DOMAIN = 'api.msz-pl.com'
        BACKEND_PATH = "/home/campaignprox/domains/${SUB_DOMAIN}/public_html"
        FRONTEND_PATH = '/home/campaignprox/public_html'
        BACKUP_PATH = "/home/campaignprox/domains/${SUB_DOMAIN}/public_html/backups"
        BUILD_TIMESTAMP = sh(returnStdout: true, script: 'date +%Y%m%d_%H%M%S').trim()
        RELEASE_NAME = "${APP_NAME}_${BUILD_TIMESTAMP}"
        PHP_CMD = 'php8.2'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        skipStagesAfterUnstable()
    }
    
    stages {
        stage('🏗️ Infrastructure Setup') {
            steps {
                script {
                    echo "🏗️ Checking and setting up Virtualmin infrastructure..."
                    // Upload setup-production.sh
                    sh """
                        sshpass -p ${PROD_PASSWORD} scp -o StrictHostKeyChecking=no scripts/setup-production.sh ${PROD_USER}@${PROD_SERVER}:/tmp/setup-production.sh
                    """
                    // Check and run setup if needed
                    sh """
                        sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} '
                            set -e
                            if ! command -v virtualmin &>/dev/null || ! virtualmin list-domains | grep -q "${PRIMARY_DOMAIN}" || ! virtualmin list-domains | grep -q "${SUB_DOMAIN}" || ! command -v rsync &>/dev/null || ! command -v sqlite3 &>/dev/null || ! dpkg -l | grep -q php8.2-sqlite3 || ! [ -f /etc/supervisor/conf.d/laravel-worker.conf ]; then
                                echo "Infrastructure setup required, running setup-production.sh..."
                                sudo bash /tmp/setup-production.sh
                                rm /tmp/setup-production.sh
                            else
                                echo "Infrastructure already set up, skipping..."
                            fi
                        '
                    """
                }
            }
        }
        
        stage('🔍 Pre-Deployment Validation') {
            steps {
                script {
                    echo "🔍 Validating production environment..."
                    sh """
                        sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} '
                            set -e
                            if ! command -v ${PHP_CMD} &>/dev/null; then
                                echo "ERROR: PHP 8.2 not found, checking alternatives..."
                                for ver in php8.3 php8.1 php7.1; do
                                    if command -v \$ver &>/dev/null; then
                                        echo "Found \$ver"
                                        exit 0
                                    fi
                                done
                                echo "ERROR: No compatible PHP version found"
                                exit 1
                            fi
                            if [ ! -d "${FRONTEND_PATH}" ] || [ ! -d "${BACKEND_PATH}" ]; then
                                echo "ERROR: Virtualmin directories missing"
                                exit 1
                            fi
                            df -h / | grep -v Filesystem | awk "{if(\$4<\"1G\") {print \"ERROR: Insufficient disk space\"; exit 1}}"
                        '
                    """
                }
            }
        }
        
        stage('🔍 Preparation') {
            steps {
                script {
                    echo "🚀 Starting deployment pipeline for ${APP_NAME}"
                    cleanWs()
                    checkout scm
                    writeFile file: 'build-info.json', text: """
{
    "build_number": "${BUILD_NUMBER}",
    "build_timestamp": "${BUILD_TIMESTAMP}",
    "git_commit": "${GIT_COMMIT}",
    "git_branch": "${GIT_BRANCH}",
    "release_name": "${RELEASE_NAME}",
    "deployed_by": "${env.BUILD_USER ?: 'Jenkins'}",
    "deployment_date": "${BUILD_TIMESTAMP}"
}
"""
                }
            }
        }
        
        stage('🧪 Backend Tests') {
            steps {
                dir('backend') {
                    sh '''
                        composer install --no-dev --optimize-autoloader --no-interaction
                        cp .env.example .env.testing
                        sed -i 's/DB_CONNECTION=.*/DB_CONNECTION=sqlite/' .env.testing
                        sed -i 's/DB_DATABASE=.*/DB_DATABASE=:memory:/' .env.testing
                        php artisan key:generate --env=testing
                        php artisan config:cache --env=testing
                        php artisan config:clear
                        php artisan route:list > /dev/null
                    '''
                }
            }
        }
        
        stage('🎨 Frontend Tests & Build') {
            steps {
                dir('frontend') {
                    sh '''
                        npm ci --silent
                        if [ -f .env ]; then cp .env .env.example.dev; fi
                        cp .env.example.production .env
                        npm run build
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'frontend/dist/**/*', allowEmptyArchive: false
                }
            }
        }
        
        stage('📦 Create Deployment Package') {
            steps {
                sh '''
                    mkdir -p deployment/backend
                    cp -r backend/* deployment/backend/
                    cp backend/.env.production.example deployment/backend/.env
                    cp build-info.json deployment/backend/
                    rm -rf deployment/backend/tests deployment/backend/storage/logs/* deployment/backend/.git* deployment/backend/phpunit.xml
                    mkdir -p deployment/frontend
                    cp -r frontend/dist/* deployment/frontend/
                    cp build-info.json deployment/frontend/
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'deployment/**/*', allowEmptyArchive: false
                }
            }
        }
        
        stage('🚀 Deploy to Production') {
            parallel {
                stage('🔧 Backend Deployment') {
                    steps {
                        sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/deploy-backend.sh"
                    }
                }
                stage('🎨 Frontend Deployment') {
                    steps {
                        sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/deploy-frontend.sh"
                    }
                }
            }
        }
        
        stage('🔧 Setup Supervisor') {
            steps {
                sh """
                    sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} '
                        if [ -f /etc/supervisor/conf.d/laravel-worker.conf ]; then
                            sudo supervisorctl restart laravel-worker:*
                        fi
                    '
                """
            }
        }
        
        stage('🔍 Health Checks') {
            steps {
                sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/health-check.sh"
            }
        }
        
        stage('🧹 Cleanup') {
            steps {
                sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/cleanup.sh"
            }
        }
    }
    
    post {
        success {
            sh """
                if [ -n "${SLACK_WEBHOOK_URL}" ]; then
                    curl -X POST -H 'Content-type: application/json' \
                    --data "{\"text\":\"✅ Deployment successful!\\n🚀 Release: ${RELEASE_NAME}\\n📅 Time: ${BUILD_TIMESTAMP}\\n🔗 Build: ${BUILD_URL}\"}" \
                    "${SLACK_WEBHOOK_URL}" || echo "Notification failed"
                fi
            """
        }
        failure {
            sh """
                if [ -n "${SLACK_WEBHOOK_URL}" ]; then
                    curl -X POST -H 'Content-type: application/json' \
                    --data "{\"text\":\"❌ Deployment FAILED!\\n🚨 Release: ${RELEASE_NAME}\\n📅 Time: ${BUILD_TIMESTAMP}\\n🔗 Build: ${BUILD_URL}\"}" \
                    "${SLACK_WEBHOOK_URL}" || echo "Notification failed"
                fi
                if [ -f scripts/rollback.sh ]; then
                    RELEASE_NAME=${RELEASE_NAME} ./scripts/rollback.sh || echo "Rollback failed"
                fi
            """
        }
        always {
            cleanWs()
        }
    }
}