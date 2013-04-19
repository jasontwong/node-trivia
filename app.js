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
  socket.on('join', function(data) {
    var user = get_valid_user(data.user);
    users[user] = {
      points: 0
    };
    socket.emit('let in', { user: user });
  });
});
