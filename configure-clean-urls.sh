#!/bin/bash

# CloudFront Clean URLs Configuration Script
# This script configures CloudFront to serve HTML files without .html extension

DISTRIBUTION_ID="E1X8PSUZIPUQPI"
BUCKET_NAME="digitus.com.do"

echo "Configuring CloudFront for clean URLs..."

# Get current distribution config
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > current-config.json

# Extract the ETag for the update
ETAG=$(jq -r '.ETag' current-config.json)

# Create a new behavior for clean URLs
cat > clean-urls-behavior.json << EOF
{
  "PathPattern": "accessibility-test",
  "TargetOriginId": "S3-$BUCKET_NAME",
  "ViewerProtocolPolicy": "redirect-to-https",
  "CachePolicyId": "4135ea2d-6f57-4daa-9f0b-24d7f6272314",
  "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
  "ResponseHeadersPolicyId": "67f7725c-6f97-4210-82d7-5512b31e9d03",
  "Compress": true,
  "FunctionAssociations": {
    "Quantity": 1,
    "Items": [
      {
        "EventType": "viewer-request",
        "FunctionARN": "arn:aws:cloudfront::function/clean-urls"
      }
    ]
  }
}
EOF

# Update the distribution configuration
jq '.DistributionConfig.CacheBehaviors.Items += [input]' current-config.json clean-urls-behavior.json > updated-config.json

# Update the distribution
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file://updated-config.json \
  --if-match $ETAG

echo "Clean URLs configuration completed!"
echo "Note: You may need to manually configure CloudFront behaviors in the AWS Console"
echo "Add a behavior for path pattern 'accessibility-test' that serves 'accessibility-test.html'"

# Clean up temporary files
rm current-config.json clean-urls-behavior.json updated-config.json
