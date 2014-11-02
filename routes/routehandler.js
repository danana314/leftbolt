var shortid = require('shortid');
//shortid.generate()

exports.login = function(req, res) {
	res.render('login');
};

// GET /r/:id
exports.checkin = function(req, res) {
	var id = req.params.id;
	if(!id) {
		console.log('new room!');
	}
	else {
		console.log(id);
	}
}