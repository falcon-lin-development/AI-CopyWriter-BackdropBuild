import json
import numpy as np
import boto3
import os
import logging
import sys
from lsh.multi_table_lsh import MultiTableLSH

dynamodb = boto3.client("dynamodb", region_name=os.getenv("AWS_REGION"))
random_vectors_table_name = os.getenv("RANDOM_VECTORS_TABLE")

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    try:
        multi_table_lsh = MultiTableLSH(
            rv_table_name=random_vectors_table_name,
        )
        multi_table_lsh.init_random_vectors()
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Random vectors added successfully"}),
        }
    except Exception as e:
        logging.error(str(e))
        return {"statusCode": 400, "body": "Some error occurred"}
