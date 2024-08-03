#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SGStack } from '../lib/sg-stack';
import { VAStack } from '../lib/va-stack';

const app = new cdk.App();

// Deploy Singapore Stack
const sgStack = new SGStack(app, 'BCA-AI-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-1'
  }, // Singapore region
});

// Deploy Virginia Stack
const vaStack = new VAStack(app, 'BCA-AI-VA-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  }, // N. Virginia region
  snsToUsArn: sgStack.snsToUs.topicArn,
  resultProcessorLambdaArn: sgStack.resultProcessorLambda.functionArn,
});

vaStack.addDependency(sgStack);
