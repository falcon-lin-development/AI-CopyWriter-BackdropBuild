import os
import boto3
import json
import numpy as np
from botocore.exceptions import ClientError
import hashlib
import logging
from botocore.config import Config

dynamodb = boto3.client('dynamodb')
bedrock_runtime = boto3.client(
    "bedrock-runtime", config=Config(region_name=os.environ["AWS_REGION"])
)
vector_table_name = os.environ['VECTOR_TABLE']
random_vectors_table_name = os.environ['RANDOM_VECTORS_TABLE']
vector_table = dynamodb.Table(vector_table_name)
random_vectors_table = dynamodb.Table(random_vectors_table_name)

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_random_vectors():
    response = dynamodb.get_item(
        TableName=random_vectors_table_name, 
        Key={'id': {'S': 'random_vectors'}}
    )
    return json.loads(response['Item']['vector']['S'])


def hash_vector(vector, random_vectors):
    # TODO: Implement this using matrix multiplication
    return "".join(["1" if np.dot(vector, rv) > 0 else "0" for rv in random_vectors])

def get_embedding(text):
    body = json.dumps({
        "inputText": text
    })
    response = bedrock_runtime.invoke_model(
        modelId="amazon.titan-embed-text-v1",
        contentType="application/json",
        accept="application/json",
        body=body
    )
    response_body = json.loads(response['body'].read())
    return response_body["embedding"]



def handler(event, context):
    try:
        article = json.loads(event['body'])
        article_id = article["id"]
        content = article["content"]

        # Get the embedding for the article
        embedding = get_embedding(content)

        # Get the random vectors
        random_vectors = get_random_vectors()
        lsh_hash = hash_vector(embedding, random_vectors)

        # store to dynamodb
        response = vector_table.put_item(
            Item={
                'hash': lsh_hash,
                'id': article_id,
                'content': json.dumps(content),
                'embedding': json.dumps(embedding)
            }
        )

        logger.info(json.dumps({
            'message': 'Article added successfully',
            'response': response,
            'hash': lsh_hash,
        }))


        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Article added successfully',
            })
        }

    except Exception as e:
        return {
            'statusCode': 400,
            'body': str(e)
        }   