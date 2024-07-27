import { APIGatewayEvent, Context, APIGatewayProxyWebsocketHandlerV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { debug, error, info } from "./logger";
import { DynamoDB } from 'aws-sdk';
const dynamodb = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event: APIGatewayProxyWebsocketEventV2, context: Context) => {
  try {
    debug("Disconnected Event", { event, context });

    const connectionId = event.requestContext.connectionId;
    const params = {
      TableName: process.env.REGULAR_TABLE!,
      Key: { id: connectionId }
    };

    // await dynamodb.delete(params).promise();
    // console.log('Connection removed from DynamoDB');
    debug("Removed connection", { connectionId });
    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Error removing connection:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};
