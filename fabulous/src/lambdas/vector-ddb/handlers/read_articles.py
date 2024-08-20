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
    rvs = []
    for i in range(1, 4):

        response = dynamodb.get_item(
            TableName=random_vectors_table_name,
            Key={"id": {"S": f"random_vectors_{i}"}},
        )
        rvs.append(json.loads(response["Item"]["vector"]["S"]))
    return rvs


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


def generate_hamming_neighbors(hash_value):
    return [
        hash_value[:i] + ("1" if hash_value[i] == "0" else "0") + hash_value[i + 1 :]
        for i in range(len(hash_value))
    ]


def query_lsh_table(
    table_name,
    index_name,
    pk_name,
    hash_value,
):
    neighbors = [hash_value] + generate_hamming_neighbors(hash_value)
    results = []
    for neighbor in neighbors:
        response = dynamodb.query(
            TableName=table_name,
            IndexName=index_name,
            KeyConditionExpression=f"{pk_name.lower()} = :hash_value",
            ExpressionAttributeValues={":hash_value": {"N": str(int(neighbor, 2))}},
        )
        results.extend(response.get("Items", []))
    return results


def handler(event, context):
    try:
        # Parse the request body
        query = json.loads(event["body"])["query"]
        query_embedding = get_embedding(query)
        random_vectors = get_random_vectors()
        lsh_hashes = [hash_vector(query_embedding, rv) for rv in random_vectors]

        logger.info(
            json.dumps(
                {
                    "message": "Query successful",
                    "query": query,
                    "hash": lsh_hashes,
                }
            )
        )

        # Query all LSH tables
        all_results = []
        for i, hash_value in enumerate(lsh_hashes, 1):
            results = query_lsh_table(
                table_name=vector_table_name,
                index_name=f"LSH{i}",
                pk_name="hash" + str(i),
                hash_value=hash_value,
            )
            all_results.extend(results)

        # Remove duplicates and calculate similarities
        unique_results = {}
        for item in all_results:
            if item["id"]["S"] not in unique_results:
                article_embedding = json.loads(item["embedding"]["S"])
                similarity = cosine_similarity(query_embedding, article_embedding)
                unique_results[item["id"]["S"]] = {
                    "id": item["id"]["S"],
                    "content": json.loads(item["content"]["S"]),
                    "similarity": similarity,
                }

        # Sort results by similarity
        sorted_results = sorted(
            unique_results.values(), key=lambda x: x["similarity"], reverse=True
        )

        logger.info(
            json.dumps(
                {
                    "message": "Query successful",
                    "query": query,
                    "hashes": lsh_hashes,
                    "results": sorted_results[:5],
                }
            )
        )

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Query successful",
                    "results": sorted_results[:5],  # Return only top 5 results
                }
            ),
        }
    except Exception as e:
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}
