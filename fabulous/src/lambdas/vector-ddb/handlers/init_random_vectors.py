import json
import numpy as np
import boto3
import os
import logging
import sys

dynamodb = boto3.client("dynamodb", region_name=os.getenv("AWS_REGION"))
random_vectors_table_name = os.getenv("RANDOM_VECTORS_TABLE")

# LSH parameters
NUM_PROJECTIONS = 10
VECTOR_DIM = 1024  # Bedrock Titan embedding dimension

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def generate_random_vectors(d, num_hashes):
    # Generate d dimension random vectors for LSH
    return [np.random.rand(d).tolist() for _ in range(num_hashes)]


# Function to convert DynamoDB response to a JSON serializable format
def convert_dynamodb_item(item):
    return {k: list(v.values())[0] for k, v in item.items()}


def handler(event, context):
    try:

        ##################################################
        # check is random vectors already exist
        ##################################################
        logger.info("Checking if random vectors already exist")

        response = dynamodb.get_item(
            TableName=random_vectors_table_name, Key={"id": {"S": "random_vectors"}}
        )
        item = response.get("Item", {})
        if item:
            serializable_item = convert_dynamodb_item(item)
            serialized_item = json.dumps(serializable_item)
            logger.info({
                "serialized_item": serialized_item,
                "size_serialized_item": sys.getsizeof(serialized_item),
            })
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
        random_vectors = generate_random_vectors(
            d=VECTOR_DIM, num_hashes=NUM_PROJECTIONS
        )
        # Convert to JSON string
        serialized_vector = json.dumps(random_vectors)
        logger.info(
            {
                "size_serialized_vector": sys.getsizeof(serialized_vector),
            }
        )

        response = dynamodb.put_item(
            TableName=random_vectors_table_name,
            Item={
                "id": {"S": "random_vectors"},
                "vector": {"S": serialized_vector},
            },
        )

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
