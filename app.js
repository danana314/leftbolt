
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
io.on('connection', function(socket) {
  socket.on('helperRegister', function(helperId) {
    socket.broadcast.emit('helperJoin', helperId);
  });

  socket.on('disconnect', function() {
    io.sockets.emit()
  })
})

// Routes
var routes = require('./lib/routes');
app.get('/', routes.login);
app.get('/r/:id?', routes.checkin)

// Start server
var port = 8080;
server.listen(port, function() {
  console.log('server listening on port ' + port);
});
