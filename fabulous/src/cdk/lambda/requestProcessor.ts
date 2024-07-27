import { Context, SQSEvent, SQSRecord } from 'aws-lambda';
import { debug, error, info } from "./logger";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';


const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({});

export const handler = async (event: SQSEvent,  context: Context): Promise<void> => {
    debug("Request Processor Event", { event, context });

    for (const record of event.Records) {
        await processRecord(record);
    }
}

async function processRecord(record: SQSRecord): Promise<void>{
  try {
    debug("Start Process Record", { record });

    const body = JSON.parse(record.body);
    const message = JSON.parse(body.Message);
    debug("Parsed Body & Message", { body, message });

  // Store request info in DynamoDB
  const dynamoParams = {
    TableName: process.env.REGULAR_TABLE!,
    Item: {
      id: message.connectionId,
      message: message.message,
      timestamp: new Date().toISOString()
    }
  };

    // await dynamodb.send(new PutCommand(dynamoParams));
    debug("Stored Request in DynamoDB", { dynamoParams });

    // Forward to US
    const snsParams = {
      Message: JSON.stringify({
        message: message.message,
        connectionId: message.connectionId
      }),
      TopicArn: process.env.SNS_TO_US_TOPIC
    };

    await sns.send(new PublishCommand(snsParams));

    debug('Request forwarded to US');
  } catch (error) {
    console.error('Error processing request:', error);
  }
}