const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const AGREEMENTS_DIR = path.join(__dirname, 'agreements');
const VERSION_PATTERN = /^[A-Za-z0-9._-]{1,40}$/;

function canonicalize(agreement) {
  return JSON.stringify({
    version: agreement.version,
    title: agreement.title,
    statement: agreement.statement,
    checkboxLabel: agreement.checkboxLabel,
    terms: agreement.terms,
  });
}

function digestAgreement(agreement) {
  return crypto.createHash('sha256').update(canonicalize(agreement)).digest('hex');
}

function validateAgreement(raw, fileVersion) {
  const ok =
    raw &&
    typeof raw === 'object' &&
    VERSION_PATTERN.test(String(raw.version)) &&
    String(raw.version) === fileVersion &&
    [raw.title, raw.statement, raw.checkboxLabel].every((value) => typeof value === 'string' && value.trim()) &&
    Array.isArray(raw.terms) &&
    raw.terms.length > 0 &&
    raw.terms.every((paragraph) => typeof paragraph === 'string' && paragraph.trim());
  if (!ok) {
    throw new Error(`Agreement file ${fileVersion}.json is malformed.`);
  }
  return {
    version: raw.version,
    title: raw.title,
    statement: raw.statement,
    checkboxLabel: raw.checkboxLabel,
    terms: raw.terms,
  };
}

function listAgreementVersions(dir = AGREEMENTS_DIR) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.slice(0, -'.json'.length))
    .filter((version) => VERSION_PATTERN.test(version))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

/** Loads the pinned version, or the highest version file when none is pinned. */
function loadAgreement({ version = null, dir = AGREEMENTS_DIR } = {}) {
  const versions = listAgreementVersions(dir);
  const chosen = version || versions[versions.length - 1];
  if (!chosen || !versions.includes(chosen)) {
    throw new Error(`Agreement version "${chosen || ''}" not found in ${dir}.`);
  }
  const raw = JSON.parse(fs.readFileSync(path.join(dir, `${chosen}.json`), 'utf8'));
  const agreement = validateAgreement(raw, chosen);
  return { ...agreement, digest: digestAgreement(agreement) };
}

module.exports = { AGREEMENTS_DIR, digestAgreement, listAgreementVersions, loadAgreement };
