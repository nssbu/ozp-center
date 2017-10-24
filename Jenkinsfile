pipeline {
    agent {
        label 'KZ01_TI-141_OZP_CentOS'
    }
    stages {
        stage('Clear the workspace') {
            steps {
                sh 'sudo rm -rf *'
            }
        }
        stage('Install NodeJS and NPM') {
            steps {
                sh '''
                  sudo yum -y update
                  sudo yum -y install gcc-c++ make
                  curl -sL https://rpm.nodesource.com/setup_5.x | sudo -E bash -
                  sudo yum -y install nodejs
                '''
            }
        }
        stage('Checkout Repo') {
            steps {
                git url: 'http://www.github.com/mark-betters-ozp-forks/ozp-center.git', branch: 'master'
            }
        }
        stage('Build') {
            steps {
                sh '''
                  npm install bower gulp
                  npm install; npm run build; npm run tarDistDate
                  mv *.tar.gz center.tar.gz
                '''
            }
        }
    }
}