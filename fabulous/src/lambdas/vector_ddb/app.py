import json
import enum
import os
import logging
import cfnresponse
import boto3
from botocore.config import Config
import sys

bedrock_runtime = boto3.client(
    "bedrock-runtime", config=Config(region_name=os.environ["AWS_REGION"])
)
logger = logging.getLogger()
logger.setLevel(logging.INFO)


class LambdaHanderNames(enum.Enum):
    INIT_RANDOM_VECTORS = "init_random_vectors"
    ADD_ARTICLES = "add_articles"
    READ_ARTICLES = "read_articles"


def handler(event, context):
    try:
        lambda_handler_name = os.getenv("LAMBDA_HANDLER", "UNKNOWN_HANDLER")
        logger.info(
            {
                "lambda_handler_name": lambda_handler_name,
                "Python path:": sys.path,
                "Current working directory:": os.getcwd(),
                "Contents of current directory:": os.listdir(),
            }
        )

        if lambda_handler_name == LambdaHanderNames.INIT_RANDOM_VECTORS.value:
            from handlers import init_random_vectors

            if "ResponseURL" in event:
                result = init_random_vectors.handler(event, context)
                cfnresponse.send(
                    event,
                    context,
                    cfnresponse.SUCCESS,
                    {"Message": "Resource created successfully"},
                )
                return result
        elif lambda_handler_name == LambdaHanderNames.ADD_ARTICLES.value:
            from handlers import add_articles

            return add_articles.handler(event, context)
        elif lambda_handler_name == LambdaHanderNames.READ_ARTICLES.value:
            from handlers import read_articles

            return read_articles.handler(event, context)
        else:
            if "ResponseURL" in event:
                cfnresponse.send(
                    event,
                    context,
                    cfnresponse.SUCCESS,
                    {"Message": "Unfound Lambda Handler"},
                )

            return {
                "statusCode": 400,
                "body": f"Invalid Lambda Handler: {lambda_handler_name}",
            }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        if "ResponseURL" in event:
            cfnresponse.send(event, context, cfnresponse.FAILED, {"Message": str(e)})
        return {"statusCode": 400, "body": "some error"}
