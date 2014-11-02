
var express = require('express')
  ,app = express()
  ,server = require('http').Server(app)
  ,io = require('socket.io')(server)
    ,cookieParser = require('cookie-parser')
    ,bodyParser = require('body-parser')
    ,session = require('express-session')
    ,routes = require('./routes/routehandler');

// Setup express framework
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({ secret: 'dmc'}));
app.use(express.static(__dirname + '/public'));

// Socket.io
io.on('connection', function(socket) {
  socket.on('RegisterOffice', function(officename) {
    socket.broadcast.emit('OfficeJoin', officename);
  });

  socket.on('disconnect', function() {
    io.sockets.emit()
  })
})

// Routes
app.get('/', routes.login);
app.post('/checkin', routes.checkIn);
app.get('/main', routes.main)

var port = 8080;
server.listen(port, function() {
  console.log('server listening on port ' + port);
});
