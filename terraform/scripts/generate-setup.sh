#!/bin/bash
# terraform/scripts/generate-setup.sh
# Generate secure configuration for Harbor Guesser infrastructure

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE} Harbor Guesser EU-Sovereign Infrastructure${NC}"
    echo -e "${BLUE} Secure Configuration Generator${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local required_commands=("openssl" "ssh-keygen" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            print_error "Required command '$cmd' not found. Please install it and try again."
            exit 1
        fi
    done
    
    print_success "All prerequisites satisfied"
}

# Check we're in the right place
check_location() {
    print_status "Checking location..."
    
    # We should be in the terraform/scripts directory
    if [[ ! -f "../environments/production/main.tf" ]]; then
        print_error "Please run this script from terraform/scripts/ directory"
        print_error "Current directory: $(pwd)"
        exit 1
    fi
    
    print_success "Running from correct location"
}

# Create only missing directories
create_missing_directories() {
    print_status "Checking directory structure..."
    
    # Only create what's missing
    mkdir -p ../shared/secrets
    
    print_success "Directory structure verified"
}

# Generate SSH key pair
generate_ssh_key() {
    print_status "Generating SSH key pair..."
    
    local ssh_key_path="../shared/secrets/harborguessr_rsa"
    
    if [[ -f "$ssh_key_path" ]]; then
        print_warning "SSH key already exists, skipping generation"
        return
    fi
    
    ssh-keygen -t rsa -b 4096 -C "harborguessr@$(whoami)" -f "$ssh_key_path" -N ""
    
    print_success "SSH key pair generated: $ssh_key_path"
}

# Generate secure passwords
generate_passwords() {
    print_status "Generating secure passwords..."
    
    # Generate PostgreSQL password (25 characters)
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Generate JWT secret (32 characters)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-32)
    
    # Validate password lengths
    if [[ ${#POSTGRES_PASSWORD} -lt 20 ]]; then
        print_error "Generated PostgreSQL password is too short"
        exit 1
    fi
    
    if [[ ${#JWT_SECRET} -lt 30 ]]; then
        print_error "Generated JWT secret is too short"
        exit 1
    fi
    
    print_success "Secure passwords generated"
}

# Get current IPv4 address only
get_current_ip() {
    print_status "Detecting your current IPv4 address..."
    
    CURRENT_IP=""
    local ip_services=("ipv4.icanhazip.com" "checkip.amazonaws.com" "ifconfig.me/ip")
    
    for service in "${ip_services[@]}"; do
        if CURRENT_IP=$(curl -s --max-time 5 "http://$service" 2>/dev/null); then
            # Validate IPv4 format and ensure it's not IPv6
            if [[ $CURRENT_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && [[ ! $CURRENT_IP =~ : ]]; then
                break
            fi
        fi
        CURRENT_IP=""
    done
    
    if [[ -z "$CURRENT_IP" ]]; then
        print_warning "Could not detect your IPv4 address automatically"
        CURRENT_IP="0.0.0.0"
        print_warning "Using 0.0.0.0 (allows access from anywhere)"
    else
        print_success "Detected your IPv4 address: $CURRENT_IP"
    fi
}

# Create Terraform configuration
create_terraform_config() {
    print_status "Creating Terraform configuration..."
    
    # Read SSH public key and ensure it's on one line
    local ssh_public_key
    ssh_public_key=$(cat ../shared/secrets/harborguessr_rsa.pub | tr -d '\n\r')
    
    # Ensure passwords are single line and properly escaped
    local clean_postgres_password
    local clean_jwt_secret
    clean_postgres_password=$(echo "$POSTGRES_PASSWORD" | tr -d '\n\r')
    clean_jwt_secret=$(echo "$JWT_SECRET" | tr -d '\n\r')
    
    # Check if terraform.tfvars already exists
    if [[ -f "../environments/production/terraform.tfvars" ]]; then
        print_warning "terraform.tfvars already exists"
        read -p "Overwrite existing configuration? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Keeping existing configuration"
            return
        fi
    fi
    
    cat > ../environments/production/terraform.tfvars << EOF
# Harbor Guesser Production Infrastructure Configuration
# 🔐 SECURE: Auto-generated configuration with random passwords
# Generated: $(date)
# 
# IMPORTANT: Add your Hetzner API token below before deploying!

# Hetzner Cloud API Token (REQUIRED - GET FROM HETZNER CONSOLE)
# Get from: https://console.hetzner-cloud.com → Security → API Tokens
# NEVER commit this token to git!
hcloud_token = ""

# SSH Public Key (auto-generated)
ssh_public_key = "$ssh_public_key"

# Database Credentials (auto-generated, secure)
postgres_password = "$clean_postgres_password"
jwt_secret = "$clean_jwt_secret"

# Security Configuration (auto-detected IPv4 only)
allowed_ssh_ips = ["$CURRENT_IP/32"]
allowed_admin_ips = ["$CURRENT_IP/32"]

# Server Configuration
server_type = "cpx11"  # €3.85/month - 2 vCPU, 2GB RAM
location = "nbg1"      # Nuremberg, Germany

# Resource Tags
tags = {
  project     = "harborguessr"
  service     = "supabase"
  environment = "production"
  managed_by  = "terraform"
}
EOF
    
    print_success "Terraform configuration created"
}

# Update root .gitignore
update_root_gitignore() {
    print_status "Updating root .gitignore..."
    
    # Go to repo root (2 levels up from scripts)
    local root_gitignore="../../.gitignore"
    
    local gitignore_entries=(
        ""
        "# Harbor Guesser Infrastructure Secrets"
        "terraform/shared/secrets/"
        "terraform/environments/*/terraform.tfvars"
        "terraform/environments/*/.terraform/"
        "terraform/environments/*/terraform.tfstate*"
        "terraform/environments/*/.terraform.lock.hcl"
        "terraform/**/.env"
    )
    
    # Create .gitignore if it doesn't exist
    touch "$root_gitignore"
    
    # Check if entries already exist
    local needs_update=false
    for entry in "${gitignore_entries[@]}"; do
        if [[ -n "$entry" ]] && ! grep -Fxq "$entry" "$root_gitignore"; then
            needs_update=true
            break
        fi
    done
    
    if [[ "$needs_update" == true ]]; then
        for entry in "${gitignore_entries[@]}"; do
            echo "$entry" >> "$root_gitignore"
        done
        print_success "Root .gitignore updated with infrastructure secrets"
    else
        print_success "Root .gitignore already configured"
    fi
}

# Set secure file permissions
set_permissions() {
    print_status "Setting secure file permissions..."
    
    chmod 600 ../environments/production/terraform.tfvars
    chmod 600 ../shared/secrets/harborguessr_rsa
    chmod 644 ../shared/secrets/harborguessr_rsa.pub
    
    print_success "Secure file permissions set"
}

# Display setup summary
show_summary() {
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN} Setup Complete! 🎉${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${BLUE}🔐 Security Features:${NC}"
    echo "   ├── All secrets auto-generated and gitignored"
    echo "   ├── SSH access restricted to your IPv4: $CURRENT_IP"
    echo "   ├── Admin access restricted to your IPv4: $CURRENT_IP"
    echo "   ├── 25+ character PostgreSQL password"
    echo "   ├── 32+ character JWT secret"
    echo "   └── Secure file permissions (600) applied"
    echo ""
    echo -e "${BLUE}🔄 Next Steps:${NC}"
    echo "   1. Get Hetzner API token: https://console.hetzner-cloud.com"
    echo "   2. Edit terraform/environments/production/terraform.tfvars"
    echo "   3. Add your token: hcloud_token = \"your-token-here\""
    echo "   4. Deploy: ./deploy.sh"
    echo ""
    echo -e "${BLUE}📁 Generated Files:${NC}"
    echo "   ├── terraform/shared/secrets/harborguessr_rsa (private key)"
    echo "   ├── terraform/shared/secrets/harborguessr_rsa.pub (public key)"
    echo "   └── terraform/environments/production/terraform.tfvars (config)"
    echo ""
    echo -e "${GREEN}Ready to deploy your EU-sovereign Harbor Guesser infrastructure! 🇪🇺${NC}"
}

# Main execution
main() {
    print_header
    check_prerequisites
    check_location
    create_missing_directories
    generate_ssh_key
    generate_passwords
    get_current_ip
    create_terraform_config
    update_root_gitignore
    set_permissions
    show_summary
}

# Execute main function
main "$@"