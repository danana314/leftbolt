var shortid = require('shortid');
var db = require('./database');
//shortid.generate()


exports.login = function(req, res) {
	res.render('login');
};

// GET /r/:id
exports.checkin = function(req, res) {
	var id = req.params.id;
	var room = null;
	if(!id) {
		room = shortid.generate();
		console.log('new room:');
		db.set(room, "Field");
		res.render('main', {roomid: JSON.stringify(room), userid: JSON.stringify(room+'_u')});
	}
	else {
		console.log(id);
		if (db.exists(id)) {
			res.render('main', {roomid: JSON.stringify(id), userid: JSON.stringify(room + '_h')});
		}
		//if 
	}
}