# iss-fe

ISS frontend — Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.

This is a skeleton: the `create-next-app` scaffold plus a home page that checks
whether the [iss-be](https://github.com/tygbspartan/iss-backend) backend is
reachable. No routing, state management or UI library beyond Tailwind yet.

## Requirements

- Node.js 20+
- The `iss-be` backend running (for the status check to pass)

## Setup

```bash
npm install
cp .env.example .env.local   # defaults to http://localhost:5000
```

## Running

```bash
npm run dev     # http://localhost:3000
npm run build
npm start
npm run lint
```

## Backend connection

The home page renders [ApiStatus](src/components/ApiStatus.tsx), which fetches
`NEXT_PUBLIC_API_URL/api/health` **from the browser**. That's deliberate — a
browser-side call also catches a wrong API URL, a backend that isn't running,
and CORS rejecting this origin, none of which a server-side fetch would reveal.

If it shows **Unreachable**, check in this order:

1. `iss-be` is running — `npm run dev` in that repo, listening on port 5000.
2. `NEXT_PUBLIC_API_URL` in `.env.local` matches that port. Next only reads
   env files at startup, so restart `npm run dev` after changing it.
3. `CLIENT_URL` in the backend's `.env` is `http://localhost:3000`, or its CORS
   layer will reject this origin.

Delete `ApiStatus` once there are real features to talk to.

## Layout

```
src/
  app/
    layout.tsx       Root layout — fonts, metadata
    page.tsx         Home page
    globals.css      Tailwind import + theme tokens
  components/
    ApiStatus.tsx    Backend health indicator (temporary)
```

`@/*` is aliased to `src/*`.

## A note on AGENTS.md

`next dev` writes and re-adds the rules block in [AGENTS.md](AGENTS.md) itself;
it's committed so the working tree stays clean. Leave it in place.
