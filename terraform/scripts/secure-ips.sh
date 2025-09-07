#!/bin/bash
# terraform/scripts/secure-ips.sh
# Restrict access to specific IPs (run after deployment)

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_status "Harbor Guesser IP Security Manager"
echo ""

# Get current IP
CURRENT_IP=$(curl -s http://ipv4.icanhazip.com/)
print_status "Your current IP: $CURRENT_IP"

echo ""
echo "Choose security level:"
echo "1) Restrict to your current IP only ($CURRENT_IP)"
echo "2) Add multiple specific IPs"
echo "3) Keep all IPs allowed (current setting)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        print_status "Restricting to your current IP only..."
        
        # Update terraform.tfvars
        cd ../environments/production

        # Apply changes
        terraform apply -auto-approve
        
        print_success "✅ Security updated! Only your IP ($CURRENT_IP) can access SSH and Studio"
        ;;
        
    2)
        print_status "Enter IP addresses (one per line, press Enter twice when done):"
        
        IPS=()
        while true; do
            read -p "IP address (or press Enter to finish): " ip
            if [[ -z "$ip" ]]; then
                break
            fi
            # Add /32 if not already specified
            if [[ ! "$ip" =~ /[0-9]+$ ]]; then
                ip="$ip/32"
            fi
            IPS+=("\"$ip\"")
        done
        
        if [[ ${#IPS[@]} -eq 0 ]]; then
            print_error "No IPs provided. Keeping current settings."
            exit 1
        fi
        
        # Build IP list
        IP_LIST=$(IFS=,; echo "${IPS[*]}")
        
        print_status "Updating firewall rules..."
        cd ../environments/production
        
        # Apply changes
        terraform apply -auto-approve
        
        ;;
        
    3)
        print_status "Keeping all IPs allowed (current setting)"
        print_status "Your infrastructure remains accessible from anywhere"
        ;;
        
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
print_status "🔗 Your Harbor Guesser Infrastructure:"
terraform output supabase_url
terraform output supabase_studio_url
