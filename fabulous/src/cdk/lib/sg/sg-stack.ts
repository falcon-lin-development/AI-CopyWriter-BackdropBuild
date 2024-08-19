import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

import { createWebScraperResources } from './ddb-res';
import { createApiGatewayResources } from './api-gateway-res';

export class SGStack extends cdk.Stack {
  public readonly snsToUs: sns.Topic; // SNS topic to forward messages to US
  // public readonly sqsResultFromUs: sqs.Queue; // SQS queue to get results from US
  public readonly resultProcessorLambda: lambda.Function; // Lambda function to process results from US

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /*******************
     * DynamoDB tables
     */
    const { regularTable } = createWebScraperResources(this);

    /*******************
     * S3 buckets
     */
    // const s3BucketSG = new s3.Bucket(this, 'S3BucketSG');

    /*******************
     * SNS topics & SQS queues
     * Cross regoin 
     */
    const snsToUs = new sns.Topic(this, 'SnsToUs', {
      topicName: cdk.PhysicalName.GENERATE_IF_NEEDED,
    }); // send messages to US
    this.snsToUs = snsToUs;

    /*******************
     * Lambda functions
     */

    const messageLambda = new lambda.Function(this, 'MessageLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/message.handler",
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        REGULAR_TABLE: regularTable.tableName,
        // SNS_REQUEST_TOPIC: snsRequest.topicArn,
        SNS_REQUEST_TOPIC: snsToUs.topicArn,
      }
    });

    const pingLambda = new lambda.Function(this, 'PingLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/ping.handler",
      code: lambda.Code.fromAsset('lambda'),
    });


    /*******************
     * WebSocket API
     */
    const { api, apiGatewayEndpoint } = createApiGatewayResources(this)
    api.addRoute('ping', {
      integration: new WebSocketLambdaIntegration(
        "PingIntegration",
        pingLambda
      ),
    });

    api.addRoute('message', {
      integration: new WebSocketLambdaIntegration(
        "MessageIntegration",
        messageLambda
      ),
    });
    messageLambda.addEnvironment("APIGATEWAY_ENDPOINT", apiGatewayEndpoint);
    pingLambda.addEnvironment("APIGATEWAY_ENDPOINT", apiGatewayEndpoint);


    /*******************
     * Lambda request/response functions
     */

    const _resultProcessorLambdaId = 'ResultProcessorLambda';
    const resultProcessorLambda = new lambda.Function(this, _resultProcessorLambdaId, {
      // functionName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      functionName: `${this.stackName}_fabulous_${_resultProcessorLambdaId}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/resultProcessor.handler",
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        APIGATEWAY_ENDPOINT: apiGatewayEndpoint,
        REGULAR_TABLE: regularTable.tableName,
      }
    });
    this.resultProcessorLambda = resultProcessorLambda;


    /*******************
     * Web Scraper Lambda
     */
    // const webScraperLambda = new lambda.Function(this, 'webScraperLambda', {
    //   runtime: lambda.Runtime.PYTHON_3_11,
    //   handler: 'main.handler',
    //   code: lambda.Code.fromAsset('lambda-py/webscraper_function'),
    //   memorySize: 1024,
    //   timeout: cdk.Duration.minutes(10),
    //   environment: {
    //     TABLE_NAME: vectorTable.tableName,
    //   },
    // });

    /*******************
     * Permissions
     */
    regularTable.grantReadWriteData(messageLambda);
    snsToUs.grantPublish(messageLambda);
    api.grantManageConnections(messageLambda);
    regularTable.grantReadWriteData(pingLambda);
    api.grantManageConnections(pingLambda);
    regularTable.grantReadWriteData(resultProcessorLambda);
    api.grantManageConnections(resultProcessorLambda);

    resultProcessorLambda.addPermission('AllowSNSInvocation', { // explicit permission
      principal: new iam.ServicePrincipal('sns.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: `arn:aws:sns:us-east-1:${this.account}:*SnsResultToSG*`
    });

    // vectorTable.grantReadWriteData(webScraperLambda);
    // // Grant Bedrock permissions to Lambda
    // webScraperLambda.addToRolePolicy(new iam.PolicyStatement({
    //   actions: ['bedrock:InvokeModel'],
    //   /**
    //    * @TODO only need embedding model
    //    */
    //   resources: ['*'],
    // }));
  }
}
