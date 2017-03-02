var express = require('express');
var redisClient = require('redis'),
		redisDB = redisClient.createClient();

var app = express();

app.get('/api/nt/:id', (req, res) => {
	redisDB.hgetall(`nt:${req.params.id}`, (err, result) => {
		console.error("Redis error: " + err);
		res.send(result);
	});
});

app.listen(1337, function(){
    console.log('Express server listening on port 1337');
});
