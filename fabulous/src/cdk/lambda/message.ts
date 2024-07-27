import { debug, error, info } from "./logger";
import { Context } from 'aws-lambda';
import { APIGatewayProxyWebsocketHandlerV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
// import { ApiGatewayManagementApi } from 'aws-sdk';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';


const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({});
const apiGateWayClient = new ApiGatewayManagementApiClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.APIGATEWAY_ENDPOINT,
});

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event: APIGatewayProxyWebsocketEventV2, context: Context) => {
  try {
    debug("Message event", { event, context });


    const connectionId = event.requestContext.connectionId;
    const message = JSON.parse(event.body || '{}');

    // Update DynamoDB if needed
    // await dynamodb.send(new UpdateCommand({
    //   TableName: process.env.REGULAR_TABLE!,
    //   Key: { id: connectionId },
    //   UpdateExpression: 'SET lastMessage = :message',
    //   ExpressionAttributeValues: { ':message': message }
    // }));
    debug("Stored Message By Connection Id", { connectionId, message });

    const snsParams = {
      Message: JSON.stringify({ message, connectionId }),
      TopicArn: process.env.SNS_REQUEST_TOPIC
    }

    await sns.send(new PublishCommand(snsParams));
    debug("SNS published", { snsParams });

    // send message signaling that the message was received
    const postParams = {
      ConnectionId: connectionId,
      Data: JSON.stringify({ message: 'Message received' })
    }
    debug("Sending message back to client", { postParams, endpoint: process.env.APIGATEWAY_ENDPOINT });
    await apiGateWayClient.send(new PostToConnectionCommand(postParams));
    debug("Message sent back to client", postParams);

    // Return success to API Gateway (not sent to the client)
    return { statusCode: 200, body: 'Message processed' };
  } catch (error) {
    console.error('Error publishing message:', error);
    return { statusCode: 500, body: 'Failed to send message' };
  }
};


