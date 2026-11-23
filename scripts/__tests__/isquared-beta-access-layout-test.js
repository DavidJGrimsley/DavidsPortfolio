const fs = require('node:fs');
const path = require('node:path');

const CSS_PATH = path.join(__dirname, '..', 'isquared-beta', 'public', 'beta.css');

function parseRules(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const mediaStack = [];
  let index = 0;

  while (index < text.length) {
    const nextOpen = text.indexOf('{', index);
    const nextClose = text.indexOf('}', index);
    if (nextOpen === -1 && nextClose === -1) break;

    if (nextClose !== -1 && (nextOpen === -1 || nextClose < nextOpen)) {
      mediaStack.pop();
      index = nextClose + 1;
      continue;
    }

    const prelude = text.slice(index, nextOpen).trim();
    index = nextOpen + 1;
    if (prelude.startsWith('@')) {
      const maxWidth = /^@media\b/.test(prelude) ? Number((/max-width:\s*(\d+)px/.exec(prelude) || [])[1]) : null;
      mediaStack.push(Number.isFinite(maxWidth) ? maxWidth : null);
      continue;
    }

    const end = text.indexOf('}', index);
    const body = text.slice(index, end);
    index = end + 1;
    const declarations = {};
    for (const part of body.split(';')) {
      const colon = part.indexOf(':');
      if (colon === -1) continue;
      const prop = part.slice(0, colon).trim();
      const value = part.slice(colon + 1).trim();
      if (prop) declarations[prop] = value;
    }
    const widths = mediaStack.filter((value) => Number.isFinite(value));
    rules.push({
      maxWidth: widths.length ? Math.min(...widths) : null,
      selectors: prelude.split(',').map((selector) => selector.trim()).filter(Boolean),
      declarations,
    });
  }

  return rules;
}

function specificity(selector) {
  const ids = (selector.match(/#[\w-]+/g) || []).length;
  const classes = (selector.match(/\.[\w-]+|:(?!:)[\w-]+(?:\([^)]*\))?/g) || []).length;
  const stripped = selector.replace(/#[\w-]+|\.[\w-]+|:(?!:)[\w-]+(?:\([^)]*\))?/g, ' ');
  const elements = (stripped.match(/[a-z*]+/gi) || []).length;
  return [ids, classes, elements];
}

function subject(selector) {
  return selector.trim().split(/\s*[>+~]\s*|\s+/).filter(Boolean).at(-1);
}

function matchesRepoList(selector) {
  const target = subject(selector);
  return target === '.repo-links' || target === 'ul.repo-links';
}

function compareSpec(left, right) {
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

function winningDeclaration(rules, width, property) {
  let winner = null;
  rules.forEach((rule, order) => {
    if (rule.maxWidth != null && width > rule.maxWidth) return;
    if (!rule.declarations[property]) return;
    for (const selector of rule.selectors) {
      if (!matchesRepoList(selector)) continue;
      const spec = specificity(selector);
      const better =
        !winner ||
        compareSpec(spec, winner.spec) > 0 ||
        (compareSpec(spec, winner.spec) === 0 && order >= winner.order);
      if (better) {
        winner = { spec, order, value: rule.declarations[property], selector };
      }
    }
  });
  return winner;
}

describe('iSquared access page repository links', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  const rules = parseRules(css);

  it('uses four, two, then one column as the viewport narrows', () => {
    expect(winningDeclaration(rules, 1200, 'grid-template-columns').value).toBe('repeat(4, minmax(0, 1fr))');
    expect(winningDeclaration(rules, 960, 'grid-template-columns').value).toBe('repeat(2, minmax(0, 1fr))');
    expect(winningDeclaration(rules, 700, 'grid-template-columns').value).toBe('repeat(2, minmax(0, 1fr))');
    expect(winningDeclaration(rules, 600, 'grid-template-columns').value).toBe('minmax(0, 1fr)');
    expect(winningDeclaration(rules, 390, 'grid-template-columns').value).toBe('minmax(0, 1fr)');
  });

  it('lets the higher-specificity preview selector win inside media queries', () => {
    const narrow = winningDeclaration(rules, 390, 'grid-template-columns');
    const mid = winningDeclaration(rules, 800, 'grid-template-columns');
    expect(specificity('.preview-section ul.repo-links')).toEqual([0, 2, 1]);
    expect(specificity('.repo-links')).toEqual([0, 1, 0]);
    expect(compareSpec(narrow.spec, specificity('.repo-links'))).toBeGreaterThan(0);
    expect(mid.selector).toBe('.preview-section ul.repo-links');
    expect(narrow.selector).toBe('.preview-section ul.repo-links');
  });

  it('lets long repository names wrap inside the grid cell', () => {
    const anchor = rules.find(
      (rule) => rule.maxWidth == null && rule.selectors.includes('.repo-links a') && rule.declarations['overflow-wrap']
    );
    const item = rules.find((rule) => rule.selectors.includes('.repo-links > li'));
    expect(anchor.declarations['overflow-wrap']).toBe('anywhere');
    expect(anchor.declarations['min-width']).toBe('0');
    expect(item.declarations['min-width']).toBe('0');
    expect(css).not.toMatch(/\.repo-links a\s*\{[^}]*white-space:\s*nowrap/);
  });

  it('pins the closed notice inside the access card at the top right', () => {
    const card = rules.find(
      (rule) => rule.maxWidth == null && rule.selectors.includes('.card-access') && rule.declarations.position
    );
    const desktop = rules.find((rule) => rule.maxWidth == null && rule.selectors.includes('.access-closed'));
    const phone = rules.find((rule) => rule.maxWidth === 480 && rule.selectors.includes('.access-closed'));
    const desktopRoom = rules.find(
      (rule) => rule.maxWidth == null && rule.selectors.includes('.card-access.is-closed')
    );
    const phoneRoom = rules.find((rule) => rule.maxWidth === 480 && rule.selectors.includes('.card-access.is-closed'));
    // The shell animation leaves a transform in place. The card has to be the containing block
    // or the badge anchors to that shell and straddles the card border.
    expect(card.declarations.position).toBe('relative');
    expect(desktop.declarations.position).toBe('absolute');
    expect(desktop.declarations.top).toBe('14px');
    expect(desktop.declarations.right).toBe('16px');
    expect(desktop.declarations.color).toBe('#ff7a4a');
    expect(desktop.declarations.border).toBe('1px solid #ff7a4a');
    expect(desktop.declarations.background).toBe('rgba(255, 122, 74, 0.08)');
    expect(desktop.declarations['max-width']).toBe('calc(100% - 32px)');
    expect(desktop.declarations['text-align']).toBe('right');
    expect(desktopRoom.declarations['padding-top']).toBe('58px');
    expect(phone.declarations.top).toBe('12px');
    expect(phone.declarations.right).toBe('12px');
    expect(phone.declarations['max-width']).toBe('calc(100% - 24px)');
    expect(phone.declarations['font-size']).toBe('13px');
    expect(phoneRoom.declarations['padding-top']).toBe('68px');
    expect(rules.some((rule) => rule.selectors.includes('.access-closed') && rule.declarations.position === 'fixed')).toBe(false);
  });
});
