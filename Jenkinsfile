pipeline {
    agent any

    parameters {

        string(
            name: 'IMAGE_TAG',
            defaultValue: '',
            description: 'Docker image tag. Leave empty to use Jenkins BUILD_NUMBER.'
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

        /*
         * ---------------------------------------------------------
         * STAGE 1: CODE CHECKOUT
         * ---------------------------------------------------------
         */

        stage('Code Checkout') {
            steps {

                echo 'Checking out source code...'

                checkout scm
            }
        }


        /*
         * ---------------------------------------------------------
         * STAGE 2: INSTALL DEPENDENCIES
         * ---------------------------------------------------------
         */

        stage('Install Dependencies') {
            steps {

                echo 'Installing Node.js dependencies...'

                sh 'npm ci'
            }
        }


        /*
         * ---------------------------------------------------------
         * STAGE 3: RUN TESTS
         * ---------------------------------------------------------
         */

        stage('Run Tests') {
            steps {

                echo 'Running unit tests...'

                sh 'npm test'
            }
        }


        /*
         * ---------------------------------------------------------
         * STAGE 4: BUILD DOCKER IMAGE
         * ---------------------------------------------------------
         */

        stage('Build Docker Image') {

            steps {

                script {

                    /*
                     * If IMAGE_TAG parameter is provided,
                     * use it.
                     *
                     * Otherwise use Jenkins BUILD_NUMBER.
                     */

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


        /*
         * ---------------------------------------------------------
         * STAGE 5: AUTHENTICATE WITH GCP
         * ---------------------------------------------------------
         */

        stage('Authenticate with GCP') {

            steps {

                echo 'Authenticating Jenkins with Google Cloud...'

                /*
                 * jenkins-gcp is a Jenkins Secret File credential.
                 *
                 * The JSON service-account key is never written
                 * directly inside the Jenkinsfile.
                 */

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


        /*
         * ---------------------------------------------------------
         * STAGE 6: CONFIGURE DOCKER AUTHENTICATION
         * ---------------------------------------------------------
         */

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


        /*
         * ---------------------------------------------------------
         * STAGE 7: TAG DOCKER IMAGE
         * ---------------------------------------------------------
         */

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


        /*
         * ---------------------------------------------------------
         * STAGE 8: PUSH DOCKER IMAGE
         * ---------------------------------------------------------
         */

        stage('Push Docker Image') {

            steps {

                echo 'Pushing Docker image to Artifact Registry...'

                sh """
                    docker push \
                    ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${APP_NAME}:${FINAL_IMAGE_TAG}
                """
            }
        }


        /*
         * ---------------------------------------------------------
         * STAGE 9: DEPLOY TO GKE
         * ---------------------------------------------------------
         */

        stage('Deploy to GKE') {

            /*
             * Deploy only when DEPLOY_TO_GKE is TRUE.
             *
             * If the user selects FALSE,
             * Jenkins skips this stage.
             */

            when {

                expression {
                    params.DEPLOY_TO_GKE
                }
            }

            steps {

                echo 'Deploying application to GKE...'


                /*
                 * Get GKE cluster credentials
                 */

                sh '''
                    gcloud container clusters get-credentials gowmitha-cluster-1 \
                        --region asia-south1 \
                        --project poised-legend-472201-g0
                '''


                /*
                 * Verify cluster connectivity
                 */

                echo 'Checking GKE cluster connectivity...'

                sh '''
                    kubectl get nodes
                '''


                /*
                 * Apply Kubernetes Deployment
                 */

                echo 'Applying Kubernetes deployment...'

                sh '''
                    kubectl apply -f kubernetes/deployment.yaml
                '''


                /*
                 * Apply Kubernetes Service
                 */

                echo 'Applying Kubernetes service...'

                sh '''
                    kubectl apply -f kubernetes/service.yaml
                '''


                /*
                 * Update deployment with the newly
                 * pushed Docker image.
                 *
                 * IMPORTANT:
                 * Use FINAL_IMAGE_TAG instead of IMAGE_TAG.
                 */

                echo "Updating GKE deployment with image tag: ${FINAL_IMAGE_TAG}"

                sh '''
                    kubectl set image deployment/ci-cd-gke-task \
                        ci-cd-gke-task=asia-south1-docker.pkg.dev/poised-legend-472201-g0/gowmitha-ci-cd-repo/ci-cd-gke-task:${FINAL_IMAGE_TAG}
                '''


                /*
                 * Wait until the new version
                 * is successfully rolled out.
                 */

                echo 'Waiting for Kubernetes rollout...'

                sh '''
                    kubectl rollout status deployment/ci-cd-gke-task \
                        --timeout=180s
                '''


                /*
                 * Display final deployment information
                 */

                echo 'Checking deployed resources...'

                sh '''
                    kubectl get deployment ci-cd-gke-task

                    kubectl get pods

                    kubectl get service ci-cd-gke-task-service
                '''


                echo 'Application successfully deployed to GKE!'
            }
        }
    }


    /*
     * ---------------------------------------------------------
     * POST ACTIONS
     * ---------------------------------------------------------
     */

    post {

        success {

            echo 'Pipeline completed successfully!'

            echo """
            ================================================
            Docker image pushed successfully:

            ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${APP_NAME}:${FINAL_IMAGE_TAG}

            GKE Cluster:
            ${CLUSTER_NAME}

            Deployment:
            ${APP_NAME}

            ================================================
            """
        }


        failure {

            echo '''
            ================================================
            Pipeline failed.

            Please check the Jenkins console output
            for the failed stage and error details.
            ================================================
            '''
        }


        always {

            echo 'Pipeline execution completed.'
        }
    }
}