# Watershed — the app

Nine screens, no build step, no dependencies. Open `index.html` through any
static server and it runs.

## Running it locally

    cd app && python3 -m http.server 8000

Then open <http://localhost:8000>. A plain `file://` open works too, but the
service worker will not register, so you lose the offline behaviour.

## Installing it on a phone

Open the published URL in Chrome or Safari and choose *Add to Home Screen*. It
installs as a standalone app with its own icon and works with no network.

## Where the data lives

`localStorage`, on that device, under the key `watershed.v1`. It never leaves
the phone: there is no account, no sync and no server. Clearing site data
clears the record.

## Two query strings, for testing only

- `?demo` — opens a throwaway year of made-up blocks under a separate key
  (`watershed.demo.v1`), so the year and week views have something in them.
  Nothing it writes touches your real record.
- `?reset` — clears the current key and reloads. Destructive, and deliberately
  not in the UI.

## The files

| File | What it is |
| --- | --- |
| `index.html` | The shell. One `<main>`, everything else is rendered. |
| `app.js` | State, storage, the nine screens, and the event delegation. |
| `styles.css` | Tokyo Night tokens and the layout. |
| `sw.js` | Service worker: cache-first shell so it opens offline. |
| `manifest.webmanifest` | Name, icons, standalone display. |
| `icons/` | `icon.svg` and `icon-maskable.svg` are the sources; the PNGs are generated with `rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png`. |
