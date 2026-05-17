function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const data = {
    title: getMetaValue_(ss, 'title', 'Anderson World Cup Pool'),
    subtitle: getMetaValue_(ss, 'subtitle', 'Live results, group rankings, knockout bracket, and tiebreakers.'),
    stats: readTable_(ss, 'Stats'),
    leaderboard: readTable_(ss, 'Leaderboard'),
    groups: readGroups_(ss, 'Groups'),
    bracket: readBracket_(ss, 'Bracket'),
    tiebreakers: readList_(ss, 'Tiebreakers'),
    scoring: readScoring_(ss, 'Scoring'),
    results: readResults_(ss, 'Results'),
    generatedAt: new Date().toISOString()
  };

  const js = 'window.POOL_DATA = ' + JSON.stringify(data) + ';';
  return ContentService.createTextOutput(js).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getMetaValue_(ss, key, defaultValue) {
  const sheet = ss.getSheetByName('Meta');
  if (!sheet) return defaultValue;
  const values = sheet.getDataRange().getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase() === String(key).toLowerCase()) {
      return values[i][1] || defaultValue;
    }
  }
  return defaultValue;
}

function readTable_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  return values
    .filter(function (row) { return row.join('') !== ''; })
    .map(function (row) {
      const obj = {};
      headers.forEach(function (h, idx) {
        obj[String(h)] = row[idx];
      });
      return obj;
    });
}

function readList_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  return values.slice(1).map(function (row) { return String(row[0] || ''); }).filter(Boolean);
}

function readScoring_(ss, sheetName) {
  return readTable_(ss, sheetName).map(function (row) {
    return { title: row.Title || row.title || '', text: row.Text || row.text || '' };
  });
}

function readResults_(ss, sheetName) {
  return readTable_(ss, sheetName).map(function (row) {
    return { time: row.Time || row.time || '', title: row.Title || row.title || '', text: row.Text || row.text || '' };
  });
}

function readGroups_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const rows = values.slice(1);
  const byGroup = {};
  rows.forEach(function (row) {
    const group = String(row[0] || '');
    const team = String(row[1] || '');
    const pts = String(row[2] || '');
    if (!group) return;
    if (!byGroup[group]) byGroup[group] = [];
    byGroup[group].push([team, pts]);
  });
  return Object.keys(byGroup).sort().map(function (group) {
    return { name: group, rows: byGroup[group] };
  });
}

function readBracket_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const rows = values.slice(1);
  const byRound = {};
  rows.forEach(function (row) {
    const round = String(row[0] || '');
    const a = String(row[1] || '');
    const b = String(row[2] || '');
    if (!round) return;
    if (!byRound[round]) byRound[round] = [];
    byRound[round].push([a, b]);
  });
  return Object.keys(byRound).map(function (round) {
    return { round: round, matches: byRound[round] };
  });
}
