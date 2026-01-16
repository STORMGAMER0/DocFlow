import boto3
from botocore.exceptions import NoCredentialsError
import os

#connecting to MinIO
MINIO_URL = os.getenv("MINIO_ENDPOINT", "localhost:9000")
ACCESS_KEY = "minioadmin"
SECRET_KEY = "minioadmin"
BUCKET_NAME = "documents"

s3_client = boto3.client('s3',
                         endpoint_url = f"http://{MINIO_URL}",
                         aws_access_key_id = ACCESS_KEY,
                         aws_secret_access_key = SECRET_KEY,
                         region_name = "us-east-1")

def upload_to_minio(file_data, object_name):
    #uploads a file to MinIO bucket
    try:
        #checks if bucket exists and creates one if none
        try:
            s3_client.head_bucket(Bucket= BUCKET_NAME)
        except:
            s3_client.create_bucket(Bucket = BUCKET_NAME)
        
        #upload the file object directly
        s3_client.upload_fileobj(file_data, BUCKET_NAME, object_name)
        return True
    except Exception as e:
        print (f"storage error: {e}")
        return False