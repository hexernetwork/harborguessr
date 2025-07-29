#!/bin/bash
# terraform/scripts/ssh.sh
# SSH to Harbor Guesser server

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find SSH key
SSH_KEY="$SCRIPT_DIR/../shared/secrets/harborguessr_rsa"

# Check if key exists
if [[ ! -f "$SSH_KEY" ]]; then
    echo "Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Check key permissions
if [[ "$(stat -f '%A' "$SSH_KEY" 2>/dev/null || stat -c '%a' "$SSH_KEY" 2>/dev/null)" != "600" ]]; then
    echo "Fixing SSH key permissions..."
    chmod 600 "$SSH_KEY"
fi

# Get server IP from terraform
cd "$SCRIPT_DIR/../environments/production"

if [[ ! -f terraform.tfstate ]]; then
    echo "Error: Infrastructure not deployed yet."
    exit 1
fi

SERVER_IP=$(terraform output -raw supabase_server_ip 2>/dev/null)

if [[ -z "$SERVER_IP" ]]; then
    echo "Error: Could not get server IP"
    exit 1
fi

echo "🔗 Connecting to Harbor Guesser server..."
echo "Server: $SERVER_IP"
echo "Key: $SSH_KEY"

# Connect
ssh -i "$SSH_KEY" root@"$SERVER_IP"