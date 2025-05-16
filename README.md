# Finnish Harbor Guesser

A multilingual interactive game that tests your knowledge of Finnish harbors through location guessing and trivia challenges.

## Overview

Finnish Harbor Guesser is an educational game designed to help players learn about Finland's rich maritime geography, featuring both coastal archipelago harbors and inland lake marinas. The game offers two modes:

1. **Harbor Location Game**: Find Finnish harbors on a map using progressive hints
2. **Harbor Trivia**: Test your knowledge with trivia questions about Finnish harbors

The application supports three languages: English, Finnish, and Swedish.

## Features

- Interactive map-based harbor location guessing
- Multilingual support (English, Finnish, Swedish)
- Trivia questions about Finnish harbors
- Progressive hint system
- Scoring based on performance
- Supabase integration for data storage
- Responsive design for desktop and mobile

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for database functionality)

### Setup

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/finnish-harbor-guesser.git
   cd finnish-harbor-guesser
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install --legacy-peer-deps
   \`\`\`
   
   Note: The `--legacy-peer-deps` flag is used to resolve dependency conflicts between date-fns and react-day-picker.

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`

   Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase project URL and anonymous key.

## Supabase Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)

2. Create the following tables in your Supabase database:

   **harbors**
   \`\`\`sql
   CREATE TABLE harbors (
     id INTEGER NOT NULL,
     name TEXT NOT NULL,
     coordinates JSONB NOT NULL,
     region TEXT NOT NULL,
     type TEXT[] NOT NULL,
     notable_feature TEXT NOT NULL,
     description TEXT NOT NULL,
     language TEXT NOT NULL,
     PRIMARY KEY (id, language)
   );
   \`\`\`

   **harbor_hints**
   \`\`\`sql
   CREATE TABLE harbor_hints (
     harbor_id INTEGER NOT NULL,
     hint_order INTEGER NOT NULL,
     hint_text TEXT NOT NULL,
     language TEXT NOT NULL,
     PRIMARY KEY (harbor_id, hint_order, language),
     FOREIGN KEY (harbor_id, language) REFERENCES harbors (id, language)
   );
   \`\`\`

   **trivia_questions**
   \`\`\`sql
   CREATE TABLE trivia_questions (
     id INTEGER NOT NULL,
     question TEXT NOT NULL,
     answers TEXT[] NOT NULL,
     correct_answer INTEGER NOT NULL,
     explanation TEXT NOT NULL,
     language TEXT NOT NULL,
     PRIMARY KEY (id, language)
   );
   \`\`\`

3. Set up Row Level Security (RLS) policies for your tables if needed.

## Running the Project

### Development Mode

\`\`\`bash
npm run dev
\`\`\`

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Production Build

\`\`\`bash
npm run build
npm start
\`\`\`

## Database Initialization

The first time you run the application, it will attempt to seed the Supabase database with harbor and trivia data. You can also manually trigger this process by calling the `seedDatabase()` function from `lib/data.js`.

If Supabase credentials are not available or there's an error connecting to the database, the application will fall back to using local data.

## Project Structure

\`\`\`
finnish-harbor-guesser/
├── app/                  # Next.js app directory
│   ├── about/            # About page
│   ├── how-to-play/      # How to play page
│   ├── location-game/    # Harbor location game
│   ├── trivia-game/      # Harbor trivia game
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── db-initializer.tsx # Database initialization component
│   ├── hint-panel.tsx    # Hint panel component
│   ├── language-selector.tsx # Language selector component
│   ├── map-component.tsx # Map component
│   ├── score-display.tsx # Score display component
│   ├── theme-provider.tsx # Theme provider component
│   └── ui/               # UI components
├── lib/                  # Utility functions
│   ├── data.js           # Data and database functions
│   ├── db-utils.js       # Database utility functions
│   └── utils.ts          # General utility functions
├── public/               # Static assets
├── .env.local            # Environment variables (create this file)
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies
├── README.md             # Project documentation
└── tsconfig.json         # TypeScript configuration
\`\`\`

## Troubleshooting

### Dependency Conflicts

If you encounter dependency conflicts during installation, try one of these approaches:

1. Use the `--legacy-peer-deps` flag:
   \`\`\`bash
   npm install --legacy-peer-deps
   \`\`\`

2. Downgrade date-fns to a compatible version:
   \`\`\`bash
   npm install date-fns@3.0.0
   \`\`\`

### Database Connection Issues

If you're having trouble connecting to Supabase:

1. Verify that your `.env.local` file contains the correct credentials
2. Check that your Supabase project is active
3. Ensure that your database tables are set up correctly
4. Check the browser console for specific error messages

The application will fall back to local data if it can't connect to Supabase.

## Language Support

The application supports three languages:

- English (default)
- Finnish
- Swedish

Users can switch languages using the language selector in the top right corner of the application.

## Credits

- Map data: OpenStreetMap
- Icons: Lucide React
- UI Components: shadcn/ui
- Framework: Next.js
- Database: Supabase

## License

[MIT License](LICENSE)

