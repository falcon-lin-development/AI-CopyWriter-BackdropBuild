"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../utils/logger");
const client_apigatewaymanagementapi_1 = require("@aws-sdk/client-apigatewaymanagementapi");
// const dynamoClient = new DynamoDBClient({});
// const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const apiGateWayClient = new client_apigatewaymanagementapi_1.ApiGatewayManagementApiClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.APIGATEWAY_ENDPOINT,
});
const handler = async (event) => {
    console.log('Result processor event:', JSON.stringify(event, null, 2));
    for (const record of event.Records) {
        await processRecord(record);
    }
};
exports.handler = handler;
async function processRecord(record) {
    try {
        (0, logger_1.debug)("Start Process Record", { record });
        // const body = JSON.parse(record.body);
        const snsMsg = JSON.parse(record.Sns.Message);
        const { connectionId, result } = snsMsg;
        (0, logger_1.debug)("Parsed Message", {
            snsMsg
        });
        // Update DynamoDB
        // const dynamoParams = {
        //     TableName: process.env.REGULAR_TABLE!,
        //     Key: { id: connectionId },
        //     UpdateExpression: 'set #result = :r, #status = :s',
        //     ExpressionAttributeNames: { '#result': 'result', '#status': 'status' },
        //     ExpressionAttributeValues: { ':r': result, ':s': 'completed' }
        // };
        // await dynamodb.send(new UpdateCommand(dynamoParams));
        // debug('DynamoDB updated with result', { dynamoParams });
        // Send result back through WebSocket
        await apiGateWayClient.send(new client_apigatewaymanagementapi_1.PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify({ result })
        }));
        (0, logger_1.debug)('Result sent back through WebSocket');
    }
    catch (error) {
        (0, logger_1.logError)('Error processing result:', error);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaGFuZGxlcnMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNENBQXdEO0FBSXhELDRGQUFpSDtBQUdqSCwrQ0FBK0M7QUFDL0MsOERBQThEO0FBRzlELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSw4REFBNkIsQ0FBQztJQUN2RCxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVO0lBQzlCLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtDQUM1QyxDQUFDLENBQUM7QUFHSSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBZSxFQUFpQixFQUFFO0lBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdkUsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakMsTUFBTSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQU5XLFFBQUEsT0FBTyxXQU1sQjtBQUVGLEtBQUssVUFBVSxhQUFhLENBQUMsTUFBc0I7SUFDL0MsSUFBSSxDQUFDO1FBQ0QsSUFBQSxjQUFLLEVBQUMsc0JBQXNCLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBRTFDLHdDQUF3QztRQUN4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUMsTUFBTSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUE7UUFDdkMsSUFBQSxjQUFLLEVBQUMsZ0JBQWdCLEVBQUU7WUFDcEIsTUFBTTtTQUNULENBQUMsQ0FBQztRQUdILGtCQUFrQjtRQUNsQix5QkFBeUI7UUFDekIsNkNBQTZDO1FBQzdDLGlDQUFpQztRQUNqQywwREFBMEQ7UUFDMUQsOEVBQThFO1FBQzlFLHFFQUFxRTtRQUNyRSxLQUFLO1FBQ0wsd0RBQXdEO1FBRXhELDJEQUEyRDtRQUczRCxxQ0FBcUM7UUFDckMsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSx3REFBdUIsQ0FBQztZQUNwRCxZQUFZLEVBQUUsWUFBWTtZQUMxQixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDO1NBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBQSxjQUFLLEVBQUMsb0NBQW9DLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLElBQUEsaUJBQVEsRUFBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRCxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlYnVnLCBsb2dFcnJvciwgaW5mbyB9IGZyb20gXCIuLi91dGlscy9sb2dnZXJcIjtcbmltcG9ydCB7IFNOU0V2ZW50LCBTTlNFdmVudFJlY29yZCwgU1FTRXZlbnQsIFNRU1JlY29yZCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuaW1wb3J0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgVXBkYXRlQ29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYic7XG5pbXBvcnQgeyBBcGlHYXRld2F5TWFuYWdlbWVudEFwaUNsaWVudCwgUG9zdFRvQ29ubmVjdGlvbkNvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtYXBpZ2F0ZXdheW1hbmFnZW1lbnRhcGknO1xuXG5cbi8vIGNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG4vLyBjb25zdCBkeW5hbW9kYiA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShkeW5hbW9DbGllbnQpO1xuXG5cbmNvbnN0IGFwaUdhdGVXYXlDbGllbnQgPSBuZXcgQXBpR2F0ZXdheU1hbmFnZW1lbnRBcGlDbGllbnQoe1xuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTixcbiAgICBlbmRwb2ludDogcHJvY2Vzcy5lbnYuQVBJR0FURVdBWV9FTkRQT0lOVCxcbn0pO1xuXG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBTTlNFdmVudCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnNvbGUubG9nKCdSZXN1bHQgcHJvY2Vzc29yIGV2ZW50OicsIEpTT04uc3RyaW5naWZ5KGV2ZW50LCBudWxsLCAyKSk7XG5cbiAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiBldmVudC5SZWNvcmRzKSB7XG4gICAgICAgIGF3YWl0IHByb2Nlc3NSZWNvcmQocmVjb3JkKTtcbiAgICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzUmVjb3JkKHJlY29yZDogU05TRXZlbnRSZWNvcmQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgICBkZWJ1ZyhcIlN0YXJ0IFByb2Nlc3MgUmVjb3JkXCIsIHsgcmVjb3JkIH0pO1xuXG4gICAgICAgIC8vIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKHJlY29yZC5ib2R5KTtcbiAgICAgICAgY29uc3Qgc25zTXNnID0gSlNPTi5wYXJzZShyZWNvcmQuU25zLk1lc3NhZ2UpO1xuICAgICAgICBjb25zdCB7IGNvbm5lY3Rpb25JZCwgcmVzdWx0IH0gPSBzbnNNc2dcbiAgICAgICAgZGVidWcoXCJQYXJzZWQgTWVzc2FnZVwiLCB7XG4gICAgICAgICAgICBzbnNNc2dcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvLyBVcGRhdGUgRHluYW1vREJcbiAgICAgICAgLy8gY29uc3QgZHluYW1vUGFyYW1zID0ge1xuICAgICAgICAvLyAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5SRUdVTEFSX1RBQkxFISxcbiAgICAgICAgLy8gICAgIEtleTogeyBpZDogY29ubmVjdGlvbklkIH0sXG4gICAgICAgIC8vICAgICBVcGRhdGVFeHByZXNzaW9uOiAnc2V0ICNyZXN1bHQgPSA6ciwgI3N0YXR1cyA9IDpzJyxcbiAgICAgICAgLy8gICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogeyAnI3Jlc3VsdCc6ICdyZXN1bHQnLCAnI3N0YXR1cyc6ICdzdGF0dXMnIH0sXG4gICAgICAgIC8vICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7ICc6cic6IHJlc3VsdCwgJzpzJzogJ2NvbXBsZXRlZCcgfVxuICAgICAgICAvLyB9O1xuICAgICAgICAvLyBhd2FpdCBkeW5hbW9kYi5zZW5kKG5ldyBVcGRhdGVDb21tYW5kKGR5bmFtb1BhcmFtcykpO1xuXG4gICAgICAgIC8vIGRlYnVnKCdEeW5hbW9EQiB1cGRhdGVkIHdpdGggcmVzdWx0JywgeyBkeW5hbW9QYXJhbXMgfSk7XG5cblxuICAgICAgICAvLyBTZW5kIHJlc3VsdCBiYWNrIHRocm91Z2ggV2ViU29ja2V0XG4gICAgICAgIGF3YWl0IGFwaUdhdGVXYXlDbGllbnQuc2VuZChuZXcgUG9zdFRvQ29ubmVjdGlvbkNvbW1hbmQoe1xuICAgICAgICAgICAgQ29ubmVjdGlvbklkOiBjb25uZWN0aW9uSWQsXG4gICAgICAgICAgICBEYXRhOiBKU09OLnN0cmluZ2lmeSh7IHJlc3VsdCB9KVxuICAgICAgICB9KSk7XG5cbiAgICAgICAgZGVidWcoJ1Jlc3VsdCBzZW50IGJhY2sgdGhyb3VnaCBXZWJTb2NrZXQnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dFcnJvcignRXJyb3IgcHJvY2Vzc2luZyByZXN1bHQ6JywgZXJyb3IpO1xuICAgIH1cbn0iXX0=