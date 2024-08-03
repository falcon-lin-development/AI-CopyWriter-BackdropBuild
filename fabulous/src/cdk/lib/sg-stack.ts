import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

// interface SGStackProps extends cdk.StackProps {
//   snsResultArn: string;
// }


export class SGStack extends cdk.Stack {
  public readonly snsToUs: sns.Topic; // SNS topic to forward messages to US
  // public readonly sqsResultFromUs: sqs.Queue; // SQS queue to get results from US
  public readonly resultProcessorLambda: lambda.Function; // Lambda function to process results from US

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /*******************
     * DynamoDB tables
     */
    const regularTable = new dynamodb.Table(this, 'RegularTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

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
    const connectLambda = new lambda.Function(this, 'ConnectLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "connect.handler",
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        REGULAR_TABLE: regularTable.tableName,
      }
    });

    const disconnectLambda = new lambda.Function(this, "DisconnectLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "disconnect.handler",
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        REGULAR_TABLE: regularTable.tableName,
      }
    });

    const messageLambda = new lambda.Function(this, 'MessageLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "message.handler",
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        REGULAR_TABLE: regularTable.tableName,
        // SNS_REQUEST_TOPIC: snsRequest.topicArn,
        SNS_REQUEST_TOPIC: snsToUs.topicArn,
      }
    });

    const pingLambda = new lambda.Function(this, 'PingLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "lambda/ping.handler",
      code: lambda.Code.fromAsset('lambda'),
    });


    /*******************
     * WebSocket API
     */
    const api = new apigatewayv2.WebSocketApi(this, "WebSocketApi", {
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "ConnectIntegration",
          connectLambda,
        )
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DisconnectIntegration",
          disconnectLambda
        ),
      },
    });

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

    const stage = new apigatewayv2.WebSocketStage(this, 'DevStage', {
      webSocketApi: api,
      stageName: 'dev',
      autoDeploy: true,
    });
    // @dev set the APIGATEWAY_ENDPOINT environment variable
    const apiGatewayEndpoint = stage.url.replace('wss://', 'https://');
    messageLambda.addEnvironment("APIGATEWAY_ENDPOINT", apiGatewayEndpoint);
    pingLambda.addEnvironment("APIGATEWAY_ENDPOINT", apiGatewayEndpoint);


    /*******************
     * Lambda request/response functions
     */
    const resultProcessorLambda = new lambda.Function(this, 'ResultProcessorLambda', {
      functionName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "resultProcessor.handler",
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        APIGATEWAY_ENDPOINT: apiGatewayEndpoint,
        REGULAR_TABLE: regularTable.tableName,
      }
    });
    this.resultProcessorLambda = resultProcessorLambda;

    /*******************
     * Permissions
     */
    regularTable.grantWriteData(connectLambda);
    regularTable.grantWriteData(disconnectLambda);
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
  }
}
