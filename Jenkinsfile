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
        stage('Infrastructure Setup') {
            steps {
                sh '''
                    echo "Setting up build infrastructure..."
                    echo "Application: ${APP_NAME}"
                    echo "Release: ${RELEASE_NAME}"
                    echo "Build Timestamp: ${BUILD_TIMESTAMP}"
                    echo "Frontend Target: ${FRONTEND_PATH}"
                    echo "Backend Target: ${BACKEND_PATH}"
                    echo "Backup Location: ${BACKUP_PATH}"
                    echo "Infrastructure setup completed!"
                '''
            }
        }
        
        stage('Environment Setup') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Installing Composer dependencies..."
                                composer install --no-dev --optimize-autoloader
                                
                                echo "Generating build information..."
                                echo "{\\"build_date\\": \\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\\", \\"commit\\": \\"${GIT_COMMIT}\\", \\"branch\\": \\"${GIT_BRANCH}\\", \\"build_number\\": \\"${BUILD_NUMBER}\\"}" > build-info.json
                                
                                echo "Backend dependencies installed!"
                            '''
                        }
                    }
                }
                
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            sh '''
                                echo "Installing Node.js dependencies..."
                                npm ci
                                
                                echo "Building production assets..."
                                npm run build
                                
                                echo "Generating build information..."
                                echo "{\\"build_date\\": \\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\\", \\"commit\\": \\"${GIT_COMMIT}\\", \\"branch\\": \\"${GIT_BRANCH}\\", \\"build_number\\": \\"${BUILD_NUMBER}\\"}" > dist/build-info.json
                                
                                echo "Frontend build completed!"
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Package Deployment') {
            steps {
                sh '''
                    echo "Creating deployment package..."
                    rm -rf deployment
                    mkdir -p deployment/backend deployment/frontend
                    
                    echo "Packaging backend..."
                    rsync -av --exclude='node_modules' --exclude='.git' --exclude='tests' --exclude='storage/logs/*' backend/ deployment/backend/
                    cp backend/.env.production.example deployment/backend/.env
                    cp backend/build-info.json deployment/backend/
                    rm -rf deployment/backend/tests deployment/backend/storage/logs/* deployment/backend/.git* deployment/backend/phpunit.xml
                    mkdir -p deployment/frontend
                    cp -r frontend/dist/* deployment/frontend/
                    [ -f frontend/dist/build-info.json ] && cp frontend/dist/build-info.json deployment/frontend/ || echo "Frontend build-info.json not found"
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'deployment/**/*', allowEmptyArchive: false
                }
            }
        }
        
        stage('Deploy to Production') {
            parallel {
                stage('Deploy Backend') {
                    steps {
                        sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/deploy-backend.sh"
                    }
                }
                
                stage('Deploy Frontend') {
                    steps {
                        sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/deploy-frontend.sh"
                    }
                }
            }
        }
        
        stage('Setup Supervisor') {
            steps {
                sh """
                    sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} '
                        echo "Updating supervisor configuration for PHP 8.3..."
                        
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
                        
                        echo "Reloading supervisor configuration..."
                        sudo supervisorctl reread
                        sudo supervisorctl update
                        
                        # Stop any existing workers first
                        sudo supervisorctl stop laravel-worker:* || true
                        
                        # Start workers
                        echo "Starting Laravel workers..."
                        sudo supervisorctl start laravel-worker:* || true
                        
                        echo "Current supervisor status:"
                        sudo supervisorctl status
                    '
                """
            }
        }
        
        stage('Production Diagnostics') {
            steps {
                sh """
                    sshpass -p ${PROD_PASSWORD} scp -o StrictHostKeyChecking=no scripts/diagnose-production.sh ${PROD_USER}@${PROD_SERVER}:/tmp/diagnose-production.sh
                    sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} '
                        chmod +x /tmp/diagnose-production.sh
                        /tmp/diagnose-production.sh
                        rm /tmp/diagnose-production.sh
                    '
                """
            }
        }
        
        stage('Fix Production Issues') {
            steps {
                sh """
                    sshpass -p ${PROD_PASSWORD} scp -o StrictHostKeyChecking=no scripts/fix-production-issues.sh ${PROD_USER}@${PROD_SERVER}:/tmp/fix-production-issues.sh
                    sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} '
                        chmod +x /tmp/fix-production-issues.sh
                        /tmp/fix-production-issues.sh
                        rm /tmp/fix-production-issues.sh
                    '
                """
            }
        }
        
        stage('Fix 405 Errors') {
            steps {
                sh """
                    sshpass -p ${PROD_PASSWORD} scp -o StrictHostKeyChecking=no scripts/fix-405-error.sh ${PROD_USER}@${PROD_SERVER}:/tmp/fix-405-error.sh
                    sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} '
                        chmod +x /tmp/fix-405-error.sh
                        /tmp/fix-405-error.sh
                        rm /tmp/fix-405-error.sh
                    '
                """
            }
        }
        
        stage('Health Checks') {
            steps {
                sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/health-check.sh"
            }
        }
        
        stage('Cleanup') {
            steps {
                sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/cleanup.sh"
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            script {
                try {
                    sh '''
                        if [ -n "${SLACK_WEBHOOK}" ]; then
                            curl -X POST -H 'Content-type: application/json' \
                                --data '{"text":"Deployment successful! Application: '${APP_NAME}', Release: '${RELEASE_NAME}'"}' \
                                "${SLACK_WEBHOOK}"
                            echo "Deployment successful! (Slack notification sent)"
                        else
                            echo "Deployment successful! (Slack webhook not configured)"
                        fi
                    '''
                } catch (Exception e) {
                    echo "Deployment successful! (Slack webhook not configured)"
                }
            }
        }
        failure {
            script {
                try {
                    sh '''
                        if [ -n "${SLACK_WEBHOOK}" ]; then
                            curl -X POST -H 'Content-type: application/json' \
                                --data '{"text":"Deployment failed! Application: '${APP_NAME}', Build: '${BUILD_NUMBER}'"}' \
                                "${SLACK_WEBHOOK}"
                            echo "Deployment failed! (Slack notification sent)"
                        else
                            echo "Deployment failed! (Slack webhook not configured)"
                        fi
                    '''
                } catch (Exception e) {
                    echo "Deployment failed! (Slack webhook not configured)"
                }
            }
        }
    }
}
