# CloudFront Configuration for Clean URLs

## Current Setup

- S3 Bucket: `digitus.com.do`
- CloudFront Distribution ID: `E1X8PSUZIPUQPI`

## Clean URL Configuration

### 1. CloudFront Behaviors

Configure these behaviors in your CloudFront distribution:

#### Default Behavior

- **Path Pattern**: `*`
- **Origin**: `digitus.com.do.s3.amazonaws.com`
- **Viewer Protocol Policy**: `Redirect HTTP to HTTPS`
- **Cache Policy**: `Managed-CachingOptimized`
- **Origin Request Policy**: `Managed-CORS-S3Origin`

#### HTML Files Behavior

- **Path Pattern**: `*.html`
- **Origin**: `digitus.com.do.s3.amazonaws.com`
- **Viewer Protocol Policy**: `Redirect HTTP to HTTPS`
- **Cache Policy**: `Managed-CachingOptimized`
- **Origin Request Policy**: `Managed-CORS-S3Origin`

### 2. Lambda@Edge Function (Optional - Advanced)

For more sophisticated URL rewriting, you can use Lambda@Edge:

```javascript
exports.handler = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const uri = request.uri;

  // Remove .html extension
  if (uri.endsWith(".html")) {
    request.uri = uri.slice(0, -5);
  }

  // Add .html extension for S3 lookup
  if (!uri.includes(".")) {
    request.uri = uri + ".html";
  }

  callback(null, request);
};
```

### 3. S3 Website Configuration

Ensure your S3 bucket has these settings:

```json
{
  "IndexDocument": {
    "Suffix": "index.html"
  },
  "ErrorDocument": {
    "Key": "404.html"
  }
}
```

## Implementation Steps

### Step 1: Rename Files

```bash
# Rename HTML files to remove extensions
mv accessibility-test.html accessibility-test
mv blog-post-1.html blog-post-1
mv about-us.html about-us
```

### Step 2: Update Internal Links

Update all internal links in your HTML files:

```html
<!-- Change from -->
<a href="accessibility-test.html">Accessibility Test</a>

<!-- To -->
<a href="accessibility-test">Accessibility Test</a>
```

### Step 3: Configure CloudFront

1. Go to CloudFront Console
2. Select your distribution (E1X8PSUZIPUQPI)
3. Go to Behaviors tab
4. Create new behavior for `*.html` pattern
5. Set up redirects as needed

### Step 4: Test

- Visit `digitus.com.do/accessibility-test`
- Should serve the content without `.html` in URL
- Internal links should work correctly

## Benefits

- ✅ Clean, professional URLs
- ✅ Better SEO
- ✅ Easier to remember
- ✅ Future-proof for blog posts
- ✅ Consistent with modern web standards

## Blog URL Structure

For future blog posts, use this structure:

- `digitus.com.do/blog` (blog index)
- `digitus.com.do/blog/post-title` (individual posts)
- `digitus.com.do/blog/category/post-title` (categorized posts)
