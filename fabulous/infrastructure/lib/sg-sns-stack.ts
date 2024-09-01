import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class SGSnsStack extends cdk.Stack {
    public readonly snsGenPost_PromptHandler: sns.Topic;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        /*******************
         * SNS Topic to send messages to US
         */
        this.snsGenPost_PromptHandler = new sns.Topic(this, 'SnsGenPost_PromptHandler', {
            topicName: cdk.PhysicalName.GENERATE_IF_NEEDED,
        });
    }
}
