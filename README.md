# Finnish Harbor Guesser

An interactive game to learn about Finnish harbors and marinas.

## Features

- Harbor Location Game: Find Finnish harbors on a map
- Harbor Trivia Game: Test your knowledge about Finnish harbors
- Multilingual support (English, Finnish, Swedish)
- User authentication with Supabase
- Responsive design for mobile and desktop

## Setup

1. Clone the repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Create a `.env.local` file with your Supabase credentials:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   \`\`\`

4. Run the development server:
   \`\`\`
   npm run dev
   \`\`\`

## Migrating Data to Supabase

Before running the migration, make sure you have created the necessary tables in your Supabase database. You can use the SQL migration files in the `supabase/migrations` directory.

1. Run the SQL migrations in the Supabase SQL editor:
   - First run `20240514_initial_schema.sql`
   - Then run `20240514_multilingual_schema.sql`

2. Install dotenv for the migration script:
   \`\`\`
   npm install dotenv
   \`\`\`

3. Run the migration script:
   \`\`\`
   node scripts/migrate-to-supabase.js
   \`\`\`

This will migrate all harbor and trivia data from the local data files to your Supabase database.

## Multilingual Support

The application supports three languages:
- English (en)
- Finnish (fi) - Default
- Swedish (sv)

Users can switch between languages using the language selector in the header.

## Project Structure

- `app/`: Next.js app router pages
- `components/`: React components
- `contexts/`: React context providers
- `lib/`: Utility functions and data
- `public/`: Static assets
- `scripts/`: Utility scripts
- `supabase/`: Supabase-related files

## License

MIT
