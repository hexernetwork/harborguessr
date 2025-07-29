# terraform/modules/database/supabase/variables.tf
# Variables for the SaaS-ready Supabase module

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (production, staging, dev)"
  type        = string
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "cpx11"
}

variable "location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "nbg1"
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

variable "allowed_ssh_ips" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # SaaS-ready: Allow all IPs initially
}

variable "allowed_admin_ips" {
  description = "CIDR blocks allowed admin access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # SaaS-ready: Allow all IPs initially
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}