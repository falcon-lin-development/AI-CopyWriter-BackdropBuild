import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from 'constructs';

export interface VaAiStackProps extends cdk.StackProps {
    vectorTable: dynamodb.Table;
    snsIn: sns.Topic;
    snsOut: sns.Topic;
}

export class VaAiStack extends cdk.Stack {
    // public readonly snsToSG: sns.Topic;
    public readonly bedrockLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: VaAiStackProps) {
        super(scope, id, props);

        // /*******************
        //  * SNS Topic to send messages to SG
        //  */
        // this.snsToSG = new sns.Topic(this, 'SnsToSG', {
        //     topicName: cdk.PhysicalName.GENERATE_IF_NEEDED,
        // });

        /*******************
         * Lambda Function for Bedrock Model Invocation
         */
        this.bedrockLambda = new lambda.Function(this, 'BedrockLambda', {
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: 'main.handler',
            code: lambda.Code.fromAsset(
                path.join(__dirname, '..', '..', 'services', 'ai-service', 'src', 'bedrock_function')
            ),
            timeout: cdk.Duration.minutes(3),  // Timeout set to 3 minutes
            environment: {
                //   S3_BUCKET: props.s3Bucket.bucketName,
                VECTOR_TABLE: props.vectorTable.tableName,
                // SNS_RESULT_TOPIC: this.snsToSG.topicArn
                SNS_RESULT_TOPIC: props.snsOut.topicArn
            }
        });

        // Grant Bedrock permissions
        const bedrockModels = [
            'amazon.titan-text-lite-v1',
            'meta.llama3-8b-instruct-v1:0',
            'amazon.titan-text-premier-v1:0',
            'anthropic.claude-3-haiku-20240307-v1:0',
            'meta.llama3-70b-instruct-v1:0',
            'anthropic.claude-3-5-sonnet-20240620-v1:0'
        ];
        const bedrockModelArns = bedrockModels.map(model =>
            `arn:aws:bedrock:${this.region}::foundation-model/${model}`
        );

        this.bedrockLambda.addToRolePolicy(new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: bedrockModelArns,
        }));


        /*******************
         * SNS Subscription for Bedrock Lambda
         */
        props.snsIn.addSubscription(new snsSubscriptions.LambdaSubscription(this.bedrockLambda));
        props.snsOut.grantPublish(this.bedrockLambda);
        props.vectorTable.grantReadWriteData(this.bedrockLambda);
    }
}