import { handler } from "../lambda/handlers/message";
import { APIGatewayEvent, Context } from "aws-lambda";

const event: APIGatewayEvent = {
  body: JSON.stringify({ action: 'ping' }),
  resource: '/{proxy+}',
  path: '/message',
  httpMethod: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  multiValueHeaders: {
    'Content-Type': ['application/json'],
  },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: {
    proxy: 'message',
  },
  stageVariables: null,
  requestContext: {
    accountId: '123456789012',
    apiId: 'api-id',
    authorizer: {
      principalId: 'user',
      integrationLatency: 0,
    },
    connectedAt: 1234567890,
    connectionId: 'testConnectionId',
    domainName: 'example.com',
    eventType: 'MESSAGE',
    extendedRequestId: 'extended-request-id',
    protocol: 'HTTP/1.1',
    httpMethod: 'POST',
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: '127.0.0.1',
      user: null,
      userAgent: 'Custom User Agent String',
      userArn: null,
    },
    messageDirection: 'IN',
    requestId: 'request-id',
    requestTime: '09/Apr/2021:12:34:56 +0000',
    requestTimeEpoch: 1234567890,
    resourceId: 'resource-id',
    resourcePath: '/{proxy+}',
    stage: 'dev',
    path: ""
  },
  isBase64Encoded: false,
};

const context: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'message',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:message',
  memoryLimitInMB: '128',
  awsRequestId: 'aws-request-id',
  logGroupName: '/aws/lambda/message',
  logStreamName: '2021/04/09/[$LATEST]abcdef1234567890abcdef',
  getRemainingTimeInMillis: () => 1000,
  done: () => { },
  fail: () => { },
  succeed: () => { },
};

beforeAll(() => {
  // Set environment variables for the test
  process.env.AWS_REGION = 'ap-southeast-1';
  process.env.APIGATEWAY_ENDPOINT = 'http://localhost:3001';
});

test("Ping-Pong", async () => {


  // const response = await handler(event, context);
  // expect(response.statusCode).toBe(200);
  // expect(JSON.parse(response.body)).toStrictEqual({ action: "pong" });
});