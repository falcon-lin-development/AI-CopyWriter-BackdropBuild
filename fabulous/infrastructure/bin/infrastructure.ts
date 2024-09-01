#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { SGStack } from '../../_archived/sg/sg-stack';
// import { VAStack } from '../../_archived/va/va-stack';
import { SGWebSocketStack } from '../lib/sg-websocket-stack';
import { SGDomainMappingStack } from '../lib/sg-domain-mapping-stack';
import { SGWebSocketResponseLambdaStack } from '../lib/sg-websocket-response-stack';
import { SGGenPostLambdaStack } from "../lib/routes/sg-gen-post-stack";
import { SGPingLambdaStack } from "../lib/routes/sg-ping-stack";
import { SGSnsStack } from "../lib/sg-sns-stack";
import { VaAiStack } from "../lib/va-ai-stack";
import { VADatabaseStack } from "../lib/va-database-stack";
import { VaSnsStack } from "../lib/va-sns-stack";
import { VAWebScraperStack } from "../lib/va-web-scraper-stack";

const app = new cdk.App();
const SG_REGION = 'ap-southeast-1';
const VA_REGION = 'us-east-1';
const DOMAIN = 'brandcopy-ai.xyz';
const SUB_DOMAIN = 'dev-ws';

//  WebStocket Stack
const sgWebSocketStack = new SGWebSocketStack(app, 'BCA-SG-WebSocket-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: SG_REGION
  },
});

// Domain Mapping
const sgDomainMappingStack = new SGDomainMappingStack(app, 'BCA-SG-Domain-Mapping-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: SG_REGION
  },
  websocketStack: sgWebSocketStack,
  domainName: DOMAIN,
  subDomainName: SUB_DOMAIN,
});

// SG SNS sStack
const sgSnStack = new SGSnsStack(app, 'BCA-SG-SNS-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: SG_REGION
  },
});

// Response Lambda Stack
const sgWebSocketResponseLambdaStack = new SGWebSocketResponseLambdaStack(app, 'BCA-SG-Response-Lambda-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: SG_REGION
  },
  apiGatewayEndpoint: sgWebSocketStack.apiGatewayEndpoint,
});

// Route Stacks
new SGPingLambdaStack(app, 'BCA-SG-Ping-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: SG_REGION
  },
  apiGatewayEndpoint: sgWebSocketStack.apiGatewayEndpoint,
});

new SGGenPostLambdaStack(app, 'BCA-SG-Gen-Post-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: SG_REGION
  },
  apiGatewayEndpoint: sgWebSocketStack.apiGatewayEndpoint,
  snsOut: sgSnStack.snsGenPost_PromptHandler,
});

// VA Stacks
// DB
const vaDatabaseStack = new VADatabaseStack(app, 'BCA-VA-Database-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: VA_REGION
  },
});

const vaSnsStack = new VaSnsStack(app, 'BCA-VA-SNS-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: VA_REGION
  },
  sgWebSocketResponseLambdaStackArn: sgWebSocketResponseLambdaStack.responseLambda.functionArn,
});

const vaAiStack = new VaAiStack(app, 'BCA-VA-AI-Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: VA_REGION
  },
  vectorTable: vaDatabaseStack.vectorTable,
  snsIn: sgSnStack.snsGenPost_PromptHandler,
  snsOut: vaSnsStack.snsBedrock_Response,
});


// vaStack.addDependency(sgStack);
