import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";

interface VAStackProps extends cdk.StackProps {
  snsToUsArn: string;
  resultProcessorLambdaArn: string;
}

export class VAStack extends cdk.Stack {


  constructor(scope: Construct, id: string, props: VAStackProps
  ) {
    super(scope, id, props);
    /*******************
     * DynamoDB tables
     */
    const vectorTable = new dynamodb.Table(this, 'VectorTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /*******************
     * S3 buckets
     */
    const s3BucketUS = new s3.Bucket(this, 'S3BucketUs');

    /*******************
     * Cross Regoin SNS topics & SQS queues
     */
    const snsResultToSG = new sns.Topic(this, 'SnsResultToSG', {
      topicName: cdk.PhysicalName.GENERATE_IF_NEEDED,
    });    // SNS topic for results in US  
    const snsToUs = sns.Topic.fromTopicArn(this, 'SnsToUs', props.snsToUsArn)


    /*******************
     * Lambda functions
    */
    const resultProcessorLambda = lambda.Function.fromFunctionArn(
      this,
      'ResultProcessorLambda',
      props.resultProcessorLambdaArn
    );
    const bedrockLambda = new lambda.Function(this, 'BedrockLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/bedrock.handler",
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(3),  // Set timeout to 5 minutes
      environment: {
        S3_BUCKET: s3BucketUS.bucketName,
        VECTOR_TABLE: vectorTable.tableName,
        SNS_RESULT_TOPIC: snsResultToSG.topicArn
      }
    });

    /**
     * Subscriptions
     */
    snsToUs.addSubscription(new snsSubscriptions.LambdaSubscription(bedrockLambda));
    snsResultToSG.addSubscription(new snsSubscriptions.LambdaSubscription(resultProcessorLambda));

    /*******************
     * Permissions
     */

    // Grant S3 permissions
    s3BucketUS.grantPut(bedrockLambda);

    // Grant SNS permissions
    snsResultToSG.grantPublish(bedrockLambda);


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

    bedrockLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: bedrockModelArns,
    }));
  }
}