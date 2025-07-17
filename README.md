# 🇪🇺 EU-Sovereign Infrastructure Architecture
## Zero CLOUD Act Dependencies - Cache-First Design

**EU-sovereign infrastructure demonstrating cache-first architecture that scales from €1/month to millions of users. Shows how to build globally-distributed apps with 99%+ cache hit rates, <50ms response times, and predictable scaling costs using modern edge computing.**

### 🎯 Project Goals
- **100% EU jurisdiction** for all infrastructure
- **Zero CLOUD Act exposure** in production
- **Cache-first architecture** with 99%+ hit rates
- **Progressive sovereignty** (start mixed, end pure EU)
- **€1-6/month** startup costs with clear scaling path
- **GDPR-native compliance** by design

---

## 🏗️ Architecture Overview

```
Phase 1: Development (€1/month)
┌─────────────────────────────────────────────────────────────┐
│                   🇪🇺 EU-FIRST STACK                        │
└─────────────────────────────────────────────────────────────┘

Domain: Gandi 🇫🇷 (or keep Namecheap 🇨🇦)
         │
         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    Codeberg     │    │   Scaleway       │    │   Supabase      │
│   (Git Repo)    │────│ Static Hosting   │────│  Cloud EU       │
│   🇩🇪 Germany    │    │   🇫🇷 France     │    │ 🇪🇺 Frankfurt   │
│     FREE        │    │     FREE         │    │     FREE        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         │              ┌──────────────────┐             │
         └─────────────▶│    BunnyCDN      │◀────────────┘
                        │  (Global CDN)    │
                        │  🇸🇮 Slovenia    │
                        │   €1/month       │
                        │  99%+ Cache Hit  │
                        └──────────────────┘

Phase 2: Production - 100% EU Sovereign (€5-6/month)
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    Codeberg     │    │   Scaleway       │    │   Hetzner VPS   │
│   (Git Repo)    │────│ Static Hosting   │────│  Self-hosted    │
│   🇩🇪 Germany    │    │   🇫🇷 France     │    │   Supabase      │
│     FREE        │    │     FREE         │    │  🇩🇪 Germany     │
└─────────────────┘    └──────────────────┘    │   €4.15/month   │
         │                       │              └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐             │
         └─────────────▶│    BunnyCDN      │◀────────────┘
                        │  (Global CDN)    │
                        │  🇸🇮 Slovenia    │
                        │   €1/month       │
                        │  1-year cache    │
                        └──────────────────┘
```

---

## 🌍 EU Domain Registrar Options

### 🇫🇷 Gandi (France) - Recommended
- **Cost**: €15-20/year (.com domains)
- **Benefits**: EU-based, GDPR-native, privacy-focused
- **Features**: Free WHOIS protection, DNS management
- **CLOUD Act**: ❌ Zero exposure (French jurisdiction)

### 🇩🇪 IONOS (Germany) - Alternative
- **Cost**: €12-18/year (.com domains)
- **Benefits**: German privacy laws, EU data centers
- **Features**: Integrated hosting, SSL certificates
- **CLOUD Act**: ❌ Zero exposure (German jurisdiction)

### 🇨🇦 Namecheap (Keep Existing)
- **Cost**: €0 (already owned)
- **Status**: ⚠️ Canadian jurisdiction (Five Eyes alliance)
- **Migration**: Optional - can migrate to EU registrar later
- **Benefits**: Already configured, WHOIS protection active

---

## 📊 Complete Component Breakdown

### 💻 Source Code Repository
**Provider**: Codeberg.org (Germany) 🇩🇪
- **Cost**: FREE forever
- **Features**: Git, Issues, CI/CD, Web IDE, Pages hosting
- **CLOUD Act**: ❌ Zero exposure (German non-profit)
- **Privacy**: Privacy-first alternative to GitHub
- **Migration**: `git remote set-url origin git@codeberg.org:user/harborguessr.git`

### 🖥️ Frontend Hosting
**Provider**: Scaleway Static Sites (France) 🇫🇷
- **Cost**: FREE (unlimited bandwidth, 100GB storage)
- **Tech**: Next.js static export (same code)
- **Features**: Auto-deploy from Codeberg, custom domains, SSL
- **CLOUD Act**: ❌ Zero exposure (French jurisdiction)
- **Deployment**: Git push → Auto build → Live in <2 minutes

### ⚡ API Layer & Caching Strategy
**Provider**: Scaleway Serverless Functions (France) 🇫🇷
- **Cost**: FREE (1M requests + 400K GB-s/month)
- **Tech**: Same Node.js worker code with minimal changes
- **Cache Headers**: 1-year cache for harbors/trivia data
- **Performance**: <50ms globally with 99%+ cache hit rate
- **Features**: Auto-scaling, environment variables, secrets

### 🗄️ Database Architecture - Keep Supabase!

**Phase 1**: Supabase Cloud EU (Frankfurt) 🇪🇺
- **Cost**: FREE (500MB, 50K users)
- **CLOUD Act**: ⚠️ Minimal risk (US company, EU data center)
- **Migration**: Zero changes needed from existing setup
- **Features**: Real-time, auth, row-level security, storage

**Phase 2**: Self-hosted Supabase on Hetzner 🇩🇪
- **Cost**: €4.15/month (CPX11 VPS - 2 vCPU AMD, 2GB RAM, 40GB SSD)
- **CLOUD Act**: ❌ Zero exposure (your German VPS)
- **Migration**: Docker Compose setup + `pg_dump` → `pg_restore` + update URL only
- **Same Everything**: Identical Supabase API, auth, real-time, storage
- **Benefits**: Full control, unlimited storage, EU sovereignty
- **Why This Rocks**: Keep all your existing code, just change the URL!

### 💾 Storage Strategy - Supabase Storage Always
**Phase 1**: Supabase Storage
- **Cost**: FREE (included with database)
- **Features**: S3-compatible API, image optimization

**Phase 2**: Self-hosted Supabase Storage on Hetzner 🇩🇪
- **Cost**: €0 (included with VPS)
- **Same API**: Identical Supabase Storage API - zero code changes
- **Migration**: Simple file copy between storage instances
- **Benefits**: Unlimited storage, full control, EU sovereignty

### 🚀 CDN & Global Cache Network
**Provider**: BunnyCDN (Slovenia) 🇸🇮
- **Cost**: €1/month minimum (10TB included)
- **Features**: 260+ edge locations globally
- **Cache Strategy**: 
  - Harbor/trivia data: 1-year cache
  - Static assets: Indefinite cache
  - API responses: Smart cache headers
- **Performance**: 10-50ms response times globally
- **Purging**: Real-time cache invalidation via API

---

## 🎯 Cache-First Philosophy Implementation

### Why 99%+ Cache Hit Rate Matters
```javascript
// Traditional approach: Every request hits database
Database Load: 100% of requests = Expensive + Slow

// Cache-first approach: 99%+ served from edge
Database Load: <1% of requests = €1/month + <50ms globally
```

### Cache Strategy by Content Type
```javascript
// 1-year cache for game data (admin-controlled refresh)
'Cache-Control': 'public, max-age=31536000' // Harbors, trivia

// Indefinite cache for static assets
'Cache-Control': 'public, max-age=31536000, immutable' // CSS, JS, images

// Smart caching for dynamic content  
'Cache-Control': 'public, max-age=300' // User scores, leaderboards
```

### Admin Cache Control
```javascript
// Admin can instantly refresh global cache
POST /api/cache/clear
{
  "type": "harbors", // or "trivia" or "all"
  "language": "fi"   // or "en", "sv", "all"
}
// Result: Fresh content globally in <60 seconds
```

---

## 💰 Detailed Cost Breakdown & Scaling Economics

### Phase 1: Development & Testing (€1/month)
```
Source Code (Codeberg):         €0/month (FREE forever)
Domain (Gandi or keep existing): €0-1.50/month
Frontend (Scaleway Static):     €0/month (FREE - 100GB)
API (Scaleway Functions):       €0/month (FREE - 1M requests)
Database (Supabase Cloud EU):   €0/month (FREE - 500MB)
Storage (Supabase):            €0/month (included)
CDN (BunnyCDN):               €1/month (10TB included)
──────────────────────────────────────────────
Total:                        €1-2.50/month
User Capacity:                3,000 daily active users
```

### Phase 2: Production - 100% EU Sovereign (€5-6/month)
```
Source Code (Codeberg):         €0/month (FREE forever)
Domain (EU registrar):         €1-1.50/month
Frontend (Scaleway Static):     €0/month (still FREE)
API (Scaleway Functions):       €0/month (within free tier)
Database (Hetzner VPS):        €4.15/month (CPX11)
Storage (Supabase on VPS):     €0/month (included)
CDN (BunnyCDN):               €1/month (still within 10TB)
──────────────────────────────────────────────
Total:                        €5.15-6.65/month
User Capacity:                15,000+ daily active users
```

### Phase 3: Scale (€24-101/month)
```
Source Code (Codeberg):         €0/month (FREE)
Domain (EU registrar):         €1-1.50/month
Frontend (Scaleway Static):     €0-5/month (if >100GB)
API (Scaleway Functions):       €5-15/month (paid tier)
Database (Hetzner CPX21+):     €8-30/month (larger VPS)
Storage (included in VPS):     €0/month
CDN (BunnyCDN):               €10-50/month (>10TB traffic)
──────────────────────────────────────────────
Total:                        €24-101/month
User Capacity:                100K-1M+ daily active users
```

---

## 🌍 GDPR & Jurisdiction Analysis

### 🇩🇪 Germany (Codeberg, Hetzner)
- **CLOUD Act**: ❌ No exposure
- **Data Protection**: Strict German BDSG + GDPR
- **Government**: EU member, strong privacy advocacy
- **Benefits**: Non-profit Codeberg, German privacy culture

### 🇫🇷 France (Scaleway, Gandi)
- **CLOUD Act**: ❌ No exposure
- **Data Protection**: CNIL enforcement + GDPR
- **Government**: EU member, digital sovereignty focus
- **Benefits**: French cloud sovereignty initiative

### 🇸🇮 Slovenia (BunnyCDN)
- **CLOUD Act**: ❌ No exposure
- **Data Protection**: EU member, GDPR compliant
- **Government**: Pro-privacy EU jurisdiction
- **Infrastructure**: EU-owned CDN network

### 🇪🇺 EU Frankfurt (Supabase Cloud) - Phase 1 Only
- **CLOUD Act**: ⚠️ Minimal risk (US company, EU servers)
- **Migration**: Clear path to self-hosted in Phase 2
- **Temporary**: Development phase only

### 🇨🇦 Canada (Namecheap) - Optional Migration
- **CLOUD Act**: ⚠️ Five Eyes alliance member
- **Migration**: Can move to Gandi/IONOS when ready
- **Current**: Already owned, works fine for development

---

## 🔄 Progressive Migration Strategy

### Step 1: Source Code Migration (Today)
```bash
# 1. Create Codeberg account at codeberg.org
# 2. Import existing GitHub repository
git remote add codeberg git@codeberg.org:yourusername/harborguessr.git
git push codeberg main

# 3. Update remote origin
git remote set-url origin git@codeberg.org:yourusername/harborguessr.git

# 4. Verify migration
git remote -v
```

### Step 2: Frontend Deployment (Day 2-3)
```bash
# 1. Create Scaleway account
# 2. Go to Web Hosting → Static Sites
# 3. Connect to Codeberg repository
# 4. Configure build settings:
Framework: Next.js
Build command: npm run build && npm run export  
Output directory: out/
Environment variables: Copy from current .env

# 5. Deploy automatically on git push
# 6. Custom domain: point to Scaleway nameservers
```

### Step 3: API Layer Migration (Day 3-4)
```javascript
// Scaleway Serverless Functions - simple setup:

export const handle = async (request, context) => {
  const env = {
    SUPABASE_URL: context.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: context.env.SUPABASE_ANON_KEY,
    // Your environment variables
  };
  
  // Your harbor/trivia API logic here
  return handleAPIRequest(request, env);
};

// Set cache headers for optimal performance
const response = await getHarborsFromDatabase();
return new Response(JSON.stringify(response), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=31536000', // 1 year cache
    'CDN-Cache-Control': 'max-age=31536000'
  }
});
```

### Step 4: CDN & Caching Setup (Day 4-5)
```bash
# 1. Create BunnyCDN account
# 2. Add pull zone:
#    - Origin: your-scaleway-site.static.site
#    - Cache everything for 1 year
#    - Custom SSL certificate
# 3. Configure cache rules:
#    - /api/harbors: 1 year cache
#    - /api/trivia: 1 year cache  
#    - Static assets: indefinite cache
# 4. Update DNS: point domain to BunnyCDN
```

### Step 5: Database Migration (When Ready for 100% EU)
```bash
# Phase 1: Keep Supabase Cloud EU (no changes needed)

# Phase 2: Migrate to self-hosted (when ready)
# 1. Set up Hetzner VPS (CPX11 - €4.15/month)
# 2. Install Supabase via Docker Compose:
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# Edit .env with your custom JWT secrets and passwords
docker compose up -d

# 3. Export current data:
pg_dump "$SUPABASE_CLOUD_URL" > harbor_backup.sql

# 4. Import to VPS:
docker exec -i supabase-db psql -U postgres < harbor_backup.sql

# 5. Update only environment variables:
NEXT_PUBLIC_SUPABASE_URL=https://your-vps-domain.com:8000
# All existing code works unchanged!
```

### Step 6: EU Domain Migration (Optional)
```bash
# Current: Keep Namecheap (works fine)
# Future: Migrate to EU registrar

# 1. Choose: Gandi (🇫🇷) or IONOS (🇩🇪)
# 2. Transfer domain or register new EU domain
# 3. Update DNS to point to BunnyCDN
# 4. Full EU sovereignty achieved!
```

---

## 🚀 Performance & Scaling Expectations

### Response Times (Global, 99th percentile)
- **Cached harbor/trivia data**: 10-30ms (BunnyCDN edge)
- **Static assets (CSS/JS/images)**: 5-20ms (BunnyCDN edge)
- **Fresh API calls**: 50-150ms (Scaleway Functions)
- **Database queries**: 1-20ms (same region as functions)

### Cache Hit Rates by Content Type
- **Harbor/trivia game data**: >99% (1-year cache)
- **Static assets**: >98% (indefinite cache)
- **User-specific data**: >90% (smart TTL)
- **Admin dashboard**: No cache (always fresh)

### Scaling Triggers & Actions
```yaml
Phase 1 → Phase 2 Triggers:
- Database approaching 400MB (80% of 500MB)
- Monthly users approaching 40K (80% of 50K)
- Want 100% EU sovereignty for compliance
- Need more database control

Phase 2 → Phase 3 Triggers:
- VPS CPU consistently >80%
- Monthly CDN traffic >8TB (80% of 10TB free)
- Need high availability (multiple regions)
- Enterprise compliance requirements

Automatic Scaling:
✅ Scaleway Functions: Auto-scale with traffic
✅ BunnyCDN: Automatic global distribution
✅ Scaleway Static: Unlimited bandwidth
🔧 Hetzner VPS: Manual upgrade (larger instances)
```

---

## 🔒 Security & GDPR Compliance

### GDPR-Native Architecture
```yaml
Data Minimization:
- Only collect necessary user data
- Anonymous gameplay by default
- Optional account creation

Purpose Limitation:
- Clear data use cases documented
- No data selling or sharing
- Game analytics only

Storage Limitation:
- Automatic data expiry policies
- User-controlled data retention
- Regular cleanup procedures

User Rights (Article 15-22):
- Data export via Supabase API
- Account deletion with cascade
- Data modification through dashboard
- Consent withdrawal mechanisms
```

### Security Implementation
```javascript
// Multi-layer admin authentication
const verifyAdminAccess = async (request) => {
  // 1. JWT token verification
  const token = extractJWT(request);
  const user = await verifySupabaseToken(token);
  
  // 2. User ID validation
  if (user.id !== request.userId) throw new Error('Invalid user');
  
  // 3. Admin role check
  if (user.user_metadata?.role !== 'admin') {
    throw new Error('Insufficient privileges');
  }
  
  // 4. Audit logging
  await logAdminAction(user.id, request.action, request.ip);
  
  return user;
};

// Rate limiting at edge (BunnyCDN)
const rateLimitConfig = {
  adminEndpoints: '10 requests per minute',
  gameAPI: '100 requests per minute',
  staticAssets: 'unlimited (cached)'
};
```

### Compliance Certifications
- ✅ **GDPR**: All providers EU-compliant
- ✅ **ISO 27001**: Hetzner, Scaleway certified
- ✅ **SOC 2**: BunnyCDN certified  
- ✅ **Data residency**: Guaranteed EU-only in Phase 2
- ✅ **Privacy by design**: Built-in from architecture level

---

## 🛠️ Development Workflow & CI/CD

### Perfect EU-Native Pipeline
```
Developer → Codeberg → Scaleway → BunnyCDN → Global Users
    ↓         ↓         ↓          ↓
   Code   Auto-build  Deploy   Accelerate
 (<1min)   (<2min)   (<1min)   (instant)
```

### Daily Development Flow
```bash
# 1. Local development
npm run dev                    # Test locally
git add .
git commit -m "Add Turku harbor with winter accessibility info"
git push origin main

# 2. Automatic deployment pipeline
# Codeberg receives push → triggers webhook
# Scaleway detects changes → builds Next.js export  
# Deployment completes → BunnyCDN syncs changes
# Users see updates globally in <5 minutes

# 3. Admin content updates
# Admin adds harbor via dashboard
# Scaleway Function updates database
# Function calls BunnyCDN purge API
# Next request rebuilds cache from database
# Fresh content globally in <60 seconds
```

### Environment Configuration
```bash
# .env.local (same across all phases)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://your-function.scw.cloud  
NEXT_PUBLIC_CDN_URL=https://your-cdn.b-cdn.net

# Only URL changes during migrations - same code!
```

---

## 📊 Monitoring & Analytics

### Performance Monitoring Stack
```yaml
BunnyCDN Analytics:
- Cache hit ratios by content type
- Global response times by region
- Bandwidth usage and costs
- Purge frequency and timing

Scaleway Metrics:
- Function execution count/duration
- Error rates and types
- Memory usage patterns
- Auto-scaling events

Hetzner Monitoring:
- VPS CPU, memory, disk usage
- Network traffic patterns
- Database connection pools
- Backup completion status

Supabase Dashboard:
- Database query performance
- Auth events and failures
- Real-time connection count
- Storage usage growth
```

### Key Performance Indicators
```yaml
Technical KPIs:
- Cache hit rate: >99% (target)
- Global response time: <50ms 95th percentile
- Database connections: <40 concurrent
- Error rate: <0.1% across all services
- Uptime: >99.9% (measured by BunnyCDN)

Business KPIs:
- Daily active users growth
- Geographic distribution
- Session duration trends
- Admin content creation rate
- Infrastructure cost per user

Scaling KPIs:
- Database size growth rate
- CDN bandwidth trends
- Function execution growth
- VPS resource utilization
```

---

## 🎉 Success Criteria & Benefits

### Technical Achievements
- ✅ **Sub-50ms** response times globally via 260+ edge locations
- ✅ **99%+ cache hit rate** reducing database load to <1%
- ✅ **Zero vendor lock-in** - can migrate to any provider
- ✅ **Same codebase** from development to millions of users
- ✅ **Progressive enhancement** - start simple, scale smart

### Business Benefits
- ✅ **Predictable costs** - €1 → €6 → €24-101/month scaling path
- ✅ **EU compliance ready** for B2B customers
- ✅ **Competitive advantage** through EU sovereignty
- ✅ **Developer productivity** - familiar tools and workflows

### Compliance & Privacy
- ✅ **GDPR audit ready** from day one
- ✅ **Zero CLOUD Act exposure** in production
- ✅ **Data sovereignty** with EU-only infrastructure
- ✅ **Privacy by design** architecture

---

## 🎯 The Bottom Line

**Build a globally-distributed, cache-first infrastructure for €1-6/month with:**

- 🇪🇺 **100% EU sovereignty** in production (Phase 2)
- ⚡ **<50ms global performance** via aggressive edge caching
- 📈 **99%+ cache hit rate** keeping database load minimal
- 💰 **Predictable scaling**: €1 → €6 → €24-101/month path
- 🛡️ **GDPR compliance** by design with EU data residency
- ⚙️ **Same codebase** from development to millions of users
- 🔧 **Zero vendor lock-in** - migrate anywhere, anytime
- 🚀 **Supabase everywhere** - keep your existing API and auth

**Start building your EU-sovereign infrastructure today!** 🌍⚡🔒

*The future of web development is European, edge-first, and privacy-focused. This architecture puts you ahead of the curve while keeping costs minimal and performance maximal.*