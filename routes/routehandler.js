offices = require('../offices.json');

exports.login = function(req, res) {
	res.render('login', { offices: offices });
};

exports.checkIn = function(req, res) {
	req.session.officeid = req.body.officeid;
	req.session.authed = true;
	res.send({authed: true});
}

exports.main = function(req, res) {
	res.render('main', { officeid: req.session.officeid, offices: offices} )
}

//offices: ['Chicago', 'Boston', 'Denver']