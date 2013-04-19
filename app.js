var fs = require('fs');
  users = {},
  handler = function (req, res) {
    fs.readFile(__dirname + '/index.html', function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }

      res.writeHead(200);
      res.end(data);
    });
  },
  app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  get_valid_user = function(user, count) {
    var new_user = user;
    if (typeof count !== 'number') {
      count = 0;
    } else {
      new_user = user + String.prototype.substr.call(count, 0);
    }

    if (users.hasOwnProperty(new_user)) {
      return get_valid_user(user, count + 1);
    } else {
      return new_user;
    }
  };

app.listen(8080);

io.sockets.on('connection', function (socket) {
  var curr_q_ans = false,
    qanda = [
      { question: '1 + 1?', answer: 2 },
      { question: '2 + 1?', answer: 3 },
      { question: '3 + 1?', answer: 4 },
      { question: '4 + 1?', answer: 5 },
      { question: '5 + 1?', answer: 6 }
    ],
    q_index = 0;
  socket.on('join', function(data) {
    var user = get_valid_user(data.user);
    users[user] = {
      points: 0
    };
    socket.emit('let in', { user: user });
  });
  socket.on('answer', function(data) {
    if (!curr_q_ans && data.hasOwnProperty('answer') && data.hasOwnProperty('user')) {
      var user = data.user;
      if (qanda[q_index].answer === parseInt(data.answer, 10)) {
        if (users.hasOwnProperty(user)) {
          curr_q_ans = true;
          socket.emit('update_points', { user: user, points: ++users[user].points, msg: "You're too slow" });
        }
      }
    }  
  });
  setInterval(function() {
    curr_q_ans = false;
    q_index = Math.floor(Math.random() * qanda.length);
    socket.emit('question', { question: qanda[q_index].question });
  }, 10000);
});
