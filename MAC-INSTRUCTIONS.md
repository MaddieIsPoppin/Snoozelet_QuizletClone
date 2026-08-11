# Snoozelet for macOS

This package is designed to run locally on an Intel Mac, including a 2017
MacBook Air. Study data is stored only in this folder.

## First-time setup

1. Install the current Node.js LTS **macOS Intel (x64) Installer** from
   <https://nodejs.org/en/download>.
2. Extract the Snoozelet ZIP.
3. Open Terminal, type `cd ` (including the space), drag the extracted
   Snoozelet folder into Terminal, and press Return.
4. Run this command once:

   ```bash
   chmod +x "Start Snoozelet.command"
   ```

5. Double-click `Start Snoozelet.command` in Finder. The first launch installs
   the app's dependencies and creates its local database, so it requires an
   internet connection and may take a few minutes.

After setup, Snoozelet opens at <http://localhost:3000>. Keep the Terminal
window open while using it. Press Control-C in that window to stop the app.

Seeded login:

```text
username: owner
password: password123
```

If macOS blocks the launcher, Control-click it, choose **Open**, then confirm
**Open**. Alternatively, run it from Terminal:

```bash
./Start\ Snoozelet.command
```

## Backups

The local database is `data/study.sqlite`. Quit Snoozelet before copying this
file for backup. Do not run `npm run db:reset` unless you intend to erase the
local study data and restore the sample data.
