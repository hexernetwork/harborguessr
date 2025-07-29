# terraform/environments/production/main.tf
# Harbor Guesser Production Environment

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

# Deploy Supabase using our reusable module
module "supabase" {
  source = "../../modules/database/supabase"
  
  # Project configuration
  project_name   = "harborguessr"
  environment    = "production"
  
  # Server configuration
  server_type    = var.server_type
  location       = var.location
  ssh_public_key = var.ssh_public_key
  
  # Security configuration
  allowed_ssh_ips   = var.allowed_ssh_ips
  allowed_admin_ips = var.allowed_admin_ips
  
  # Application secrets
  postgres_password = var.postgres_password
  jwt_secret       = var.jwt_secret
  
  # Resource tagging
  tags = var.tags
}