var express = require('express');
var redisClient = require('redis'),
		redisDB = redisClient.createClient();

var app = express();

app.get('/api/nt/:id', (req, res) => {
	redisDB.hgetall(`nt:${req.params.id}`, (err, result) => {
		if (!err) {
			res.send(result);
		} else {
			console.error("Redis error: " + err);
			res.statusCode = 500;
			res.send({error: "Redis error: " + err})
		}
	});
});

app.get('/api/nt/:nt_id/ns/:ns_id', (req, res) => {
	redisDB.hmget(`nt:${req.params.nt_id}`, `ns:${req.params.ns_id}`, (err, result) => {
		if (!err) {
			res.send(result);
		} else {
			console.error("Redis error: " + err);
			res.statusCode = 500;
			res.send({error: "Redis error: " + err})
		}
	});
});

app.listen(1337, function(){
    console.log('Express server listening on port 1337');
});
