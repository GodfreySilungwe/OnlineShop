# Cafe Fausse — AWS Lambda Deployment

## Overview

This repository contains the Cafe Fausse interactive web app refactored for AWS serverless deployment.
The backend runs on AWS Lambda with API Gateway, uses DynamoDB for data storage, and S3 for file storage.
The frontend is served via CloudFront.

## Architecture

- **Backend**: AWS Lambda + API Gateway
- **Database**: DynamoDB (single table design)
- **Storage**: S3 bucket
- **Frontend**: CloudFront CDN
- **Payments**: Stripe integration

## Prerequisites

- AWS Account with appropriate permissions
- Python 3.10+
- Node.js 18+ (for frontend)
- AWS CLI configured

## AWS Resources Required

1. **DynamoDB Table**: `OnlineShopTable` with the following configuration:
   - Primary Key: PK (String), SK (String)
   - Global Secondary Indexes:
     - GSI1: GSI1PK (String), GSI1SK (String)
     - GSI2: GSI2PK (String), GSI2SK (String)
     - GSI3: GSI3PK (String), GSI3SK (String)
     - GSI4: GSI4PK (String), GSI4SK (String)
     - GSI5: GSI5PK (String), GSI5SK (String)
     - GSI6: GSI6PK (String), GSI6SK (String)

2. **S3 Bucket**: For storing uploaded images

3. **Lambda Function**: Python 3.10 runtime

4. **API Gateway**: REST API

5. **CloudFront Distribution**: For frontend hosting

## Environment Variables

Update the `.env` file with your AWS resources:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
DYNAMODB_TABLE_NAME=OnlineShopTable
S3_BUCKET_NAME=your-online-shop-bucket
CORS_ORIGINS=https://your-cloudfront-distribution.cloudfront.net
ADMIN_SECRET=your-admin-secret
```

Update the `frontend/.env` file with your API Gateway and S3 URLs:

```env
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/prod
VITE_S3_BUCKET_URL=https://your-s3-bucket.s3.amazonaws.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SrBLkCZASIgPTZB8lUtHMu8WypI4Z1qAvh1j6jTZxTy2h9EgSGVVjctEGDZ43abIK9L9rMBZgiAqlSYWKAQJCPf00Za8FS8WF
```

## Deployment Steps

1. **Create AWS Resources**:
   - Create DynamoDB table with GSI configuration
   - Create S3 bucket
   - Create Lambda function
   - Create API Gateway
   - Create CloudFront distribution

2. **Deploy Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt -t .
   zip -r lambda-package.zip .
   # Upload to Lambda via AWS Console or CLI
   ```

3. **Deploy Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   # Upload dist/ contents to S3 bucket configured for CloudFront
   ```

4. **Update API URLs**:
   - Update frontend to use API Gateway URL
   - Update CORS origins in Lambda

## Local Development

For local testing with AWS services:

```bash
cd backend
pip install -r requirements.txt
python wsgi.py
```

The backend will use the AWS credentials from .env to connect to DynamoDB and S3.

## Notes

- All data is now stored in a single DynamoDB table using single-table design patterns
- File uploads are handled via S3
- The application is serverless and scales automatically
- CORS is configured for CloudFront origins