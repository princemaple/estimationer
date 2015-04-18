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

  heartBeat(ws);

  var $estimator = $('.estimator'),
      $estimation = $('#estimation'),
      $admin = $('.admin'),
      $newIssue = $('#new-issue'),
      $history = $('.history'),
      $quickEstimates = $$('.estimate');

  $('.status').classList.remove('hide');

  ws.onopen = function() {
    ws.send('IAM:' + name);
  };

  function focusElem(elem) {
    elem.focus();
    elem.select();
  }

  [].forEach.call($quickEstimates, function($estimate) {
    $estimate.onclick = function(e) {
      $estimation.value = e.target.dataset.est;
      focusElem($estimation);
    };
  });

  $estimator.onsubmit = function(e) {
    e.preventDefault();

    var estimation = $estimation.value.trim();

    if (estimation == '') { return; }

    ws.send('EST:' + estimation);
    $estimation.value = '';
    $estimator.classList.add('hide');
    focusElem($newIssue);
  };

  $admin.onsubmit = function(e) {
    e.preventDefault();

    ws.send('NEW:' + $newIssue.value.trim());
    $newIssue.value = '';
    focusElem($estimation);
  };

  ws.onmessage = function(message) {
    var data = message.data;

    if (_.startsWith(data, 'NEW:')) {
      $('#issue-id').textContent = data.replace(/NEW:/, '');
      $estimator.classList.remove('hide');

      $history.innerHTML = '';
      focusElem($estimation);
    }

    if (_.startsWith(data, 'EST:')) {
      data = data.replace(/^EST:/, '').split(':');

      var estimator = data[0],
          estimation = data[1];

      var record = document.createElement('p');
      record.textContent = estimator + ' estimated ' + estimation;

      $history.appendChild(record);
    }

    if (_.startsWith(data, 'AVG:')) {
      data = data.replace(/^AVG:/, '').split(':');

      var averageEST = data[0],
          estimators = data[1];

      $('#average').textContent = 'Average ' + averageEST + ' by ' +  estimators + ' estimator(s)';
    }

    if (data == 'ADMIN') {
      $admin.classList.remove('hide');
      focusElem($newIssue);
    }
  };
}

function heartBeat(ws) {
  return setInterval(function() {
    ws.send('PING');
  }, 5000);
}

register();
