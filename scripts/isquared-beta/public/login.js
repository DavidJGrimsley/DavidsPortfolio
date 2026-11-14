(function () {
  'use strict';

  var API = '/iSquared/api';
  var MESSAGES = {
    invalid: "That access code isn't valid, has expired, or is no longer active.",
    terms: 'Please accept the confidentiality terms to continue.',
    outdated: 'The confidentiality terms were updated. Reload this page to review them.',
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
    var dialog = document.getElementById('terms-dialog');
    var personalMessage = document.getElementById('personal-message');
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

    document.getElementById('open-terms').addEventListener('click', function () {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
    document.getElementById('close-terms').addEventListener('click', function () {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    });

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
