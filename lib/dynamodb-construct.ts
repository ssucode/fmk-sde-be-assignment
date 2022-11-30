import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';

export class DynamoDbConstruct extends Construct {
  readonly paticipantsTable: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // create paticipants table on DynamoDB
    // eslint-disable-next-line no-new
    this.paticipantsTable = new Table(this, 'paticipants-table', {
      partitionKey: {
        name: 'Email',
        type: AttributeType.STRING,
      },
      tableName: 'paticipants',
      billingMode: BillingMode.PROVISIONED,
    });
  }
}
