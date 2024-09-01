import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as path from 'path';
import { Construct } from 'constructs';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface SGGenPostLambdaStackProps extends cdk.StackProps {
    apiGatewayEndpoint: string;
    snsOut: sns.Topic;
}

export class SGGenPostLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: SGGenPostLambdaStackProps) {
        super(scope, id, props);

        // Import WebSocket API ID and API Gateway endpoint
        const wsApiId = cdk.Fn.importValue('WebSocketApiId');

        /*******************
         * Lambda Function for Ping
         */
        const genPostLambda = new lambda.Function(this, 'GenPostLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'routes/genPost.handler',
            code: lambda.Code.fromAsset(
                // 'lambda'
                path.join(__dirname, '..', '..', '..', 'services', 'websocket-handler', 'dist'),
            ),
            environment: {
                APIGATEWAY_ENDPOINT: props.apiGatewayEndpoint,
                SNS_OUT_TOPIC: props.snsOut.topicArn,
            },
        });

        /*******************
         * WebSocket API - Add Ping Route
         */
        // Create the API Gateway route integration
        const integration = new apigatewayv2.CfnIntegration(this, 'GenPostIntegration', {
            apiId: wsApiId,
            integrationType: 'AWS_PROXY',
            integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${genPostLambda.functionArn}/invocations`,
            integrationMethod: 'POST',
        });

        // Add the route to the WebSocket API
        new apigatewayv2.CfnRoute(this, 'GenPostRoute', {
            apiId: wsApiId,
            routeKey: 'gen-post',
            authorizationType: 'NONE',
            target: `integrations/${integration.ref}`,
        });

        /*******************
         * Permissions
         */
        // Add permission for API Gateway to invoke the Lambda
        genPostLambda.addPermission('APIGatewayInvoke', {
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${wsApiId}/*/*`,
        });

        props.snsOut.grantPublish(genPostLambda);
    }
}
