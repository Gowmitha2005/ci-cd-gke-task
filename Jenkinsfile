pipeline {
    agent any

    environment {
        APP_NAME = 'ci-cd-gke-task'
        IMAGE_TAG = "${BUILD_NUMBER}"

        PROJECT_ID = 'poised-legend-472201-g0'
        REGION = 'asia-south1'
        REPOSITORY = 'gowmitha-ci-cd-repo'

        IMAGE_URI = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${APP_NAME}:${IMAGE_TAG}"
    }

    stages {

        stage('Code Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running unit tests...'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh 'docker build -t ${APP_NAME}:${IMAGE_TAG} .'
            }
        }

        stage('Authenticate with GCP') {
            steps {
                echo 'Authenticating Jenkins with Google Cloud...'

                withCredentials([file(credentialsId: 'jenkins-gcp', variable: 'GCP_KEY')]) {
                    sh '''
                        gcloud auth activate-service-account \
                            --key-file="$GCP_KEY"

                        gcloud config set project "$PROJECT_ID"
                    '''
                }
            }
        }

        stage('Test GKE Access') {
          steps {
            echo 'Testing Jenkins access to GKE...'

            withCredentials([
              file(
                credentialsId: 'jenkins-gcp',
                variable: 'GCP_KEY'
              )
            ]) {
                sh '''
                gcloud auth activate-service-account \
                    --key-file="$GCP_KEY"

                gcloud config set project "$PROJECT_ID"

                gcloud container clusters get-credentials \
                    gowmitha-cluster-1 \
                    --region asia-south1 \
                    --project "$PROJECT_ID"

                kubectl get nodes
                '''
            }
        }

        stage('Configure Docker for Artifact Registry') {
            steps {
                echo 'Configuring Docker authentication for Artifact Registry...'

                sh '''
                    gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
                '''
            }
        }

        stage('Tag Docker Image') {
            steps {
                echo 'Tagging Docker image for Artifact Registry...'

                sh '''
                    docker tag ${APP_NAME}:${IMAGE_TAG} ${IMAGE_URI}
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                echo 'Pushing Docker image to Artifact Registry...'

                sh '''
                    docker push ${IMAGE_URI}
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Docker image pushed: ${IMAGE_URI}"
        }

        failure {
            echo 'Pipeline failed. Check the console output for details.'
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}