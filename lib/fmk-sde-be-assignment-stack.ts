import { Stack, StackProps, Arn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { DynamoDbConstruct } from './dynamodb-construct';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class FmkSdeBeAssignmentStack extends Stack {
  private readonly authorizer: apigateway.IAuthorizer;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const paticipantsDb = new DynamoDbConstruct(this, 'paticipants-db');
    const environment = {
      TABLE_NAME: Arn.extractResourceName(paticipantsDb.paticipantsTable.tableArn, 'table'),
    };
    // participation lambda를 연동한다.
    const participationLambdaFunction = new NodejsFunction(this, 'ParticipationLambdaFunction', {
      functionName: 'participation-lambda-function',
      description: '고객정보수집: 고객의 정보를 등록 및 수정',
      entry: path.resolve(__dirname, '../lambda/participants/put.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      environment,
    });

    // Lambda 와 DynamoDB 의 role을 추가한다.
    participationLambdaFunction.role?.attachInlinePolicy(
      new Policy(this, 'participation-update-policy', {
        statements: [
          new PolicyStatement({
            actions: ['dynamodb:PartiQLInsert', 'dynamodb:PartiQLUpdate', 'dynamodb:PartiQLSelect'],
            resources: [paticipantsDb.paticipantsTable.tableArn],
          }),
        ],
      }),
    );

    // API Gateway 를 'Participation-API-Service' 라는 이름의 REST API 리소스로 정의
    const api = new apigateway.RestApi(this, 'participation-api', {
      restApiName: 'Participation-API-Service',
    });

    // API Gateway 의 /participation 경로에 구현되어 있는 participationLambdaFunction 함수 추가
    const participationApi = api.root.addResource('participation').addResource('{email}');
    participationApi.addMethod('PUT', new apigateway.LambdaIntegration(participationLambdaFunction), {
      authorizer: this.authorizer,
    });
  }
}
