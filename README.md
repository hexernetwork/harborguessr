# Finnish Harbor Guesser

An interactive game to learn about Finnish harbors and marinas.

## Features

- Harbor Location Game: Find Finnish harbors on a map
- Harbor Trivia Game: Test your knowledge about Finnish harbors
- Multilingual support (English, Finnish, Swedish)
- User authentication with Supabase
- Responsive design for mobile and desktop

## Setup

1. Install dependencies:

```
   npm install
```

2. Create a `.env.local` file with your Supabase credentials:
```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```
   npm run build
   npm run dev
```

## Migrating Data to Supabase

Run database-schema.sql in the Supabase SQL editor, figure out how to migrate data from language files i.e. `findata.js` and `fintrivia.js`. 

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

MIT Licence 
