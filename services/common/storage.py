import boto3
from botocore.exceptions import NoCredentialsError
from services.common.config import settings

#connecting to MinIO
s3_client = boto3.client('s3',
                         endpoint_url=f"http://{settings.minio_endpoint}",
                         aws_access_key_id=settings.minio_access_key,
                         aws_secret_access_key=settings.minio_secret_key,
                         region_name="us-east-1")

BUCKET_NAME = settings.minio_bucket_name

def upload_to_minio(file_data, object_name):
    
    try:
        #checks if bucket exists and creates one if none
        try:
            s3_client.head_bucket(Bucket= BUCKET_NAME)
        except:
            s3_client.create_bucket(Bucket = BUCKET_NAME)
        
    
        s3_client.upload_fileobj(file_data, BUCKET_NAME, object_name)
        return True
    except Exception as e:
        print (f"storage error: {e}")
        return False