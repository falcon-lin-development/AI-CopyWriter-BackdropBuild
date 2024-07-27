import { APIGatewayEvent, Context } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { debug, error, info } from "./logger";
import { readdirSync } from 'fs';

// Replace with your default region if needed
const region = process.env.AWS_REGION || 'ap-southeast-1';
// Default endpoint for local testing
let apiGatewayEndpoint = process.env.APIGATEWAY_ENDPOINT || 'wss://dywg4wpf8e.execute-api.ap-southeast-1.amazonaws.com/dev/';
apiGatewayEndpoint = apiGatewayEndpoint.replace('wss://', 'https://')
const apiGateway = new ApiGatewayManagementApiClient({
  endpoint: apiGatewayEndpoint,
  region: region
});

export const handler = async (event: APIGatewayEvent, context: Context) => {
  try {
    debug("Connected", {
      event: event,
      context: context,
      env: process.env,
      cwd: process.cwd(),
      __dirname: __dirname,
      lsCwdFiles: readdirSync(process.cwd()),
    });


    const connectionId = event.requestContext.connectionId;

    if (!event.body) {
      throw new Error("No message body");
    } if (!connectionId) {
      throw new Error("No connectionId");
    }
    const message = JSON.parse(event.body);

    if (message.action === "ping") {
      const command = new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify({ action: "pong" })
      });

      // return { statusCode: 200, body: JSON.stringify({ action: "pong" }) };
      await apiGateway.send(command);
    }
  } catch (error) {
    console.error("Failed to send message", error);
    return { statusCode: 500, body: 'Failed to send message' };
  }

  // Your message handling logic here
  return { statusCode: 200, body: 'Message received' };
};


