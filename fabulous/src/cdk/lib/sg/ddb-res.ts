import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export function createWebScraperResources(scope: Construct,): Record<string, dynamodb.Table> {
  /*******************
   * DynamoDB tables
   */
  const messageTableId = 'MessageTable';
  const regularTable = new dynamodb.Table(scope, 'RegularTable', {
    partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  return {
    regularTable,
    //  vectorTable 
  };
}