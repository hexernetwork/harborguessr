# terraform/modules/database/supabase/outputs.tf
# Outputs from the Lightweight Supabase module

output "server_ip" {
  description = "Public IP address of the Supabase server"
  value       = hcloud_server.supabase.ipv4_address
}

output "server_id" {
  description = "Hetzner server ID"
  value       = hcloud_server.supabase.id
}

output "server_name" {
  description = "Server name"
  value       = hcloud_server.supabase.name
}

output "supabase_url" {
  description = "Supabase API URL (main endpoint for your app)"
  value       = "http://${hcloud_server.supabase.ipv4_address}:8000"
}

output "database_admin_url" {
  description = "pgAdmin database administration interface"
  value       = "http://${hcloud_server.supabase.ipv4_address}:3000"
}

output "health_check_url" {
  description = "Health check endpoint"
  value       = "http://${hcloud_server.supabase.ipv4_address}:8000/health"
}

output "postgres_connection_string" {
  description = "PostgreSQL direct connection string"
  value       = "postgresql://postgres:${var.postgres_password}@${hcloud_server.supabase.ipv4_address}:5432/postgres"
  sensitive   = true
}

output "postgrest_url" {
  description = "PostgREST direct URL (for debugging)"
  value       = "http://${hcloud_server.supabase.ipv4_address}:3001"
}

output "auth_url" {
  description = "Supabase Auth direct URL (for debugging)"
  value       = "http://${hcloud_server.supabase.ipv4_address}:9999"
}

output "firewall_id" {
  description = "Firewall ID"
  value       = hcloud_firewall.supabase_firewall.id
}

output "ssh_key_id" {
  description = "SSH key ID"
  value       = hcloud_ssh_key.supabase_key.id
}

output "setup_complete_message" {
  description = "Setup completion message with access URLs"
  value = <<-EOT
    🎉 Harbor Guesser Lightweight Supabase deployed successfully!
    
    🔗 Main Access Points:
    📊 Database Admin: http://${hcloud_server.supabase.ipv4_address}:3000
    🔌 Supabase API: http://${hcloud_server.supabase.ipv4_address}:8000
    🔍 Health Check: http://${hcloud_server.supabase.ipv4_address}:8000/health
    
    💻 Frontend Configuration:
    NEXT_PUBLIC_SUPABASE_URL=http://${hcloud_server.supabase.ipv4_address}:8000
    
    🔑 SSH Access:
    ssh -i ../../shared/secrets/harborguessr_rsa root@${hcloud_server.supabase.ipv4_address}
    
    📋 View credentials: sudo cat /opt/supabase/credentials.txt
    📊 Check status: sudo /opt/supabase/status.sh
    
    🎮 Harbor Guesser Ready: Auth ✅ | Database ✅ | API ✅ | Admin UI ✅
  EOT
}