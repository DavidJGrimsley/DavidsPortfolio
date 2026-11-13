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

function renderLoginPage({ agreement, csrfToken }) {
  const paragraphs = agreement.terms.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n');
  return layout({
    title: 'iSquared Private Preview',
    script: 'login.js',
    body: `<main class="shell">
  <section class="card" aria-labelledby="page-title">
    <p class="eyebrow">iSquared</p>
    <h1 id="page-title">iSquared Private Preview</h1>
    <p class="preview-note">iSquared will be open source. For now, I’m sharing this prototype with a small number of people.</p>
    <p class="lead">Please enter your personal access code to continue.</p>
    <form id="access-form" novalidate autocomplete="off"
          data-csrf="${escapeHtml(csrfToken)}"
          data-agreement-version="${escapeHtml(agreement.version)}"
          data-agreement-digest="${escapeHtml(agreement.digest)}">
      <label for="code">Access code</label>
      <input id="code" name="code" type="text" inputmode="text" autocapitalize="characters"
             autocomplete="off" autocorrect="off" spellcheck="false" maxlength="40"
             placeholder="4X73B" aria-describedby="form-error" required>
      <div class="terms">
        <p class="statement">${escapeHtml(agreement.statement)}</p>
        <label class="check" for="agree">
          <input id="agree" name="agree" type="checkbox" required>
          <span>${escapeHtml(agreement.checkboxLabel)}</span>
        </label>
        <button type="button" class="link" id="open-terms">Read the full confidentiality terms</button>
      </div>
      <p id="form-error" class="error" role="alert" hidden></p>
      <button type="submit" id="submit" class="primary" disabled>Enter iSquared</button>
    </form>
    <section class="preview-section" aria-labelledby="prototype-details-title">
      <h2 id="prototype-details-title">What’s real and what’s simulated</h2>
      <div class="details-grid">
        <div>
          <h3>Real</h3>
          <ul>
            <li>The example project repositories and their code.</li>
            <li>The Pet Show and Tell app and its simulator experience.</li>
            <li>The web preview of the Experimemo Exact app.</li>
          </ul>
        </div>
        <div>
          <h3>Simulated</h3>
          <ul>
            <li>AI chat and agent interactions are scripted for this prototype.</li>
            <li>Session progression uses archive points I created while building locally to demonstrate the IDE’s flow.</li>
          </ul>
        </div>
      </div>
      <p class="imagination-caption">Use your imagination :)</p>
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
      <a class="more-info" href="https://davidjgrimsley.com/portfolio/software-development/isquared" target="_blank" rel="noopener noreferrer">More about iSquared <span aria-hidden="true">→</span></a>
    </section>
  </section>
</main>
<dialog id="terms-dialog" aria-labelledby="terms-title">
  <h2 id="terms-title">${escapeHtml(agreement.title)}</h2>
  <p class="meta">Version ${escapeHtml(agreement.version)}</p>
  <div class="terms-body">
${paragraphs}
  </div>
  <button type="button" class="primary" id="close-terms">Close</button>
</dialog>`,
  });
}

function renderSignoutPage({ csrfToken, testerName }) {
  return layout({
    title: 'Sign out of iSquared',
    script: 'login.js',
    body: `<main class="shell">
  <section class="card">
    <p class="eyebrow">iSquared</p>
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
    <p class="eyebrow">iSquared beta</p>
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
