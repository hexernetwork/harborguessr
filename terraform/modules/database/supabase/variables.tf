# terraform/modules/database/supabase/variables.tf

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

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}