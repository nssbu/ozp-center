pipeline {
    agent {
        label 'KZ01_TI-141_OZP_CentOS'
    }
    stages {
        stage('Install NodeJS and NPM') {
            steps {
                sh '''
                  yum update
                  yum install -y gcc-c++ make
                  curl -sL https://rpm.nodesource.com/setup_5.x | sudo -E bash -
                  yum install -y nodejs
                '''
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