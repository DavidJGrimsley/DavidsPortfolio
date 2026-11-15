// Server-rendered HTML for the access screen, sign-out and admin dashboard. Every dynamic value
// goes through escapeHtml, and the pages load only same-origin scripts/styles so the strict
// Content-Security-Policy in routes.cjs can forbid inline script.

const ASSET_BASE = '/iSquared/_beta';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout({ title, body, script }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${ASSET_BASE}/beta.css">
</head>
<body>
${body}
<script src="${ASSET_BASE}/${script}" defer></script>
</body>
</html>
`;
}

function renderBrandLockup(tagText = 'INFINITE INTELLIGENCE') {
  return `<div class="brand-lockup">
      <div class="brand-mark" aria-hidden="true">
        <svg class="brand-infinity" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 12C8.25 12 9.75 6 13.5 6C14.2956 6 15.0587 6.31607 15.6213 6.87868C16.1839 7.44129 16.5 8.20435 16.5 9C16.5 9.79565 16.1839 10.5587 15.6213 11.1213C15.0587 11.6839 14.2956 12 13.5 12C9.75 12 8.25 6 4.5 6C3.70435 6 2.94129 6.31607 2.37868 6.87868C1.81607 7.44129 1.5 8.20435 1.5 9C1.5 9.79565 1.81607 10.5587 2.37868 11.1213C2.94129 11.6839 3.70435 12 4.5 12Z" stroke="currentColor" stroke-width="1.875" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="brand-wordmark">i2</span>
      <span class="eyebrow">${escapeHtml(tagText)}</span>
    </div>`;
}

function renderLoginPage({ agreement, csrfToken }) {
  return layout({
    title: 'iSquared Private Preview',
    script: 'login.js',
    body: `<main class="shell">
  <section class="card card-wide" aria-labelledby="page-title">
    <header class="page-header">
      ${renderBrandLockup('INFINITE INTELLIGENCE')}
      <h1 id="page-title">iSquared Private Preview</h1>
      <p class="preview-note">iSquared will be open source. For now, I’m sharing this prototype with a small number of people.</p>
    </header>
    <section class="preview-section" aria-labelledby="feedback-title">
      <h2 id="feedback-title">About this prototype</h2>
      <div class="about-grid">
        <div class="about-copy">
          <p>This prototype is a Vite TypeScript app for demonstration and design purposes. I’m open to feedback of any sort.</p>
          <p>I’m considering Code-OSS with a custom runtime, building it entirely in Rust, or exploring Contract in some areas. That's where I want to lean on some more experienced developers who want to join the cause.</p>
          <p>Any third-party plugins shown are for demonstration. No partnerships or agreements have been made. I do want to invite companies to make plugins such as Figma, Expo, GitHub, Brain.fm, Linear, Sentry, Supabase, etc., so that the experience can continue to grow without context switching.</p>
        </div>
        <div class="about-details">
          <div class="details-grid">
            <div class="detail-panel">
              <h3>Real</h3>
              <ul>
                <li>The example project repositories and their code.</li>
                <li>Web previews of the Pet Show and Tell and Experimemo Exact apps.</li>
              </ul>
            </div>
            <div class="detail-panel">
              <h3>Simulated</h3>
              <ul>
                <li>AI chat and agent interactions are scripted for this prototype.</li>
                <li>Session progression uses archive points I created while building locally to demonstrate the IDE’s flow.</li>
                <li>A lot of other claims.</li>
              </ul>
            </div>
          </div>
          <p class="imagination-caption">Use your imagination :)</p>
        </div>
      </div>
    </section>
    <section class="preview-section access-section" aria-labelledby="access-title">
      <div class="access-header">
        <h2 id="access-title">Access code</h2>
        <p class="lead">Please enter your personal access code to continue.</p>
      </div>
      <form id="access-form" novalidate autocomplete="off"
            data-csrf="${escapeHtml(csrfToken)}"
            data-agreement-version="${escapeHtml(agreement.version)}"
            data-agreement-digest="${escapeHtml(agreement.digest)}">
        <div class="access-grid">
          <div class="access-code-col">
            <label for="code">Access code</label>
            <input id="code" name="code" type="text" inputmode="text" autocapitalize="characters"
                   autocomplete="off" autocorrect="off" spellcheck="false" maxlength="40"
                   placeholder="4X73B" aria-describedby="form-error" required>
            <p id="personal-message" class="personal-message" role="status" hidden></p>
            <p id="fullscreen-message" class="personal-message personal-message-note" role="status" hidden>Please put this browser window in full screen before starting the prototype experience. Enjoy.</p>
          </div>
          <div class="access-action-col">
            <div class="terms">
              <label class="check" for="agree">
                <input id="agree" name="agree" type="checkbox" required>
                <span>${escapeHtml(agreement.checkboxLabel)}</span>
              </label>
            </div>
            <button type="submit" id="submit" class="primary" disabled>Enter iSquared</button>
          </div>
        </div>
        <p id="form-error" class="error" role="alert" hidden></p>
      </form>
    </section>
    <section class="preview-section" aria-labelledby="repos-title">
      <h2 id="repos-title">Explore the code</h2>
      <p>Take a closer look at the projects featured in this preview.</p>
      <ul class="repo-links">
        <li><a href="https://github.com/DavidJGrimsley/mrdj-dev-suite" target="_blank" rel="noopener noreferrer">Mr. DJ’s Dev Suite and iSquared prototype</a></li>
        <li><a href="https://github.com/DavidJGrimsley/pet-show-and-tell" target="_blank" rel="noopener noreferrer">Pet Show and Tell</a></li>
        <li><a href="https://github.com/DavidJGrimsley/experimemo-exact" target="_blank" rel="noopener noreferrer">Experimemo Exact</a></li>
        <li><a href="https://github.com/DavidJGrimsley/not-hot-dog" target="_blank" rel="noopener noreferrer">Not Hot Dog</a></li>
      </ul>
      <div class="action-row">
        <a class="more-info" href="https://davidjgrimsley.com/portfolio/software-development/isquared" target="_blank" rel="noopener noreferrer">More about iSquared <span aria-hidden="true">→</span></a>
        <button type="button" id="open-inspiration" class="more-info secondary-action">Where I stole this idea</button>
      </div>
    </section>
  </section>
</main>
<dialog id="inspiration-dialog" class="video-dialog" aria-labelledby="inspiration-title">
  <div class="dialog-header">
    <h2 id="inspiration-title">Where I stole this idea</h2>
    <button type="button" id="close-inspiration" class="dialog-close" aria-label="Close">×</button>
  </div>
  <div class="video-frame-wrap">
    <iframe id="inspiration-frame"
            title="Where I stole this idea video"
            data-src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&amp;rel=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </div>
</dialog>`,
  });
}

function renderSignoutPage({ csrfToken, testerName }) {
  return layout({
    title: 'Sign out of iSquared',
    script: 'login.js',
    body: `<main class="shell">
  <section class="card">
    ${renderBrandLockup('iSquared')}
    <h1>Sign out</h1>
    <p class="lead">${testerName ? `Signed in as ${escapeHtml(testerName)}.` : 'You are not signed in.'}</p>
    <div id="signout" data-csrf="${escapeHtml(csrfToken)}">
      <p id="form-error" class="error" role="alert" hidden></p>
      <button type="button" id="signout-button" class="primary"${testerName ? '' : ' disabled'}>Sign out</button>
      <p class="meta"><a href="/iSquared/">Back to the prototype</a></p>
    </div>
  </section>
</main>`,
  });
}

function renderAdminLoginPage({ csrfToken }) {
  return layout({
    title: 'iSquared beta administration',
    script: 'admin.js',
    body: `<main class="shell">
  <section class="card" aria-labelledby="page-title">
    ${renderBrandLockup('iSquared beta')}
    <h1 id="page-title">Administrator sign-in</h1>
    <form id="admin-login" novalidate data-csrf="${escapeHtml(csrfToken)}">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocomplete="username" maxlength="100" required>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required>
      <p id="form-error" class="error" role="alert" hidden></p>
      <button type="submit" class="primary">Sign in</button>
    </form>
  </section>
</main>`,
  });
}

const STATUS_LABELS = {
  active: 'Active',
  invited: 'Invited (never logged in)',
  disabled: 'Disabled',
  expired: 'Expired',
};

const SORT_COLUMNS = [
  ['name', 'Tester'],
  ['logins', 'Logins'],
  ['visits', 'Visits'],
  ['lastLoginAt', 'Last login'],
  ['status', 'Status'],
];

function timeCell(iso) {
  return iso
    ? `<time datetime="${escapeHtml(iso)}" data-localize>${escapeHtml(iso.replace('T', ' ').replace(/\.\d+Z$/, ' UTC'))}</time>`
    : '<span class="muted">Never</span>';
}

function compareBy(sort, dir) {
  const factor = dir === 'asc' ? 1 : -1;
  return (a, b) => {
    const left = a[sort] ?? '';
    const right = b[sort] ?? '';
    const result =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right), 'en', { numeric: true });
    return (result || a.name.localeCompare(b.name)) * factor;
  };
}

function renderDashboard({ stats, query, csrfToken }) {
  const sort = SORT_COLUMNS.some(([key]) => key === query.sort) ? query.sort : 'name';
  const dir = query.dir === 'desc' ? 'desc' : 'asc';
  const statusFilter = Object.hasOwn(STATUS_LABELS, query.status) ? query.status : '';
  const needle = String(query.q || '').trim().toLowerCase().slice(0, 100);

  const rows = stats.testers
    .filter((tester) => (!statusFilter || tester.status === statusFilter) && (!needle || tester.name.toLowerCase().includes(needle)))
    .sort(compareBy(sort, dir));

  const link = (overrides) => {
    const params = new URLSearchParams({ days: String(stats.periodDays), sort, dir, ...overrides });
    if (statusFilter && !('status' in overrides)) params.set('status', statusFilter);
    if (needle && !('q' in overrides)) params.set('q', needle);
    return `/iSquared/admin/?${params.toString()}`;
  };

  const headers = SORT_COLUMNS.map(([key, label]) => {
    const next = sort === key && dir === 'asc' ? 'desc' : 'asc';
    const marker = sort === key ? (dir === 'asc' ? ' ▲' : ' ▼') : '';
    const numeric = key === 'logins' || key === 'visits' ? ' class="num"' : '';
    return `<th scope="col"${numeric}><a href="${escapeHtml(link({ sort: key, dir: next }))}">${escapeHtml(label)}${marker}</a></th>`;
  }).join('');

  const body = rows.length
    ? rows
        .map(
          (tester) => `<tr>
  <th scope="row">${escapeHtml(tester.name)}</th>
  <td class="num">${tester.logins}</td>
  <td class="num">${tester.visits}</td>
  <td>${timeCell(tester.lastLoginAt)}</td>
  <td><span class="badge badge-${escapeHtml(tester.status)}">${escapeHtml(STATUS_LABELS[tester.status])}</span></td>
</tr>`
        )
        .join('\n')
    : '<tr><td colspan="5" class="muted">No testers match.</td></tr>';

  const s = stats.summary;
  const tile = (label, value) => `<div class="tile"><span class="tile-value">${value}</span><span class="tile-label">${escapeHtml(label)}</span></div>`;
  const statusOptions = ['', ...Object.keys(STATUS_LABELS)]
    .map(
      (key) =>
        `<option value="${escapeHtml(key)}"${key === statusFilter ? ' selected' : ''}>${escapeHtml(key ? STATUS_LABELS[key] : 'All statuses')}</option>`
    )
    .join('');

  return layout({
    title: 'iSquared beta dashboard',
    script: 'admin.js',
    body: `<main class="wide">
  <header class="bar">
    <h1>iSquared private beta</h1>
    <button type="button" id="admin-logout" data-csrf="${escapeHtml(csrfToken)}">Sign out</button>
  </header>
  <section class="tiles" aria-label="Summary">
    ${tile('Invited testers', s.totalTesters)}
    ${tile('Enabled testers', s.activeTesters)}
    ${tile(`Active in last ${stats.periodDays} days`, s.activeTestersInPeriod)}
    ${tile('Never logged in', s.neverLoggedIn)}
    ${tile('Total logins', s.totalLogins)}
    ${tile('Total visits', s.totalVisits)}
    ${tile(`Logins, last ${stats.periodDays} days`, s.loginsInPeriod)}
    ${tile(`Visits, last ${stats.periodDays} days`, s.visitsInPeriod)}
  </section>
  <form class="filters" method="get" action="/iSquared/admin/">
    <label>Period
      <select name="days">${[7, 14, 30, 90, 365]
        .map((n) => `<option value="${n}"${n === stats.periodDays ? ' selected' : ''}>${n} days</option>`)
        .join('')}</select>
    </label>
    <label>Status <select name="status">${statusOptions}</select></label>
    <label>Name <input type="search" name="q" value="${escapeHtml(needle)}" maxlength="100"></label>
    <input type="hidden" name="sort" value="${escapeHtml(sort)}">
    <input type="hidden" name="dir" value="${escapeHtml(dir)}">
    <button type="submit">Apply</button>
  </form>
  <div class="table-wrap">
    <table>
      <thead><tr>${headers}</tr></thead>
      <tbody>
${body}
      </tbody>
    </table>
  </div>
  <p class="meta">Generated <time datetime="${escapeHtml(stats.generatedAt)}" data-localize>${escapeHtml(stats.generatedAt)}</time>. Times are stored in UTC and shown in your local time zone. A visit is an authenticated opening of the prototype page; reloads within the visit gap and asset requests are not counted. Tester management is CLI-only: <code>npm run isquared:beta -- help</code>.</p>
</main>`,
  });
}

module.exports = {
  escapeHtml,
  renderAdminLoginPage,
  renderDashboard,
  renderLoginPage,
  renderSignoutPage,
};
