import { APIGatewayEvent, Context } from 'aws-lambda';
export declare const handler: (event: APIGatewayEvent, context: Context) => Promise<{
    statusCode: number;
    body: string;
}>;
