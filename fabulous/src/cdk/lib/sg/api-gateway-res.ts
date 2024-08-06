import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';

export function createApiGatewayResources(
    scope: Construct,

) {
    /*******************
     * DynamoDB tables
     */
    const _connectionTableId = 'ConnectionTable';
    const connectionTable = new dynamodb.Table(scope, _connectionTableId, {
        tableName: `${cdk.Stack.of(scope).stackName}_fabulous_${_connectionTableId}`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const _connectionCounterId = 'ConnectionCounterTable';
    const connectionCounterTable = new dynamodb.Table(scope, _connectionCounterId, {
        tableName: `${cdk.Stack.of(scope).stackName}_fabulous_${_connectionCounterId}`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /*******************
     * Lambda functions
     */
    const _lambdaId = 'ConnectLambda';
    const connectLambda = new lambda.Function(scope, _lambdaId, {
        functionName: `${cdk.Stack.of(scope).stackName}_fabulous_${_lambdaId}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handlers/connect.handler",
        code: lambda.Code.fromAsset('lambda'),
        environment: {
            DDB_TABLE: connectionTable.tableName,
            COUNTER_TABLE: connectionCounterTable.tableName,
        }
    });

    const _disconnectLambdaId = 'DisconnectLambda';
    const disconnectLambda = new lambda.Function(scope, _disconnectLambdaId, {
        functionName: `${cdk.Stack.of(scope).stackName}_fabulous_${_disconnectLambdaId}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handlers/disconnect.handler",
        code: lambda.Code.fromAsset('lambda'),
        environment: {
            DDB_TABLE: connectionTable.tableName,
        }
    });


    /*******************
     * WebSocket API
     */
    const _apiId = 'WebSocketApi';
    const api = new apigatewayv2.WebSocketApi(scope, "WebSocketApi", {
        apiName: `${cdk.Stack.of(scope).stackName}_fabulous_${_apiId}`,
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

    const _stageId = 'DevStage';
    const stage = new apigatewayv2.WebSocketStage(scope, _stageId, {
        stageName: 'dev', // this is the path after the API
        webSocketApi: api,
        autoDeploy: true,
    });
    // @dev set the APIGATEWAY_ENDPOINT environment variable
    const apiGatewayEndpoint = stage.url.replace('wss://', 'https://');


    /*******************
     * Permissions
     */
    connectionTable.grantReadWriteData(connectLambda);
    connectionCounterTable.grantReadWriteData(connectLambda);
    connectionTable.grantReadWriteData(disconnectLambda);

    return {
        api,
        connectLambda,
        disconnectLambda,
        apiGatewayEndpoint,
        connectionTable
    }
}