(function () {
  'use strict';

  var API = '/iSquared/api';
  var MESSAGES = {
    invalid: "That access code isn't valid, has expired, or is no longer active.",
    terms: 'Please check the box to continue.',
    outdated: 'The preview form was updated. Reload this page to continue.',
    limited: 'Too many attempts. Please wait a few minutes and try again.',
    network: 'Could not reach the server. Check your connection and try again.',
  };

  function showError(node, message) {
    node.textContent = message;
    node.hidden = false;
  }

  var form = document.getElementById('access-form');
  if (form) {
    var code = document.getElementById('code');
    var agree = document.getElementById('agree');
    var submit = document.getElementById('submit');
    var error = document.getElementById('form-error');
    var personalMessage = document.getElementById('personal-message');
    var fullscreenMessage = document.getElementById('fullscreen-message');
    var lookupTimer;
    var lookupController;
    var lookupVersion = 0;

    function clearLookup() {
      lookupVersion += 1;
      clearTimeout(lookupTimer);
      if (lookupController) lookupController.abort();
      lookupController = null;
      personalMessage.textContent = '';
      personalMessage.hidden = true;
      if (fullscreenMessage) fullscreenMessage.hidden = true;
    }

    function scheduleLookup() {
      clearLookup();
      var value = code.value;
      var normalized = value.replace(/[\s-]+/g, '');
      if (!/^[a-z0-9]{5,32}$/i.test(normalized)) return;
      var version = lookupVersion;
      lookupTimer = setTimeout(function () {
        lookupController = new AbortController();
        fetch(API + '/personal-message', {
          method: 'POST', credentials: 'same-origin', signal: lookupController.signal,
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': form.dataset.csrf },
          body: JSON.stringify({ code: value }),
        }).then(function (response) {
          return response.ok ? response.json() : null;
        }).then(function (data) {
          if (version !== lookupVersion || code.value !== value || !data || typeof data.message !== 'string' || !data.message) return;
          personalMessage.textContent = data.message;
          personalMessage.hidden = false;
          if (fullscreenMessage) fullscreenMessage.hidden = false;
        }).catch(function () { /* A missing message must not prevent sign-in. */ });
      }, 250);
    }

    var sync = function () {
      submit.disabled = !(code.value.trim().length > 0 && agree.checked);
    };
    code.addEventListener('input', sync);
    code.addEventListener('input', scheduleLookup);
    agree.addEventListener('change', sync);
    sync();

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

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submit.disabled) return;
      clearLookup();
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
            // Reload the URL the visitor asked for; the session cookie now unlocks it.
            window.location.replace(window.location.pathname + window.location.search);
            return;
          }
          var kind = result.data && result.data.error;
          showError(error, MESSAGES[kind] || MESSAGES.invalid);
          sync();
        })
        .catch(function () {
          showError(error, MESSAGES.network);
          sync();
        });
    });
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
