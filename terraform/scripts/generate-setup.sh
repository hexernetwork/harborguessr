#!/bin/bash
# terraform/modules/database/supabase/user_data.sh
# Robust version that won't stall

set -euo pipefail

# Simple logging function that actually works
log() {
    local msg="$1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $msg" | tee -a /var/log/harborguessr-setup.log
}

log "Starting Harbor Guesser Supabase setup (Robust version)..."

# Update system packages
log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# Install essential packages in smaller chunks to avoid hangs
log "Installing essential packages..."
apt-get install -y curl wget git unzip
apt-get install -y apt-transport-https ca-certificates gnupg lsb-release
apt-get install -y fail2ban ufw htop vim postgresql-client jq

# Install Node.js and npm separately
log "Installing Node.js and npm..."
apt-get install -y nodejs npm

# Configure fail2ban
log "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Install Docker with robust error handling
log "Installing Docker (robust method)..."

# Method 1: Try official Docker installation
if ! command -v docker &> /dev/null; then
    log "Adding Docker GPG key..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    log "Adding Docker repository..."
    ARCH=$$(dpkg --print-architecture)
    CODENAME=$$(lsb_release -cs)
    echo "deb [arch=$$ARCH signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $$CODENAME stable" > /etc/apt/sources.list.d/docker.list
    
    log "Updating package index..."
    apt-get update -y
    
    log "Installing Docker packages..."
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    log "Starting Docker service..."
    systemctl start docker
    systemctl enable docker
else
    log "Docker already installed, skipping..."
fi

# Install Docker Compose standalone (backup method)
log "Installing Docker Compose standalone..."
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION="2.24.0"
    curl -L "https://github.com/docker/compose/releases/download/v$$COMPOSE_VERSION/docker-compose-Linux-x86_64" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Verify installations
log "Verifying Docker installation..."
docker --version || log "ERROR: Docker installation failed"
docker-compose --version || log "ERROR: Docker Compose installation failed"

# Create supabase user
log "Creating supabase user..."
useradd -m -s /bin/bash supabase || true
usermod -aG docker supabase

# Create directory structure
log "Setting up directories..."
mkdir -p /opt/supabase/volumes/db/data
mkdir -p /opt/supabase/volumes/db/init
mkdir -p /opt/supabase/volumes/api
mkdir -p /opt/supabase/volumes/storage
chown -R supabase:supabase /opt/supabase
cd /opt/supabase

# Get server IP
SERVER_IP=$$(curl -s http://ipv4.icanhazip.com/ || echo "localhost")
log "Server IP: $$SERVER_IP"

# Use Terraform variables
log "Setting up secrets..."
JWT_SECRET="${jwt_secret}"
POSTGRES_PASSWORD="${postgres_password}"

# Generate additional secrets
DASHBOARD_USERNAME="admin"
DASHBOARD_PASSWORD=$$(openssl rand -base64 20 | tr -d "=+/" | cut -c1-16)
SECRET_KEY_BASE=$$(openssl rand -base64 48 | tr -d '\n')
DB_ENC_KEY=$$(openssl rand -base64 32 | tr -d '\n' | cut -c1-32)

# Create JWT generation script
log "Creating JWT generator..."
cat > generate_jwt.js << 'EOJWT'
const crypto = require('crypto');

function base64URLEscape(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateJWT(payload, secret) {
    const header = {"alg": "HS256", "typ": "JWT"};
    const encodedHeader = base64URLEscape(Buffer.from(JSON.stringify(header)).toString('base64'));
    const encodedPayload = base64URLEscape(Buffer.from(JSON.stringify(payload)).toString('base64'));
    const data = encodedHeader + "." + encodedPayload;
    const signature = crypto.createHmac('sha256', secret).update(data).digest('base64');
    const encodedSignature = base64URLEscape(signature);
    return data + "." + encodedSignature;
}

const secret = process.argv[2];
const role = process.argv[3];
const payload = {
    "iss": "supabase",
    "ref": "harborguessr", 
    "role": role,
    "iat": Math.floor(Date.now() / 1000),
    "exp": Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
};
console.log(generateJWT(payload, secret));
EOJWT

# Generate JWT tokens
log "Generating JWT tokens..."
ANON_KEY=$$(node generate_jwt.js "$$JWT_SECRET" "anon")
SERVICE_ROLE_KEY=$$(node generate_jwt.js "$$JWT_SECRET" "service_role")

log "All secrets generated successfully"

# Create environment file
log "Creating environment configuration..."
cat > .env << EOENV
POSTGRES_PASSWORD=$$POSTGRES_PASSWORD
JWT_SECRET=$$JWT_SECRET
ANON_KEY=$$ANON_KEY
SERVICE_ROLE_KEY=$$SERVICE_ROLE_KEY
SECRET_KEY_BASE=$$SECRET_KEY_BASE
DB_ENC_KEY=$$DB_ENC_KEY
SITE_URL=http://$$SERVER_IP:8000
SUPABASE_PUBLIC_URL=http://$$SERVER_IP:8000
DASHBOARD_USERNAME=$$DASHBOARD_USERNAME
DASHBOARD_PASSWORD=$$DASHBOARD_PASSWORD
STUDIO_DEFAULT_ORGANIZATION=Harbor Guesser
STUDIO_DEFAULT_PROJECT=Production
SERVER_IP=$$SERVER_IP
EOENV

# Create Docker Compose file
log "Creating Docker Compose configuration..."
cat > docker-compose.yml << 'EODCOMPOSE'
name: harborguessr-supabase

services:
  db:
    container_name: supabase-db
    image: supabase/postgres:15.1.0.147
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: $${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
    volumes:
      - ./volumes/db/data:/var/lib/postgresql/data
      - ./volumes/db/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  auth:
    container_name: supabase-auth
    image: supabase/gotrue:v2.143.0
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    ports:
      - "9999:9999"
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:$${POSTGRES_PASSWORD}@db:5432/postgres?sslmode=disable
      GOTRUE_SITE_URL: $${SITE_URL}
      GOTRUE_JWT_SECRET: $${JWT_SECRET}
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_MAILER_AUTOCONFIRM: true

  rest:
    container_name: supabase-rest
    image: postgrest/postgrest:v12.0.2
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      PGRST_DB_URI: postgres://authenticator:$${POSTGRES_PASSWORD}@db:5432/postgres
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: $${JWT_SECRET}

  realtime:
    container_name: supabase-realtime
    image: supabase/realtime:v2.25.50
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      PORT: 4000
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: supabase_admin
      DB_PASSWORD: $${POSTGRES_PASSWORD}
      DB_NAME: postgres
      DB_ENC_KEY: $${DB_ENC_KEY}
      API_JWT_SECRET: $${JWT_SECRET}
      SECRET_KEY_BASE: $${SECRET_KEY_BASE}

  storage:
    container_name: supabase-storage
    image: supabase/storage-api:v0.46.4
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      ANON_KEY: $${ANON_KEY}
      SERVICE_KEY: $${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: $${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:$${POSTGRES_PASSWORD}@db:5432/postgres
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
    volumes:
      - ./volumes/storage:/var/lib/storage

  meta:
    container_name: supabase-meta
    image: supabase/postgres-meta:v0.68.0
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: db
      PG_META_DB_NAME: postgres
      PG_META_DB_USER: supabase_admin
      PG_META_DB_PASSWORD: $${POSTGRES_PASSWORD}

  kong:
    container_name: supabase-kong
    image: kong:2.8.1-alpine
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_PLUGINS: request-transformer,cors,key-auth
    volumes:
      - ./volumes/api/kong.yml:/var/lib/kong/kong.yml:ro
    depends_on:
      - auth
      - rest
      - realtime
      - storage
      - meta

  studio:
    container_name: supabase-studio
    image: supabase/studio:20240326-5e5586d
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      POSTGRES_PASSWORD: $${POSTGRES_PASSWORD}
      SUPABASE_URL: http://kong:8000
      SUPABASE_PUBLIC_URL: $${SUPABASE_PUBLIC_URL}
      SUPABASE_ANON_KEY: $${ANON_KEY}
      SUPABASE_SERVICE_KEY: $${SERVICE_ROLE_KEY}
    depends_on:
      - db
      - meta
      - kong
EODCOMPOSE

# Create database initialization
log "Creating database initialization..."
cat > volumes/db/init/01-init.sql << 'EOSQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create roles
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'REPLACE_PASSWORD';
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'REPLACE_PASSWORD';
CREATE ROLE supabase_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'REPLACE_PASSWORD';
CREATE ROLE supabase_storage_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'REPLACE_PASSWORD';

-- Grant memberships
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- Create schemas
CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;
CREATE SCHEMA storage AUTHORIZATION supabase_storage_admin;
CREATE SCHEMA realtime AUTHORIZATION supabase_admin;
CREATE SCHEMA _realtime AUTHORIZATION supabase_admin;

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Application tables
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    location_name TEXT,
    guess_lat DECIMAL,
    guess_lng DECIMAL,
    actual_lat DECIMAL,
    actual_lng DECIMAL,
    distance_km INTEGER,
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    username TEXT,
    total_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    avg_distance_km DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public access" ON public.games FOR ALL USING (true);
CREATE POLICY "Public access" ON public.leaderboard FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.games TO anon, authenticated, service_role;
GRANT ALL ON public.leaderboard TO anon, authenticated, service_role;
EOSQL

# Replace password placeholder
sed -i "s/REPLACE_PASSWORD/$$POSTGRES_PASSWORD/g" volumes/db/init/01-init.sql

# Create Kong config
log "Creating Kong configuration..."
cat > volumes/api/kong.yml << 'EOKONG'
_format_version: "2.1"

consumers:
  - username: anon
    keyauth_credentials:
      - key: $${ANON_KEY}
  - username: service_role
    keyauth_credentials:
      - key: $${SERVICE_ROLE_KEY}

services:
  - name: auth-v1
    url: http://auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - "/auth/v1/"
    plugins:
      - name: cors

  - name: rest-v1
    url: http://rest:3000/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - "/rest/v1/"
    plugins:
      - name: cors
      - name: key-auth

  - name: realtime-v1
    url: http://realtime:4000/socket/
    routes:
      - name: realtime-v1-all
        strip_path: true
        paths:
          - "/realtime/v1/"
    plugins:
      - name: cors
      - name: key-auth

  - name: storage-v1
    url: http://storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - "/storage/v1/"
    plugins:
      - name: cors

  - name: meta
    url: http://meta:8080/
    routes:
      - name: meta-all
        strip_path: true
        paths:
          - "/pg/"
    plugins:
      - name: key-auth

plugins:
  - name: cors
    config:
      origins: ["*"]
      methods: [GET, POST, PUT, PATCH, DELETE, OPTIONS]
      headers: [Accept, Authorization, Content-Type, apikey]
      credentials: true
EOKONG

# Set ownership
chown -R supabase:supabase /opt/supabase

# Create start script
log "Creating startup script..."
cat > start.sh << 'EOSTART'
#!/bin/bash
set -e
cd /opt/supabase

echo "🚀 Starting Harbor Guesser Supabase..."

docker-compose pull
docker-compose up -d db

echo "⏳ Waiting for database..."
sleep 30

docker-compose up -d auth rest realtime storage meta
sleep 30

docker-compose up -d kong studio
sleep 30

echo "✅ Supabase started!"
source .env
echo "📊 Studio: http://$SERVER_IP:3000"
echo "🔌 API: http://$SERVER_IP:8000"
echo "🔑 Anon Key: $ANON_KEY"
EOSTART

chmod +x start.sh

# Create credentials file
log "Creating credentials..."
cat > credentials.txt << EOCREDS
Harbor Guesser Supabase
======================

🌐 URLs:
- Studio: http://$$SERVER_IP:3000
- API: http://$$SERVER_IP:8000

🔐 Login:
- Username: $$DASHBOARD_USERNAME
- Password: $$DASHBOARD_PASSWORD

🔑 Keys:
- Anon: $$ANON_KEY
- Service: $$SERVICE_ROLE_KEY
- JWT Secret: $$JWT_SECRET

🗄️ Database:
- Host: $$SERVER_IP:5432
- Password: $$POSTGRES_PASSWORD

💻 Frontend:
NEXT_PUBLIC_SUPABASE_URL=http://$$SERVER_IP:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=$$ANON_KEY
EOCREDS

chmod 600 credentials.txt

# Start services
log "Starting Supabase services..."
sudo -u supabase ./start.sh

log "Waiting for services to initialize..."
sleep 90

log "✅ Harbor Guesser Supabase setup complete!"
log "📊 Studio: http://$$SERVER_IP:3000"
log "🔌 API: http://$$SERVER_IP:8000"
log "📋 Credentials: /opt/supabase/credentials.txt"