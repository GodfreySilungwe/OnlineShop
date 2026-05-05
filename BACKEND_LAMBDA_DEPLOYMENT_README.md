# Backend AWS Lambda Deployment Guide

## Backend Readiness Check

The backend is **ready for AWS Lambda deployment** with the following components verified:

### ✅ Ready Components
- **Lambda Handler**: `app.lambda_handler` in `backend/app/__init__.py` using `serverless-wsgi`
- **Dependencies**: All required packages listed in `backend/requirements.txt` and pre-installed in `backend/deployment_package/`
- **AWS Services Integration**: 
  - DynamoDB for data storage (single-table design)
  - S3 for file storage
- **Flask App Structure**: Modular with blueprints, CORS enabled
- **Environment Variables**: Properly configured for AWS services
- **Packaged Code**: `backend/Deployment.zip` contains the deployable package

### ⚠️ Prerequisites to Complete
- AWS account with necessary permissions
- DynamoDB table creation
- S3 bucket creation
- Lambda function creation and configuration
- API Gateway setup
- Environment variables configuration

## Requirements

### AWS Account Requirements
- **IAM User/Permissions**: 
  - `AWSLambda_FullAccess`
  - `AmazonDynamoDBFullAccess`
  - `AmazonS3FullAccess`
  - `AmazonAPIGatewayAdministrator`
  - `CloudWatchLogsFullAccess`

### Software Requirements
- **AWS CLI**: Version 2.x
- **Python**: 3.10+ (for local testing)
- **Zip utility**: For packaging (built-in on Windows/Linux/Mac)

### AWS Resources Required
1. **DynamoDB Table**: `OnlineShopTable`
   - Primary Key: `PK` (String), `SK` (String)
   - Global Secondary Indexes (6 GSIs):
     - GSI1: `GSI1PK`, `GSI1SK`
     - GSI2: `GSI2PK`, `GSI2SK`
     - GSI3: `GSI3PK`, `GSI3SK`
     - GSI4: `GSI4PK`, `GSI4SK`
     - GSI5: `GSI5PK`, `GSI5SK`
     - GSI6: `GSI6PK`, `GSI6SK`

2. **S3 Bucket**: For image storage (e.g., `your-online-shop-bucket`)

3. **Lambda Function**: Python 3.10 runtime

4. **API Gateway**: REST API with Lambda proxy integration

## Installation and Deployment Steps

### Step 1: Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, default region (us-east-1), and output format (json)
```

### Step 2: Create DynamoDB Table
```bash
aws dynamodb create-table \
    --table-name OnlineShopTable \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
        AttributeName=GSI2PK,AttributeType=S \
        AttributeName=GSI2SK,AttributeType=S \
        AttributeName=GSI3PK,AttributeType=S \
        AttributeName=GSI3SK,AttributeType=S \
        AttributeName=GSI4PK,AttributeType=S \
        AttributeName=GSI4SK,AttributeType=S \
        AttributeName=GSI5PK,AttributeType=S \
        AttributeName=GSI5SK,AttributeType=S \
        AttributeName=GSI6PK,AttributeType=S \
        AttributeName=GSI6SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST" \
        "IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST" \
        "IndexName=GSI3,KeySchema=[{AttributeName=GSI3PK,KeyType=HASH},{AttributeName=GSI3SK,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST" \
        "IndexName=GSI4,KeySchema=[{AttributeName=GSI4PK,KeyType=HASH},{AttributeName=GSI4SK,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST" \
        "IndexName=GSI5,KeySchema=[{AttributeName=GSI5PK,KeyType=HASH},{AttributeName=GSI5SK,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST" \
        "IndexName=GSI6,KeySchema=[{AttributeName=GSI6PK,KeyType=HASH},{AttributeName=GSI6SK,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST" \
    --billing-mode PAY_PER_REQUEST
```

### Step 3: Create S3 Bucket
```bash
aws s3 mb s3://your-online-shop-bucket-name
# Note: Choose a unique bucket name
```

### Step 4: Create Lambda Function
```bash
# If using existing Deployment.zip
aws lambda create-function \
    --function-name CafeFausseBackend \
    --runtime python3.10 \
    --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
    --handler app.lambda_handler \
    --zip-file fileb://backend/Deployment.zip \
    --environment "Variables={AWS_REGION=us-east-1,DYNAMODB_TABLE_NAME=OnlineShopTable,S3_BUCKET_NAME=your-online-shop-bucket-name,CORS_ORIGINS=https://your-cloudfront-domain.cloudfront.net,ADMIN_SECRET=your-secure-admin-secret}" \
    --timeout 30 \
    --memory-size 512
```

**Note**: Replace `YOUR_ACCOUNT_ID` with your AWS account ID, and update bucket name and CloudFront domain.

### Step 5: Create API Gateway
```bash
# Create REST API
aws apigateway create-rest-api \
    --name CafeFausseAPI \
    --description "Cafe Fausse Backend API"

# Get API ID (save this for later)
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='CafeFausseAPI'].id" --output text)

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/'].id" --output text)

# Create proxy resource
aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part "{proxy+}"

# Create method
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE

# Set Lambda integration
LAMBDA_ARN=$(aws lambda get-function --function-name CafeFausseBackend --query "Configuration.FunctionArn" --output text)
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations

# Deploy API
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod

# Get API URL
API_URL=$(aws apigateway get-rest-apis --query "items[?name=='CafeFausseAPI'].id" --output text)
echo "API Gateway URL: https://$API_URL.execute-api.us-east-1.amazonaws.com/prod"
```

### Step 6: Add Lambda Permission for API Gateway
```bash
aws lambda add-permission \
    --function-name CafeFausseBackend \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:apigateway:us-east-1::/restapis/$API_ID/*"
```

### Step 7: Configure CORS (if needed)
Update the Lambda environment variable `CORS_ORIGINS` with your CloudFront distribution URL.

### Step 8: Test Deployment
```bash
# Test API Gateway endpoint
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/api/menu
```

## Alternative: Using AWS Console

If you prefer GUI:

1. **DynamoDB**: Go to AWS Console → DynamoDB → Create table
2. **S3**: S3 → Create bucket
3. **Lambda**: Lambda → Create function → Upload `backend/Deployment.zip`
4. **API Gateway**: API Gateway → Create API → Lambda proxy integration

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| AWS_REGION | AWS region | us-east-1 |
| DYNAMODB_TABLE_NAME | DynamoDB table name | OnlineShopTable |
| S3_BUCKET_NAME | S3 bucket for images | your-bucket-name |
| CORS_ORIGINS | Allowed origins (comma-separated) | https://your-domain.cloudfront.net |
| ADMIN_SECRET | Admin authentication secret | secure-random-string |

## Troubleshooting

### Common Issues
1. **Lambda Timeout**: Increase timeout in Lambda configuration (default 30s)
2. **Memory Issues**: Increase memory allocation (default 512MB)
3. **CORS Errors**: Verify `CORS_ORIGINS` environment variable
4. **DynamoDB Permissions**: Ensure Lambda has DynamoDB access
5. **S3 Permissions**: Ensure Lambda has S3 access

### Logs
Check CloudWatch logs for Lambda function errors:
```bash
aws logs tail /aws/lambda/CafeFausseBackend --follow
```

## Local Development

For local testing with AWS services:

```bash
cd backend
pip install -r requirements.txt
export FLASK_APP=app
export FLASK_ENV=development
flask run
```

## Updating the Lambda Function

To deploy updates:

```bash
# Create new deployment package
cd backend
zip -r Deployment.zip .

# Update Lambda function
aws lambda update-function-code \
    --function-name CafeFausseBackend \
    --zip-file fileb://Deployment.zip
```

## Cost Estimation

- **Lambda**: ~$0.20/month (1M requests, 512MB)
- **DynamoDB**: ~$1-5/month (depending on usage)
- **S3**: ~$0.50/month (storage + requests)
- **API Gateway**: ~$3-5/month (1M requests)

## Security Notes

- Use IAM roles instead of access keys in production
- Rotate admin secrets regularly
- Enable CloudTrail for auditing
- Use VPC for additional security if needed</content>
<parameter name="filePath">c:\Users\PIU\Desktop\Personal Folder 23Oct2023\Quantic Work\Interactive webApp Assignment\BACKEND_LAMBDA_DEPLOYMENT_README.md