import json
import numpy as np
import boto3
import os
import logging
import sys

dynamodb = boto3.client("dynamodb", region_name=os.getenv("AWS_REGION"))
random_vectors_table_name = os.getenv("RANDOM_VECTORS_TABLE")

# LSH parameters
NUM_TABLES = 3
NUM_PROJECTIONS_PER_TABLE = 10
VECTOR_DIM = 1024  # Bedrock Titan embedding dimension

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def generate_orthogonal_vectors(d, num_hashes):
    # Generate d-dimensional orthogonal vectors
    vectors = np.random.randn(num_hashes, d)
    q, _ = np.linalg.qr(vectors.T)
    return q.T.tolist()


# Function to convert DynamoDB response to a JSON serializable format
def convert_dynamodb_item(item):
    return {k: list(v.values())[0] for k, v in item.items()}


def handler(event, context):
    try:
        ##################################################
        # check is random vectors already exist
        ##################################################
        response = dynamodb.get_item(
            TableName=random_vectors_table_name, Key={"id": {"S": "random_vectors"}}
        )
        item = response.get("Item", {})
        if item:
            serializable_item = convert_dynamodb_item(item)
            serialized_item = json.dumps(serializable_item)
            logger.info(
                {
                    "serialized_item": serialized_item,
                    "size_serialized_item": sys.getsizeof(serialized_item),
                }
            )
        else:
            logger.info("Item not found.")

        if "Item" in response:
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "Random vectors already exist"}),
            }

        #########################
        # generate random vectors
        #########################
        # Generate orthogonal random vectors for each table
        random_vectors = [
            generate_orthogonal_vectors(VECTOR_DIM, NUM_PROJECTIONS_PER_TABLE)
            for _ in range(NUM_TABLES)
        ]
        # Convert to JSON string

        for i, rv in enumerate(random_vectors, 1):
            serialized_v = json.dumps(rv)
            logger.info(
                {
                    "msg": f"rv {i}: {rv}",
                    "size_serialized_vector": sys.getsizeof(serialized_v),
                }
            )
            response = dynamodb.put_item(
                TableName=random_vectors_table_name,
                Item={
                    "id": {"S": f"random_vectors_{i}"},
                    "vector": {"S": serialized_v},
                },
            )
        else:
            logger.info(
                json.dumps(
                    {
                        "message": "Random vectors added successfully",
                    }
                )
            )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Random vectors added successfully"}),
        }
    except Exception as e:
        logging.error(str(e))
        return {"statusCode": 400, "body": "Some error occurred"}
