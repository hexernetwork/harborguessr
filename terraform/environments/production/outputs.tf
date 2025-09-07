# terraform/environments/production/outputs.tf
# Production environment outputs for Lightweight Supabase

output "supabase_server_ip" {
  description = "Public IP address of the Supabase server"
  value       = module.supabase.server_ip
}

output "supabase_url" {
  description = "Supabase API URL (main endpoint for your app)"
  value       = module.supabase.supabase_url
}

output "database_admin_url" {
  description = "pgAdmin database administration interface"
  value       = module.supabase.database_admin_url
}

output "health_check_url" {
  description = "Health check endpoint"
  value       = module.supabase.health_check_url
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh -i ../../shared/secrets/harborguessr_rsa root@${module.supabase.server_ip}"
}

output "deployment_info" {
  description = "Deployment summary information"
  value = {
    environment       = "production"
    server_type       = var.server_type
    location         = var.location
    monthly_cost_eur = var.server_type == "cpx11" ? "3.85" : "variable"
    jurisdiction     = "Germany (EU)"
    cloud_act_risk   = "None (EU-sovereign)"
    security         = "All secrets generated dynamically"
    setup_type       = "Lightweight Supabase (Essential services only)"
    ram_usage        = "~520MB (perfect for 2GB server)"
    services         = "PostgreSQL + PostgREST + Auth + Nginx + pgAdmin"
  }
}

output "setup_complete_message" {
  description = "Complete setup information"
  value       = module.supabase.setup_complete_message
}