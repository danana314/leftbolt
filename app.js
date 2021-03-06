
var express = require('express')
  ,app = express()
  ,server = require('http').Server(app)
  ,io = require('socket.io')(server)
  ,cookieParser = require('cookie-parser')
  ,bodyParser = require('body-parser')
  ,session = require('express-session')
  ,easyrtc = require('easyrtc');

// Setup express framework
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({ secret: 'dmc'}));
app.use(express.static(__dirname + '/public'));

//EasyRTC server
var rtc = easyrtc.listen(app, io);

// Socket.io
var db = require('./app/database');

io.on('connection', function(socket) {
  socket.on('register', function(data) {
    db.set(data.roomid, data.isuser==="1" ? "user present" : "helper present", "true");
    socket.broadcast.emit('join', data.isuser);
  });

  // Listen for mouse move events
  socket.on('mousemove', function(data) {
    socket.broadcast.emit('moving', data);
  });

  // Listen for clear events
  socket.on('canvasclear', function() {
    socket.broadcast.emit('clearcanvas');
  })

  socket.on('disconnect', function() {
    //io.sockets.emit();
  })
})

// Routes
var routes = require('./app/routes');
app.get('/', function(req, res) {
	res.render('index');
};);
app.post('/newroom', routes.newroom);
app.get('/r/:id/:isuser', routes.checkin);
app.get('/canvas', function(req, res) { res.render('canvas.jade');});
app.get('/easyrtc', function(req, res) {res.render('easyrtctest');});

// Start server
var port = process.env.PORT; //8080;
server.listen(port, function() {
  console.log('server listening on port ' + port);
});
