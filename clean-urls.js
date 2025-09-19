// Clean URLs Management Script
// This script helps manage clean URLs for your static site

class CleanURLManager {
    constructor() {
        this.htmlFiles = [];
        this.redirects = new Map();
    }

    // Find all HTML files in the project
    findHTMLFiles() {
        // This would be run in a build process
        // For now, we'll manually list the files
        return [
            'accessibility-test.html',
            'index.html', // Keep index.html as is
            // Add more files as needed
        ];
    }

    // Generate clean URL redirects
    generateRedirects() {
        const redirects = [];
        
        this.htmlFiles.forEach(file => {
            if (file !== 'index.html') {
                const cleanName = file.replace('.html', '');
                redirects.push({
                    from: `/${file}`,
                    to: `/${cleanName}`,
                    status: 301
                });
            }
        });

        return redirects;
    }

    // Generate S3 redirect rules
    generateS3Redirects() {
        const rules = [];
        
        this.htmlFiles.forEach(file => {
            if (file !== 'index.html') {
                const cleanName = file.replace('.html', '');
                rules.push({
                    Condition: {
                        KeyPrefixEquals: `/${cleanName}`
                    },
                    Redirect: {
                        ReplaceKeyWith: `/${file}`
                    }
                });
            }
        });

        return {
            RoutingRules: rules
        };
    }

    // Update internal links in HTML files
    updateInternalLinks(content, filePath) {
        let updatedContent = content;
        
        // Find all internal links
        const linkRegex = /href="([^"]*\.html)"/g;
        const matches = content.match(linkRegex);
        
        if (matches) {
            matches.forEach(match => {
                const originalLink = match.match(/href="([^"]*\.html)"/)[1];
                const cleanLink = originalLink.replace('.html', '');
                updatedContent = updatedContent.replace(originalLink, cleanLink);
            });
        }

        return updatedContent;
    }

    // Generate CloudFront configuration
    generateCloudFrontConfig() {
        return {
            "Comment": "Clean URLs configuration for Digitus website",
            "DefaultCacheBehavior": {
                "TargetOriginId": "S3-digitus.com.do",
                "ViewerProtocolPolicy": "redirect-to-https",
                "CachePolicyId": "4135ea2d-6f57-4daa-9f0b-24d7f6272314"
            },
            "Origins": [
                {
                    "Id": "S3-digitus.com.do",
                    "DomainName": "digitus.com.do.s3.amazonaws.com",
                    "S3OriginConfig": {
                        "OriginAccessIdentity": ""
                    }
                }
            ],
            "CustomErrorResponses": [
                {
                    "ErrorCode": 404,
                    "ResponsePagePath": "/404.html",
                    "ResponseCode": "404"
                }
            ]
        };
    }
}

// Usage example
const urlManager = new CleanURLManager();

// Export for use in build process
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CleanURLManager;
}

// For browser use
if (typeof window !== 'undefined') {
    window.CleanURLManager = CleanURLManager;
}
