# Production Deployment Script for CV-Ranking (PowerShell)
# This script builds and deploys the application to production

param(
    [string]$Deploy = $false,
    [string]$BucketName = "",
    [string]$CloudFrontId = ""
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting production deployment..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Status "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Status "npm version: $npmVersion"
} catch {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

# Check Node.js version (recommend 18+)
$nodeMajorVersion = [int](node --version).Split('.')[0].Substring(1)
if ($nodeMajorVersion -lt 18) {
    Write-Warning "Node.js version $(node --version) detected. Recommended version is 18 or higher."
}

# Clean previous builds
Write-Status "Cleaning previous builds..."
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
}

# Install dependencies
Write-Status "Installing dependencies..."
npm ci --production=false

# Run linting
Write-Status "Running linting checks..."
npm run lint

# Run tests
Write-Status "Running tests..."
npm test -- --watch=false --browsers=ChromeHeadless

# Build for production
Write-Status "Building for production..."
npm run build:prod

# Check bundle size
Write-Status "Analyzing bundle size..."
npm run analyze

# Create deployment package
Write-Status "Creating deployment package..."
$deployDir = "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

# Copy build files
Copy-Item -Path "dist\cv-ranking\*" -Destination $deployDir -Recurse -Force
Copy-Item -Path "package.json" -Destination $deployDir -Force
Copy-Item -Path "angular.json" -Destination $deployDir -Force

# Create deployment manifest
$manifest = @{
    version = "1.0.0"
    buildDate = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    environment = "production"
    bundleSize = (Get-ChildItem -Path "dist\cv-ranking" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    files = (Get-ChildItem -Path "dist\cv-ranking" -Recurse -File).Count
} | ConvertTo-Json -Depth 3

$manifest | Out-File -FilePath "$deployDir\deployment-manifest.json" -Encoding UTF8

Write-Status "Deployment package created: $deployDir"

# Optional: Upload to AWS S3
if ($Deploy -eq "true") {
    Write-Status "Deploying to AWS S3..."
    
    # Check if AWS CLI is installed
    try {
        aws --version | Out-Null
    } catch {
        Write-Error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    }
    
    # Check if bucket name is provided
    if ([string]::IsNullOrEmpty($BucketName)) {
        Write-Error "Please provide S3 bucket name: .\deploy.ps1 -Deploy true -BucketName your-bucket-name"
        exit 1
    }
    
    # Sync files to S3
    aws s3 sync "$deployDir" "s3://$BucketName" --delete
    
    # Invalidate CloudFront cache (if CloudFront distribution ID is provided)
    if (-not [string]::IsNullOrEmpty($CloudFrontId)) {
        Write-Status "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths "/*"
    }
    
    Write-Status "Deployment completed successfully!"
    Write-Status "Your application is now live at: https://$BucketName.s3-website-region.amazonaws.com"
} else {
    Write-Status "Build completed successfully!"
    Write-Status "To deploy to AWS S3, run: .\deploy.ps1 -Deploy true -BucketName your-bucket-name [-CloudFrontId distribution-id]"
}

Write-Status "Deployment script completed!" 