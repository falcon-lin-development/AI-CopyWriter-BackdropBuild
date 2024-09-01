import json
import os
import logging
import typing as t
import boto3
from datetime import datetime
from botocore.config import Config

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
sns = boto3.client("sns")
# s3 = boto3.client("s3")
bedrock_runtime = boto3.client(
    "bedrock-runtime", config=Config(region_name=os.environ["AWS_REGION"])
)


def handler(event: t.Dict[str, t.Any], context: t.Any) -> None:
    try:
        logger.info(json.dumps({"message": "Bedrock", "event": event}))

        for record in event["Records"]:
            process_record(record)
    except Exception as e:
        logger.error("Error in handler", exc_info=True)


def process_record(record: t.Dict[str, t.Any]) -> None:
    try:
        logger.info(json.dumps({"message": "Processing record", "record": record}))

        sns_msg = json.loads(record["Sns"]["Message"])

        logger.info(json.dumps({"message": "Parsed snsMsg", "sns_msg": sns_msg}))

        # Bedrocks
        models = {
            "titan_lite": "amazon.titan-text-lite-v1",
            "llama_3_instruct_8b": "meta.llama3-8b-instruct-v1:0",
            "titan_text_premier": "amazon.titan-text-premier-v1:0",
            "claude_3_haiku": "anthropic.claude-3-haiku-20240307-v1:0",
            "llama_3_instruct_70b": "meta.llama3-70b-instruct-v1:0",
            "claude_3_5_sonnet": "anthropic.claude-3-5-sonnet-20240620-v1:0",
        }
        prompt = f"""
        You are a social media content expert.
        Generate a concise, engaging Instagram post for a business client on behave of their request. \
        
        '''client request
        {sns_msg['message']['message']}
        '''
        
        The post should:
        - Be approximately 100 words long
        - Include relevant emojis
        - Be informative yet fun and easy to read
        - Capture attention quickly (assume readers have only a few seconds to decide whether to read)
        - Focus on a business need related to the topic
        - Exclude greetings and meta-commentary

        Respond only with the post content, formatted as it would appear on Instagram.
        """
        result_titan_text_premier = titan(
            prompt=prompt, model_id=models["titan_text_premier"]
        )

        result = {
            "result_titan_text_premier": result_titan_text_premier,
            "recommended": result_titan_text_premier,
        }

        # Store vector info in DynamoDB
        dynamo_params = {
            "TableName": os.environ["VECTOR_TABLE"],
            "Item": {
                "id": sns_msg["connectionId"],
                "vector": "Simulated vector data",
                "timestamp": datetime.now().isoformat(),
            },
        }
        # dynamodb.Table(os.environ['VECTOR_TABLE']).put_item(**dynamo_params)
        logger.info(
            json.dumps(
                {
                    "message": "Vector info stored in DynamoDB",
                    "dynamo_params": dynamo_params,
                }
            )
        )

        # Send result to SNS
        sns_params = {
            "TopicArn": os.environ["SNS_RESULT_TOPIC"],
            "Message": json.dumps(
                {"connectionId": sns_msg["connectionId"], "result": result}
            ),
        }
        sns.publish(**sns_params)
        logger.info(
            json.dumps({"message": "Result sent to SNS", "sns_params": sns_params})
        )

    except Exception as e:
        logger.error("Error processing record", exc_info=True)


def titan(prompt: str, model_id: str) -> str:
    try:
        bedrock_params = {
            "modelId": model_id,
            "contentType": "application/json",
            "accept": "application/json",
            "body": json.dumps(
                {
                    "inputText": prompt,
                    "textGenerationConfig": {
                        "maxTokenCount": 300,
                        "temperature": 0.7,
                        "topP": 1,
                        "stopSequences": [],
                    },
                }
            ),
        }
        logger.info(
            json.dumps(
                {
                    "message": "Invoke Bedrock with params",
                    "bedrock_params": bedrock_params,
                }
            )
        )

        response = bedrock_runtime.invoke_model(**bedrock_params)
        response_body = json.loads(response["body"].read().decode("utf-8"))
        logger.info(
            json.dumps(
                {
                    "message": "Bedrock response",
                    "model_id": model_id,
                    # "response": response,
                    "serializable_response": {
                        "ResponseMetadata": response.get("ResponseMetadata", {}),
                        "ContentType": response.get("ContentType", ""),
                        "StatusCode": response.get("StatusCode", None),
                    },
                    "response_body": response_body,
                }
            )
        )

        result = response_body["results"][0]["outputText"]
        logger.info(
            json.dumps(
                {"message": "Bedrock result", "model_id": model_id, "result": result}
            )
        )

        return result
    except Exception as e:
        logger.error(f"Error in {model_id}", exc_info=True)
        return f"Error in {model_id}"
