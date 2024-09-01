import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import * as path from 'path';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';


export class SGWebSocketStack extends cdk.Stack {
  public readonly wsApi: apigatewayv2.WebSocketApi;
  public readonly apiGatewayEndpoint: string;
  public readonly connectLambda: lambda.Function;
  public readonly disconnectLambda: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*******************
     * DynamoDB Tables
     */
    const connectionTable = new dynamodb.Table(this, 'ConnectionTable', {
      tableName: `${this.stackName}_ConnectionTable`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const connectionCounterTable = new dynamodb.Table(this, 'ConnectionCounterTable', {
      tableName: `${this.stackName}_ConnectionCounterTable`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /*******************
     * Lambda Functions
     */
    this.connectLambda = new lambda.Function(this, 'ConnectLambda', {
      // this.connectLambda = new NodejsFunction(this, 'ConnectLambda', {
      functionName: `${this.stackName}_ConnectLambda`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/connect.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', 'services', 'websocket-handler', 'dist'),

      ),
      environment: {
        DDB_TABLE: connectionTable.tableName,
        COUNTER_TABLE: connectionCounterTable.tableName,
      },
    });

    this.disconnectLambda = new lambda.Function(this, 'DisconnectLambda', {
      functionName: `${this.stackName}_DisconnectLambda`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/disconnect.handler',
      code: lambda.Code.fromAsset(
        // 'lambda'
        path.join(__dirname, '..', '..', 'services', 'websocket-handler', 'dist'),
      ),
      environment: {
        DDB_TABLE: connectionTable.tableName,
      },
    });

    /*******************
     * WebSocket API
     */
    this.wsApi = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
      apiName: `${this.stackName}_WebSocketApi`,
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('ConnectIntegration', this.connectLambda),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration('DisconnectIntegration', this.disconnectLambda),
      },
    });

    const stage = new apigatewayv2.WebSocketStage(this, 'DevStage', {
      stageName: 'dev',
      webSocketApi: this.wsApi,
      autoDeploy: true,
    });

    this.apiGatewayEndpoint = stage.url.replace('wss://', 'https://');

    // Export the WebSocket API ID and the API Gateway endpoint
    new cdk.CfnOutput(this, 'WebSocketApiId', {
      value: this.wsApi.apiId,
      exportName: 'WebSocketApiId',
    });



    /*******************
     * Permissions
     */
    connectionTable.grantReadWriteData(this.connectLambda);
    connectionCounterTable.grantReadWriteData(this.connectLambda);
    connectionTable.grantReadWriteData(this.disconnectLambda);
  }
}
