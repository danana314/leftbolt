var redis = require('redis');

// Setup Redis
var client = redis.createClient();
client.on("error", function(err) {
  console.log("Error " + err);
});

module.exports = {
	hset: function(key, field, value) {
		return client.hset(key, field, value, redis.print);
	},

	set: function(key, value) {
		return client.set(key, value, redis.print);
	},

	hget: function(key, field) {
		return client.hget(key, field, function(err, reply) {
			//console.log(reply);
		});
	},

	get: function(key) {
		client.get(key, function(err, reply) {
			//console.log(reply);
			return reply;
		});
	},

	exists: function(key) {
		return client.exists(key, function(err, reply) {
			return reply===1 ? true : false;
		});
	}
};

