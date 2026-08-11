# Snoozelet for Android

Snoozelet is delivered to Android as an installable Progressive Web App. The
installed app and desktop website use the same account and hosted database, so
decks and progress remain synchronized without maintaining a separate Android
codebase.

## What is already handled by the app

- Android home-screen installation and standalone display
- Adaptive Android launcher icons and safe-area layout
- Connection and pending-sync indicators
- Offline queueing for study answers
- Automatic replay through server-authoritative grading after reconnecting
- Duplicate-attempt protection during synchronization

## Hosted synchronization setup

The deployed app needs one persistent Turso/libSQL database. Configure these
values in Netlify for both builds and runtime functions:

```text
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-token
```

If card image uploads are required, also configure the three Cloudinary values
documented in `README.md`. Never commit tokens to Git.

## Install on Android

1. Open the deployed HTTPS URL in Chrome on Android.
2. Sign in with the same Snoozelet account used on desktop.
3. Tap **Install app** inside Snoozelet. If Chrome does not show it, open the
   Chrome menu and choose **Install app** or **Add to Home screen**.
4. Launch Snoozelet from the new home-screen icon.

Study answers made during a connection interruption remain on that device. A
status pill reports the number waiting, and Snoozelet syncs them in order after
the device reconnects. Keep the app installed and do not clear Chrome site data
while answers are waiting to sync.

## Local production check

The install prompt and service worker only run in a production build:

```bash
npm install
npm run build
npm run start
```

Open `http://localhost:3000`. Installation on a physical Android phone requires
an HTTPS deployment or a secure local-development tunnel.

## Current offline boundary

Interrupted study answers are queue-safe. Opening uncached pages and changing
deck content still require a connection. Online deck changes synchronize
immediately because Android and desktop use the same hosted database.
