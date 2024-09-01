import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Construct } from 'constructs';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface SGPingLambdaStackProps extends cdk.StackProps {
    apiGatewayEndpoint: string;
    // wsApi: cdk.aws_apigatewayv2.WebSocketApi;
}

export class SGPingLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: SGPingLambdaStackProps) {
        super(scope, id, props);

        // Import WebSocket API ID and API Gateway endpoint
        const wsApiId = cdk.Fn.importValue('WebSocketApiId');

        /*******************
         * Lambda Function for Ping
         */
        const pingLambda = new lambda.Function(this, 'PingLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'routes/ping.handler',
            code: lambda.Code.fromAsset(
                path.join(__dirname, '..', '..', '..', 'services', 'websocket-handler', 'dist'),
            ),
            environment: {
                APIGATEWAY_ENDPOINT: props.apiGatewayEndpoint,
            },
        });

        /*******************
         * WebSocket API - Add Ping Route
         */
        // Create the API Gateway route integration
        const integration = new apigatewayv2.CfnIntegration(this, 'PingIntegration', {
            apiId: wsApiId,
            integrationType: 'AWS_PROXY',
            integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${pingLambda.functionArn}/invocations`,
            integrationMethod: 'POST',
        });

        // Add the route to the WebSocket API
        new apigatewayv2.CfnRoute(this, 'PingRoute', {
            apiId: wsApiId,
            routeKey: 'ping',
            authorizationType: 'NONE',
            target: `integrations/${integration.ref}`,
        });

        // 1) Add permission for API Gateway to invoke the Lambda
        pingLambda.addPermission('APIGatewayInvoke', {
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${wsApiId}/*/*`,
        });


        // 2) permission lambda trigger websockets
        pingLambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['execute-api:ManageConnections'],
            resources: [`arn:aws:execute-api:${this.region}:${this.account}:${wsApiId}/*`],
        }));
        

        // const wsApi = props.wsApi;

        // wsApi.addRoute('ping', {
        //     integration: new WebSocketLambdaIntegration('PingIntegration', pingLambda),
        // });
    }
}
