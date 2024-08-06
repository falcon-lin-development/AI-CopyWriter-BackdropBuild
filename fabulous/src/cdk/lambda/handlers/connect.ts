import { Context, APIGatewayProxyWebsocketHandlerV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { debug, error, info } from "../common/logger";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event: APIGatewayProxyWebsocketEventV2, context: Context) => {
  try {
    debug("Connect Event", { event, context });
    const connectionId = event.requestContext.connectionId;
    const timestamp = new Date().toISOString();
    const params = {
      TableName: process.env.DDB_TABLE!,
      Item: {
        id: connectionId,
        timestamp: timestamp,
        status: 'connected'
      }
    };

    // Your connection logic here
    await dynamodb.send(new PutCommand(params));
    // increment COUNTER_TABLE connection count
    await incrementConnectionCount(process.env.COUNTER_TABLE!);
    
    debug("Stored connection", { connectionId, timestamp });
    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Error storing connection:', error);
    return { statusCode: 500, body: 'Failed to connect' };
  }
};


async function incrementConnectionCount(tableName: string) {
  await dynamodb.send(new UpdateCommand({
    TableName: tableName,
    Key: { id: 'connections' },
    UpdateExpression: 'SET #count = if_not_exists(#count, :start) + :increment, #lastUpdated = :timestamp',
    ExpressionAttributeNames: {
      '#count': 'count',
      '#lastUpdated': 'lastUpdated',
    },
    ExpressionAttributeValues: {
      ':increment': 1,
      ':start': 0,
      ':timestamp': new Date().toISOString(),
    },
  }));
}