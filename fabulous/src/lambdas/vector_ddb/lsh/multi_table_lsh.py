import os
import sys
import json
import logging
import numpy as np
from scipy.stats import ortho_group

# AWS
import boto3
from botocore.config import Config

# custom imports
from .decorators import (
    require_rv_table_name,
    require_counter_table_name,
    require_v_table_name,
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb = boto3.client("dynamodb", region_name=os.getenv("AWS_REGION"))
bedrock_runtime = boto3.client(
    "bedrock-runtime", config=Config(region_name=os.environ["AWS_REGION"])
)


# Multi-table LSH based on DynamoDB
class MultiTableLSH:
    # LSH parameters
    NUM_TABLE = 3
    VECTOR_DIM = 1024  # Bedrock Titan embedding dimension
    NUM_PROJECTIONS = 10
    COUNTER_NAME = "vector_id"

    def index_name(self, i):
        return f"LSH{i}"

    def pk_name(self, i):
        return f"hash{i}"

    def __init__(self, rv_table_name=None, v_table_name=None, counter_table_name=None):
        self.rv_table_name = rv_table_name
        self.v_table_name = v_table_name
        self.counter_table_name = counter_table_name

    @require_rv_table_name
    @require_v_table_name
    @require_counter_table_name
    def put_data(self, content):
        next_id = self.get_next_id()
        # Get the embedding for the article
        embedding = self.get_embedding(content)
        # Get random vectors
        random_vectors = self.get_random_vectors()
        # Hash the embedding
        lsh_hashes = [self.fast_hash_vector(embedding, rv) for rv in random_vectors]
        # Store the hash and embedding in the DynamoDB table
        response = dynamodb.put_item(
            TableName=self.v_table_name,
            Item={
                "id": {"N": str(next_id)},
                "content": {"S": json.dumps(content)},
                "embedding": {"S": json.dumps(embedding)},
                "hash1": {"N": str(int(lsh_hashes[0], 2))},
                "hash2": {"N": str(int(lsh_hashes[1], 2))},
                "hash3": {"N": str(int(lsh_hashes[2], 2))},
            },
        )
        return response

    @require_rv_table_name
    @require_v_table_name
    def querySimilarData(self, query, table=3, hammer=1, topk=5):
        query_embedding = self.get_embedding(query)
        random_vectors = self.get_random_vectors()
        lsh_hashes = [
            self.fast_hash_vector(query_embedding, rv) for rv in random_vectors
        ]

        # Query all LSH tables
        hammer_0_results = []
        hammer_1_results = []
        for i, hash_value in enumerate(lsh_hashes, 1):
            response =  self.queryTable(hash_value, i)
            hammer_0_results.extend(response.get("Items", []))

            results = []
            neighbors = [hash_value] + self.generate_hamming_neighbors(hash_value)
            for neighbor in neighbors:
                response =  self.queryTable(neighbor, i)
                results.extend(response.get("Items", []))
            else:
                hammer_1_results.extend(results)
        else:
            logger.info({
                "message": "Query successful",
                "query": query,
                # map result to not include the embedding
                "hammer_0_results": list(map(lambda x: {k: v for k, v in x.items() if k != "embedding"}, hammer_0_results)),
                "hammer_1_results": list(map(lambda x: {k: v for k, v in x.items() if k != "embedding"}, hammer_1_results))                
            })

        # Cosine Similarity
        unique_results = {}
        for item in hammer_0_results + hammer_1_results:
            if item["id"]["N"] not in unique_results:
                article_embedding = json.loads(item["embedding"]["S"])
                similarity = self.cosine_similarity(query_embedding, article_embedding)
                unique_results[item["id"]["N"]] = {
                    "id": item["id"]["N"],
                    "content": json.loads(item["content"]["S"]),
                    "similarity": similarity,
                    "hash1": item["hash1"]["N"],
                    "hash2": item["hash2"]["N"],
                    "hash3": item["hash3"]["N"],
                }
        
        # Sort by similarity
        sorted_results = sorted(
            unique_results.values(), key=lambda x: x["similarity"], reverse=True
        )

        return sorted_results[:topk]

    @require_v_table_name
    def queryTable(self, hash_value, index_i):
        response = response = dynamodb.query(
            TableName=self.v_table_name,
            IndexName=self.index_name(index_i),
            KeyConditionExpression=f"{self.pk_name(index_i).lower()} = :hash_value",
            ExpressionAttributeValues={
                ":hash_value": {"N": str(int(hash_value, 2))}
            },
        )
        return response
    #####################
    # HELPER FUNCTIONS
    #####################
    @require_counter_table_name
    def get_next_id(self):
        response = dynamodb.update_item(
            TableName=self.counter_table_name,
            Key={"counter_name": {"S": self.COUNTER_NAME}},
            UpdateExpression="SET current_value = if_not_exists(current_value, :start) + :incr",
            ExpressionAttributeValues={":incr": {"N": "1"}, ":start": {"N": "0"}},
            ReturnValues="UPDATED_NEW",
        )
        return int(response["Attributes"]["current_value"]["N"])

    def get_embedding(self, text):
        body = json.dumps({"inputText": text})
        response = bedrock_runtime.invoke_model(
            modelId="amazon.titan-embed-text-v2:0",
            contentType="application/json",
            accept="application/json",
            body=body,
        )
        response_body = json.loads(response["body"].read())
        return response_body["embedding"]

    @require_rv_table_name
    def get_random_vectors(self):
        if not self.rv_table_name:
            raise ValueError("Random vectors table name not provided")

        rvs = []
        for i in range(1, 4):
            response = dynamodb.get_item(
                TableName=self.rv_table_name, Key={"id": {"S": f"random_vectors_{i}"}}
            )
            rvs.append(json.loads(response["Item"]["vector"]["S"]))
        return rvs

    def hash_vector(self, vector, random_vectors):
        # TODO: Implement this using matrix multiplication
        return "".join(
            ["1" if np.dot(vector, rv) > 0 else "0" for rv in random_vectors]
        )

    def fast_hash_vector(self, vector, random_vectors):
        # Convert random_vectors to a 2D numpy array if it's not already
        random_vectors_matrix = np.array(random_vectors)

        # Perform matrix multiplication
        dot_products = np.dot(random_vectors_matrix, vector)

        # Convert to binary hash
        binary_hash = (dot_products > 0).astype(int)

        # Join into a string
        return "".join(binary_hash.astype(str))

    def cosine_similarity(self, v1, v2):
        # Calculate the cosine similarity between two vectors
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    def generate_hamming_neighbors(self, hash_value):
        return [
            hash_value[:i]
            + ("1" if hash_value[i] == "0" else "0")
            + hash_value[i + 1 :]
            for i in range(len(hash_value))
        ]

    ########### Init Random Vectors ###########
    @require_rv_table_name
    def init_random_vectors(self):
        # Check if random vectors already exist
        # if not, generate and store random vectors
        for i in range(1, self.NUM_TABLE + 1):
            response = dynamodb.get_item(
                TableName=self.rv_table_name, Key={"id": {"S": f"random_vectors_{i}"}}
            )

            if "Item" in response:
                logger.info(
                    json.dumps(
                        {
                            "message": f"Random vectors {i} already exist",
                        }
                    )
                )
                continue
            else:
                logger.info(
                    json.dumps(
                        {
                            "message": f"Random vectors {i} not found",
                        }
                    )
                )
                rv = self._generate_orthogonal_vectors(
                    self.VECTOR_DIM, self.NUM_PROJECTIONS
                )
                serialized_rv = json.dumps(rv)
                logger.info(
                    json.dumps(
                        {
                            "message": f"generated rv {i}: {rv}",
                            "size_serialized_vector": sys.getsizeof(serialized_rv),
                        }
                    )
                )
                response = dynamodb.put_item(
                    TableName=self.rv_table_name,
                    Item={
                        "id": {"S": f"random_vectors_{i}"},
                        "vector": {"S": serialized_rv},
                    },
                )
        else:
            logger.info(
                json.dumps(
                    {
                        "message": "Random vectors initialized successfully",
                    }
                )
            )

    def _generate_orthogonal_vectors(self, d, num_hashes):
        # Generate d-dimensional orthogonal vectors
        vectors = np.random.randn(num_hashes, d)
        q, _ = np.linalg.qr(vectors.T)
        return q.T.tolist()
