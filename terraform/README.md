# Harbor Guesser Infrastructure

**EU-Sovereign Terraform infrastructure** for Harbor Guesser with self-hosted Supabase.

## 🚀 Quick Start

### 1. Generate Configuration
```bash
cd terraform/scripts
./generate-setup.sh
```

### 2. Add Hetzner API Token
1. Get token: [Hetzner Console](https://console.hetzner-cloud.com) → Security → API Tokens
2. Edit `environments/production/terraform.tfvars`
3. Add your token: `hcloud_token = "your-token-here"`

### 3. Deploy Infrastructure
```bash
./deploy.sh
```

### 4. Start Supabase
```bash
./ssh.sh
sudo /opt/supabase/start.sh
```

## 📁 Complete File Structure

```
terraform/
├── environments/production/
│   ├── main.tf                    # Main Terraform configuration
│   ├── variables.tf               # Variable definitions
│   ├── outputs.tf                 # Output definitions
│   ├── terraform.tfvars.example   # Configuration template
│   └── terraform.tfvars           # Generated config (gitignored)
├── modules/database/supabase/
│   ├── main.tf                    # Supabase module resources
│   ├── variables.tf               # Module variables
│   ├── outputs.tf                 # Module outputs
│   └── user_data.sh               # Server initialization script
├── shared/secrets/                # Generated secrets (gitignored)
│   ├── harborguessr_rsa          # Private SSH key
│   └── harborguessr_rsa.pub      # Public SSH key
├── scripts/
│   ├── generate-setup.sh         # Setup generator
│   ├── deploy.sh                 # Deployment script
│   └── ssh.sh                    # SSH helper
└── README.md                     # This file
```

## 🔄 Simple Workflow

### Initial Setup
1. **Generate**: `./scripts/generate-setup.sh` - Creates everything with empty token
2. **Configure**: Edit `environments/production/terraform.tfvars` - Add your Hetzner token
3. **Deploy**: `./scripts/deploy.sh` - Deploys infrastructure
4. **Connect**: `./scripts/ssh.sh` - SSH to server

### Daily Operations
```bash
# Check server status
./scripts/ssh.sh
sudo /opt/supabase/status.sh

# Start/Stop Supabase
sudo /opt/supabase/start.sh
sudo /opt/supabase/stop.sh

# Create backup
sudo /opt/supabase/backup.sh

# View credentials
sudo cat /opt/supabase/credentials.txt
```

## 🛡️ Security Features

- ✅ **All secrets gitignored** - Never committed to repository
- ✅ **SSH access restricted** - Only your IP can connect
- ✅ **Auto-generated passwords** - 25+ character secure passwords
- ✅ **EU-only infrastructure** - Hosted in Germany (Nuremberg)
- ✅ **No CLOUD Act exposure** - EU-sovereign deployment
- ✅ **Firewall configured** - Only necessary ports open
- ✅ **Fail2ban protection** - Automatic SSH attack prevention

## 💰 Cost Structure

| Component | Specification | Monthly Cost |
|-----------|---------------|--------------|
| **Hetzner CPX11** | 2 vCPU, 2GB RAM, 40GB SSD | €3.85 |
| **Traffic** | 20TB included | €0.00 |
| **Firewall** | Included | €0.00 |
| **SSH Key** | Included | €0.00 |
| **Total** | | **€3.85/month** |

**Realistic Capacity**: 
- **Light usage**: 1,000-2,000 daily active users
- **Medium usage**: 500-1,000 concurrent users  
- **Database**: Small to medium datasets (under 10GB)
- **API calls**: Up to 100K requests/day
- **Scaling**: Easy upgrade to larger Hetzner instances when needed

## 🔧 Management Commands

### Infrastructure
```bash
# Generate secure configuration
./scripts/generate-setup.sh

# Deploy infrastructure
./scripts/deploy.sh

# SSH to server
./scripts/ssh.sh

# Get server info
cd environments/production
terraform output

# Update firewall for new IP (common need)
CURRENT_IP=$(curl -s http://ipv4.icanhazip.com/)
sed -i.bak "s/allowed_ssh_ips = \[\".*\"/allowed_ssh_ips = [\"$CURRENT_IP\/32\"/" terraform.tfvars
terraform apply -auto-approve
```

### IP Address Management
```bash
# Check your current IP (using EU-based services)
curl -s http://ipv4.icanhazip.com/

# Allow your current IP only (most secure)
CURRENT_IP=$(curl -s http://ipv4.icanhazip.com/)
sed -i.bak "s/allowed_ssh_ips = \[\".*\"/allowed_ssh_ips = [\"$CURRENT_IP\/32\"/" terraform.tfvars
terraform apply -auto-approve

# Allow all IPs temporarily (for testing - less secure)
sed -i.bak 's/allowed_ssh_ips = \[.*\]/allowed_ssh_ips = ["0.0.0.0\/0"]/' terraform.tfvars
terraform apply -auto-approve

# Allow multiple specific IPs (recommended for production)
# Edit terraform.tfvars manually:
# allowed_ssh_ips = ["HOME-IP/32", "OFFICE-IP/32", "VPN-IP/32"]
```

### Supabase Operations (on server)
```bash
# Service management
sudo /opt/supabase/start.sh    # Start all services
sudo /opt/supabase/stop.sh     # Stop all services
sudo /opt/supabase/status.sh   # Check status

# Data management
sudo /opt/supabase/backup.sh   # Create backup

# View configuration
sudo cat /opt/supabase/credentials.txt
```

## 🌍 Access URLs

After deployment, your infrastructure will be available at:

- **Supabase API**: `http://YOUR-SERVER-IP:8000`
- **Supabase Studio**: `http://YOUR-SERVER-IP:3001`
- **PostgreSQL**: `postgresql://postgres:PASSWORD@YOUR-SERVER-IP:5432/postgres`

Get your server IP with: `terraform output supabase_server_ip`

## 🔄 Future Expansion

The structure is ready for additional modules:

```
terraform/
├── modules/
│   ├── database/supabase/     ✅ Complete
│   ├── networking/bunnycdn/   🔄 Future CDN
│   ├── compute/nodejs-api/    🔄 Future API
│   └── monitoring/grafana/    🔄 Future monitoring
├── environments/
│   ├── production/            ✅ Complete
│   ├── staging/               🔄 Future staging
│   └── development/           🔄 Future dev
```

## 🚨 Troubleshooting

### Common Issues

**1. "Hetzner API token not configured"**
```bash
# Edit the terraform.tfvars file
nano environments/production/terraform.tfvars
# Add: hcloud_token = "your-actual-token"
```

**2. "SSH connection refused" / "Connection timeout"**

This is usually an IP firewall issue. Your IP address changed since deployment!

```bash
# Check your current IP
curl -s http://ipv4.icanhazip.com/

# Check what IP is allowed
cd environments/production
grep allowed_ssh_ips terraform.tfvars

# If they don't match, update your IP:
```

**Fix Option A: Update to your current IP**
```bash
# Get your current IP and update terraform.tfvars (using EU services)
CURRENT_IP=$(curl -s http://ipv4.icanhazip.com/)
sed -i.bak "s/allowed_ssh_ips = \[\".*\"/allowed_ssh_ips = [\"$CURRENT_IP\/32\"/" terraform.tfvars
sed -i.bak "s/allowed_admin_ips = \[\".*\"/allowed_admin_ips = [\"$CURRENT_IP\/32\"/" terraform.tfvars

# Apply the firewall update
terraform apply -auto-approve
```

**Fix Option B: Allow all IPs temporarily (for testing)**
```bash
# Allow access from anywhere (LESS SECURE - for testing only)
sed -i.bak 's/allowed_ssh_ips = \[.*\]/allowed_ssh_ips = ["0.0.0.0\/0"]/' terraform.tfvars
sed -i.bak 's/allowed_admin_ips = \[.*\]/allowed_admin_ips = ["0.0.0.0\/0"]/' terraform.tfvars

# Apply the change
terraform apply -auto-approve

# Don't forget to restrict it later for production!
```

**Fix Option C: Allow multiple IPs**
```bash
# Edit terraform.tfvars to allow multiple IPs (home + mobile + VPN)
nano terraform.tfvars
# Change to: allowed_ssh_ips = ["HOME-IP/32", "MOBILE-IP/32", "VPN-IP/32"]

terraform apply -auto-approve
```

**Alternative: Use Hetzner Console**
- Go to [Hetzner Console](https://console.hetzner-cloud.com)
- Find your server → Firewalls → Edit rules
- Add your current IP or temporarily allow 0.0.0.0/0

**3. "Supabase not responding"**
```bash
# SSH to server and check status
./scripts/ssh.sh
sudo /opt/supabase/status.sh
# Restart if needed
sudo /opt/supabase/stop.sh && sudo /opt/supabase/start.sh
```

**4. "Permission denied (publickey)"**
```bash
# Check SSH key permissions
ls -la shared/secrets/
chmod 600 shared/secrets/harborguessr_rsa
```

**5. "IP changed while traveling/working"**
Common when using mobile hotspots, VPNs, or different networks:
```bash
# Quick fix - get current IP and update firewall (using EU services)
curl -s http://ipv4.icanhazip.com/
# Then use Fix Option A above to update your IP
```

### Support Commands
```bash
# View Terraform logs
terraform plan
terraform apply

# View server logs
journalctl -u harborguessr-supabase

# Check Docker containers
docker ps
docker logs supabase-db
```

## 📚 Documentation References

- [Hetzner Cloud API](https://docs.hetzner.cloud/)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/hosting/docker)
- [Terraform Hetzner Provider](https://registry.terraform.io/providers/hetznercloud/hcloud/latest/docs)

## 🎯 Next Steps After Deployment

1. **Configure your frontend**:
   ```javascript
   // In your Harbor Guesser app
   const supabaseUrl = 'http://YOUR-SERVER-IP:8000'
   const supabaseKey = 'YOUR-ANON-KEY' // From credentials.txt
   ```

2. **Set up your database schema** via Supabase Studio

3. **Configure authentication** in Supabase settings

4. **Set up regular backups** using the included backup script

---

**Harbor Guesser EU Infrastructure** - Proving digital sovereignty at €3.85/month 🇪🇺⚡

*Built with Terraform • Hosted in Germany • GDPR Compliant • No CLOUD Act Exposure*