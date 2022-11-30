## FMK SDE BE Assignment

[![NPM version](https://badge.fury.io/js/aws-cdk.svg)](https://badge.fury.io/js/aws-cdk)
![Typescript](https://img.shields.io/badge/Typescript-3178C6?style=flat&logo=TypeScript&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/Aws_Lambda-orange?style=flat&logo=awslambda&logoColor=white)
![AWS APIGateway](https://img.shields.io/badge/Aws_APIGateway-blue?style=flat&logo=amazonapigateway&logoColor=white)
![AWS DynamoDB](https://img.shields.io/badge/Aws_DynamoDB-purple?style=flat&logo=amazondynamodb&logoColor=white)

AWS CDK를 기반으로 이벤트 페이지를 통해 전달되는 고객 정보를 수집할 백엔드 API 서비스를 구현합니다.

### Requirements
- [AWS CDK](https://aws.amazon.com/cdk/)
- [Node.js](https://nodejs.org/)
- [Typescript](https://www.typescriptlang.org/)

### Install Essential Tools
- pre-commit
```shell
brew install pre-commit
pre-commit install
```

### Deployment
환경변수 설정 파일 수정하기(local 일 경우)
  1. 최상위 폴더의 .env.dev 파일을 복사하여 같은 폴더에 .env 파일을 생성합니다.(내용은 아래와 같습니다.)
```
TABLE_NAME=paticipants
```
[AWS CDK](https://aws.amazon.com/cdk/)를 사용하여 AWS 계정에 서비스를 배포합니다.
```shell
npm install
cdk synth
cdk bootstrap
npm run deploy:dev
```

### Unit Test
```shell
npm run test
```
![img.png](img.png)


### CI / CD
```
** AWS Secrets setting **
AWS_ACCESS_KEY_ID : AWS IAM을 통해 발급
AWS_SECRET_ACCESS_KEY : AWS IAM을 통해 발급
AWS_REGION : AWS에서 REGION 확인
```

#### 개발자 샌드박스 배포
```
1. git clone
2. branch checkout
3. npm run deploy:dev 명령 실행
```
#### Staging 배포(main-ci-cd.yml)
```
1. PR merge
2. code-test (unit test)
4. AWS Staging 배포 (cdk bootstrap, deploy)
```
#### Production 배포(main-cd.yml)
```
1. PR merge
2. code-test (unit test)
4. AWS Production 배포 (cdk bootstrap, deploy)
```

### 동작 확인
```
1. curl을 이용하여 정상적인 동작 테스트를 합니다.
 - End Point:
        https://xxxxx.execute-api.ap-northeast-2.amazonaws.com/prod/participation/part2@gmail.com
 - Row Data:
    {
        "Email": "part2@gmail.com",
        "Name": "Json Kim",
        "Mobile": "+82102345678",
        "Agree": true
    }
 - Response Data:
     {
        "Agree": true,
        "Mobile": "+82102345678",
        "LastUpdatedAt": "2022-11-30T07:51:06.595Z",
        "CreatedAt": "2022-11-30T07:50:24.354Z",
        "Email": "part2@gmail.com",
        "Name": "Json Kim"
    }
```

![img_1.png](img_1.png)
