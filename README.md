# World Cup Pool Site

This folder is a drop-in static website for GitHub Pages.

## Files
- `index.html` - main page
- `styles.css` - styling
- `data.js` - fallback/sample content and Google Sheet URL placeholder
- `app.js` - renders the page and loads live data if configured
- `google-apps-script.gs` - optional Apps Script file for pulling from Google Sheets

## How to use the GitHub site
1. Upload these files to your repo root.
2. Open `data.js`.
3. Paste your Google Apps Script web app URL into `window.POOL_CONFIG.dataUrl`.
4. Commit changes.
5. In GitHub Pages, deploy from branch `main`, folder `/ (root)`.

## How to connect Google Sheets
Create these sheet tabs in the spreadsheet that stores your survey responses or scored data:

- `Meta`
- `Stats`
- `Leaderboard`
- `Groups`
- `Bracket`
- `Tiebreakers`
- `Scoring`
- `Results`

The included `google-apps-script.gs` reads those tabs and returns the data as JavaScript that the website can load.

## Suggested sheet columns

### Meta
| A | B |
|---|---|
| title | Anderson World Cup Pool |
| subtitle | Live results, group rankings, knockout bracket, and tiebreakers. |

### Stats
| Label | Value |
|---|---|
| Entries | 24 |
| Current Leader | Jake |
| Prize Pool | £480 |
| Updated | Live |

### Leaderboard
| name | total | perfect | excellent | good | groups | knockout |

### Groups
| Group | Team | Points |

### Bracket
| Round | Team A | Team B |

### Tiebreakers
| One item per row |

### Scoring
| Title | Text |

### Results
| Time | Title | Text |

## Google Apps Script deployment
Paste `google-apps-script.gs` into Apps Script attached to the sheet, then deploy as a Web App. Use the deployment URL in `data.js`.

## If you only want the sample site
Leave `dataUrl` blank in `data.js` and the page will use the built-in sample data.
