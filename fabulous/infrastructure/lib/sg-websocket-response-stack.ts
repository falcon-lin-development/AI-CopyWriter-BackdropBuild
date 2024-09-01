import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

export interface SGWebSocketResponseLambdaStackProps extends cdk.StackProps {
    apiGatewayEndpoint: string;
}

export class SGWebSocketResponseLambdaStack extends cdk.Stack {
    public readonly responseLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: SGWebSocketResponseLambdaStackProps) {
        super(scope, id, props);

        // Import WebSocket API ID and API Gateway endpoint
        const wsApiId = cdk.Fn.importValue('WebSocketApiId');

        /*******************
         * Lambda for Result Processing
         */
        const _responseLambdaId = `SgResponseLambda`;
        this.responseLambda = new lambda.Function(this, _responseLambdaId, {
            functionName: `${this.stackName}_fabulous_${_responseLambdaId}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'handlers/response.handler',
            code: lambda.Code.fromAsset(
                // 'lambda'
                path.join(__dirname, '..', '..', 'services', 'websocket-handler', 'dist'),
            ),
            environment: {
                APIGATEWAY_ENDPOINT: props.apiGatewayEndpoint,
            },
        });

        /*******************
         * Subscribe Lambda to SNS Topic: allow SNS from US region to invoke the lambda
         */
        this.responseLambda.addPermission('AllowSNSInvocation', { // explicit permission
            principal: new iam.ServicePrincipal('sns.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:sns:us-east-1:${this.account}:*`
        });

        /**
         * Permission to trigger api gateway
         */
        this.responseLambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['execute-api:ManageConnections'],
            resources: [`arn:aws:execute-api:${this.region}:${this.account}:${wsApiId}/*`],
        }));
    }
}
