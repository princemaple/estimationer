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

  document.title += ' - ' + name;

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

  function newIssue(issue) {
    $('#issue-id').textContent = issue;
    $estimator.classList.remove('hide');

    $history.innerHTML = '';
    focusElem($estimation);
  }

  function estimate(user, score) {
    var record = document.createElement('p');
    record.textContent = user + ' estimated ' + score;

    $history.appendChild(record);
  }

  function average(averageScore, userCount) {
    $('#average').textContent = 'Average ' + averageScore + ' by ' +  userCount + ' estimator(s)';
  }

  function userEnter(name) {
    var user = document.createElement('p');
    user.textContent = name + ' joined';

    $('.users').appendChild(user);
  }

  function userLeave(name) {
    var user = document.createElement('p');
    user.textContent = name + ' disconnected';

    $('.users').appendChild(user);
  }

  function admin() {
    $admin.classList.remove('hide');
    focusElem($newIssue);
  }

  dispatcher = {
    NEW: newIssue,
    EST: estimate,
    AVG: average,
    YO: userEnter,
    BYE: userLeave,
    ADMIN: admin,
    PONG: _.noop
  };

  ws.onmessage = function(message) {
    console.log(message.data);
    var command = message.data.split(':');
    var args = command.splice(1);

    dispatcher[command].apply(null, args);
  };
}

function heartBeat(ws) {
  return setInterval(function() {
    ws.send('PING');
  }, 5000);
}

register();
