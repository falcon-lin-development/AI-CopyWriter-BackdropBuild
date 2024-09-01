"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_apigatewaymanagementapi_1 = require("@aws-sdk/client-apigatewaymanagementapi");
const logger_1 = require("../utils/logger");
const fs_1 = require("fs");
// Replace with your default region if needed
const region = process.env.AWS_REGION || 'ap-southeast-1';
// Default endpoint for local testing
let apiGatewayEndpoint = process.env.APIGATEWAY_ENDPOINT || 'wss://dywg4wpf8e.execute-api.ap-southeast-1.amazonaws.com/dev/';
apiGatewayEndpoint = apiGatewayEndpoint.replace('wss://', 'https://');
const apiGateway = new client_apigatewaymanagementapi_1.ApiGatewayManagementApiClient({
    endpoint: apiGatewayEndpoint,
    region: region
});
const handler = async (event, context) => {
    try {
        (0, logger_1.debug)("Connected", {
            event: event,
            context: context,
            env: process.env,
            cwd: process.cwd(),
            __dirname: __dirname,
            lsCwdFiles: (0, fs_1.readdirSync)(process.cwd()),
        });
        const connectionId = event.requestContext.connectionId;
        if (!event.body) {
            throw new Error("No message body");
        }
        if (!connectionId) {
            throw new Error("No connectionId");
        }
        const message = JSON.parse(event.body);
        if (message.action === "ping") {
            const command = new client_apigatewaymanagementapi_1.PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify({ action: "pong" })
            });
            // return { statusCode: 200, body: JSON.stringify({ action: "pong" }) };
            await apiGateway.send(command);
        }
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send message", error);
        return { statusCode: 500, body: 'Failed to send message' };
    }
    // Your message handling logic here
    return { statusCode: 200, body: 'Message received' };
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvcGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw0RkFBaUg7QUFDakgsNENBQXdEO0FBQ3hELDJCQUFpQztBQUVqQyw2Q0FBNkM7QUFDN0MsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksZ0JBQWdCLENBQUM7QUFDMUQscUNBQXFDO0FBQ3JDLElBQUksa0JBQWtCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxnRUFBZ0UsQ0FBQztBQUM3SCxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBQ3JFLE1BQU0sVUFBVSxHQUFHLElBQUksOERBQTZCLENBQUM7SUFDbkQsUUFBUSxFQUFFLGtCQUFrQjtJQUM1QixNQUFNLEVBQUUsTUFBTTtDQUNmLENBQUMsQ0FBQztBQUVJLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFzQixFQUFFLE9BQWdCLEVBQUUsRUFBRTtJQUN4RSxJQUFJLENBQUM7UUFDSCxJQUFBLGNBQUssRUFBQyxXQUFXLEVBQUU7WUFDakIsS0FBSyxFQUFFLEtBQUs7WUFDWixPQUFPLEVBQUUsT0FBTztZQUNoQixHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUc7WUFDaEIsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDbEIsU0FBUyxFQUFFLFNBQVM7WUFDcEIsVUFBVSxFQUFFLElBQUEsZ0JBQVcsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDdkMsQ0FBQyxDQUFDO1FBR0gsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUM7UUFFdkQsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDckMsQ0FBQztRQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDckMsQ0FBQztRQUNELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZDLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxNQUFNLEVBQUUsQ0FBQztZQUM5QixNQUFNLE9BQU8sR0FBRyxJQUFJLHdEQUF1QixDQUFDO2dCQUMxQyxZQUFZLEVBQUUsWUFBWTtnQkFDMUIsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7YUFDekMsQ0FBQyxDQUFDO1lBRUgsd0VBQXdFO1lBQ3hFLE1BQU0sVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixJQUFBLGlCQUFRLEVBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLHdCQUF3QixFQUFFLENBQUM7SUFDN0QsQ0FBQztJQUVELG1DQUFtQztJQUNuQyxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztBQUN2RCxDQUFDLENBQUM7QUFyQ1csUUFBQSxPQUFPLFdBcUNsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlFdmVudCwgQ29udGV4dCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQXBpR2F0ZXdheU1hbmFnZW1lbnRBcGlDbGllbnQsIFBvc3RUb0Nvbm5lY3Rpb25Db21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWFwaWdhdGV3YXltYW5hZ2VtZW50YXBpJztcbmltcG9ydCB7IGRlYnVnLCBsb2dFcnJvciwgaW5mbyB9IGZyb20gXCIuLi91dGlscy9sb2dnZXJcIjtcbmltcG9ydCB7IHJlYWRkaXJTeW5jIH0gZnJvbSAnZnMnO1xuXG4vLyBSZXBsYWNlIHdpdGggeW91ciBkZWZhdWx0IHJlZ2lvbiBpZiBuZWVkZWRcbmNvbnN0IHJlZ2lvbiA9IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgJ2FwLXNvdXRoZWFzdC0xJztcbi8vIERlZmF1bHQgZW5kcG9pbnQgZm9yIGxvY2FsIHRlc3RpbmdcbmxldCBhcGlHYXRld2F5RW5kcG9pbnQgPSBwcm9jZXNzLmVudi5BUElHQVRFV0FZX0VORFBPSU5UIHx8ICd3c3M6Ly9keXdnNHdwZjhlLmV4ZWN1dGUtYXBpLmFwLXNvdXRoZWFzdC0xLmFtYXpvbmF3cy5jb20vZGV2Lyc7XG5hcGlHYXRld2F5RW5kcG9pbnQgPSBhcGlHYXRld2F5RW5kcG9pbnQucmVwbGFjZSgnd3NzOi8vJywgJ2h0dHBzOi8vJylcbmNvbnN0IGFwaUdhdGV3YXkgPSBuZXcgQXBpR2F0ZXdheU1hbmFnZW1lbnRBcGlDbGllbnQoe1xuICBlbmRwb2ludDogYXBpR2F0ZXdheUVuZHBvaW50LFxuICByZWdpb246IHJlZ2lvblxufSk7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5RXZlbnQsIGNvbnRleHQ6IENvbnRleHQpID0+IHtcbiAgdHJ5IHtcbiAgICBkZWJ1ZyhcIkNvbm5lY3RlZFwiLCB7XG4gICAgICBldmVudDogZXZlbnQsXG4gICAgICBjb250ZXh0OiBjb250ZXh0LFxuICAgICAgZW52OiBwcm9jZXNzLmVudixcbiAgICAgIGN3ZDogcHJvY2Vzcy5jd2QoKSxcbiAgICAgIF9fZGlybmFtZTogX19kaXJuYW1lLFxuICAgICAgbHNDd2RGaWxlczogcmVhZGRpclN5bmMocHJvY2Vzcy5jd2QoKSksXG4gICAgfSk7XG5cblxuICAgIGNvbnN0IGNvbm5lY3Rpb25JZCA9IGV2ZW50LnJlcXVlc3RDb250ZXh0LmNvbm5lY3Rpb25JZDtcblxuICAgIGlmICghZXZlbnQuYm9keSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbWVzc2FnZSBib2R5XCIpO1xuICAgIH0gaWYgKCFjb25uZWN0aW9uSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNvbm5lY3Rpb25JZFwiKTtcbiAgICB9XG4gICAgY29uc3QgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSk7XG5cbiAgICBpZiAobWVzc2FnZS5hY3Rpb24gPT09IFwicGluZ1wiKSB7XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFBvc3RUb0Nvbm5lY3Rpb25Db21tYW5kKHtcbiAgICAgICAgQ29ubmVjdGlvbklkOiBjb25uZWN0aW9uSWQsXG4gICAgICAgIERhdGE6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiBcInBvbmdcIiB9KVxuICAgICAgfSk7XG5cbiAgICAgIC8vIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3Rpb246IFwicG9uZ1wiIH0pIH07XG4gICAgICBhd2FpdCBhcGlHYXRld2F5LnNlbmQoY29tbWFuZCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ0Vycm9yKFwiRmFpbGVkIHRvIHNlbmQgbWVzc2FnZVwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogNTAwLCBib2R5OiAnRmFpbGVkIHRvIHNlbmQgbWVzc2FnZScgfTtcbiAgfVxuXG4gIC8vIFlvdXIgbWVzc2FnZSBoYW5kbGluZyBsb2dpYyBoZXJlXG4gIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgYm9keTogJ01lc3NhZ2UgcmVjZWl2ZWQnIH07XG59O1xuXG5cbiJdfQ==