# Finnish Harbor Guesser

An interactive game to learn about Finnish harbors and marinas. Built to demonstrate how to create scalable infrastructure that can handle millions of users cost-efficiently.

## The Challenge

Most developers build apps that work fine with 100 users but collapse or become expensive at scale. This project shows the actual implementation of scaling from zero to millions of users for under $10/month.

## 🎮 Features

- **Harbor Location Game**: Find Finnish harbors on a map using hints
- **Harbor Trivia Game**: Test your knowledge about Finnish harbors
- **Multilingual support** (English, Finnish, Swedish)
- **User authentication** with Supabase
- **Responsive design** for mobile and desktop
- **Reduced database writes** with localStorage batching
- **Personalized user experiences** with smart randomization
- **Admin dashboard** for content management (first user gets admin rights)

## 📈 Scaling Strategy

This project demonstrates a **3-phase scaling approach**:

### Phase 1: Built for scale from day one (0-100K users) - $0/month
- **Database**: Supabase (free tier)
- **Frontend**: Cloudflare Pages (free)
- **Authentication**: Supabase Auth (free)
- **Caching**: Cloudflare Workers + KV (free tier)
- **Storage**: Cloudflare R2 for images (free tier)
- **Architecture**: Ready to handle viral traffic spikes

### Phase 2: Enhanced features (100K-1M users) - ~$5/month
- **Advanced Analytics**: Custom metrics and monitoring
- **Premium Features**: Enhanced Cloudflare capabilities
- **Scaling**: When free tiers are exceeded

### Phase 3: Self-hosting option (1M+ users) - ~$10/month
- **Self-hosted Database**: Supabase on Hetzner/Linode VPS
- **Full Control**: Ultimate cost optimization and customization
- **Performance**: Dedicated resources for peak performance

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Caching**: Cloudflare Workers + KV
- **Storage**: Cloudflare R2
- **Maps**: Leaflet.js
- **Deployment**: Cloudflare Pages

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_WORKER_URL=your_cloudflare_worker_url
   ```

4. **Set up the database:**
   - Run `database-schema.sql` in your Supabase SQL editor
   - First registered user automatically gets admin rights

5. **Deploy Cloudflare Worker:**
   - Copy `worker.js` to Cloudflare Workers
   - Create KV namespace called `HARBOR_CACHE`
   - Add Supabase credentials to Worker environment

6. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🗄 Database Setup

Run the provided `database-schema.sql` in your Supabase SQL editor to create:

- `harbors` table with multilingual support
- `trivia_questions` table with randomization logic
- `game_scores` table supporting both authenticated and anonymous users
- `harbor_guesses` and `trivia_answers` for detailed analytics
- Optimized indexes for performance
- Row Level Security policies

## 🌍 Multilingual Support

The application supports three languages with complete localization:

- **English (en)**
- **Finnish (fi)** - Default
- **Swedish (sv)**

Users can switch languages using the header selector, with preferences stored in user metadata.

## 📊 Performance Optimizations

### Caching Strategy
- Static game data cached at Cloudflare edge for 24 hours
- User data stays real-time in database  
- Images served from global CDN
- localStorage batching reduces database writes by 90%

### Database Optimization
- Smart indexing for fast queries
- View count randomization for unique experiences
- Batch operations instead of individual writes
- Connection pooling and query optimization

## 🏗 Project Structure

```
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── contexts/            # React context providers (auth, language)
├── lib/                 # Utility functions and data access
├── public/              # Static assets
├── scripts/             # Database migration and utility scripts
├── supabase/            # Database schema and migrations
├── worker.js            # Cloudflare Worker for caching
└── docs/                # Architecture documentation
```

## 💡 Key Decisions

### Why This Stack?

- **Supabase**: Great free tier, handles auth well, can self-host later
- **Cloudflare**: Excellent edge network with generous free limits  
- **Next.js**: Fast, modern, good developer experience
- **PostgreSQL**: Reliable, handles JSON data, scales well

### Trade-offs Made

- Personalization vs caching: Some database calls needed for unique user experiences
- Consistency vs speed: View counts update eventually, not immediately
- Complexity vs cost: Added caching only when free tiers were exceeded

## 🤝 Contributing

This project serves as a reference implementation for scalable game architecture. Contributions are welcome, especially:

- Performance optimizations
- Additional language support
- Mobile experience improvements
- Documentation enhancements

## 📄 License

MIT License - feel free to use this as a reference for your own projects!

---

## 📚 Learning Resources

This project demonstrates practical solutions for:

- **Scaling web applications** from prototype to production
- **Cost-effective architecture** for viral applications
- **Edge computing** and caching strategies
- **Progressive enhancement** techniques
- **Real-world performance optimization**

Perfect for developers looking to understand how to build applications that can handle millions of users without breaking the bank.