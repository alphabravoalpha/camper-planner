/**
 * Google Apps Script: Auto-create GitHub Issues from Google Form bug reports
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Form's linked Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Paste this entire script
 * 4. Replace GITHUB_TOKEN with a Personal Access Token (repo scope)
 *    - Create at: https://github.com/settings/tokens/new
 *    - Select scope: "repo" (Full control of private repositories)
 * 5. Replace GITHUB_REPO with your repo (e.g. "AlphaBravoAlpha/camper-planner")
 * 6. Click Run → onFormSubmit (to authorise permissions)
 * 7. Go to Triggers (clock icon) → Add Trigger:
 *    - Function: onFormSubmit
 *    - Event source: From spreadsheet
 *    - Event type: On form submit
 *    - Click Save
 *
 * GOOGLE FORM FIELDS EXPECTED:
 * - Column 1: Timestamp (auto)
 * - Column 2: Feedback type (Feature request / Bug report / General suggestion)
 * - Column 3: Description
 * - Column 4: Email (optional)
 *
 * Adjust COLUMN indexes below if your form columns differ.
 */

// ── Configuration ──────────────────────────────────────────
const GITHUB_TOKEN = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN';
const GITHUB_REPO = 'AlphaBravoAlpha/camper-planner';

// Column indexes (1-based, matching your Google Form response columns)
const COL_FEEDBACK_TYPE = 2;
const COL_DESCRIPTION = 3;
const COL_EMAIL = 4;
// ────────────────────────────────────────────────────────────

function onFormSubmit(e) {
  const row = e.values;

  const feedbackType = row[COL_FEEDBACK_TYPE - 1] || '';
  const description = row[COL_DESCRIPTION - 1] || '';
  const email = row[COL_EMAIL - 1] || '';
  const timestamp = row[0] || new Date().toISOString();

  // Only create GitHub issues for bug reports
  if (!feedbackType.toLowerCase().includes('bug')) {
    Logger.log('Skipping non-bug feedback: ' + feedbackType);
    return;
  }

  const title = '[Bug Report] ' + truncate(description, 80);

  const body = [
    '## Bug Report (from feedback form)',
    '',
    '**Submitted:** ' + timestamp,
    email ? '**Contact:** ' + email : '*No contact email provided*',
    '',
    '### Description',
    '',
    description,
    '',
    '---',
    '*Auto-created from Google Form submission*',
  ].join('\n');

  createGitHubIssue(title, body, ['bug', 'auto-triage']);
}

function createGitHubIssue(title, body, labels) {
  const url = 'https://api.github.com/repos/' + GITHUB_REPO + '/issues';

  const payload = {
    title: title,
    body: body,
    labels: labels,
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + GITHUB_TOKEN,
      Accept: 'application/vnd.github.v3+json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();

  if (code === 201) {
    const issue = JSON.parse(response.getContentText());
    Logger.log('Created issue #' + issue.number + ': ' + issue.html_url);
  } else {
    Logger.log('Failed to create issue. Status: ' + code);
    Logger.log('Response: ' + response.getContentText());
  }
}

function truncate(str, maxLen) {
  if (!str) return 'No description provided';
  str = str.replace(/\n/g, ' ').trim();
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}
