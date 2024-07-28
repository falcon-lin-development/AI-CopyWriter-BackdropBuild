import { debug, error, info } from "./logger";
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({});
const s3 = new S3Client({});
const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

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
    const models = {
      titan_lite: "amazon.titan-text-lite-v1",
      llama_3_instruct_8b: "meta.llama3-8b-instruct-v1:0",
      titan_text_premier: "amazon.titan-text-premier-v1:0",
      claude_3_haiku: "anthropic.claude-3-haiku-20240307-v1:0",
      llama_3_instruct_70b: "meta.llama3-70b-instruct-v1:0",
      claude_3_5_sonnet: "anthropic.claude-3-5-sonnet-20240620-v1:0"
    }
    const prompt = `
      You are a social media content expert.
      Generate a concise, engaging Instagram post for a business client on behave of their request. \
      
      """client request
      ${message.message.message}
      """
      
      The post should:
      - Be approximately 100 words long
      - Include relevant emojis
      - Be informative yet fun and easy to read
      - Capture attention quickly (assume readers have only a few seconds to decide whether to read)
      - Focus on a business need related to the topic
      - Exclude greetings and meta-commentary

      Respond only with the post content, formatted as it would appear on Instagram.
    `

    // Invoke Bedrock model
    // const result_titan_lite = await titan({
    //   prompt,
    //   modelId: models.titan_lite
    // });
    // const result_llama_3_instruct_8b = await llama3({
    //   prompt,
    //   modelId: models.llama_3_instruct_8b
    // });
    const result_titan_text_premier = await titan({
      prompt,
      modelId: models.titan_text_premier
    });
    // const result_claude_3_haiku = await claude3({
    //   prompt,
    //   modelId: models.claude_3_haiku
    // });
    // const result_llama_3_instruct_70b = await llama3({
    //   prompt,
    //   modelId: models.llama_3_instruct_70b
    // });
    // const result_claude_3_5_sonnet = await claude3({
    //   prompt,
    //   modelId: models.claude_3_5_sonnet
    // });
    const result = {
      // result_titan_lite,
      // result_llama_3_instruct_8b,
      result_titan_text_premier,
      // result_claude_3_haiku,
      // result_llama_3_instruct_70b,
      // result_claude_3_5_sonnet
      recommended: result_titan_text_premier,
    }

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


const llama3 = async ({
  prompt,
  modelId,
}: {
  prompt: string,
  modelId: string
}) => {
  try {
    const _prompt = `
    <|begin_of_text|>
    <|start_header_id|>user<|end_header_id|>
    ${prompt}
    <|eot_id|>
    <|start_header_id|>assistant<|end_header_id|>
    `;

    // Invoke Bedrock model - Meta Llama 3 Instruct 8B
    let bedrockParams = {
      // modelId: models.llama_3_instruct_8b,
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: _prompt,
        max_gen_len: 300,
        temperature: 0.7,
        top_p: 0.9,
      }),
    };
    debug('Invoke Bedrock with params', { modelId, bedrockParams });
    const command = new InvokeModelCommand(bedrockParams);
    const bedrockResponse = await bedrockClient.send(command);
    // Parse Bedrock response
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    debug('Bedrock response', { modelId, bedrockResponse, responseBody });
    const result = responseBody.generation;
    debug('Bedrock result', { modelId, result });
    return result;
  } catch (e) {
    error(`Error in ${modelId}`, { error: e });

    return `Error in ${modelId}`;
  }
}

const titan = async ({
  prompt,
  modelId,
}: {
  prompt: string,
  modelId: string
}) => {
  try {

    // Invoke Bedrock model - Amazon Titan Text Express
    let bedrockParams = {
      // modelId: models.titan_text_premier,
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 300,
          temperature: 0.7,
          topP: 1,
          stopSequences: [],
        }
      }),
    };
    debug('Invoke Bedrock with params', { modelId, bedrockParams });
    const command = new InvokeModelCommand(bedrockParams);
    const bedrockResponse = await bedrockClient.send(command);
    // Parse Bedrock response
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    debug('Bedrock response', { modelId, bedrockResponse, responseBody });
    const result = responseBody.results[0].outputText;
    debug('Bedrock result', { modelId, result });
    return result;
  } catch (e) {
    error(`Error in ${modelId}`, { error: e });

    return `Error in ${modelId}`;
  }
}


const claude3 = async ({
  prompt,
  modelId,
}: {
  prompt: string,
  modelId: string
}) => {
  try {
    // Invoke Bedrock model - Anthropic Claude 3 Haiku
    let bedrockParams = {
      // modelId: models.claude_3_haiku,
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        messages:[
          {
            role: "user",
            content: [
              {type: "text", text: prompt}
            ]
          }
        ],
        // prompt: prompt,
        max_tokens: 300,
        temperature: 0.7,
        top_p: 1,
      }),
    };
    debug('Invoke Bedrock with params', { modelId, bedrockParams });
    const command = new InvokeModelCommand(bedrockParams);
    const bedrockResponse = await bedrockClient.send(command);
    // Parse Bedrock response
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    debug('Bedrock response', { modelId, bedrockResponse,responseBody  });
    const result = responseBody.completion || responseBody.content[0].text;
    debug('Bedrock result', { modelId, result });
    return result
  } catch (e) {
    error(`Error in ${modelId}`, { error: e });
    return `Error in ${modelId}`;
  }
}