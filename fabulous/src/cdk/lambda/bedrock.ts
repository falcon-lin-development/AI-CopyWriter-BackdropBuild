import { debug, error, info } from "./logger";
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({});
const s3 = new S3Client({});

export const handler = async (event: SQSEvent, context: Context) => {
  debug("Bedrock", { event, context });


  for (const record of event.Records) {
    await processRecord(record);
  }
};

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    debug("Start Process Record", { record });

    // const message = JSON.parse(record.body);
    const body = JSON.parse(record.body);
    const message = JSON.parse(body.Message);
    debug("Parsed Body & Message", { body, message });


    // Simulate Bedrock processing
    const result = `Processed: ${message.message.message}`;

    // Store vector info in DynamoDB
    const dynamoParams = {
      TableName: process.env.VECTOR_TABLE!,
      Item: {
        id: message.connectionId,
        vector: 'Simulated vector data',
        timestamp: new Date().toISOString()
      }
    };
    // await dynamodb.send(new PutCommand(dynamoParams));
    debug('Vector info stored in DynamoDB', { dynamoParams });

    // Store result in S3
    const s3Params = {
      Bucket: process.env.S3_BUCKET!,
      Key: `result-${message.connectionId}.txt`,
      Body: result
    };
    // await s3.send(new PutObjectCommand(s3Params));
    debug('Result stored in S3', { s3Params });


    // Publish result to SNS
    const snsParams = {
      Message: JSON.stringify({ connectionId: message.connectionId, result }),
      TopicArn: process.env.SNS_RESULT_TOPIC
    };
    await sns.send(new PublishCommand(snsParams));
    debug('Result published to SNS');
  } catch (error) {
    console.error('Error processing in Bedrock:', error);
  }
}