import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class VAWebScraperStack extends cdk.Stack {
  public readonly regularTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*******************
     * DynamoDB Table for Web Scraper
     */
    this.regularTable = new dynamodb.Table(this, 'RegularTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // You can add more resources for the web scraper here (e.g., Lambda functions, S3 buckets, etc.)
  }
}
