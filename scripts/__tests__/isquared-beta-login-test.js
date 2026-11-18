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
    submit: {}, 'form-error': {},
    'personal-message': { hidden: true, textContent: '' },
    'fullscreen-message': { hidden: true },
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
  expect(elements['fullscreen-message'].hidden).toBe(true);
  jest.advanceTimersByTime(250);
  resolveFetch({ ok: true, json: async () => ({ message: '<b>Hi!</b>' }) });
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  expect(elements['personal-message'].hidden).toBe(false);
  expect(elements['personal-message'].textContent).toBe('<b>Hi!</b>');
  expect(elements['fullscreen-message'].hidden).toBe(false);
  elements.code.value = '';
  handlers.input.forEach((fn) => fn());
  expect(elements['personal-message'].hidden).toBe(true);
  expect(elements['fullscreen-message'].hidden).toBe(true);
  jest.useRealTimers();
});

it('opens and closes the inspiration video modal with autoplay src lifecycle', () => {
  const listeners = {};
  const register = (id) => (event, fn) => {
    listeners[id + ':' + event] = fn;
  };
  let modalOpen = false;
  const elements = {
    'access-form': { dataset: { csrf: 'token' }, addEventListener: register('form') },
    code: { value: '', addEventListener: register('code') },
    agree: { checked: false, addEventListener: register('agree') },
    submit: {},
    'form-error': {},
    'personal-message': { hidden: true, textContent: '' },
    'fullscreen-message': { hidden: true },
    'open-inspiration': { addEventListener: register('open') },
    'close-inspiration': { addEventListener: register('close') },
    'inspiration-dialog': {
      showModal: () => { modalOpen = true; },
      close: () => {
        modalOpen = false;
        if (listeners['dialog:close']) listeners['dialog:close']();
      },
      addEventListener: register('dialog'),
    },
    'inspiration-frame': {
      dataset: { src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0' },
      src: '',
      removeAttribute(attr) {
        if (attr === 'src') this.src = '';
      },
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../isquared-beta/public/login.js'), 'utf8'), {
    document: { getElementById: (id) => elements[id] },
    fetch: jest.fn(),
    AbortController,
    setTimeout,
    clearTimeout,
  });

  listeners['open:click']();
  expect(modalOpen).toBe(true);
  expect(elements['inspiration-frame'].src).toBe(
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0'
  );

  listeners['close:click']();
  expect(modalOpen).toBe(false);
  expect(elements['inspiration-frame'].src).toBe('');
});
