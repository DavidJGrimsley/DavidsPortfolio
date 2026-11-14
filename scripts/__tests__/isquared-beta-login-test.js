const fs = require('fs');
const vm = require('vm');
const path = require('path');

it('clears stale messages and ignores delayed lookup responses after an edit', async () => {
  jest.useFakeTimers();
  const handlers = {};
  const elements = {
    'access-form': { dataset: { csrf: 'token' }, addEventListener: (event, fn) => { handlers['form:' + event] = fn; } },
    code: { value: '', addEventListener: (event, fn) => { (handlers[event] ||= []).push(fn); } },
    agree: { checked: false, addEventListener() {} },
    submit: {}, 'form-error': {}, 'terms-dialog': {},
    'personal-message': { hidden: true, textContent: '' },
    'open-terms': { addEventListener() {} }, 'close-terms': { addEventListener() {} },
  };
  let resolveFetch;
  const fetch = jest.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../isquared-beta/public/login.js'), 'utf8'), {
    document: { getElementById: (id) => elements[id] }, fetch, AbortController, setTimeout, clearTimeout,
  });
  elements.code.value = 'HELLO7';
  handlers.input.forEach((fn) => fn());
  jest.advanceTimersByTime(250);
  expect(fetch).toHaveBeenCalledTimes(1);
  elements.code.value = 'OTHER7';
  handlers.input.forEach((fn) => fn());
  resolveFetch({ ok: true, json: async () => ({ message: 'Old message' }) });
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  expect(elements['personal-message'].hidden).toBe(true);
  expect(elements['personal-message'].textContent).toBe('');
  jest.advanceTimersByTime(250);
  resolveFetch({ ok: true, json: async () => ({ message: '<b>Hi!</b>' }) });
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  expect(elements['personal-message'].hidden).toBe(false);
  expect(elements['personal-message'].textContent).toBe('<b>Hi!</b>');
  jest.useRealTimers();
});
