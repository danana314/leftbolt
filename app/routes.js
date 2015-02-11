var shortid = require('shortid');
var db = require('./database');

// GET /
exports.index = function(req, res) {
	res.render('index');
};
exports.login = function(req, res) {
	res.render('login');
};

// POST /newroom
exports.newroom = function(req, res) {
	var room = shortid.generate();
	db.hset(room, "user present", "");
	db.hset(room, "helper present", "");
	db.hset(room, "helper name", "");
	res.send({ roomid: room });
};

// GET /r/:id/:isuser
exports.checkin = function(req, res) {
	var roomid = req.params.id;
	var isuser = req.params.isuser;
	if (db.exists(roomid)) {
		res.render('main', { roomid: JSON.stringify(roomid), isuser: JSON.stringify(isuser) });
	}
	else {
		res.render('index');
	}
};