import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class FmkSdeBeAssignmentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // participation lambda를 연동한다.
    const participationLambdaFunction = new NodejsFunction(this, 'ParticipationLambdaFunction', {
      functionName: 'participation-lambda-function',
      entry: path.resolve(__dirname, '../lambda/participants/put.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X
    });

    // API Gateway 를 'Participation-API-Service' 라는 이름의 REST API 리소스로 정의
    const api = new apigateway.RestApi(this, 'participation-api', {
      restApiName: 'Participation-API-Service'
    });

    // API Gateway 의 /participation 경로에 구현되어 있는 participationLambdaFunction 함수 추가(테스트로 get 호출)
    const participationApi = api.root.addResource('participation');
    participationApi.addMethod('GET', new apigateway.LambdaIntegration(participationLambdaFunction));
  }
}
