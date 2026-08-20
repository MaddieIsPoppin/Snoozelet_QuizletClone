# Snoozelet Stable Local Edition

This branch is the laptop-first edition of Snoozelet. It deliberately uses one database only:

`data/study.sqlite`

Turso and Netlify environment variables are ignored. Cloud and phone synchronization are paused, and no cloud copy can replace the local database.

## Start on Windows

Double-click `Start Snoozelet.bat`. It checks the release, builds the current source when necessary, starts the server in a hidden window, and opens <http://localhost:3000>.

From PowerShell, the equivalent commands are:

```powershell
cd C:\Snoozelet\Snoozelet_inside
npm.cmd install
npm.cmd run build
npm.cmd start
```

## Data protection

- The live database is `data/study.sqlite`.
- A compact automatic snapshot is created in `data/backups` on the first startup each day.
- Every launch checks SQLite integrity. If the live file is damaged, Snoozelet preserves it and restores the newest valid automatic snapshot.
- Progress → Backup can download an exact SQLite copy and a portable JSON export.
- Diagnostics displays the exact active database path.
- Never run `npm.cmd run db:reset` unless you intentionally want to replace your study data with samples.

The preserved mobile code is on the `mobile-paused` branch. Do not merge it into this branch until mobile synchronization is intentionally redesigned.
