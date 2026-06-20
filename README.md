# dB — Decibel Meter 🔊

A sleek, installable **PWA** that measures sound level from your device
microphone. The gauge sits **green** while you're under your limit and turns
**red** the moment it's exceeded. Run a **session** to track the average,
peak, and duration — everything is saved right on your device, no account
needed.

- **Stack:** Vite + React + TypeScript, Tailwind CSS, `vite-plugin-pwa`
- **Storage:** the browser's `localStorage` (no backend, no login)
- **Deploy:** any static host (Vercel, Netlify, GitHub Pages…)

---

## How it works

- **Live meter** — tap **Start session** and the gauge shows the current level
  in dB. Green when you're comfortably under your limit, amber as you approach
  it, red once you hit or exceed it.
- **Sessions** — while a session runs it tracks the running **average**,
  **peak**, and **elapsed time**. Tap **End session** to save a summary.
- **History** — past sessions are listed with their average, peak, length, and
  date. Saved locally; clear them anytime in Settings.
- **Settings** — set the **red-above** threshold and a **calibration** offset.

### A note on accuracy
Browsers only expose loudness relative to digital full scale (dBFS), and phone
mics aren't calibrated instruments — so the readout is an **approximation**, not
a lab-grade SPL measurement. The **Calibration** slider lets you nudge readings
to line up with a known reference (or a real sound-level meter) in a steady
sound.

---

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Microphone access requires a **secure context** — `localhost` counts, and so
does any HTTPS deploy. Other scripts:

```bash
npm run build    # typecheck + production build to dist/
npm run preview  # preview the production build
```

---

## Get it on GitHub

This project isn't tied to any particular GitHub repo yet. To put it on yours:

1. Create a **new, empty** repo on GitHub (no README/.gitignore — this project
   already has them). Name it whatever you like, e.g. `db`.
2. From this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: dB decibel meter PWA"
   git branch -M main
   git remote add origin https://github.com/<you>/db.git
   git push -u origin main
   ```

---

## Deploy (free, ~2 minutes)

**Vercel** (recommended): import the GitHub repo at
[vercel.com/new](https://vercel.com/new). It auto-detects Vite (build → `dist/`).
No environment variables needed. Once live (HTTPS), open it on your phone and
**Add to Home Screen** to install the PWA.

Any static host works the same way — point it at `npm run build` / `dist/`.

---

## Project structure

```
index.html
public/icon.svg              App icon (swap in your own anytime)
src/
  main.tsx                   Entry point + service-worker registration
  App.tsx                    Screens: meter + history, session logic
  hooks/useDecibelMeter.ts   Mic capture → smoothed dB stream
  components/
    Gauge.tsx                Circular level gauge (green → amber → red)
    SettingsSheet.tsx        Threshold + calibration controls
    icons.tsx                Inline SVG icons
  lib/
    levels.ts                Colour zones, ranges, formatting
    storage.ts               localStorage load/save
    types.ts                 Settings + Session shapes
```

## Customising

- **Threshold default / colours:** `src/lib/levels.ts` and `src/lib/storage.ts`
  (`DEFAULT_SETTINGS`).
- **App icon:** replace `public/icon.svg`. For the best iOS home-screen look,
  add a 180×180 PNG and point `apple-touch-icon` in `index.html` at it.
