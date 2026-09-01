pipeline {
    agent any

    parameters {
        string(
            name: 'IMAGE_TAG',
            defaultValue: '',
            description: 'Docker image tag. Leave empty to use BUILD_NUMBER.'
        )

        booleanParam(
            name: 'DEPLOY_TO_GKE',
            defaultValue: true,
            description: 'Deploy the application to GKE'
        )
    }

    environment {
        PROJECT_ID = 'poised-legend-472201-g0'
        REGION = 'asia-south1'
        REPOSITORY = 'gowmitha-ci-cd-repo'
        APP_NAME = 'ci-cd-gke-task'
        CLUSTER_NAME = 'gowmitha-cluster-1'
        GCP_CREDENTIALS = 'jenkins-gcp'
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
                script {
                    def tag = params.IMAGE_TAG?.trim()
                        ? params.IMAGE_TAG.trim()
                        : env.BUILD_NUMBER

                    env.FINAL_IMAGE_TAG = tag

                    echo "Building Docker image with tag: ${env.FINAL_IMAGE_TAG}"

                    sh """
                        docker build \
                        -t ${APP_NAME}:${FINAL_IMAGE_TAG} .
                    """
                }
            }
        }

        stage('Authenticate with GCP') {
            steps {
                echo 'Authenticating Jenkins with Google Cloud...'

                withCredentials([
                    file(
                        credentialsId: "${GCP_CREDENTIALS}",
                        variable: 'GCP_KEY'
                    )
                ]) {
                    sh """
                        gcloud auth activate-service-account \
                        --key-file="\$GCP_KEY"

                        gcloud config set project ${PROJECT_ID}

                        gcloud auth list
                    """
                }
            }
        }

        stage('Configure Docker for Artifact Registry') {
            steps {
                echo 'Configuring Docker authentication for Artifact Registry...'

                sh """
                    gcloud auth configure-docker \
                    ${REGION}-docker.pkg.dev \
                    --quiet
                """
            }
        }

        stage('Tag Docker Image') {
            steps {
                echo 'Tagging Docker image for Artifact Registry...'

                sh """
                    docker tag \
                    ${APP_NAME}:${FINAL_IMAGE_TAG} \
                    ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${APP_NAME}:${FINAL_IMAGE_TAG}
                """
            }
        }

        stage('Push Docker Image') {
            steps {
                echo 'Pushing Docker image to Artifact Registry...'

                sh """
                    docker push \
                    ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${APP_NAME}:${FINAL_IMAGE_TAG}
                """
            }
        }

        stage('Deploy to GKE') {
            when {
                expression {
                    return params.DEPLOY_TO_GKE
                }
            }

            steps {
                echo 'Deploying application to GKE...'

                sh """
                    gcloud container clusters get-credentials ${CLUSTER_NAME} \
                    --region ${REGION} \
                    --project ${PROJECT_ID}
                """

                echo 'Applying Kubernetes manifests...'

                sh '''
                    kubectl apply -f kubernetes/deployment.yaml
                    kubectl apply -f kubernetes/service.yaml
                '''

                echo "Updating GKE deployment with image tag: ${FINAL_IMAGE_TAG}"

                sh """
                    kubectl set image deployment/${APP_NAME} \
                    ${APP_NAME}=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${APP_NAME}:${FINAL_IMAGE_TAG}
                """

                echo 'Waiting for Kubernetes rollout...'

                sh """
                    kubectl rollout status deployment/${APP_NAME} \
                    --timeout=180s
                """

                echo 'Verifying Kubernetes deployment...'

                sh """
                    kubectl get deployment ${APP_NAME}
                    kubectl get pods
                    kubectl get service ${APP_NAME}-service
                """

                echo 'Application successfully deployed to GKE!'
            }
        }
    }

    post {

        success {
            echo "Pipeline completed successfully!"

            echo """
            Docker image pushed:
            ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${APP_NAME}:${FINAL_IMAGE_TAG}
            """
        }

        failure {
            echo 'Pipeline failed. Check the console output for details.'
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}