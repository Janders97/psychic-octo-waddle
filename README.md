# World Cup 2026 Pool

A tiny prediction pool: friends rank each group 1st–4th, the site shows live
group standings, everyone's predictions, and a scored leaderboard.

## Files
- `index.html`, `styles.css`, `app.js` — the website (host on GitHub Pages)
- `called.gs` — the Apps Script backend (web app)

## How it works (the simple version)
- A 5-minute trigger runs `updateStandings()`, which asks ESPN for every
  group-stage day and **rebuilds the whole standings table from scratch**.
  Nothing is stored between runs, so the table can't drift into stale zeros.
- `doGet()` reads that table, reads the form responses, scores each prediction
  live, and returns one JSON object the website renders.

## Apps Script setup
1. Paste `called.gs` into your Apps Script project.
2. Check `SPREADSHEET_ID` at the top matches your sheet.
3. Run `setup()` once  → creates the sheets and installs the trigger.
4. Run `updateStandings()` once → fills standings now (don't wait 5 minutes).
5. Deploy → New deployment → **Web app** → execute as you, access "Anyone".
6. Copy the `/exec` URL.

## Website setup
1. Put the `/exec` URL into `app.js` as `WEB_APP_URL`.
2. Commit `index.html`, `styles.css`, `app.js` to your GitHub Pages repo.

## Form requirements
- A column named exactly **`Leaderboard Name`**.
- Group columns named **`Group A [Mexico]`**, **`Group B [Canada]`**, etc.,
  with values `1st` / `2nd` / `3rd` / `4th`.

## Settings
- The `Settings` sheet: cell **B1 = TRUE** shows predictions publicly,
  **FALSE** hides them.

## Scoring
- Exact place 4 · off by 1 = 2 · off by 2 = 1 · perfect group order +4 bonus.
- 20 points max per group; a group is only scored once it has kicked off.

## Checking it works
- Run `diag()` in the editor: it prints how many completed matches were found
  and each group's points. If a team ever fails to match, add it to the alias
  map in `norm_()`.
