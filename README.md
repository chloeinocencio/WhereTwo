# WhereTwo

Plan trips together. WhereTwo builds an AI day-by-day itinerary (Google Gemini) around where
you're staying, and lets you invite the people you travel with.

- **Web app:** React + Vite in `src/`, deployed to GitHub Pages
- **iPhone app:** SwiftUI in `ios/`, with a Home Screen widget and Live Activity (see `ios/README.md`)
- **Backend:** Supabase auth + an edge function in `supabase/functions/server` that both apps call

## Web app

```sh
npm install
npm run dev       # local dev server
npm run deploy    # build and publish to GitHub Pages
```

Supabase settings for the client are in `src/lib/supabase.ts`. The Gemini, Resend and
service-role keys are set as secrets on the edge function, never in the client.

Privacy policy: `public/privacy.html`, served at `/WhereTwo/privacy.html`.
