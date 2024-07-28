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
  sqsResultFromUsArn: string;
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

    const sqsRequestFromSG = new sqs.Queue(this, 'SqsRequestFromSG', {
      queueName: cdk.PhysicalName.GENERATE_IF_NEEDED,
    });    // SQS queue in US

    /**
     * Subscriptions
     */
    // Request Subscription
    const snsToUs = sns.Topic.fromTopicArn(this, 'SnsToUs', props.snsToUsArn)
    // sqs::=> sqsRequestFromSG
    snsToUs.addSubscription(new snsSubscriptions.SqsSubscription(
      sqsRequestFromSG
    )
    ); // Subscribe US SQS queue to SG SNS topic
    snsToUs.grantPublish(new iam.ServicePrincipal('sns.amazonaws.com'));
    sqsRequestFromSG.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
      resources: [sqsRequestFromSG.queueArn],
      conditions: {
        ArnEquals: {
          'aws:SourceArn': snsToUs.topicArn,
        },
      },
    }));

    // Response Subscription
    // sns::=> snsResultToSG
    const sqsResultFromUs = sqs.Queue.fromQueueArn(this, 'SqsResultFromUs', props.sqsResultFromUsArn)
    const subscription = snsResultToSG.addSubscription(
      new snsSubscriptions.SqsSubscription(
        sqsResultFromUs
      )
    ); // Subscribe SG SQS queue to US SNS topic
    snsResultToSG.grantPublish(new iam.ServicePrincipal('sns.amazonaws.com'));
    // sqsResultFromUs.addToResourcePolicy(new iam.PolicyStatement({
    //   actions: ['sqs:SendMessage'],
    //   principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
    //   resources: [sqsResultFromUs.queueArn],
    //   conditions: {
    //     ArnEquals: {
    //       'aws:SourceArn': snsResultToSG.topicArn,
    //     },
    //   },
    // }));


    /*******************
     * Lambda functions
     */
    const bedrockLambda = new lambda.Function(this, 'BedrockLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "bedrock.handler",
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(3),  // Set timeout to 5 minutes

      environment: {
        S3_BUCKET: s3BucketUS.bucketName,
        VECTOR_TABLE: vectorTable.tableName,
        SNS_RESULT_TOPIC: snsResultToSG.topicArn
      }
    });
    /*******************
     * Permissions
     */
    s3BucketUS.grantPut(bedrockLambda);
    snsResultToSG.grantPublish(bedrockLambda);

    sqsRequestFromSG.grantConsumeMessages(bedrockLambda);
    // Grant DynamoDB permissions
    bedrockLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:PutItem'],
      resources: [vectorTable.tableArn],
    }));

    // Grant S3 permissions
    bedrockLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [s3BucketUS.bucketArn],
    }));

    // Grant SNS permissions
    bedrockLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [snsResultToSG.topicArn],
    }));

    // Grant SQS permissions
    bedrockLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
      ],
      resources: [sqsRequestFromSG.queueArn],
    }));

    // Grant Bedrock permissions
    bedrockLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        // `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307`,
        `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-text-lite-v1`,
        // '*'
        `arn:aws:bedrock:${this.region}::foundation-model/meta.llama3-8b-instruct-v1:0`,
        `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-text-premier-v1:0`,
        `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
        `arn:aws:bedrock:${this.region}::foundation-model/meta.llama3-70b-instruct-v1:0`,
        `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0`,
      ], // Consider restricting this if possible
    }));

    // Event source mapping
    new lambda.EventSourceMapping(this, 'BedrockLambdaMapping', {
      target: bedrockLambda,
      eventSourceArn: sqsRequestFromSG.queueArn,
      batchSize: 10,
    });


  }
}