var $ = document.querySelector.bind(document),
    $$ = document.querySelectorAll.bind(document);

function register() {
  var $register = $('.register');

  $register.onsubmit = function(e) {
    e.preventDefault();

    $register.classList.add('hide');
    setup($('#name').value.trim());
  };
}

function setup(name) {
  var ws = new WebSocket('ws://' + location.host + '/websocket');

  var $estimator = $('.estimator'),
      $estimation = $('#estimation'),
      $admin = $('.admin'),
      $newIssue = $('#new-issue'),
      $history = $('.history');

  $('.status').classList.remove('hide');

  ws.onopen = function() {
    ws.send('IAM:' + name);
  };

  $estimator.onsubmit = function(e) {
    e.preventDefault();

    ws.send('EST:' + $estimation.value.trim());
    $estimation.value = '';
    $estimator.classList.add('hide');
  };

  $admin.onsubmit = function(e) {
    e.preventDefault();

    ws.send('NEW:' + $newIssue.value.trim());
    $newIssue.value = '';
  };

  ws.onmessage = function(message) {
    var data = message.data;

    if (_.startsWith(data, 'NEW:')) {
      $('#issue-id').textContent = data.replace(/NEW:/, '');
      $estimator.classList.remove('hide');

      $history.innerHTML = '';
    }

    if (_.startsWith(data, 'EST:')) {
      data = data.replace(/^EST:/, '').split(':');

      var estimator = data[0],
          estimation = data[1];

      var record = document.createElement('p');
      record.textContent = estimator + ' estimated ' + estimation;

      $history.appendChild(record);
    }

    if (_.startsWith(data, 'AEST:')) {
      data = data.replace(/^AEST:/, '').split(':');

      var averageEST = data[0],
          estimators = data[1];

      $('#average').textContent = 'Average ' + averageEST + ' by ' +  estimators + ' estimator(s)';
    }

    if (data == 'ADMIN') {
      $admin.classList.remove('hide');
    }
  };
}

register();
