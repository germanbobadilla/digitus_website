# Deployment Guide - Digitus Website

## AWS S3 + CloudFront Deployment

This document contains the deployment configuration for the Digitus website hosted on AWS S3 with CloudFront CDN.

### AWS Credentials

**Access Key ID:** `YOUR_AWS_ACCESS_KEY_ID`  
**Secret Access Key:** `YOUR_AWS_SECRET_ACCESS_KEY`  
**Region:** `us-east-1` (or your preferred region)

> **Note:** Replace the placeholder values with your actual AWS credentials. Never commit real credentials to version control.

### Deployment Steps

1. **Install AWS CLI**
   ```bash
   # macOS
   brew install awscli
   
   # Or using pip
   pip install awscli
   ```

2. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your Access Key ID and Secret Access Key when prompted
   # Set default region (e.g., us-east-1)
   # Set default output format (json)
   ```

3. **Create S3 Bucket** (if not already created)
   ```bash
   aws s3 mb s3://digitus-website --region us-east-1
   ```

4. **Enable Static Website Hosting**
   ```bash
   aws s3 website s3://digitus-website --index-document index.html --error-document index.html
   ```

5. **Upload Website Files**
   ```bash
   # Upload all files to S3
   aws s3 sync . s3://digitus-website --exclude "*.md" --exclude ".git/*" --exclude ".env*"
   
   # Set proper content types
   aws s3 cp index.html s3://digitus-website/ --content-type "text/html"
   aws s3 cp assets/css/style.css s3://digitus-website/assets/css/ --content-type "text/css"
   aws s3 cp assets/js/app.js s3://digitus-website/assets/js/ --content-type "application/javascript"
   aws s3 cp assets/favicon.svg s3://digitus-website/ --content-type "image/svg+xml"
   ```

6. **Configure S3 Bucket Policy** (for public read access)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::digitus-website/*"
       }
     ]
   }
   ```

7. **Set up CloudFront Distribution**
   - Origin: S3 bucket (digitus-website)
   - Default root object: index.html
   - Price class: Use all edge locations (or choose based on budget)
   - Custom error pages: 404 → index.html (for SPA routing)

### Automated Deployment Script

Create a `deploy.sh` script for easy updates:

```bash
#!/bin/bash
echo "Deploying Digitus website to S3..."

# Sync files to S3
aws s3 sync . s3://digitus-website \
  --exclude "*.md" \
  --exclude ".git/*" \
  --exclude ".env*" \
  --exclude "deploy.sh" \
  --delete

# Set cache headers
aws s3 cp s3://digitus-website/index.html s3://digitus-website/index.html \
  --metadata-directive REPLACE \
  --cache-control "max-age=0,no-cache,no-store,must-revalidate"

aws s3 cp s3://digitus-website/assets/css/style.css s3://digitus-website/assets/css/style.css \
  --metadata-directive REPLACE \
  --cache-control "max-age=31536000"

aws s3 cp s3://digitus-website/assets/js/app.js s3://digitus-website/assets/js/app.js \
  --metadata-directive REPLACE \
  --cache-control "max-age=31536000"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

### Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit credentials to Git** - Use environment variables or AWS IAM roles
2. **Rotate keys regularly** - Generate new access keys periodically
3. **Use IAM policies** - Restrict permissions to only what's needed
4. **Enable MFA** - Use multi-factor authentication for AWS console access
5. **Monitor usage** - Set up CloudWatch alarms for unusual activity

### Environment Variables

For production deployment, set these environment variables:

```bash
export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=us-east-1
export S3_BUCKET_NAME=digitus-website
```

### Troubleshooting

**Common Issues:**
- **403 Forbidden**: Check S3 bucket policy and public read permissions
- **404 Not Found**: Verify CloudFront origin settings and error pages
- **CORS Issues**: Add CORS configuration to S3 bucket if needed
- **Cache Issues**: Invalidate CloudFront distribution after updates

### Cost Optimization

- **S3 Storage**: Very low cost for static files
- **CloudFront**: Pay per request and data transfer
- **Consider**: Using S3 Transfer Acceleration for faster uploads
- **Monitor**: Set up billing alerts for unexpected costs

---

**Last Updated:** January 2025  
**Maintained by:** Digitus Business & Software Solutions
