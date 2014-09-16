var _ = require('underscore');
var users = require('../users.json');
var rooms = require('../rooms.json');

/************************************* vLine functions ************************************/
var jwt = require('green-jwt');
var serviceId = 'showme';   // replace with your service ID
var apiSecret = '9_O9cPPnN_Jc-R3iuKiCMO9YclLQCGZcbMIONtlsDGw';   // replace with your API Secret

function createToken(userId) {
  var exp = new Date().getTime() + (48 * 60 * 60);     // 2 days in seconds

  return createAuthToken(serviceId, userId, exp, apiSecret);
}

function createAuthToken(serviceId, userId, expiry, apiSecret) {
  var subject = serviceId + ':' + userId;
  var payload = {'iss': serviceId, 'sub': subject, 'exp': expiry};
  var apiSecretKey = base64urlDecode(apiSecret);
  return jwt.encode(payload, apiSecretKey);
}

function base64urlDecode(str) {
  return new Buffer(base64urlUnescape(str), 'base64');
}

function base64urlUnescape(str) {
  str += Array(5 - str.length % 4).join('=');
  return str.replace(/\-/g, '+').replace(/_/g, '/');
}
/************************************* vLine functions ************************************/


exports.authenticator = {
  checkIn: function (req, res) {
    if (req.session.authed) {
      var vlineAuthToken = createToken(req.session.user.id);
      res.render('layout', {ses: req.session, jwt: vlineAuthToken, users: users, serviceId: serviceId});
    }
    else {
      res.render('login', {layout: 'login'});
    }
  },

  trytolog: function (req, res) {
    var room = _.find(rooms, function (room) {
      return room.roomnumber == req.body.roomnumber;
    });
    var user = _.find(users, function (user) {
      return user.username == req.body.username;
    })
    if (room) {
      req.session.authed = true;
      req.session.room = room;
      req.session.user = user; // TODO: dynamically generate users and associate with rooms
      res.send({authed: true});
    } else {
      res.send({authed: false});
    }

  },

  logout: function (req, res) {
    if (req.session) {
      req.session.auth = null;
      res.clearCookie('auth');
      req.session.destroy(function () {
      });
    }
    res.redirect('/');
  }
};