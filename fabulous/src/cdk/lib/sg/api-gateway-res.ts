import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';


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
    const wsApi = new apigatewayv2.WebSocketApi(scope, "WebSocketApi", {
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
        webSocketApi: wsApi,
        autoDeploy: true,
    });
    // @dev set the APIGATEWAY_ENDPOINT environment variable
    const apiGatewayEndpoint = stage.url.replace('wss://', 'https://');

    /*******************
     * Certificart
     */
    const hostedZoneId = 'BCA-HostedZone';
    const hostedZone = route53.HostedZone.fromLookup(scope, hostedZoneId, {
        domainName: 'brandcopy-ai.xyz',
    });
    // Import the ACM certificate
    const _domainName = 'dev-ws.brandcopy-ai.xyz';
    const certificateId = 'BCA-Certificate';
    const certificate = new certificatemanager.Certificate(scope, certificateId, {
        domainName: _domainName,
        validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
    });
    const domainNameId = 'BCA-CustomDomain';
    const domainName = new apigatewayv2.CfnDomainName(scope, domainNameId, {
        domainName: _domainName,
        domainNameConfigurations: [{
            certificateArn: certificate.certificateArn,
            endpointType: 'REGIONAL',  // WebSocket APIs only support regional endpoints
        }],
    });

    // Map custom domain to WebSocket API
    const apiMappingId = 'ApiMapping';
    const apiMapping = new apigatewayv2.CfnApiMapping(scope, apiMappingId, {
        apiId: wsApi.apiId,
        domainName: domainName.ref,
        stage: stage.stageName,  // Define the stage
    });
    // Ensure base path mapping depends on the stage
    apiMapping.node.addDependency(stage);
    apiMapping.node.addDependency(wsApi);
    apiMapping.node.addDependency(stage);


    // Create a Route53 alias record to point the custom domain to the WebSocket API
    new route53.ARecord(scope, 'WsApiAliasRecord', {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(new targets.ApiGatewayv2DomainProperties(
            domainName.attrRegionalDomainName,
            domainName.attrRegionalHostedZoneId,
        )),
        recordName: 'dev-ws',  // This creates dev-ws.brandcopy-ai.xyz
    });
    /*******************
     * Permissions
     */
    connectionTable.grantReadWriteData(connectLambda);
    connectionCounterTable.grantReadWriteData(connectLambda);
    connectionTable.grantReadWriteData(disconnectLambda);

    return {
        api: wsApi,
        connectLambda,
        disconnectLambda,
        apiGatewayEndpoint,
        connectionTable
    }
}