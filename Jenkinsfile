pipeline {

    agent any

    environment {

        IMAGE_NAME_FNT = 'frontend-image'
        CONTAINER_NAME_FNT = 'frontend-container'
        GIT_CREDENTIALS = 'Github-Compose'

    }

    stages {

        stage('Clone Frontend Repo') {

            steps {

                git credentialsId: "${GIT_CREDENTIALS}",
                url: 'https://github.com/247HealthMedPro/asure-frontend-version1.git',
                branch: 'main'
            }
        }

        stage('Build and Deploy Frontend') {

            steps {

                sh """

                    echo "Building frontend image..."

                    docker build \
                    -t ${IMAGE_NAME_FNT}:${BUILD_NUMBER} \
                    -t ${IMAGE_NAME_FNT}:latest .

                    echo "Taking frontend logs backup..."

                    /home/ubuntu/projects/asure-frontend-version1/backup-docker-logs.sh || true

                    echo "Stopping old container..."

                    docker stop ${CONTAINER_NAME_FNT} || true

                    docker rm ${CONTAINER_NAME_FNT} || true

                    echo "Starting frontend container..."

                    docker compose up -d

                """
            }
        }
    }

    post {

        success {

            echo 'Frontend deployment successful'
        }

        failure {

            echo 'Frontend deployment failed'
        }
    }
}
