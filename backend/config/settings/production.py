from .base import *

DEBUG = False
CORS_ALLOW_ALL_ORIGINS = False

# Use S3 for file storage in production
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME', '')
AWS_S3_REGION_NAME = os.environ.get('AWS_REGION', 'eu-west-1')
