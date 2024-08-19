import boto3
import json
import numpy as np
import os
from botocore.exceptions import ClientError
import logging
from botocore.config import Config

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


def get_random_vectors():
    response = dynamodb.get_item(
        TableName=random_vectors_table_name, Key={"id": {"S": "random_vectors"}}
    )
    return json.loads(response["Item"]["vector"]["S"])


def hash_vector(vector, random_vectors):
    # TODO: Implement this using matrix multiplication
    return "".join(["1" if np.dot(vector, rv) > 0 else "0" for rv in random_vectors])


def get_embedding(text):
    body = json.dumps({"inputText": text})
    response = bedrock_runtime.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        contentType="application/json",
        accept="application/json",
        body=body,
    )
    response_body = json.loads(response["body"].read())
    return response_body["embedding"]


def cosine_similarity(v1, v2):
    # Calculate the cosine similarity between two vectors
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))


def handler(event, context):
    try:
        # Parse the request body
        query = json.loads(event["body"])["query"]

        # Generate embedding for the query
        query_embedding = get_embedding(query)

        # Get LSH hash for the query
        random_vectors = get_random_vectors()
        lsh_hash = hash_vector(query_embedding, random_vectors)

        logger.info(json.dumps({
            "message": "Query successful",
            "query": query,
            "hash": lsh_hash,
        }))

        # Query the DynamoDB table for similar vectors
        response = dynamodb.query(
            TableName=vector_table_name,
            # KeyConditionExpression="hash = :hash",
            # ExpressionAttributeValues={":hash": {"S": lsh_hash}},
            KeyConditionExpression="#h = :hash_value",
            ExpressionAttributeNames={"#h": "hash"},
            ExpressionAttributeValues={":hash_value": {"N": str(lsh_hash)}},
        )

        # Calculate cosine similarity for each vector
        items = response.get("Items", [])
        results = []
        for item in items:
            article_embbeding = json.loads(item["embedding"]["S"])
            similarity = cosine_similarity(query_embedding, article_embbeding)
            results.append(
                {
                    "id": item["id"]["S"],
                    "content": json.loads(item["content"]["S"]),
                    "similarity": similarity,
                }
            )
        else:
            results.sort(key=lambda x: x["similarity"], reverse=True)

        logger.info(
            json.dumps(
                {
                    "message": "Query successful",
                    "query": query,
                    "hash": lsh_hash,
                    "results": results[:5],
                }
            )
        )

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Query successful",
                    # "query": query,
                    # "hash": lsh_hash,
                    # "results": results[:5],  # Return only top 5 results
                }
            ),
        }
    except Exception as e:
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}
