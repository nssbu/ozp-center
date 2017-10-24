pipeline {
    agent {
        label 'KZ01_TI-141_OZP_CentOS'
    }
    stages {
        stage('Install NodeJS and NPM') {
            steps {
                sh '''
                  sudo yum update
                  sudo yum install -y gcc-c++ make
                  curl -sL https://rpm.nodesource.com/setup_5.x | sudo -E bash -
                  sudo yum install -y nodejs
                '''
            }
        }
        stage('Build') {
            steps {
                sh '''
                  sudo npm install bower gulp
                  sudo npm install; sudo npm run build; sudo npm run tarDistDate
                  mv *.tar.gz center.tar.gz
                '''
            }
        }
    }
}