#!/bin/bash
# terraform/scripts/deploy.sh
# Deploy Harbor Guesser infrastructure

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check we're in the right place and navigate to production
check_location_and_navigate() {
    print_status "Checking location and navigating to production environment..."
    
    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Production directory should be relative to script location
    PRODUCTION_DIR="$SCRIPT_DIR/../environments/production"
    
    if [[ ! -d "$PRODUCTION_DIR" ]]; then
        print_error "Production environment not found!"
        print_error "Expected: $PRODUCTION_DIR"
        print_error "Current location: $(pwd)"
        echo ""
        echo "Please ensure you have the complete terraform structure:"
        echo "terraform/scripts/deploy.sh (this script)"
        echo "terraform/environments/production/ (target directory)"
        exit 1
    fi
    
    cd "$PRODUCTION_DIR"
    print_success "Located production environment: $(pwd)"
}

print_status "Deploying Harbor Guesser infrastructure..."

check_location_and_navigate

# Check if Hetzner token is configured
if [[ ! -s terraform.tfvars ]] || grep -q '^hcloud_token = ""' terraform.tfvars; then
    print_error "Hetzner API token not configured!"
    echo ""
    echo "Please edit terraform/environments/production/terraform.tfvars and add your Hetzner token."
    echo ""
    echo "Get your token from: https://console.hetzner-cloud.com → Security → API Tokens"
    echo "Look for the empty hcloud_token field and paste your token there."
    echo ""
    echo "Example:"
    echo 'hcloud_token = "your-actual-token-here"'
    exit 1
fi

# Initialize Terraform
print_status "Initializing Terraform..."
terraform init

# Validate configuration
print_status "Validating configuration..."
terraform validate

# Plan deployment
print_status "Creating deployment plan..."
terraform plan

# Confirm deployment
echo ""
read -p "Deploy infrastructure? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deployment cancelled"
    exit 0
fi

# Deploy infrastructure
print_status "Deploying infrastructure..."
terraform apply -auto-approve

echo ""
print_success "🎉 Harbor Guesser infrastructure deployed!"
echo ""
print_status "📋 Deployment Summary:"
terraform output

echo ""
print_status "🔄 Next Steps:"
echo "1. SSH to server: $(terraform output -raw ssh_command)"
echo "2. Start Supabase: sudo /opt/supabase/start.sh"
echo "3. View credentials: sudo cat /opt/supabase/credentials.txt"
echo ""
print_success "Your EU-sovereign Supabase is ready! 🇪🇺"