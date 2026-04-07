# VTS Prototype

A Vite + React front-end prototype for a Vessel Traffic Service (VTS) interface. The app includes a Leaflet-based traffic map, vessel intent cards, alert panels, anchorage management views, and playback-focused operator workflows.

## Tech Stack

- Vite 6
- React 19
- TypeScript
- Tailwind CSS 4
- Leaflet + React Leaflet

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

### Preview the production build locally

```bash
npm run build
npm run preview
```

The preview server runs on [http://localhost:4173](http://localhost:4173).

## Available Scripts

- `npm run dev` starts the Vite dev server on port `3000`
- `npm run build` creates the production bundle in `dist/`
- `npm run preview` serves the built app locally on port `4173`
- `npm run lint` runs TypeScript type-checking
- `npm run clean` removes the `dist/` directory

## Environment Variables

No environment variables are required for the current front-end demo.

If you add runtime configuration later:

- Use Vite-prefixed variables such as `VITE_API_BASE_URL`
- Put local values in `.env.local`
- Configure the same keys in Vercel Project Settings before deploying

See [.env.example](/Applications/VTS/VTS-Prototype/.env.example) for the expected format.

## Deploy to Vercel

This project is ready to import directly into Vercel as a static Vite app.

### Recommended Vercel settings

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

### Import flow

1. Push this repository to GitHub.
2. In Vercel, choose `Add New Project`.
3. Import the GitHub repository.
4. Confirm the detected settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add any future `VITE_` environment variables if the app starts using them.
6. Deploy.

## Deployment Notes

- A checked-in [vercel.json](/Applications/VTS/VTS-Prototype/vercel.json) is included to make the build command and output directory explicit.
- The current app does not expose secrets to the client bundle.
- `.vercel/` is ignored so local project-link metadata will not be committed.
