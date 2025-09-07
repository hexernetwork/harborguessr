# terraform/modules/database/supabase/main.tf

terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
}

# Create SSH key resource
resource "hcloud_ssh_key" "supabase_key" {
  name       = "${var.project_name}-${var.environment}-supabase-key"
  public_key = var.ssh_public_key
}

# Create the Hetzner server for Supabase
resource "hcloud_server" "supabase" {
  name         = "${var.project_name}-${var.environment}-supabase"
  image        = "ubuntu-22.04"
  server_type  = var.server_type
  location     = var.location
  ssh_keys     = [hcloud_ssh_key.supabase_key.id]
  
  # Server initialization script with Supabase
  user_data = templatefile("${path.module}/user_data.sh", {
    postgres_password = var.postgres_password
    jwt_secret       = var.jwt_secret
  })
  
  labels = var.tags
}

# Create firewall rules
resource "hcloud_firewall" "supabase_firewall" {
  name = "${var.project_name}-${var.environment}-supabase-firewall"
  
  # SSH access - ALLOW ALL (can be restricted later)
  rule {
    direction   = "in"
    port        = "22"
    protocol    = "tcp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "SSH access"
  }
  
  # Supabase API Gateway (Kong) - Main endpoint
  rule {
    direction   = "in"
    port        = "8000"
    protocol    = "tcp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "Supabase API Gateway"
  }
  
  # Supabase Studio - Admin interface
  rule {
    direction   = "in"
    port        = "3000"
    protocol    = "tcp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "Supabase Studio"
  }
  
  # PostgreSQL Direct Access
  rule {
    direction   = "in"
    port        = "5432"
    protocol    = "tcp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "PostgreSQL Direct Access"
  }
  
  # PostgREST Direct Access (optional)
  rule {
    direction   = "in"
    port        = "3001"
    protocol    = "tcp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "PostgREST Direct Access"
  }
  
  # Supabase Auth Direct Access (optional)
  rule {
    direction   = "in"
    port        = "9999"
    protocol    = "tcp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "Supabase Auth Direct Access"
  }
  
  # pg_meta Direct Access (optional)
  rule {
    direction   = "in"
    port        = "8080"
    protocol    = "tcp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "pg_meta Direct Access"
  }
  
  # HTTP/HTTPS for future SSL
  rule {
    direction   = "in"
    port        = "80"
    protocol    = "tcp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "HTTP"
  }
  
  rule {
    direction   = "in"
    port        = "443"
    protocol    = "tcp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "HTTPS"
  }
}

# Attach firewall to server
resource "hcloud_firewall_attachment" "supabase_firewall_attachment" {
  firewall_id = hcloud_firewall.supabase_firewall.id
  server_ids  = [hcloud_server.supabase.id]
}