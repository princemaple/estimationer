var ws = new WebSocket('ws://' + location.host + '/websocket');

var $ = document.querySelector.bind(document),
    $$ = document.querySelectorAll.bind(document);

var $estimator = $('.estimator'),
    $estimation = $('#estimation'),
    $admin = $('.admin'),
    $newIssue = $('#new-issue');

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
  }

  if (_.startsWith(data, 'AEST:')) {
    data = data.replace(/AEST:/, '').split(':');

    var averageEST = data[0],
        estimators = data[1];

    $('#average').textContent = 'Average ' + averageEST + ' by ' +  estimators + ' estimator(s)';
  }

  if (data == 'ADMIN') {
    $admin.classList.remove('hide');
  }
};
