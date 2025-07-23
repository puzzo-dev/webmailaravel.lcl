pipeline {
    agent { label 'docker-agent-php' }
    
    environment {
        PROD_SERVER = credentials('prod-server-host')
        PROD_USER = credentials('prod-ssh-user')
        PROD_PASSWORD = credentials('prod-ssh-password')
        APP_NAME = 'campaignprox.msz-pl.com'
        BACKEND_PATH = '/home/campaignprox/domains/api.msz-pl.com/public_html'
        FRONTEND_PATH = '/home/campaignprox/public_html'
        BACKUP_PATH = '/home/campaignprox/domains/api.msz-pl.com/backups'
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
                    
                    cleanWs()
                    checkout scm
                    
                    def deployer = 'Jenkins'
                    try {
                        wrap([$class: 'BuildUser']) {
                            if (currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause')) {
                                deployer = env.BUILD_USER ?: 'Jenkins'
                                echo "👤 Build triggered by user: ${deployer}"
                            } else {
                                echo "👤 Build triggered by SCM or timer, using default deployer: ${deployer}"
                            }
                        }
                    } catch (Exception e) {
                        echo "⚠️ Failed to get BUILD_USER: ${e.message}. Using default: ${deployer}"
                    }
                    
                    writeFile file: 'build-info.json', text: """
{
    "build_number": "${BUILD_NUMBER}",
    "build_timestamp": "${BUILD_TIMESTAMP}",
    "git_commit": "${GIT_COMMIT}",
    "git_branch": "${GIT_BRANCH}",
    "release_name": "${RELEASE_NAME}",
    "deployed_by": "${deployer}",
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
                            sed -i 's/DB_CONNECTION=.*/DB_CONNECTION=sqlite/' .env.testing
                            sed -i 's/DB_DATABASE=.*/DB_DATABASE=:memory:/' .env.testing
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
                    
                    sh '''
                        mkdir -p deployment/backend
                        cp -r backend/* deployment/backend/
                        rm -rf deployment/backend/tests
                        rm -rf deployment/backend/storage/logs/*
                        rm -rf deployment/backend/.git*
                        rm -f deployment/backend/.env*
                        rm -f deployment/backend/phpunit.xml
                        cp build-info.json deployment/backend/
                        cd deployment
                        tar -czf ${RELEASE_NAME}_backend.tar.gz backend/
                    '''
                    
                    sh '''
                        mkdir -p deployment/frontend
                        cp -r frontend/dist/* deployment/frontend/
                        cp build-info.json deployment/frontend/
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
        
        stage('🔍 Debug Scripts') {
            steps {
                sh '''
                    echo "Listing scripts directory:"
                    ls -l scripts/
                    echo "Checking rollback.sh existence:"
                    if [ -f scripts/rollback.sh ]; then
                        echo "rollback.sh exists"
                    else
                        echo "rollback.sh does not exist"
                    fi
                '''
            }
        }
        
        stage('🚀 Deploy to Production') {
            parallel {
                stage('🔧 Backend Deployment') {
                    steps {
                        script {
                            echo "🔧 Deploying backend to production..."
                            sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/deploy-backend.sh"
                        }
                    }
                }
                
                stage('🎨 Frontend Deployment') {
                    steps {
                        script {
                            echo "🎨 Deploying frontend to production..."
                            sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/deploy-frontend.sh"
                        }
                    }
                }
            }
        }
        
        stage('🔍 Health Checks') {
            steps {
                script {
                    echo "🔍 Running post-deployment health checks..."
                    sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/health-check.sh"
                }
            }
        }
        
        stage('🧹 Cleanup') {
            steps {
                script {
                    echo "🧹 Cleaning up old deployments..."
                    sh "RELEASE_NAME=${RELEASE_NAME} ./scripts/cleanup.sh"
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo "✅ Deployment completed successfully!"
                if (env.SLACK_WEBHOOK_URL) {
                    sh """
                        curl -X POST -H 'Content-type: application/json' \
                        --data '{\"text\":\"✅ WebMail Laravel deployment successful!\\n🚀 Release: ${RELEASE_NAME}\\n📅 Time: ${BUILD_TIMESTAMP}\\n🔗 Build: ${BUILD_URL}\"}' \
                        \"${SLACK_WEBHOOK_URL}\" || echo 'Notification failed'
                    """
                } else {
                    echo "SLACK_WEBHOOK_URL not set, skipping notification"
                }
            }
        }
        
        failure {
            script {
                echo "❌ Deployment failed!"
                if (env.SLACK_WEBHOOK_URL) {
                    sh """
                        curl -X POST -H 'Content-type: application/json' \
                        --data '{\"text\":\"❌ WebMail Laravel deployment FAILED!\\n🚨 Release: ${RELEASE_NAME}\\n📅 Time: ${BUILD_TIMESTAMP}\\n🔗 Build: ${BUILD_URL}\"}' \
                        \"${SLACK_WEBHOOK_URL}\" || echo 'Notification failed'
                    """
                } else {
                    echo "SLACK_WEBHOOK_URL not set, skipping notification"
                }
                
                sh '''
                    echo "Checking rollback.sh in post block:"
                    ls -l scripts/ || echo "scripts/ directory not found"
                    if [ -f scripts/rollback.sh ]; then
                        echo "Executing rollback.sh"
                        RELEASE_NAME=${RELEASE_NAME} ./scripts/rollback.sh || echo "Rollback failed"
                    else
                        echo "Rollback script not found in post block"
                    fi
                '''
            }
        }
        
        always {
            cleanWs()
        }
    }
}