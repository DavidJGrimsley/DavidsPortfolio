(function () {
  'use strict';

  var API = '/iSquared/api';
  const PROTOTYPE = '/iSquared/Prototype';
  var MESSAGES = {
    invalid: "That access code isn't valid, has expired, or is no longer active.",
    terms: 'Please check the box to continue.',
    outdated: 'The preview form was updated. Reload this page to continue.',
    limited: 'Too many attempts. Please wait a few minutes and try again.',
    paused: 'The private preview is paused. Try again later.',
    network: 'Could not reach the server. Check your connection and try again.',
  };

  function showError(node, message) {
    node.textContent = message;
    node.hidden = false;
  }

  // The inspiration video lives on the info page, which has no access form.
  var openInspiration = document.getElementById('open-inspiration');
  var closeInspiration = document.getElementById('close-inspiration');
  var inspirationDialog = document.getElementById('inspiration-dialog');
  var inspirationFrame = document.getElementById('inspiration-frame');
  if (openInspiration && inspirationDialog && inspirationFrame) {
    var stopInspiration = function () {
      if (typeof inspirationFrame.removeAttribute === 'function') {
        inspirationFrame.removeAttribute('src');
      } else {
        inspirationFrame.src = '';
      }
    };
    openInspiration.addEventListener('click', function () {
      inspirationFrame.src = inspirationFrame.dataset.src || '';
      if (typeof inspirationDialog.showModal === 'function') inspirationDialog.showModal();
      else inspirationDialog.setAttribute('open', '');
    });
    if (closeInspiration) {
      closeInspiration.addEventListener('click', function () {
        stopInspiration();
        if (typeof inspirationDialog.close === 'function') inspirationDialog.close();
        else inspirationDialog.removeAttribute('open');
      });
    }
    if (typeof inspirationDialog.addEventListener === 'function') {
      inspirationDialog.addEventListener('close', stopInspiration);
      inspirationDialog.addEventListener('click', function (event) {
        if (event.target === inspirationDialog && typeof inspirationDialog.close === 'function') {
          inspirationDialog.close();
        }
      });
    }
  }

  var form = document.getElementById('access-form');
  var CLOSED_NOTE = "We're glad you're here but we need to make some changes. Please come back later or contact David Grimsley.";
  if (form) {
    var code = document.getElementById('code');
    var agree = document.getElementById('agree');
    var submit = document.getElementById('submit');
    var error = document.getElementById('form-error');
    var personalMessage = document.getElementById('personal-message');
    var fullscreenMessage = document.getElementById('fullscreen-message');
    var closedNotice = document.getElementById('access-closed');
    var closedNote = document.getElementById('access-closed-note');
    var accessView = document.getElementById('access-view');
    var lookupTimer;
    var lookupController;
    var lookupVersion = 0;
    // Every lookup counts against the server's rate limits, so wait for a real pause in typing
    // rather than asking about each prefix of a long code as it is typed.
    var LOOKUP_DELAY_MS = 800;
    // The normalized code whose lookup is armed, in flight or shown, and this page's settled answers.
    var activeCode = null;
    var settled = {};
    var accessClosed = form.dataset.accessClosed === '1';

    function normalizedCode() {
      return code.value.replace(/[\s-]+/g, '').toUpperCase();
    }

    function hideSecrets() {
      personalMessage.textContent = '';
      personalMessage.hidden = true;
      if (fullscreenMessage) fullscreenMessage.hidden = true;
    }

    function showClosedNote() {
      if (!closedNote) return;
      var normalized = normalizedCode();
      if (!/^[A-Z0-9]{5,32}$/.test(normalized)) {
        if (!closedNote.hidden) {
          closedNote.textContent = '';
          closedNote.hidden = true;
        }
        return;
      }
      if (closedNote.hidden || closedNote.textContent !== CLOSED_NOTE) {
        closedNote.textContent = CLOSED_NOTE;
        closedNote.hidden = false;
      }
    }

    function applyClosedState(closed) {
      var changed = closed !== accessClosed;
      accessClosed = closed;
      if (closedNotice && closedNotice.hidden === closed) {
        closedNotice.hidden = !closed;
        if (closed) closedNotice.textContent = 'Closed for changes.';
      }
      if (accessView && accessView.classList) accessView.classList.toggle('is-closed', closed);
      if (closed) {
        hideSecrets();
        if (changed) {
          lookupVersion += 1;
          clearTimeout(lookupTimer);
          if (lookupController) lookupController.abort();
          lookupController = null;
        }
        showClosedNote();
        return;
      }
      if (closedNote && !closedNote.hidden) {
        closedNote.textContent = '';
        closedNote.hidden = true;
      }
      if (changed) {
        activeCode = null;
        scheduleLookup();
      }
    }

    function clearLookup() {
      lookupVersion += 1;
      activeCode = null;
      clearTimeout(lookupTimer);
      if (lookupController) lookupController.abort();
      lookupController = null;
      hideSecrets();
      if (closedNote) {
        closedNote.textContent = '';
        closedNote.hidden = true;
      }
    }

    function showPersonalMessage(message) {
      if (!message || accessClosed) return;
      personalMessage.textContent = message;
      personalMessage.hidden = false;
      if (fullscreenMessage) fullscreenMessage.hidden = false;
    }

    function scheduleLookup() {
      // Same normalization as the server: spaces, hyphens and case do not change the code.
      var normalized = normalizedCode();
      if (normalized === activeCode) return;
      clearLookup();
      if (!/^[A-Z0-9]{5,32}$/.test(normalized)) return;
      activeCode = normalized;
      if (accessClosed) {
        showClosedNote();
        return;
      }
      if (Object.prototype.hasOwnProperty.call(settled, normalized)) {
        showPersonalMessage(settled[normalized]);
        return;
      }
      var version = lookupVersion;
      lookupTimer = setTimeout(function () {
        lookupController = new AbortController();
        fetch(API + '/personal-message', {
          method: 'POST', credentials: 'same-origin', signal: lookupController.signal,
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': form.dataset.csrf },
          body: JSON.stringify({ code: normalized }),
        }).then(function (response) {
          return response.ok ? response.json() : null;
        }).then(function (data) {
          if (version !== lookupVersion || !data || typeof data !== 'object') return;
          if (data.closed === true) {
            applyClosedState(true);
            return;
          }
          if (accessClosed) return;
          if (data.message !== null && typeof data.message !== 'string') return;
          settled[normalized] = data.message || '';
          if (version === lookupVersion) showPersonalMessage(data.message);
        }).catch(function () { /* A missing message must not prevent sign-in. */ });
      }, LOOKUP_DELAY_MS);
    }

    function refreshAccess() {
      fetch(API + '/session', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
        .then(function (response) { return response && response.ok ? response.json() : null; })
        .then(function (data) {
          if (!data || typeof data.testerAccessEnabled !== 'boolean') return;
          if (data.authenticated === true && window && window.location && typeof window.location.reload === 'function') {
            window.location.reload();
            return;
          }
          applyClosedState(data.testerAccessEnabled === false);
        })
        .catch(function () {});
    }

    if (typeof document.visibilityState === 'string') {
      setInterval(refreshAccess, 4000);
      if (typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState !== 'hidden') refreshAccess();
        });
      }
    }
    if (typeof window !== 'undefined' && window && typeof window.addEventListener === 'function') {
      window.addEventListener('focus', refreshAccess);
    }

    var sync = function () {
      submit.disabled = !(code.value.trim().length > 0 && agree.checked);
    };
    code.addEventListener('input', sync);
    code.addEventListener('input', scheduleLookup);
    agree.addEventListener('change', sync);
    sync();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submit.disabled) return;
      clearLookup();
      if (accessClosed) showClosedNote();
      error.hidden = true;
      submit.disabled = true;
      fetch(API + '/access', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': form.dataset.csrf },
        body: JSON.stringify({
          code: code.value,
          acceptTerms: agree.checked,
          agreementVersion: form.dataset.agreementVersion,
          agreementDigest: form.dataset.agreementDigest,
        }),
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            return { status: response.status, data: data };
          });
        })
        .then(function (result) {
          if (result.status === 200) {
            // The main page continues to the prototype (keeping any query); a protected URL that
            // showed this form just reloads, since the session cookie now unlocks it.
            if (form.dataset.next === PROTOTYPE) {
              window.location.replace(PROTOTYPE + window.location.search);
            } else {
              window.location.reload();
            }
            return;
          }
          var kind = result.data && result.data.error;
          showError(error, MESSAGES[kind] || MESSAGES.invalid);
          if (accessClosed) showClosedNote();
          sync();
        })
        .catch(function () {
          showError(error, MESSAGES.network);
          if (accessClosed) showClosedNote();
          sync();
        });
    });
  } else if (typeof document.visibilityState === 'string') {
    // A signed-in Continue view has no form. When access turns off, reload into the closed access view.
    setInterval(function () {
      fetch(API + '/session', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
        .then(function (response) { return response && response.ok ? response.json() : null; })
        .then(function (data) {
          if (data && data.testerAccessEnabled === false && window && window.location && typeof window.location.reload === 'function') {
            window.location.reload();
          }
        })
        .catch(function () {});
    }, 4000);
  }

  var signout = document.getElementById('signout');
  if (signout) {
    document.getElementById('signout-button').addEventListener('click', function () {
      fetch(API + '/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': signout.dataset.csrf },
        body: '{}',
      })
        .then(function () { window.location.replace('/iSquared/'); })
        .catch(function () { showError(document.getElementById('form-error'), MESSAGES.network); });
    });
  }
})();
