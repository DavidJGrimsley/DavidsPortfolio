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
  jest.advanceTimersByTime(800);
  expect(fetch).toHaveBeenCalledTimes(1);
  elements.code.value = 'OTHER7';
  handlers.input.forEach((fn) => fn());
  resolveFetch({ ok: true, json: async () => ({ message: 'Old message' }) });
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  expect(elements['personal-message'].hidden).toBe(true);
  expect(elements['personal-message'].textContent).toBe('');
  expect(elements['fullscreen-message'].hidden).toBe(true);
  jest.advanceTimersByTime(800);
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

describe('personal-message lookups spend as few rate-limited requests as possible', () => {
  let elements;
  let fetch;
  let typeValue;

  beforeEach(() => {
    jest.useFakeTimers();
    const inputHandlers = [];
    elements = {
      'access-form': { dataset: { csrf: 'token' }, addEventListener() {} },
      code: { value: '', addEventListener: (event, fn) => { if (event === 'input') inputHandlers.push(fn); } },
      agree: { checked: false, addEventListener() {} },
      submit: {}, 'form-error': {},
      'personal-message': { hidden: true, textContent: '' },
      'fullscreen-message': { hidden: true },
    };
    fetch = jest.fn();
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../isquared-beta/public/login.js'), 'utf8'), {
      document: { getElementById: (id) => elements[id] }, fetch, AbortController, setTimeout, clearTimeout,
    });
    typeValue = (value) => {
      elements.code.value = value;
      inputHandlers.forEach((fn) => fn());
    };
  });

  afterEach(() => jest.useRealTimers());

  const respond = (status, body) => fetch.mockImplementationOnce(async () => ({ ok: status === 200, status, json: async () => body }));
  const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
  const lookedUp = () => fetch.mock.calls.map(([, init]) => JSON.parse(init.body).code);

  it('looks up a long code once when it is typed at a normal pace', async () => {
    respond(200, { message: 'Hello, long code.' });
    let typed = '';
    for (const ch of 'abcd-efgh-jkmn') {
      typed += ch;
      typeValue(typed);
      jest.advanceTimersByTime(300);
    }
    expect(fetch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(800);
    await flush();
    expect(lookedUp()).toEqual(['ABCDEFGHJKMN']);
    expect(fetch.mock.calls[0][1].headers['X-CSRF-Token']).toBe('token');
    expect(elements['personal-message'].hidden).toBe(false);
    expect(elements['personal-message'].textContent).toBe('Hello, long code.');
    expect(elements['fullscreen-message'].hidden).toBe(false);
  });

  it('keeps a shown message through spacing, hyphen and case edits without another request', async () => {
    respond(200, { message: '<b>Hi!</b>' });
    typeValue('DEMO7');
    jest.advanceTimersByTime(800);
    await flush();
    for (const value of ['DEMO7 ', 'de-mo7', ' DEMO 7']) {
      typeValue(value);
      jest.advanceTimersByTime(800);
      await flush();
      expect(elements['personal-message'].hidden).toBe(false);
      expect(elements['personal-message'].textContent).toBe('<b>Hi!</b>');
    }
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reuses settled answers on this page, including no message, without new requests', async () => {
    respond(200, { message: 'For DEMO7.' });
    respond(200, { message: null });
    typeValue('DEMO7');
    jest.advanceTimersByTime(800);
    await flush();
    typeValue('DEMO78');
    expect(elements['personal-message'].hidden).toBe(true);
    jest.advanceTimersByTime(800);
    await flush();
    expect(elements['personal-message'].hidden).toBe(true);
    typeValue('DEMO7');
    expect(elements['personal-message'].textContent).toBe('For DEMO7.');
    expect(elements['personal-message'].hidden).toBe(false);
    typeValue('DEMO78');
    jest.advanceTimersByTime(800);
    await flush();
    expect(elements['personal-message'].hidden).toBe(true);
    expect(elements['fullscreen-message'].hidden).toBe(true);
    expect(lookedUp()).toEqual(['DEMO7', 'DEMO78']);
  });

  it('shows nothing for refused lookups and asks again after a real edit', async () => {
    respond(429, { error: 'limited' });
    respond(403, { error: 'forbidden' });
    respond(200, { message: 'Now available.' });
    typeValue('DEMO7');
    jest.advanceTimersByTime(800);
    await flush();
    expect(elements['personal-message'].hidden).toBe(true);
    typeValue('DEMO');
    typeValue('DEMO7');
    jest.advanceTimersByTime(800);
    await flush();
    expect(elements['personal-message'].hidden).toBe(true);
    expect(elements['fullscreen-message'].hidden).toBe(true);
    typeValue('');
    typeValue('DEMO7');
    jest.advanceTimersByTime(800);
    await flush();
    expect(elements['personal-message'].textContent).toBe('Now available.');
    expect(lookedUp()).toEqual(['DEMO7', 'DEMO7', 'DEMO7']);
  });

  it('never asks about values that cannot be a code', () => {
    for (const value of ['', 'AB-12', 'DEMO7!', 'ÄBCDE', 'A'.repeat(33)]) {
      typeValue(value);
      jest.advanceTimersByTime(800);
    }
    expect(fetch).not.toHaveBeenCalled();
    expect(elements['personal-message'].hidden).toBe(true);
  });
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

it('shows the paused sentence when sign-in is refused because access is off', async () => {
  const handlers = {};
  const elements = {
    'access-form': {
      dataset: { csrf: 'token', next: '/iSquared/' },
      addEventListener: (event, fn) => { handlers['form:' + event] = fn; },
    },
    code: { value: 'HELLO7', addEventListener() {} },
    agree: { checked: true, addEventListener() {} },
    submit: { disabled: false },
    'form-error': { hidden: true, textContent: '' },
    'personal-message': { hidden: true, textContent: '' },
    'fullscreen-message': { hidden: true },
  };
  const fetch = jest.fn(async () => ({ status: 503, json: async () => ({ error: 'paused' }) }));
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../isquared-beta/public/login.js'), 'utf8'), {
    document: { getElementById: (id) => elements[id] },
    fetch,
    AbortController,
    setTimeout,
    clearTimeout,
  });
  handlers['form:submit']({ preventDefault() {} });
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  expect(elements['form-error'].hidden).toBe(false);
  expect(elements['form-error'].textContent).toBe('The private preview is paused. Try again later.');
  expect(elements.submit.disabled).toBe(false);
});

function modalElements(listeners, state) {
  const register = (id) => (event, fn) => {
    listeners[id + ':' + event] = fn;
  };
  return {
    'open-inspiration': { addEventListener: register('open') },
    'close-inspiration': { addEventListener: register('close') },
    'inspiration-dialog': {
      showModal: () => { state.open = true; },
      close: () => {
        state.open = false;
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
}

it('runs the inspiration modal on the info page, which has no access form', () => {
  const listeners = {};
  const state = { open: false };
  const elements = modalElements(listeners, state);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../isquared-beta/public/login.js'), 'utf8'), {
    document: { getElementById: (id) => elements[id] || null },
    fetch: jest.fn(),
    AbortController,
    setTimeout,
    clearTimeout,
  });

  listeners['open:click']();
  expect(state.open).toBe(true);
  expect(elements['inspiration-frame'].src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');

  listeners['close:click']();
  expect(state.open).toBe(false);
  expect(elements['inspiration-frame'].src).toBe('');

  // Closing via the backdrop (or Escape, which fires `close`) also stops the video.
  listeners['open:click']();
  listeners['dialog:click']({ target: elements['inspiration-dialog'] });
  expect(state.open).toBe(false);
  expect(elements['inspiration-frame'].src).toBe('');
  listeners['open:click']();
  listeners['dialog:close']();
  expect(elements['inspiration-frame'].src).toBe('');
});

describe('after a successful sign-in', () => {
  async function submitWith({ next, search }) {
    let submitHandler;
    const dataset = { csrf: 'token', agreementVersion: '2', agreementDigest: 'digest' };
    if (next !== undefined) dataset.next = next;
    const elements = {
      'access-form': { dataset, addEventListener: (event, fn) => { if (event === 'submit') submitHandler = fn; } },
      code: { value: 'HELLO7', addEventListener() {} },
      agree: { checked: true, addEventListener() {} },
      submit: { disabled: false },
      'form-error': { hidden: true },
      'personal-message': { hidden: true, textContent: '' },
      'fullscreen-message': { hidden: true },
    };
    const location = { pathname: '/iSquared/Prototype', search, replace: jest.fn(), reload: jest.fn() };
    const fetch = jest.fn(async () => ({ status: 200, json: async () => ({ ok: true }) }));
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../isquared-beta/public/login.js'), 'utf8'), {
      document: { getElementById: (id) => elements[id] || null },
      window: { location },
      fetch,
      AbortController,
      setTimeout,
      clearTimeout,
    });
    submitHandler({ preventDefault() {} });
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    expect(fetch).toHaveBeenCalledWith('/iSquared/api/access', expect.objectContaining({ method: 'POST' }));
    return location;
  }

  it('continues from the main page to the prototype, keeping the query', async () => {
    const location = await submitWith({ next: '/iSquared/Prototype', search: '?s=b05' });
    expect(location.replace).toHaveBeenCalledWith('/iSquared/Prototype?s=b05');
    expect(location.reload).not.toHaveBeenCalled();
  });

  it('reloads a protected URL literally when the form has no fixed continuation', async () => {
    const location = await submitWith({ next: undefined, search: '?s=b05' });
    expect(location.reload).toHaveBeenCalledTimes(1);
    expect(location.replace).not.toHaveBeenCalled();
  });

  it('ignores any continuation other than the fixed prototype address', async () => {
    const location = await submitWith({ next: '//example.com/', search: '' });
    expect(location.reload).toHaveBeenCalledTimes(1);
    expect(location.replace).not.toHaveBeenCalled();
  });
});

const CLOSED_NOTE = "We're glad you're here but we need to make some changes. Please come back later or contact David Grimsley.";

function flushMicrotasks() {
  return (async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
  })();
}

describe('closed access notice', () => {
  const loginSource = fs.readFileSync(path.join(__dirname, '../isquared-beta/public/login.js'), 'utf8');

  function mount({ closed, watch }) {
    const inputHandlers = [];
    const accessView = { className: closed ? 'card card-access is-closed' : 'card card-access' };
    accessView.classList = {
      toggle(name, on) {
        accessView.className = on ? `card card-access ${name}` : 'card card-access';
      },
    };
    const elements = {
      'access-form': {
        dataset: { csrf: 'token', accessClosed: closed ? '1' : '0' },
        addEventListener() {},
      },
      code: {
        value: '',
        addEventListener: (event, fn) => { if (event === 'input') inputHandlers.push(fn); },
      },
      agree: { checked: false, addEventListener() {} },
      submit: { disabled: true },
      'form-error': { hidden: true, textContent: '' },
      'personal-message': { hidden: true, textContent: '' },
      'fullscreen-message': { hidden: true },
      'access-closed': { hidden: !closed, textContent: 'Closed for changes.' },
      'access-closed-note': { hidden: true, textContent: '' },
      'access-view': accessView,
    };
    const state = { enabled: !closed, authenticated: false };
    const responses = [];
    const fetch = jest.fn(async (url) => {
      if (String(url).endsWith('/session')) {
        return { ok: true, status: 200, json: async () => ({ authenticated: state.authenticated, testerAccessEnabled: state.enabled }) };
      }
      return { ok: true, status: 200, json: async () => (responses.shift() || { message: null }) };
    });
    const location = { reload: jest.fn(), replace: jest.fn(), search: '' };
    vm.runInNewContext(loginSource, {
      document: {
        getElementById: (id) => elements[id] || null,
        visibilityState: watch ? 'visible' : undefined,
      },
      window: { location },
      fetch,
      AbortController,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    });
    return {
      elements,
      accessView,
      state,
      responses,
      fetch,
      location,
      type(value) {
        elements.code.value = value;
        inputHandlers.forEach((fn) => fn());
      },
      messageCalls() {
        return fetch.mock.calls.filter(([url]) => String(url).endsWith('/personal-message'));
      },
    };
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the closed sentence instead of either note and does not request the secret', async () => {
    jest.useFakeTimers();
    const page = mount({ closed: true, watch: false });
    page.type('DEMO7');
    jest.advanceTimersByTime(800);
    await flushMicrotasks();
    expect(page.messageCalls()).toHaveLength(0);
    expect(page.elements['access-closed'].hidden).toBe(false);
    expect(page.elements['access-closed'].textContent).toBe('Closed for changes.');
    expect(page.elements['access-closed-note'].hidden).toBe(false);
    expect(page.elements['access-closed-note'].textContent).toBe(CLOSED_NOTE);
    expect(page.elements['personal-message'].hidden).toBe(true);
    expect(page.elements['personal-message'].textContent).toBe('');
    expect(page.elements['fullscreen-message'].hidden).toBe(true);
  });

  it('drops a returned secret when the server is closed, then restores both notes when access returns', async () => {
    jest.useFakeTimers();
    const page = mount({ closed: false, watch: true });
    page.responses.push({ message: 'Secret note', closed: true });
    page.responses.push({ message: 'Secret note' });
    page.type('DEMO7');
    jest.advanceTimersByTime(800);
    await flushMicrotasks();
    expect(page.elements['personal-message'].textContent).toBe('');
    expect(page.elements['personal-message'].hidden).toBe(true);
    expect(page.elements['fullscreen-message'].hidden).toBe(true);
    expect(page.elements['access-closed-note'].textContent).toBe(CLOSED_NOTE);
    expect(page.elements['access-closed'].hidden).toBe(false);
    expect(page.elements['access-closed'].textContent).toBe('Closed for changes.');
    expect(page.accessView.className).toContain('is-closed');

    page.state.enabled = true;
    jest.advanceTimersByTime(4000);
    await flushMicrotasks();
    jest.advanceTimersByTime(800);
    await flushMicrotasks();
    expect(page.elements['personal-message'].textContent).toBe('Secret note');
    expect(page.elements['personal-message'].hidden).toBe(false);
    expect(page.elements['fullscreen-message'].hidden).toBe(false);
    expect(page.elements['access-closed-note'].hidden).toBe(true);
    expect(page.elements['access-closed'].hidden).toBe(true);
    expect(page.accessView.className).not.toContain('is-closed');
    expect(page.location.reload).not.toHaveBeenCalled();
  });

  it('asks for the personal message after a closed page learns that access is back on', async () => {
    jest.useFakeTimers();
    const page = mount({ closed: true, watch: true });
    page.responses.push({ message: 'Welcome back.' });
    page.type('de-mo7');
    jest.advanceTimersByTime(800);
    await flushMicrotasks();
    expect(page.messageCalls()).toHaveLength(0);
    expect(page.elements['access-closed-note'].textContent).toBe(CLOSED_NOTE);
    page.state.enabled = true;
    jest.advanceTimersByTime(4000);
    await flushMicrotasks();
    jest.advanceTimersByTime(800);
    await flushMicrotasks();
    expect(page.messageCalls()).toHaveLength(1);
    expect(JSON.parse(page.messageCalls()[0][1].body).code).toBe('DEMO7');
    expect(page.elements['personal-message'].textContent).toBe('Welcome back.');
    expect(page.elements['fullscreen-message'].hidden).toBe(false);
    expect(page.elements['access-closed'].hidden).toBe(true);
  });

  it('reloads when a parked session becomes valid again', async () => {
    jest.useFakeTimers();
    const page = mount({ closed: true, watch: true });
    page.state.authenticated = true;
    page.state.enabled = true;
    jest.advanceTimersByTime(4000);
    await flushMicrotasks();
    expect(page.location.reload).toHaveBeenCalledTimes(1);
    expect(page.messageCalls()).toHaveLength(0);
  });

  it('reloads the signed-in access view when access turns off', async () => {
    jest.useFakeTimers();
    const location = { reload: jest.fn() };
    const fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ testerAccessEnabled: false, authenticated: false }),
    }));
    vm.runInNewContext(loginSource, {
      document: { getElementById: () => null, visibilityState: 'visible' },
      window: { location },
      fetch,
      AbortController,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    });
    jest.advanceTimersByTime(4000);
    await flushMicrotasks();
    expect(location.reload).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/iSquared/api/session', expect.objectContaining({ credentials: 'same-origin' }));
  });
});
