"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const logger_1 = require("../utils/logger");
const client = new client_dynamodb_1.DynamoDBClient({});
const dynamodb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const handler = async (event, context) => {
    try {
        (0, logger_1.debug)("Connect Event", { event, context });
        const connectionId = event.requestContext.connectionId;
        const timestamp = new Date().toISOString();
        const params = {
            TableName: process.env.DDB_TABLE,
            Item: {
                id: connectionId,
                timestamp: timestamp,
                status: 'connected'
            }
        };
        // Your connection logic here
        await dynamodb.send(new lib_dynamodb_1.PutCommand(params));
        // increment COUNTER_TABLE connection count
        await incrementConnectionCount(process.env.COUNTER_TABLE);
        (0, logger_1.debug)("Stored connection", { connectionId, timestamp });
        return { statusCode: 200, body: 'Connected' };
    }
    catch (error) {
        (0, logger_1.logError)('Error storing connection:', error);
        return { statusCode: 500, body: 'Failed to connect' };
    }
};
exports.handler = handler;
async function incrementConnectionCount(tableName) {
    await dynamodb.send(new lib_dynamodb_1.UpdateCommand({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9oYW5kbGVycy9jb25uZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDhEQUEwRDtBQUMxRCx3REFBMEY7QUFDMUYsNENBQXdEO0FBRXhELE1BQU0sTUFBTSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN0QyxNQUFNLFFBQVEsR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFFOUMsTUFBTSxPQUFPLEdBQXNDLEtBQUssRUFBRSxLQUFzQyxFQUFFLE9BQWdCLEVBQUUsRUFBRTtJQUMzSCxJQUFJLENBQUM7UUFDSCxJQUFBLGNBQUssRUFBQyxlQUFlLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUMzQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQztRQUN2RCxNQUFNLFNBQVMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzNDLE1BQU0sTUFBTSxHQUFHO1lBQ2IsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBVTtZQUNqQyxJQUFJLEVBQUU7Z0JBQ0osRUFBRSxFQUFFLFlBQVk7Z0JBQ2hCLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixNQUFNLEVBQUUsV0FBVzthQUNwQjtTQUNGLENBQUM7UUFFRiw2QkFBNkI7UUFDN0IsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUkseUJBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzVDLDJDQUEyQztRQUMzQyxNQUFNLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYyxDQUFDLENBQUM7UUFFM0QsSUFBQSxjQUFLLEVBQUMsbUJBQW1CLEVBQUUsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUN4RCxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDaEQsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixJQUFBLGlCQUFRLEVBQUMsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0MsT0FBTyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLENBQUM7SUFDeEQsQ0FBQztBQUNILENBQUMsQ0FBQztBQXpCVyxRQUFBLE9BQU8sV0F5QmxCO0FBR0YsS0FBSyxVQUFVLHdCQUF3QixDQUFDLFNBQWlCO0lBQ3ZELE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLDRCQUFhLENBQUM7UUFDcEMsU0FBUyxFQUFFLFNBQVM7UUFDcEIsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLGFBQWEsRUFBRTtRQUMxQixnQkFBZ0IsRUFBRSxvRkFBb0Y7UUFDdEcsd0JBQXdCLEVBQUU7WUFDeEIsUUFBUSxFQUFFLE9BQU87WUFDakIsY0FBYyxFQUFFLGFBQWE7U0FDOUI7UUFDRCx5QkFBeUIsRUFBRTtZQUN6QixZQUFZLEVBQUUsQ0FBQztZQUNmLFFBQVEsRUFBRSxDQUFDO1lBQ1gsWUFBWSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3ZDO0tBQ0YsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29udGV4dCwgQVBJR2F0ZXdheVByb3h5V2Vic29ja2V0SGFuZGxlclYyLCBBUElHYXRld2F5UHJveHlXZWJzb2NrZXRFdmVudFYyIH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBQdXRDb21tYW5kLCBVcGRhdGVDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcbmltcG9ydCB7IGRlYnVnLCBsb2dFcnJvciwgaW5mbyB9IGZyb20gXCIuLi91dGlscy9sb2dnZXJcIjtcblxuY29uc3QgY2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbmNvbnN0IGR5bmFtb2RiID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGNsaWVudCk7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyOiBBUElHYXRld2F5UHJveHlXZWJzb2NrZXRIYW5kbGVyVjIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eVdlYnNvY2tldEV2ZW50VjIsIGNvbnRleHQ6IENvbnRleHQpID0+IHtcbiAgdHJ5IHtcbiAgICBkZWJ1ZyhcIkNvbm5lY3QgRXZlbnRcIiwgeyBldmVudCwgY29udGV4dCB9KTtcbiAgICBjb25zdCBjb25uZWN0aW9uSWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5jb25uZWN0aW9uSWQ7XG4gICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuRERCX1RBQkxFISxcbiAgICAgIEl0ZW06IHtcbiAgICAgICAgaWQ6IGNvbm5lY3Rpb25JZCxcbiAgICAgICAgdGltZXN0YW1wOiB0aW1lc3RhbXAsXG4gICAgICAgIHN0YXR1czogJ2Nvbm5lY3RlZCdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gWW91ciBjb25uZWN0aW9uIGxvZ2ljIGhlcmVcbiAgICBhd2FpdCBkeW5hbW9kYi5zZW5kKG5ldyBQdXRDb21tYW5kKHBhcmFtcykpO1xuICAgIC8vIGluY3JlbWVudCBDT1VOVEVSX1RBQkxFIGNvbm5lY3Rpb24gY291bnRcbiAgICBhd2FpdCBpbmNyZW1lbnRDb25uZWN0aW9uQ291bnQocHJvY2Vzcy5lbnYuQ09VTlRFUl9UQUJMRSEpO1xuICAgIFxuICAgIGRlYnVnKFwiU3RvcmVkIGNvbm5lY3Rpb25cIiwgeyBjb25uZWN0aW9uSWQsIHRpbWVzdGFtcCB9KTtcbiAgICByZXR1cm4geyBzdGF0dXNDb2RlOiAyMDAsIGJvZHk6ICdDb25uZWN0ZWQnIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nRXJyb3IoJ0Vycm9yIHN0b3JpbmcgY29ubmVjdGlvbjonLCBlcnJvcik7XG4gICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogNTAwLCBib2R5OiAnRmFpbGVkIHRvIGNvbm5lY3QnIH07XG4gIH1cbn07XG5cblxuYXN5bmMgZnVuY3Rpb24gaW5jcmVtZW50Q29ubmVjdGlvbkNvdW50KHRhYmxlTmFtZTogc3RyaW5nKSB7XG4gIGF3YWl0IGR5bmFtb2RiLnNlbmQobmV3IFVwZGF0ZUNvbW1hbmQoe1xuICAgIFRhYmxlTmFtZTogdGFibGVOYW1lLFxuICAgIEtleTogeyBpZDogJ2Nvbm5lY3Rpb25zJyB9LFxuICAgIFVwZGF0ZUV4cHJlc3Npb246ICdTRVQgI2NvdW50ID0gaWZfbm90X2V4aXN0cygjY291bnQsIDpzdGFydCkgKyA6aW5jcmVtZW50LCAjbGFzdFVwZGF0ZWQgPSA6dGltZXN0YW1wJyxcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IHtcbiAgICAgICcjY291bnQnOiAnY291bnQnLFxuICAgICAgJyNsYXN0VXBkYXRlZCc6ICdsYXN0VXBkYXRlZCcsXG4gICAgfSxcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAnOmluY3JlbWVudCc6IDEsXG4gICAgICAnOnN0YXJ0JzogMCxcbiAgICAgICc6dGltZXN0YW1wJzogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH0sXG4gIH0pKTtcbn0iXX0=