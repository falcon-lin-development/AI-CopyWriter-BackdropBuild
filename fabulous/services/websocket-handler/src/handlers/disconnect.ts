import { APIGatewayEvent, Context, APIGatewayProxyWebsocketHandlerV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { debug, logError, info } from "../utils/logger";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';


const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event: APIGatewayProxyWebsocketEventV2, context: Context) => {
  try {
    debug("Disconnected Event", { event, context });

    const connectionId = event.requestContext.connectionId;
    const params = {
      TableName: process.env.DDB_TABLE!,
      Key: { id: connectionId }
    };

    await dynamodb.send(new DeleteCommand(params));
    // console.log('Connection removed from DynamoDB');
    debug("Removed connection", { connectionId });
    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    logError('Error removing connection:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};
