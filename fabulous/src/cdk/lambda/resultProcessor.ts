import { debug, error, info } from "./logger";
import { SNSEvent, SNSEventRecord, SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';


const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);


const apiGateWayClient = new ApiGatewayManagementApiClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.APIGATEWAY_ENDPOINT,
});


export const handler = async (event: SNSEvent): Promise<void> => {
    console.log('Result processor event:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        await processRecord(record);
    }
};

async function processRecord(record: SNSEventRecord): Promise<void> {
    try {
        debug("Start Process Record", { record });

        // const body = JSON.parse(record.body);
        const snsMsg = JSON.parse(record.Sns.Message);
        const { connectionId, result } = snsMsg
        debug("Parsed Message", {
            snsMsg
        });


        // Update DynamoDB
        const dynamoParams = {
            TableName: process.env.REGULAR_TABLE!,
            Key: { id: connectionId },
            UpdateExpression: 'set #result = :r, #status = :s',
            ExpressionAttributeNames: { '#result': 'result', '#status': 'status' },
            ExpressionAttributeValues: { ':r': result, ':s': 'completed' }
        };
        // await dynamodb.send(new UpdateCommand(dynamoParams));

        debug('DynamoDB updated with result', { dynamoParams });


        // Send result back through WebSocket
        await apiGateWayClient.send(new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify({ result })
        }));

        debug('Result sent back through WebSocket');
    } catch (error) {
        console.error('Error processing result:', error);
    }
}