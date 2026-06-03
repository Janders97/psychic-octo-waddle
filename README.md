# World Cup 2026 Pool

## Files
- `index.html`
- `styles.css`
- `app.js`
- `called.gs`

## What to do
1. Replace `called.gs` in Google Apps Script with the file in this package.
2. Replace the files in your GitHub Pages repo with `index.html`, `styles.css`, and `app.js`.
3. In `called.gs`, replace `SPREADSHEET_ID` with your Google Sheet ID.
4. Run `setupSheets()` once.
5. Run `updateEverything()` once.
6. Run `installMinuteTrigger()` once.
7. Deploy the Apps Script as a web app and keep the `/exec` URL in `app.js`.

## Notes
- Group scoring is the Option A version: exact = 4, off by 1 = 2, off by 2 = 1, perfect bonus = 4.
- A group only scores once every team in that group has played at least one match.
- Picks are public by default in `app.js` with `PICKS_PUBLIC = true`.
- The site updates every minute.
