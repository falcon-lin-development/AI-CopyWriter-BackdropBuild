"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../utils/logger");
const client_apigatewaymanagementapi_1 = require("@aws-sdk/client-apigatewaymanagementapi");
// import { ApiGatewayManagementApi } from 'aws-sdk';
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_sns_1 = require("@aws-sdk/client-sns");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const dynamodb = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const sns = new client_sns_1.SNSClient({});
const apiGateWayClient = new client_apigatewaymanagementapi_1.ApiGatewayManagementApiClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.APIGATEWAY_ENDPOINT,
});
const handler = async (event, context) => {
    try {
        (0, logger_1.debug)("Message event", { event, context });
        const connectionId = event.requestContext.connectionId;
        const message = JSON.parse(event.body || '{}');
        // Update DynamoDB if needed
        // await dynamodb.send(new UpdateCommand({
        //   TableName: process.env.REGULAR_TABLE!,
        //   Key: { id: connectionId },
        //   UpdateExpression: 'SET lastMessage = :message',
        //   ExpressionAttributeValues: { ':message': message }
        // }));
        (0, logger_1.debug)("Stored Message By Connection Id", { connectionId, message });
        const snsParams = {
            Message: JSON.stringify({ message, connectionId }),
            TopicArn: process.env.SNS_OUT_TOPIC
        };
        await sns.send(new client_sns_1.PublishCommand(snsParams));
        (0, logger_1.debug)("SNS published", { snsParams });
        // send message signaling that the message was received
        const postParams = {
            ConnectionId: connectionId,
            Data: JSON.stringify({ message: 'Message received' })
        };
        (0, logger_1.debug)("Sending message back to client", { postParams, endpoint: process.env.APIGATEWAY_ENDPOINT });
        await apiGateWayClient.send(new client_apigatewaymanagementapi_1.PostToConnectionCommand(postParams));
        (0, logger_1.debug)("Message sent back to client", postParams);
        // Return success to API Gateway (not sent to the client)
        return { statusCode: 200, body: 'Message processed' };
    }
    catch (error) {
        (0, logger_1.logError)('Error publishing message:', error);
        return { statusCode: 500, body: 'Failed to send message' };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuUG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvZ2VuUG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0Q0FBd0Q7QUFHeEQsNEZBQWlIO0FBQ2pILHFEQUFxRDtBQUNyRCw4REFBMEQ7QUFDMUQsd0RBQThFO0FBQzlFLG9EQUFnRTtBQUdoRSxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxRQUFRLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzNELE1BQU0sR0FBRyxHQUFHLElBQUksc0JBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM5QixNQUFNLGdCQUFnQixHQUFHLElBQUksOERBQTZCLENBQUM7SUFDekQsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVTtJQUM5QixRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7Q0FDMUMsQ0FBQyxDQUFDO0FBRUksTUFBTSxPQUFPLEdBQXNDLEtBQUssRUFBRSxLQUFzQyxFQUFFLE9BQWdCLEVBQUUsRUFBRTtJQUMzSCxJQUFJLENBQUM7UUFDSCxJQUFBLGNBQUssRUFBQyxlQUFlLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUczQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUM7UUFFL0MsNEJBQTRCO1FBQzVCLDBDQUEwQztRQUMxQywyQ0FBMkM7UUFDM0MsK0JBQStCO1FBQy9CLG9EQUFvRDtRQUNwRCx1REFBdUQ7UUFDdkQsT0FBTztRQUNQLElBQUEsY0FBSyxFQUFDLGlDQUFpQyxFQUFFLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFFcEUsTUFBTSxTQUFTLEdBQUc7WUFDaEIsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUM7WUFDbEQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYTtTQUNwQyxDQUFBO1FBRUQsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksMkJBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzlDLElBQUEsY0FBSyxFQUFDLGVBQWUsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFFdEMsdURBQXVEO1FBQ3ZELE1BQU0sVUFBVSxHQUFHO1lBQ2pCLFlBQVksRUFBRSxZQUFZO1lBQzFCLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLENBQUM7U0FDdEQsQ0FBQTtRQUNELElBQUEsY0FBSyxFQUFDLGdDQUFnQyxFQUFFLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztRQUNuRyxNQUFNLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLHdEQUF1QixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDckUsSUFBQSxjQUFLLEVBQUMsNkJBQTZCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFakQseURBQXlEO1FBQ3pELE9BQU8sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxDQUFDO0lBQ3hELENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsSUFBQSxpQkFBUSxFQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLE9BQU8sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSx3QkFBd0IsRUFBRSxDQUFDO0lBQzdELENBQUM7QUFDSCxDQUFDLENBQUM7QUF4Q1csUUFBQSxPQUFPLFdBd0NsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlYnVnLCBsb2dFcnJvciwgaW5mbyB9IGZyb20gXCIuLi91dGlscy9sb2dnZXJcIjtcbmltcG9ydCB7IENvbnRleHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eVdlYnNvY2tldEhhbmRsZXJWMiwgQVBJR2F0ZXdheVByb3h5V2Vic29ja2V0RXZlbnRWMiB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQXBpR2F0ZXdheU1hbmFnZW1lbnRBcGlDbGllbnQsIFBvc3RUb0Nvbm5lY3Rpb25Db21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWFwaWdhdGV3YXltYW5hZ2VtZW50YXBpJztcbi8vIGltcG9ydCB7IEFwaUdhdGV3YXlNYW5hZ2VtZW50QXBpIH0gZnJvbSAnYXdzLXNkayc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBVcGRhdGVDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcbmltcG9ydCB7IFNOU0NsaWVudCwgUHVibGlzaENvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtc25zJztcblxuXG5jb25zdCBkeW5hbW9DbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuY29uc3QgZHluYW1vZGIgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oZHluYW1vQ2xpZW50KTtcbmNvbnN0IHNucyA9IG5ldyBTTlNDbGllbnQoe30pO1xuY29uc3QgYXBpR2F0ZVdheUNsaWVudCA9IG5ldyBBcGlHYXRld2F5TWFuYWdlbWVudEFwaUNsaWVudCh7XG4gIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTixcbiAgZW5kcG9pbnQ6IHByb2Nlc3MuZW52LkFQSUdBVEVXQVlfRU5EUE9JTlQsXG59KTtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXI6IEFQSUdhdGV3YXlQcm94eVdlYnNvY2tldEhhbmRsZXJWMiA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5V2Vic29ja2V0RXZlbnRWMiwgY29udGV4dDogQ29udGV4dCkgPT4ge1xuICB0cnkge1xuICAgIGRlYnVnKFwiTWVzc2FnZSBldmVudFwiLCB7IGV2ZW50LCBjb250ZXh0IH0pO1xuXG5cbiAgICBjb25zdCBjb25uZWN0aW9uSWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5jb25uZWN0aW9uSWQ7XG4gICAgY29uc3QgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSB8fCAne30nKTtcblxuICAgIC8vIFVwZGF0ZSBEeW5hbW9EQiBpZiBuZWVkZWRcbiAgICAvLyBhd2FpdCBkeW5hbW9kYi5zZW5kKG5ldyBVcGRhdGVDb21tYW5kKHtcbiAgICAvLyAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuUkVHVUxBUl9UQUJMRSEsXG4gICAgLy8gICBLZXk6IHsgaWQ6IGNvbm5lY3Rpb25JZCB9LFxuICAgIC8vICAgVXBkYXRlRXhwcmVzc2lvbjogJ1NFVCBsYXN0TWVzc2FnZSA9IDptZXNzYWdlJyxcbiAgICAvLyAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHsgJzptZXNzYWdlJzogbWVzc2FnZSB9XG4gICAgLy8gfSkpO1xuICAgIGRlYnVnKFwiU3RvcmVkIE1lc3NhZ2UgQnkgQ29ubmVjdGlvbiBJZFwiLCB7IGNvbm5lY3Rpb25JZCwgbWVzc2FnZSB9KTtcblxuICAgIGNvbnN0IHNuc1BhcmFtcyA9IHtcbiAgICAgIE1lc3NhZ2U6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZSwgY29ubmVjdGlvbklkIH0pLFxuICAgICAgVG9waWNBcm46IHByb2Nlc3MuZW52LlNOU19PVVRfVE9QSUNcbiAgICB9XG5cbiAgICBhd2FpdCBzbnMuc2VuZChuZXcgUHVibGlzaENvbW1hbmQoc25zUGFyYW1zKSk7XG4gICAgZGVidWcoXCJTTlMgcHVibGlzaGVkXCIsIHsgc25zUGFyYW1zIH0pO1xuXG4gICAgLy8gc2VuZCBtZXNzYWdlIHNpZ25hbGluZyB0aGF0IHRoZSBtZXNzYWdlIHdhcyByZWNlaXZlZFxuICAgIGNvbnN0IHBvc3RQYXJhbXMgPSB7XG4gICAgICBDb25uZWN0aW9uSWQ6IGNvbm5lY3Rpb25JZCxcbiAgICAgIERhdGE6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogJ01lc3NhZ2UgcmVjZWl2ZWQnIH0pXG4gICAgfVxuICAgIGRlYnVnKFwiU2VuZGluZyBtZXNzYWdlIGJhY2sgdG8gY2xpZW50XCIsIHsgcG9zdFBhcmFtcywgZW5kcG9pbnQ6IHByb2Nlc3MuZW52LkFQSUdBVEVXQVlfRU5EUE9JTlQgfSk7XG4gICAgYXdhaXQgYXBpR2F0ZVdheUNsaWVudC5zZW5kKG5ldyBQb3N0VG9Db25uZWN0aW9uQ29tbWFuZChwb3N0UGFyYW1zKSk7XG4gICAgZGVidWcoXCJNZXNzYWdlIHNlbnQgYmFjayB0byBjbGllbnRcIiwgcG9zdFBhcmFtcyk7XG5cbiAgICAvLyBSZXR1cm4gc3VjY2VzcyB0byBBUEkgR2F0ZXdheSAobm90IHNlbnQgdG8gdGhlIGNsaWVudClcbiAgICByZXR1cm4geyBzdGF0dXNDb2RlOiAyMDAsIGJvZHk6ICdNZXNzYWdlIHByb2Nlc3NlZCcgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dFcnJvcignRXJyb3IgcHVibGlzaGluZyBtZXNzYWdlOicsIGVycm9yKTtcbiAgICByZXR1cm4geyBzdGF0dXNDb2RlOiA1MDAsIGJvZHk6ICdGYWlsZWQgdG8gc2VuZCBtZXNzYWdlJyB9O1xuICB9XG59O1xuXG5cbiJdfQ==