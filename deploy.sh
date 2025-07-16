#!/bin/bash

# Production Deployment Script for CV-Ranking
# This script builds and deploys the application to production

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version (recommend 18+)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version $(node -v) detected. Recommended version is 18 or higher."
fi

print_status "Node.js version: $(node -v)"
print_status "npm version: $(npm -v)"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Run linting
print_status "Running linting checks..."
npm run lint

# Run tests
print_status "Running tests..."
npm test -- --watch=false --browsers=ChromeHeadless

# Build for production
print_status "Building for production..."
npm run build:prod

# Check bundle size
print_status "Analyzing bundle size..."
npm run analyze

# Create deployment package
print_status "Creating deployment package..."
DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"
cp -r dist/cv-ranking/* "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp angular.json "$DEPLOY_DIR/"

# Create deployment manifest
cat > "$DEPLOY_DIR/deployment-manifest.json" << EOF
{
  "version": "1.0.0",
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "production",
  "bundleSize": "$(du -sh dist/cv-ranking | cut -f1)",
  "files": [
    "$(find dist/cv-ranking -type f | wc -l) files"
  ]
}
EOF

print_status "Deployment package created: $DEPLOY_DIR"

# Optional: Upload to AWS S3
if [ "$1" = "--deploy" ]; then
    print_status "Deploying to AWS S3..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    # Check if bucket name is provided
    if [ -z "$2" ]; then
        print_error "Please provide S3 bucket name: ./deploy.sh --deploy your-bucket-name"
        exit 1
    fi
    
    BUCKET_NAME="$2"
    
    # Sync files to S3
    aws s3 sync "$DEPLOY_DIR" "s3://$BUCKET_NAME" --delete
    
    # Invalidate CloudFront cache (if CloudFront distribution ID is provided)
    if [ ! -z "$3" ]; then
        print_status "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id "$3" --paths "/*"
    fi
    
    print_status "Deployment completed successfully!"
    print_status "Your application is now live at: https://$BUCKET_NAME.s3-website-region.amazonaws.com"
else
    print_status "Build completed successfully!"
    print_status "To deploy to AWS S3, run: ./deploy.sh --deploy your-bucket-name [cloudfront-distribution-id]"
fi

print_status "Deployment script completed!" 