import boto3
import json
import numpy as np
import os
from botocore.exceptions import ClientError
import logging
from botocore.config import Config
from lsh.multi_table_lsh import MultiTableLSH


# Initialize AWS clients
dynamodb = boto3.client("dynamodb")
bedrock_runtime = boto3.client(
    "bedrock-runtime", config=Config(region_name=os.environ["AWS_REGION"])
)
random_vectors_table_name = os.getenv("RANDOM_VECTORS_TABLE")
vector_table_name = os.environ["VECTOR_TABLE"]

# Initialize logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    try:
        # Parse the request body
        query = json.loads(event["body"])["query"]
        # Initialize the MultiTableLSH class
        lsh = MultiTableLSH(
            rv_table_name=random_vectors_table_name,
            v_table_name=vector_table_name,
            counter_table_name=None,
        )
        results = lsh.querySimilarData(query)

        logger.info(
            json.dumps(
                {
                    "message": "Query successful",
                    "query": query,
                    "results": results,
                }
            )
        )

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Query successful",
                    "results": results,  # Return only top 5 results
                }
            ),
        }
    except Exception as e:
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}
