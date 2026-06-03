# World Cup 2026 Pool

## Website files
- `index.html`
- `styles.css`
- `app.js`

## Apps Script file
- `called.gs`

## What to change

1. Open `app.js`
2. Paste your Apps Script web app URL into `WEB_APP_URL`
3. Paste your Google Sheet URL into `ENTRY_SHEET_URL`
4. Set `PICKS_PUBLIC = true` to show participant picks, or `false` to hide them

## Live data flow
- Google Form responses land in the Sheet
- Apps Script updates the leaderboard every minute
- The website reads the live data feed every minute

## Notes
- The participant picks tab can be toggled public/private in `app.js`
- The site is built for live sheet data only; no sample leaderboard data is embedded
- The bank details section has been removed from the site
