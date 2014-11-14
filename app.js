
var express = require('express')
  ,app = express()
  ,server = require('http').Server(app)
  ,io = require('socket.io')(server)
  ,cookieParser = require('cookie-parser')
  ,bodyParser = require('body-parser')
  ,session = require('express-session');

// Setup express framework
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({ secret: 'dmc'}));
app.use(express.static(__dirname + '/public'));

// Socket.io
var db = require('./lib/database');

io.on('connection', function(socket) {
  socket.on('register', function(data) {
    db.set(data.roomid, data.isuser==="1" ? "user present" : "helper present", "true");
    socket.broadcast.emit('join', data.isuser);
  });

  socket.on('disconnect', function() {
    //io.sockets.emit();
  })
})

// Routes
var routes = require('./lib/routes');
app.get('/', routes.login);
app.post('/newroom', routes.newroom);
app.get('/r/:id/:isuser', routes.checkin);

// Start server
var port = 8080;
server.listen(port, function() {
  console.log('server listening on port ' + port);
});
