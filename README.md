# World Cup 2026 Pool

## Files
- `index.html`
- `styles.css`
- `app.js`
- `called.gs`

## What this version does
- pulls the current standings from FIFA's official standings page
- shows the groups on the website even before matches are played
- scores the group stage only when all four teams in a group have played at least one match
- shows submitted predictions using the `Leaderboard Name` field
- updates every minute

## Apps Script setup
1. Paste `called.gs` into your Apps Script project.
2. Replace `PASTE_YOUR_SHEET_ID_HERE` with your Google Sheet ID.
3. Run `setupSheets()` once.
4. Run `updateEverything()` once.
5. Run `installMinuteTrigger()` once.
6. Deploy the script as a web app.
7. Paste the web app `/exec` URL into `app.js` if it changes.

## Website setup
- Replace the files in your GitHub Pages repository with the `index.html`, `styles.css`, and `app.js` here.
- Make sure `WEB_APP_URL` points to your deployed Apps Script web app.
- Keep `PICKS_PUBLIC = true` to show submitted predictions.

## Notes
- The site uses the live FIFA standings feed instead of simulated data.
- If FIFA changes the page format, the standings parser may need a small update.
