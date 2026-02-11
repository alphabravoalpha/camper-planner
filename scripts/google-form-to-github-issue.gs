/**
 * Google Apps Script: Auto-create GitHub Issues from Google Form bug reports
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Form (edit mode)
 * 2. Click the three-dot menu → Script editor (or Extensions → Apps Script)
 * 3. Paste this entire script
 * 4. Replace GITHUB_TOKEN with a Personal Access Token (repo scope)
 *    - Create at: https://github.com/settings/tokens/new
 *    - Select scope: "repo" (Full control of private repositories)
 * 5. Replace GITHUB_REPO with your repo (e.g. "AlphaBravoAlpha/camper-planner")
 * 6. Click Run → onFormSubmit (to authorise permissions)
 * 7. Go to Triggers (clock icon) → Add Trigger:
 *    - Function: onFormSubmit
 *    - Event source: From form
 *    - Event type: On form submit
 *    - Click Save
 *
 * GOOGLE FORM FIELDS EXPECTED (in order):
 * 1. Type of Feedback (dropdown: Feature Request / Bug Report / General Suggestion)
 * 2. Description
 * 3. Email Address (optional)
 */

// ── Configuration ──────────────────────────────────────────
const GITHUB_TOKEN = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN';
const GITHUB_REPO = 'AlphaBravoAlpha/camper-planner';
// ────────────────────────────────────────────────────────────

function onFormSubmit(e) {
  const response = e.response;
  const answers = response.getItemResponses();
  const timestamp = response.getTimestamp().toISOString();

  // Extract answers by index (matching form field order)
  const feedbackType = answers[0] ? answers[0].getResponse() : '';
  const description = answers[1] ? answers[1].getResponse() : '';
  const email = answers[2] ? answers[2].getResponse() : '';

  Logger.log('Feedback type: ' + feedbackType);
  Logger.log('Description: ' + description);

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
