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
        PHP_CMD = 'php8.3'
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
                            if ! command -v virtualmin &>/dev/null || ! virtualmin list-domains | grep -q "${PRIMARY_DOMAIN}" || ! virtualmin list-domains | grep -q "${SUB_DOMAIN}" || ! command -v rsync &>/dev/null || ! command -v sqlite3 &>/dev/null || ! dpkg -l | grep -q php8.3-sqlite3 || ! [ -f /etc/supervisor/conf.d/laravel-worker.conf ]; then
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
                                echo "ERROR: PHP 8.3 not found, checking alternatives..."
                                for ver in php8.2 php8.1 php7.1; do
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
                            AVAILABLE=\$(df -h / | grep -v Filesystem | awk '"'"'{print \$4}'"'"' | sed '"'"'s/G//'"'"')
                            if [ "\${AVAILABLE%.*}" -lt 1 ]; then
                                echo "ERROR: Insufficient disk space (only \${AVAILABLE}G available)"
                                exit 1
                            fi
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
                        echo "📋 Updating supervisor configuration for PHP 8.3..."
                        
                        # Force update the supervisor configuration with correct PHP version
                        sudo mkdir -p /var/log/campaignprox
                        sudo chown campaignprox:campaignprox /var/log/campaignprox
                        
                        sudo tee /etc/supervisor/conf.d/laravel-worker.conf > /dev/null <<EOF
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php8.3 ${BACKEND_PATH}/artisan queue:work --sleep=3 --tries=3 --timeout=60
autostart=true
autorestart=true
user=campaignprox
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/campaignprox/laravel-worker.log
stopwaitsecs=60
EOF
                        
                        echo "🔄 Reloading supervisor configuration..."
                        sudo supervisorctl reread
                        sudo supervisorctl update
                        
                        # Stop any existing workers first
                        sudo supervisorctl stop laravel-worker:* || true
                        
                        # Start workers
                        echo "� Starting Laravel workers..."
                        sudo supervisorctl start laravel-worker:* || true
                        
                        echo "📊 Current supervisor status:"
                        sudo supervisorctl status
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
            script {
                try {
                    def slackWebhook = env.SLACK_WEBHOOK_URL ?: ''
                    if (slackWebhook) {
                        sh """
                            curl -X POST -H 'Content-type: application/json' \
                            --data "{\\"text\\":\\"✅ Deployment successful!\\\\n🚀 Release: ${RELEASE_NAME}\\\\n📅 Time: ${BUILD_TIMESTAMP}\\\\n🔗 Build: ${BUILD_URL}\\"}" \
                            "${slackWebhook}" || echo "Notification failed"
                        """
                    } else {
                        echo "✅ Deployment successful! (Slack webhook not configured)"
                    }
                } catch (Exception e) {
                    echo "Notification failed: ${e.getMessage()}"
                }
            }
        }
        failure {
            script {
                try {
                    def slackWebhook = env.SLACK_WEBHOOK_URL ?: ''
                    if (slackWebhook) {
                        sh """
                            curl -X POST -H 'Content-type: application/json' \
                            --data "{\\"text\\":\\"❌ Deployment FAILED!\\\\n🚨 Release: ${RELEASE_NAME}\\\\n📅 Time: ${BUILD_TIMESTAMP}\\\\n🔗 Build: ${BUILD_URL}\\"}" \
                            "${slackWebhook}" || echo "Notification failed"
                        """
                    } else {
                        echo "❌ Deployment FAILED! (Slack webhook not configured)"
                    }
                } catch (Exception e) {
                    echo "Notification failed: ${e.getMessage()}"
                }
                
                try {
                    if (fileExists('scripts/rollback.sh')) {
                        sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/rollback.sh || echo 'Rollback failed'"
                    }
                } catch (Exception e) {
                    echo "Rollback failed: ${e.getMessage()}"
                }
            }
        }
        always {
            cleanWs()
        }
    }
}