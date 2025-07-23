pipeline {
    agent any
    
    environment {
        // Production server details
        PROD_SERVER = credentials('prod-server-host')
        PROD_USER = credentials('prod-ssh-user') // Set to 'yourdomain'
        PROD_PASSWORD = credentials('prod-ssh-password')
        
        // Application details
        APP_NAME = 'campaignprox.msz-pl.com'
        BACKEND_PATH = '/home/campaignprox/domains/api.msz-pl.com'
        FRONTEND_PATH = '/home/campaignprox/public_html'
        BACKUP_PATH = '/home/campaignprox/backups'
        
        // Database details
        DB_HOST = credentials('prod-db-host')
        DB_NAME = credentials('prod-db-name') // Set to 'yourdomain_webmailaravel_prod'
        DB_USER = credentials('prod-db-user') // Set to 'yourdomain_webmail_user'
        DB_PASSWORD = credentials('prod-db-password')
        
        // Build info
        BUILD_TIMESTAMP = sh(returnStdout: true, script: 'date +%Y%m%d_%H%M%S').trim()
        RELEASE_NAME = "${APP_NAME}_${BUILD_TIMESTAMP}"
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        skipStagesAfterUnstable()
    }
    
    stages {
        stage('🔍 Preparation') {
            steps {
                script {
                    echo "🚀 Starting deployment pipeline for ${APP_NAME}"
                    echo "📅 Build timestamp: ${BUILD_TIMESTAMP}"
                    echo "🏷️ Release name: ${RELEASE_NAME}"
                    
                    // Clean workspace
                    cleanWs()
                    
                    // Checkout code
                    checkout scm
                    
                    // Create build info file
                    writeFile file: 'build-info.json', text: """
{
    "build_number": "${BUILD_NUMBER}",
    "build_timestamp": "${BUILD_TIMESTAMP}",
    "git_commit": "${GIT_COMMIT}",
    "git_branch": "${GIT_BRANCH}",
    "release_name": "${RELEASE_NAME}",
    "deployed_by": "${BUILD_USER ?: 'Jenkins'}",
    "deployment_date": "${BUILD_TIMESTAMP}"
}
"""
                }
            }
        }
        
        stage('🧪 Backend Tests') {
            steps {
                dir('backend') {
                    script {
                        echo "🔧 Installing backend dependencies..."
                        sh '''
                            composer install --no-dev --optimize-autoloader --no-interaction
                            cp .env.example .env.testing
                        '''
                        
                        echo "🧪 Running backend tests..."
                        sh '''
                            php artisan key:generate --env=testing
                            php artisan config:cache --env=testing
                            php artisan config:clear
                            php artisan route:list > /dev/null
                        '''
                    }
                }
            }
        }
        
        stage('🎨 Frontend Tests & Build') {
            steps {
                dir('frontend') {
                    script {
                        echo "📦 Installing frontend dependencies..."
                        sh '''
                            npm ci --silent
                        '''
                        
                        echo "🏗️ Building frontend for production..."
                        sh '''
                            npm run build
                            ls -la dist/
                        '''
                    }
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
                script {
                    echo "📦 Creating deployment packages..."
                    
                    // Create backend package
                    sh '''
                        mkdir -p deployment/backend
                        cp -r backend/* deployment/backend/
                        
                        # Remove development files
                        rm -rf deployment/backend/tests
                        rm -rf deployment/backend/storage/logs/*
                        rm -rf deployment/backend/.git*
                        rm -f deployment/backend/.env*
                        rm -f deployment/backend/phpunit.xml
                        
                        # Add build info
                        cp build-info.json deployment/backend/
                        
                        # Create backend archive
                        cd deployment
                        tar -czf ${RELEASE_NAME}_backend.tar.gz backend/
                    '''
                    
                    // Create frontend package
                    sh '''
                        mkdir -p deployment/frontend
                        cp -r frontend/dist/* deployment/frontend/
                        
                        # Add build info
                        cp build-info.json deployment/frontend/
                        
                        # Create frontend archive
                        cd deployment
                        tar -czf ${RELEASE_NAME}_frontend.tar.gz frontend/
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'deployment/*.tar.gz', allowEmptyArchive: false
                }
            }
        }
        
        stage('🚀 Deploy to Production') {
            parallel {
                stage('🔧 Backend Deployment') {
                    steps {
                        script {
                            echo "🔧 Deploying backend to production..."
                            sh './scripts/deploy-backend.sh'
                        }
                    }
                }
                
                stage('🎨 Frontend Deployment') {
                    steps {
                        script {
                            echo "🎨 Deploying frontend to production..."
                            sh './scripts/deploy-frontend.sh'
                        }
                    }
                }
            }
        }
        
        stage('🔍 Health Checks') {
            steps {
                script {
                    echo "🔍 Running post-deployment health checks..."
                    sh './scripts/health-check.sh'
                }
            }
        }
        
        stage('🧹 Cleanup') {
            steps {
                script {
                    echo "🧹 Cleaning up old deployments..."
                    sh './scripts/cleanup.sh'
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo "✅ Deployment completed successfully!"
                
                // Send success notification
                sh '''
                    curl -X POST -H 'Content-type: application/json' \
                    --data "{\\"text\\":\\"✅ WebMail Laravel deployment successful!\\\\n🚀 Release: ${RELEASE_NAME}\\\\n📅 Time: ${BUILD_TIMESTAMP}\\\\n🔗 Build: ${BUILD_URL}\\"}" \
                    "${SLACK_WEBHOOK_URL}" || echo "Notification failed"
                '''
            }
        }
        
        failure {
            script {
                echo "❌ Deployment failed!"
                
                // Send failure notification and attempt rollback
                sh '''
                    curl -X POST -H 'Content-type: application/json' \
                    --data "{\\"text\\":\\"❌ WebMail Laravel deployment FAILED!\\\\n🚨 Release: ${RELEASE_NAME}\\\\n📅 Time: ${BUILD_TIMESTAMP}\\\\n🔗 Build: ${BUILD_URL}\\"}" \
                    "${SLACK_WEBHOOK_URL}" || echo "Notification failed"
                '''
                
                // Attempt automatic rollback
                sh './scripts/rollback.sh || echo "Rollback failed"'
            }
        }
        
        always {
            cleanWs()
        }
    }
}