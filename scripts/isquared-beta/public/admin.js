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
})();
