import os
import boto3
import json
import numpy as np
from botocore.exceptions import ClientError
import hashlib
import logging
from botocore.config import Config
from lsh.multi_table_lsh import MultiTableLSH

dynamodb = boto3.client("dynamodb")
bedrock_runtime = boto3.client(
    "bedrock-runtime", config=Config(region_name=os.environ["AWS_REGION"])
)
vector_table_name = os.environ["VECTOR_TABLE"]
random_vectors_table_name = os.environ["RANDOM_VECTORS_TABLE"]
counter_table_name = os.environ["COUNTER_TABLE"]

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    try:
        logger.info(json.dumps(event))
        article = json.loads(event["body"])
        content = article["content"]
        lsh = MultiTableLSH(
            rv_table_name=random_vectors_table_name,
            v_table_name=vector_table_name,
            counter_table_name=counter_table_name,
        )

        response = lsh.put_data(content)

        logger.info(
            json.dumps(
                {
                    "message": "Article added successfully",
                    'content': content,
                    "response": response,
                }
            )
        )

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Article added successfully",
                }
            ),
        }

    except Exception as e:
        logger.error(str(e))
        return {"statusCode": 400, "body": str(e)}
