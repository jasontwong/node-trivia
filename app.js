var fs = require('fs');
  curr_q_ans = false,
  qanda = [
    { question: '1 + 1?', answer: 2 },
    { question: '2 + 1?', answer: 3 },
    { question: '3 + 1?', answer: 4 },
    { question: '4 + 1?', answer: 5 },
    { question: '5 + 1?', answer: 6 }
  ],
  q_index = 0,
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
      new_user = user + count;
    }

    if (users.hasOwnProperty(new_user)) {
      return get_valid_user(user, count + 1);
    } else {
      return new_user;
    }
  };

app.listen(8080);

io.sockets.on('connection', function (socket) {
  socket.on('join', function(data) {
    if (data.hasOwnProperty('user')) {
      var user = data.user;
      if (users.hasOwnProperty(user)) {
        socket.emit('let in', { user: { name: user, points: users[user].points }});
      } else {
        socket.emit('no let in', {});
      }
    }
  });
  socket.on('new', function(data) {
    var user = get_valid_user(data.user);
    users[user] = {
      points: 0
    };
    socket.emit('let in', { user: { name: user, points: 0 }});
  });
  socket.on('answer', function(data) {
    if (!curr_q_ans && data.hasOwnProperty('answer') && data.hasOwnProperty('user')) {
      var user = data.user,
        new_users = [],
        i;
      if (qanda[q_index].answer === parseInt(data.answer, 10)) {
        if (users.hasOwnProperty(user)) {
          curr_q_ans = true;
          socket.emit('update_points', { user: user, points: ++users[user].points, msg: "You're too slow" });
          for (i in users) {
            if (users.hasOwnProperty(i)) {
              new_users.push({ name: i, points: users[i].points });
            }
          }
          io.sockets.emit('leaderboards', { users: new_users.sort(function(a, b){
            if (a.points > b.points) {
              return -1;
            }
            if (a.points < b.points) {
              return 1;
            }
            return 0;
          }) });
        }
      }
    }  
  });
});

setInterval(function() {
  curr_q_ans = false;
  q_index = Math.floor(Math.random() * qanda.length);
  io.sockets.emit('question', { question: qanda[q_index].question });
}, 10000);
