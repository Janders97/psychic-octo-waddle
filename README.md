# World Cup 2026 Pool site

## What to edit first

1. Open `app.js`
2. Paste your Apps Script web app URL into `WEB_APP_URL`
3. Paste your Google Sheet URL into `ENTRY_SHEET_URL`

## Files

- `index.html` – the page layout
- `styles.css` – the styling
- `app.js` – live data feed and page logic

## What the site expects from Apps Script

The web app should return rows with fields like:

- `Leaderboard Name`
- `Points Won`
- `Points Possible`
- `Points Remaining`
- `Perfect Groups`
- `Excellent Groups`
- `Good Groups`

## How refresh works

The page asks for fresh leaderboard data every minute.
