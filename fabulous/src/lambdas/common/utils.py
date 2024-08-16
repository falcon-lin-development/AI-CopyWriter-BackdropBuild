import boto3
import json
import numpy as np
import hashlib
from collections import defaultdict
from botocore.config import Config
import os

# Initialize DynamoDB and Bedrock clients
dynamodb = boto3.resource('dynamodb')
bedrock_runtime = boto3.client(
    "bedrock-runtime", config=Config(region_name=os.environ["AWS_REGION"])
)
table = dynamodb.Table('Articles')

# Constants for MinHash and LSH
NUM_PERM = 128
NUM_BANDS = 16
BAND_SIZE = 8