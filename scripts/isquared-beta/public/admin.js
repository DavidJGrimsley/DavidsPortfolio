(function () {
  'use strict';

  var API = '/iSquared/admin/api';

  // Server timestamps are UTC; show them in the viewer's local time zone.
  document.querySelectorAll('time[data-localize]').forEach(function (node) {
    var date = new Date(node.getAttribute('datetime'));
    if (!isNaN(date.getTime())) {
      node.textContent = date.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      });
      node.title = date.toISOString();
    }
  });

  var login = document.getElementById('admin-login');
  if (login) {
    var error = document.getElementById('form-error');
    login.addEventListener('submit', function (event) {
      event.preventDefault();
      error.hidden = true;
      fetch(API + '/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': login.dataset.csrf },
        body: JSON.stringify({
          username: document.getElementById('username').value,
          password: document.getElementById('password').value,
        }),
      })
        .then(function (response) {
          if (response.status === 200) {
            window.location.replace('/iSquared/admin/');
            return;
          }
          error.textContent = response.status === 429
            ? 'Too many attempts. Please wait and try again.'
            : 'Sign-in failed.';
          error.hidden = false;
        })
        .catch(function () {
          error.textContent = 'Could not reach the server.';
          error.hidden = false;
        });
    });
  }

  var logout = document.getElementById('admin-logout');
  if (logout) {
    logout.addEventListener('click', function () {
      fetch(API + '/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': logout.dataset.csrf },
        body: '{}',
      }).then(function () { window.location.replace('/iSquared/admin/'); });
    });
  }

  var banner = document.getElementById('access-banner');
  var switchButton = document.getElementById('access-switch');
  var accessFeedback = document.getElementById('access-feedback');
  if (banner && switchButton) {
    switchButton.addEventListener('click', function () {
      var turningOn = banner.getAttribute('data-enabled') !== '1';
      switchButton.disabled = true;
      accessFeedback.textContent = '';
      fetch(API + '/access', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': banner.dataset.csrf },
        body: JSON.stringify({ testerAccessEnabled: turningOn }),
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            return { status: response.status, data: data };
          });
        })
        .then(function (result) {
          if (result.status === 401) {
            window.location.replace('/iSquared/admin/');
            return;
          }
          if (result.status !== 200) {
            accessFeedback.textContent = result.status === 503
              ? 'The database is busy. The switch did not change. Refresh and try again.'
              : 'Could not change tester access. Refresh and try again.';
            switchButton.disabled = false;
            return;
          }
          var enabled = result.data.testerAccessEnabled === true;
          banner.setAttribute('data-enabled', enabled ? '1' : '0');
          banner.classList.toggle('access-off', !enabled);
          document.getElementById('access-state').textContent = enabled
            ? 'Tester access is on. Sessions that were still valid are restored.'
            : 'Tester access is off. Signed-in testers and protected APIs are blocked. Sessions were kept. A simulator that already started is not stopped.';
          switchButton.textContent = enabled ? 'Turn tester access off' : 'Turn tester access on';
          if (result.data.changed === false) {
            accessFeedback.textContent = enabled ? 'Tester access is already on.' : 'Tester access is already off.';
          } else if (enabled) {
            accessFeedback.textContent = 'Restored sessions: ' + Number(result.data.restoredSessions || 0) + '.';
          } else {
            accessFeedback.textContent = 'Tester access is off. Signed-in testers are blocked now.';
          }
          switchButton.disabled = false;
        })
        .catch(function () {
          accessFeedback.textContent = 'Could not reach the server. Refresh to check the current state.';
          switchButton.disabled = false;
        });
    });
  }

  var deletePanel = document.getElementById('delete-panel');
  var deleteConfirm = document.getElementById('delete-confirm');
  var deleteSubmit = document.getElementById('delete-submit');
  var deleteCancel = document.getElementById('delete-cancel');
  var deleteError = document.getElementById('delete-error');
  var pendingDelete = null;
  function closeDelete() {
    pendingDelete = null;
    if (deletePanel) deletePanel.hidden = true;
    if (deleteConfirm) deleteConfirm.value = '';
    if (deleteSubmit) deleteSubmit.disabled = true;
    if (deleteError) {
      deleteError.hidden = true;
      deleteError.textContent = '';
    }
  }
  if (deletePanel && deleteConfirm && deleteSubmit) {
    document.querySelectorAll('[data-delete-tester]').forEach(function (button) {
      button.addEventListener('click', function () {
        pendingDelete = { id: Number(button.getAttribute('data-tester-id')), name: button.getAttribute('data-tester-name') || '' };
        deleteConfirm.value = '';
        deleteSubmit.disabled = true;
        deleteError.hidden = true;
        deletePanel.hidden = false;
        deleteConfirm.focus();
      });
    });
    deleteConfirm.addEventListener('input', function () {
      deleteSubmit.disabled = !pendingDelete || deleteConfirm.value !== pendingDelete.name;
    });
    if (deleteCancel) deleteCancel.addEventListener('click', closeDelete);
    deleteSubmit.addEventListener('click', function () {
      if (!pendingDelete || deleteConfirm.value !== pendingDelete.name) return;
      var target = pendingDelete;
      deleteSubmit.disabled = true;
      fetch(API + '/testers/delete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': banner ? banner.dataset.csrf : '' },
        body: JSON.stringify({ testerId: target.id, confirmName: deleteConfirm.value }),
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            return { status: response.status, data: data };
          });
        })
        .then(function (result) {
          if (result.status === 401) {
            window.location.replace('/iSquared/admin/');
            return;
          }
          if (result.status !== 200) {
            deleteError.hidden = false;
            deleteError.textContent = result.data && result.data.message
              ? result.data.message
              : 'Could not delete that tester. Nothing was deleted.';
            deleteSubmit.disabled = deleteConfirm.value !== target.name;
            return;
          }
          var rowButton = document.querySelector('[data-delete-tester][data-tester-id="' + target.id + '"]');
          if (rowButton && rowButton.closest('tr')) rowButton.closest('tr').remove();
          var note = 'Tester deleted.';
          if (result.data.remoteStop === 'unconfirmed') {
            note += ' A remote simulator session could not be confirmed stopped. It may keep running until the provider ends it.';
          } else if (result.data.remoteStop === 'skipped_provider_disabled') {
            note += ' No live simulator provider is configured, so no remote stop was attempted.';
          }
          closeDelete();
          accessFeedback.textContent = note;
        })
        .catch(function () {
          deleteError.hidden = false;
          deleteError.textContent = 'Could not reach the server. Refresh to check whether the tester is still listed.';
          deleteSubmit.disabled = false;
        });
    });
  }
})();
