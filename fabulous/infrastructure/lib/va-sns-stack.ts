import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from 'constructs';


export interface VaSnsStackProps extends cdk.StackProps {
    sgWebSocketResponseLambdaStackArn: string;
}

export class VaSnsStack extends cdk.Stack {
    public readonly snsBedrock_Response: sns.Topic;

    constructor(scope: Construct, id: string, props: VaSnsStackProps) {
        super(scope, id, props);

        const sgResponseLambda = lambda.Function.fromFunctionArn(
            this,
            'SgResponseLambda',
            props.sgWebSocketResponseLambdaStackArn
        );

        /*******************
         * SNS Topic to send messages to SG
         */
        this.snsBedrock_Response = new sns.Topic(this, 'SnsBedrock_Response', {
            topicName: cdk.PhysicalName.GENERATE_IF_NEEDED,
        });

        // Subscribe the bedrock lambda to the SNS topic
        this.snsBedrock_Response.addSubscription(new snsSubscriptions.LambdaSubscription(sgResponseLambda));
    }
}