#!/bin/bash
# terraform/modules/database/supabase/user_data.sh

set -euo pipefail

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a /var/log/harborguessr-setup.log
}

log "Starting Harbor Guesser FINAL WORKING Supabase setup..."

# Update system packages
log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

# Install essential packages
log "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    fail2ban \
    ufw \
    htop \
    vim \
    postgresql-client \
    jq

# Configure fail2ban for SSH protection
log "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Install Docker
log "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose standalone
log "Installing Docker Compose..."
COMPOSE_VERSION="2.24.0"
curl -L "https://github.com/docker/compose/releases/download/v$COMPOSE_VERSION/docker-compose-Linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create supabase user for security
log "Creating supabase service user..."
useradd -m -s /bin/bash supabase
usermod -aG docker supabase

# Create Supabase directory
log "Setting up Supabase directory..."
mkdir -p /opt/supabase/{volumes/api,scripts}
chown -R supabase:supabase /opt/supabase
cd /opt/supabase

# Get server IP dynamically
SERVER_IP=$(curl -s http://ipv4.icanhazip.com/ || echo "localhost")
log "Server IP detected: $SERVER_IP"

# Generate JWT keys
log "Generating JWT tokens..."
JWT_SECRET="${jwt_secret}"

# Generate ANON key
ANON_PAYLOAD='{"iss":"supabase","ref":"harborguessr","role":"anon","iat":1641254400,"exp":1956614400}'
ANON_HEADER='{"alg":"HS256","typ":"JWT"}'

ANON_HEADER_B64=$(echo -n "$ANON_HEADER" | openssl base64 -A | tr '+/' '-_' | tr -d '=')
ANON_PAYLOAD_B64=$(echo -n "$ANON_PAYLOAD" | openssl base64 -A | tr '+/' '-_' | tr -d '=')
ANON_SIGNATURE=$(echo -n "$ANON_HEADER_B64.$ANON_PAYLOAD_B64" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
ANON_KEY="$ANON_HEADER_B64.$ANON_PAYLOAD_B64.$ANON_SIGNATURE"

# Generate SERVICE_ROLE key
SERVICE_PAYLOAD='{"iss":"supabase","ref":"harborguessr","role":"service_role","iat":1641254400,"exp":1956614400}'
SERVICE_HEADER='{"alg":"HS256","typ":"JWT"}'

SERVICE_HEADER_B64=$(echo -n "$SERVICE_HEADER" | openssl base64 -A | tr '+/' '-_' | tr -d '=')
SERVICE_PAYLOAD_B64=$(echo -n "$SERVICE_PAYLOAD" | openssl base64 -A | tr '+/' '-_' | tr -d '=')
SERVICE_SIGNATURE=$(echo -n "$SERVICE_HEADER_B64.$SERVICE_PAYLOAD_B64" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
SERVICE_ROLE_KEY="$SERVICE_HEADER_B64.$SERVICE_PAYLOAD_B64.$SERVICE_SIGNATURE"

log "Generated ANON key: $ANON_KEY"
log "Generated SERVICE key: $${SERVICE_ROLE_KEY:0:20}..."

# Create WORKING docker-compose with proper database init
log "Creating WORKING Supabase docker-compose..."
cat > docker-compose.yml << EOF
version: '3.8'

services:
  # PostgreSQL Database - Using regular postgres with custom init
  db:
    container_name: supabase-db
    image: postgres:15-alpine
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${postgres_password}
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_INITDB_ARGS: "--auth-host=md5"
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/01-init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 20

  # PostgREST API
  rest:
    container_name: supabase-rest
    image: postgrest/postgrest:v12.0.2
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      PGRST_DB_URI: postgres://authenticator:${postgres_password}@db:5432/postgres
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${jwt_secret}
      PGRST_DB_USE_LEGACY_GUCS: "false"
    depends_on:
      db:
        condition: service_healthy

  # Supabase Auth (GoTrue)
  auth:
    container_name: supabase-auth
    image: supabase/gotrue:v2.143.0
    restart: unless-stopped
    ports:
      - "9999:9999"
    environment:
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${postgres_password}@db:5432/postgres
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: http://$SERVER_IP:8000
      GOTRUE_SITE_URL: https://harborguessr.com
      GOTRUE_URI_ALLOW_LIST: "http://localhost:3000,https://harborguessr.com,http://$SERVER_IP:3000"
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_JWT_SECRET: ${jwt_secret}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_EXTERNAL_EMAIL_ENABLED: false
      GOTRUE_MAILER_AUTOCONFIRM: true
    depends_on:
      db:
        condition: service_healthy

  # Kong API Gateway
  kong:
    container_name: supabase-kong
    image: kong:2.8.1-alpine
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
    volumes:
      - ./volumes/api/kong.yml:/var/lib/kong/kong.yml:ro
    depends_on:
      - auth
      - rest

  # pg_meta for Supabase Studio
  meta:
    container_name: supabase-meta
    image: supabase/postgres-meta:v0.68.0
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: db
      PG_META_DB_PORT: 5432
      PG_META_DB_NAME: postgres
      PG_META_DB_USER: supabase_admin
      PG_META_DB_PASSWORD: ${postgres_password}
    depends_on:
      db:
        condition: service_healthy

  # REAL Supabase Studio Dashboard
  studio:
    container_name: supabase-studio
    image: supabase/studio:20240326-5e5586d
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      SUPABASE_URL: http://kong:8000
      SUPABASE_ANON_KEY: $ANON_KEY
      SUPABASE_SERVICE_KEY: $SERVICE_ROLE_KEY
    depends_on:
      - kong
      - meta

volumes:
  db-data:
EOF

# Create database initialization SQL file (this will actually work)
log "Creating database initialization SQL..."
cat > scripts/init.sql << EOF
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create roles
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD '${postgres_password}';
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN PASSWORD '${postgres_password}';
CREATE ROLE supabase_admin SUPERUSER LOGIN PASSWORD '${postgres_password}';

-- Grant permissions
GRANT authenticator TO postgres;
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT ALL ON SCHEMA public TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticator;

-- Auth schema permissions
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT authenticator TO supabase_auth_admin;

-- CRITICAL FIX: Grant proper permissions for auth migrations
GRANT ALL ON SCHEMA public TO supabase_auth_admin;
GRANT CREATE ON DATABASE postgres TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

-- Create auth.uid() function
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID 
LANGUAGE SQL STABLE
AS \$\$
  SELECT 
    COALESCE(
        NULLIF(current_setting('request.jwt.claim.sub', true), ''),
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::UUID
\$\$;

-- Create users table in auth schema
CREATE TABLE IF NOT EXISTS auth.users (
    instance_id UUID,
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aud VARCHAR(255),
    role VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    is_super_admin BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    phone VARCHAR(15),
    phone_confirmed_at TIMESTAMPTZ,
    phone_change VARCHAR(15),
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current VARCHAR(255) DEFAULT '',
    email_change_confirm_status SMALLINT DEFAULT 0,
    banned_until TIMESTAMPTZ,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMPTZ,
    is_sso_user BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- Harbor Guesser tables
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    location_name TEXT,
    guess_lat DECIMAL,
    guess_lng DECIMAL,
    actual_lat DECIMAL,
    actual_lng DECIMAL,
    distance_km INTEGER,
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    username TEXT,
    total_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    avg_distance_km DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own games" ON public.games
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games" ON public.games
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated users can update own leaderboard" ON public.leaderboard
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.leaderboard TO anon;
GRANT ALL ON public.games TO authenticated;
GRANT ALL ON public.leaderboard TO authenticated;
EOF

# Create Kong configuration
log "Creating Kong configuration..."
mkdir -p volumes/api
cat > volumes/api/kong.yml << EOF
_format_version: "2.1"

consumers:
  - username: anon
    keyauth_credentials:
      - key: $ANON_KEY
  - username: service_role
    keyauth_credentials:
      - key: $SERVICE_ROLE_KEY

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
      - name: key-auth
        config:
          hide_credentials: false

  - name: rest-v1
    url: http://rest:3001/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - "/rest/v1/"
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: true

  - name: meta
    url: http://meta:8080/
    routes:
      - name: meta-all
        strip_path: true
        paths:
          - "/pg/"
    plugins:
      - name: key-auth
        config:
          hide_credentials: true

plugins:
  - name: cors
    config:
      origins: ["*"]
      methods: [GET, POST, PUT, PATCH, DELETE, OPTIONS]
      headers: [Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Auth-Token, Authorization, X-Client-Info, apikey, X-Requested-With]
      exposed_headers: [X-Request-Id]
      credentials: true
      max_age: 3600
EOF

# Set proper ownership
chown -R supabase:supabase /opt/supabase

# Start services step by step
log "🚀 Starting Supabase services..."

# Pull images
sudo -u supabase docker-compose pull

# Start database first
sudo -u supabase docker-compose up -d db

# Wait for database to be ready (init.sql will run automatically)
log "⏳ Waiting for database initialization..."
sleep 60

# Verify database users were created
log "🔍 Verifying database users..."
docker exec supabase-db psql -U postgres -d postgres -c "SELECT rolname FROM pg_roles WHERE rolname IN ('authenticator', 'anon', 'authenticated', 'supabase_auth_admin', 'supabase_admin');" || log "⚠️ Some database users may not be created yet"

# Start all services
sudo -u supabase docker-compose up -d

# Wait for all services
log "⏳ Waiting for all services to start..."
sleep 90

# Create management scripts
log "Creating management scripts..."

cat > /opt/supabase/start.sh << EOF
#!/bin/bash
set -e
cd /opt/supabase
echo "🚀 Starting Harbor Guesser Supabase..."
docker-compose up -d
sleep 60
docker-compose ps
echo ""
echo "🔗 Access URLs:"
echo "📊 Supabase Studio: http://$SERVER_IP:3000"
echo "🔌 Supabase API: http://$SERVER_IP:8000"
EOF

cat > /opt/supabase/status.sh << EOF
#!/bin/bash
cd /opt/supabase
echo "📊 Harbor Guesser Supabase Status:"
docker-compose ps
echo ""
echo "🔗 Access URLs:"
echo "📊 Supabase Studio: http://$SERVER_IP:3000"
echo "🔌 Supabase API: http://$SERVER_IP:8000"
echo ""
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
EOF

cat > /opt/supabase/stop.sh << 'EOF'
#!/bin/bash
set -e
cd /opt/supabase
echo "🛑 Stopping Supabase..."
docker-compose down
echo "✅ Stopped"
EOF

chmod +x /opt/supabase/*.sh

# Create credentials file
log "Creating credentials..."
cat > /opt/supabase/credentials.txt << EOF
Harbor Guesser REAL Supabase
============================

🌐 Access:
- Studio: http://$SERVER_IP:3000
- API: http://$SERVER_IP:8000
- Database: postgresql://postgres:${postgres_password}@$SERVER_IP:5432/postgres

🔑 Keys:
- Anon: $ANON_KEY
- Service: $SERVICE_ROLE_KEY
- JWT: ${jwt_secret}

💻 Frontend:
NEXT_PUBLIC_SUPABASE_URL=http://$SERVER_IP:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY

Generated: $(date)
EOF

chmod 600 /opt/supabase/credentials.txt
chown supabase:supabase /opt/supabase/credentials.txt

# Final check
RUNNING=$(sudo -u supabase docker-compose ps --services --filter "status=running" | wc -l)
log "📈 Final status: $RUNNING/6 services running"

if [ "$RUNNING" -eq 6 ]; then
    log "🎯 SUCCESS! Supabase operational!"
    log "📊 Studio: http://$SERVER_IP:3000"
    log "🔌 API: http://$SERVER_IP:8000"
else
    log "⚠️ Services still starting: $RUNNING/6"
fi

log "✅ Setup complete!"