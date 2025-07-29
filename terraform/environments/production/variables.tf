# terraform/environments/production/variables.tf
# Production environment variables

variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key for server access"
  type        = string
}

variable "postgres_password" {
  description = "PostgreSQL password for Supabase"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for Supabase authentication"
  type        = string
  sensitive   = true
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "cpx11"
}

variable "location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "nbg1"  # Nuremberg, Germany
}

variable "allowed_ssh_ips" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_admin_ips" {
  description = "CIDR blocks allowed admin access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    project     = "harborguessr"
    service     = "supabase"
    environment = "production"
    managed_by  = "terraform"
  }
}