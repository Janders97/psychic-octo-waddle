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

## Live data flow
- Google Form responses land in the Sheet
- Apps Script scores them every minute
- The website reads the live data feed every minute

## Notes
- The participant picks tab is private by default
- Remove or change `PICKS_PUBLIC` in `app.js` only when you are ready
- The site does not use sample data; it waits for the live sheet feed
