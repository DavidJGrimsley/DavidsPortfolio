#!/usr/bin/env node
/* eslint-disable no-console */
// Administrative CLI for the iSquared private beta.
//   npm run isquared:beta -- help
// Reads the same env file as server.js (ISQUARED_BETA_CODE_PEPPER, ISQUARED_BETA_DIR, ...), so
// run it on the server, from the app root, as the user that runs the Node app.
const path = require('node:path');
const { loadFirstEnvFile } = require('./env-loader.cjs');
const { listAgreementVersions } = require('./isquared-beta/agreement.cjs');
const { openBeta } = require('./isquared-beta/index.cjs');
const { formatCode } = require('./isquared-beta/security.cjs');
const { hashPassword } = require('./isquared-beta/security.cjs');

const APP_ROOT = path.resolve(__dirname, '..');

const HELP = `iSquared private beta administration

Usage: npm run isquared:beta -- <command> [options]

Testers
  create --name "Jane Smith" (--code 4X73B | --code-stdin | --generate) [--expires YYYY-MM-DD]
        --code-stdin reads the code from stdin (keeps it out of shell history).
        Manual codes are 5-32 letters/digits; --generate makes a 12-character random code.
  list [--json]                       All testers with logins, visits, last login and status
  show <id|name>                      One tester: status, agreements accepted, recent history
  history <id|name> [--limit 50]      Login/visit/admin event history for a tester
  disable <id|name>                   Deny access and revoke all of the tester's sessions
  enable <id|name>
  rotate-code <id|name> (--code X | --code-stdin | --generate)
                                      Replace the code; old code stops working, sessions revoked
  set-expiry <id|name> <YYYY-MM-DD|none>

Reporting and maintenance
  stats [--days 30] [--json]          Totals, active testers in the period, never-logged-in
  agreement                           Show the active confidentiality agreement version and digest
  init                                Create/upgrade the SQLite schema (also done on server start)
  unlock                              Clear login rate-limit counters (after a lockout)
  cleanup                             Delete long-expired and revoked sessions
  hash-password                       Print an ISQUARED_ADMIN_PASSWORD_HASH value (reads stdin/prompt)

Identify testers by numeric id or exact name. Times are UTC (local time in parentheses).`;

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  const valueFlags = new Set(['name', 'code', 'expires', 'limit', 'days', 'id']);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      if (valueFlags.has(key)) {
        const value = argv[index + 1];
        if (value === undefined || value.startsWith('--')) throw new Error(`--${key} requires a value`);
        flags[key] = value;
        index += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(token);
    }
  }
  return { flags, positional };
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', reject);
  });
}

function promptHidden(label) {
  return new Promise((resolve, reject) => {
    process.stdout.write(label);
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off('data', onData);
          process.stdout.write('\n');
          return resolve(value);
        }
        if (char === '\u0003') {
          process.stdin.setRawMode(false);
          return reject(new Error('Cancelled.'));
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else value += char;
      }
      return undefined;
    };
    process.stdin.on('data', onData);
  });
}

async function readSecret(label) {
  if (process.stdin.isTTY) return promptHidden(label);
  return (await readStdin()).replace(/\r?\n$/, '');
}

function when(iso) {
  if (!iso) return 'never';
  const date = new Date(iso);
  return `${iso} (${date.toLocaleString()})`;
}

function table(rows, columns) {
  const widths = columns.map(([, label, get]) => Math.max(label.length, ...rows.map((row) => String(get(row)).length)));
  const line = (cells) => cells.map((cell, i) => String(cell).padEnd(widths[i])).join('  ');
  console.log(line(columns.map(([, label]) => label)));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) console.log(line(columns.map(([, , get]) => get(row))));
}

async function codeFromFlags(flags) {
  const sources = ['code', 'code-stdin', 'generate'].filter((key) => flags[key]);
  if (sources.length > 1) throw new Error('Use only one of --code, --code-stdin, --generate.');
  if (flags.code) return flags.code;
  if (flags['code-stdin']) return readSecret('Access code: ');
  if (flags.generate) return undefined;
  throw new Error('Provide a code with --code, --code-stdin, or --generate.');
}

function statusLabel(status) {
  return { active: 'Active', invited: 'Invited', disabled: 'Disabled', expired: 'Expired' }[status] || status;
}

async function run(argv) {
  const [command, ...rest] = argv;
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(HELP);
    return 0;
  }
  const { flags, positional } = parseArgs(rest);

  if (command === 'hash-password') {
    const password = await readSecret('New admin password (min 12 characters): ');
    console.log(hashPassword(password));
    console.error('Set this value as ISQUARED_ADMIN_PASSWORD_HASH (and ISQUARED_ADMIN_USERNAME) on the server.');
    return 0;
  }

  loadFirstEnvFile({ cwd: APP_ROOT, silent: true });
  const beta = openBeta({ appRoot: APP_ROOT });
  const { service } = beta;
  try {
    switch (command) {
      case 'init':
        console.log(`Database: ${beta.config.dbPath}`);
        console.log(`Schema version ${beta.migration.to} (${beta.migration.applied} migration(s) applied now)`);
        console.log(`Agreement ${beta.agreement.version}, digest ${beta.agreement.digest}`);
        return 0;

      case 'agreement':
        console.log(`Active version: ${beta.agreement.version}`);
        console.log(`Digest (sha256): ${beta.agreement.digest}`);
        console.log(`Available versions: ${listAgreementVersions().join(', ')}`);
        console.log(`\n${beta.agreement.title}\n\n${beta.agreement.statement}\n[ ] ${beta.agreement.checkboxLabel}\n`);
        beta.agreement.terms.forEach((paragraph, index) => console.log(`${index + 1}. ${paragraph}`));
        return 0;

      case 'create': {
        if (!flags.name) throw new Error('create requires --name');
        const code = await codeFromFlags(flags);
        const { tester, code: finalCode, generated } = service.createTester({
          name: flags.name,
          code,
          expiresAt: flags.expires,
        });
        console.log(`Name:   ${tester.name}`);
        console.log(`Id:     ${tester.id}`);
        console.log(`Status: Active${tester.expires_at ? `, expires ${tester.expires_at}` : ''}`);
        if (generated || flags['show-code']) {
          console.log(`Code:   ${formatCode(finalCode)}   (shown once; it is not stored and cannot be recovered)`);
        } else {
          console.log('Code:   stored (hashed). It is not displayed again.');
        }
        return 0;
      }

      case 'list': {
        const { testers } = service.stats({ days: 30 });
        if (flags.json) {
          console.log(JSON.stringify(testers, null, 2));
          return 0;
        }
        if (testers.length === 0) {
          console.log('No testers yet. Create one with: create --name "Jane Smith" --generate');
          return 0;
        }
        table(testers, [
          ['id', 'Id', (t) => t.id],
          ['name', 'Tester', (t) => t.name],
          ['logins', 'Logins', (t) => t.logins],
          ['visits', 'Visits', (t) => t.visits],
          ['lastLoginAt', 'Last login (UTC)', (t) => t.lastLoginAt || 'never'],
          ['status', 'Status', (t) => statusLabel(t.status)],
        ]);
        return 0;
      }

      case 'show':
      case 'history': {
        const target = positional[0] || flags.name || flags.id;
        if (!target) throw new Error(`${command} requires a tester name or ID (e.g. ${command} "Jane Smith" or --name "Jane Smith")`);
        const tester = service.findTester(target);
        const row = service.stats({ days: 30 }).testers.find((candidate) => candidate.id === tester.id);
        if (command === 'show') {
          console.log(`Name:        ${tester.name} (id ${tester.id})`);
          console.log(`Status:      ${statusLabel(row.status)}`);
          console.log(`Invited:     ${when(tester.created_at)}`);
          console.log(`Expires:     ${tester.expires_at ? when(tester.expires_at) : 'no expiry'}`);
          console.log(`Logins:      ${row.logins}`);
          console.log(`Visits:      ${row.visits}`);
          console.log(`Last login:  ${when(tester.last_login_at)}`);
          console.log(`Last visit:  ${when(row.lastVisitAt)}`);
          const accepted = service.listAgreementsFor(tester.id);
          console.log('Agreements:  ' + (accepted.length ? '' : 'none accepted'));
          accepted.forEach((a) => console.log(`  v${a.agreement_version} accepted ${when(a.accepted_at)} digest ${a.agreement_digest.slice(0, 12)}…`));
          console.log('');
        }
        const events = service.testerHistory(tester.id, { limit: Number(flags.limit) || (command === 'show' ? 10 : 50) });
        if (events.length === 0) console.log('No history yet.');
        else {
          table(events, [
            ['at', 'When (UTC)', (e) => e.at],
            ['type', 'Event', (e) => e.type],
            ['metadata', 'Details', (e) => (e.metadata ? JSON.stringify(e.metadata) : '')],
          ]);
        }
        return 0;
      }

      case 'disable':
      case 'enable': {
        const target = positional[0] || flags.name || flags.id;
        if (!target) throw new Error(`${command} requires a tester name or ID`);
        const tester = service.findTester(target);
        const result = service.setActive(tester.id, command === 'enable');
        console.log(
          command === 'disable'
            ? `${tester.name} is disabled; ${result.revokedSessions} session(s) revoked.`
            : `${tester.name} is enabled.`
        );
        return 0;
      }

      case 'rotate-code': {
        const target = positional[0] || flags.name || flags.id;
        if (!target) throw new Error('rotate-code requires a tester name or ID');
        const tester = service.findTester(target);
        const code = await codeFromFlags(flags);
        const result = service.rotateCode(tester.id, code);
        console.log(`${tester.name}: code replaced; ${result.revokedSessions} session(s) revoked.`);
        if (result.generated || flags['show-code']) console.log(`New code: ${formatCode(result.code)}   (shown once)`);
        return 0;
      }

      case 'set-expiry': {
        const target = positional[0] || flags.name || flags.id;
        if (!target) throw new Error('set-expiry requires a tester name or ID');
        const tester = service.findTester(target);
        const expiryValue = positional[1] || flags.expires;
        if (!expiryValue) throw new Error('set-expiry requires a date (YYYY-MM-DD) or "none"');
        const updated = service.setExpiry(tester.id, expiryValue);
        console.log(`${tester.name}: ${updated.expires_at ? `expires ${updated.expires_at}` : 'no expiry'}.`);
        return 0;
      }

      case 'stats': {
        const result = service.stats({ days: Number(flags.days) || 30 });
        if (flags.json) {
          console.log(JSON.stringify(result, null, 2));
          return 0;
        }
        const s = result.summary;
        console.log(`Period: last ${result.periodDays} days (since ${result.since})`);
        console.log(`Invited testers:            ${s.totalTesters}`);
        console.log(`Enabled testers:            ${s.activeTesters}`);
        console.log(`Active in period:           ${s.activeTestersInPeriod}`);
        console.log(`Never logged in:            ${s.neverLoggedIn}`);
        console.log(`Total logins / visits:      ${s.totalLogins} / ${s.totalVisits}`);
        console.log(`Logins / visits in period:  ${s.loginsInPeriod} / ${s.visitsInPeriod}`);
        return 0;
      }

      case 'unlock':
        service.resetRateLimits();
        console.log('Rate-limit counters cleared.');
        return 0;

      case 'cleanup': {
        const removed = service.cleanup();
        console.log(`Removed ${removed.sessions} tester session(s) and ${removed.adminSessions} admin session(s).`);
        return 0;
      }

      default:
        console.error(`Unknown command "${command}". Run with "help".`);
        return 2;
    }
  } finally {
    beta.close();
  }
}

run(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
);
