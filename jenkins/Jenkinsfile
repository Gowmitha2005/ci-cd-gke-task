pipeline {
    agent any

    environment {
        APP_NAME = 'ci-cd-gke-task'
        IMAGE_TAG = "${BUILD_NUMBER}"
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
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the console output for details.'
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}