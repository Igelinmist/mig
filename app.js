var route = require('./services/routes').router;
var app = require('./services/routes').express();

var http = require('http');

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use('/', route);

app.use(function(req, res, next){
    console.error('Not found URL: %s',req.url);
    res.status(404).send({ error: 'Not found' });
});

app.use(function(err, req, res, next){
    console.error('Internal error(%d): %s',res.statusCode,err.message);
    res.status(err.status || 500).send({ error: err.message });
});

var server = http.createServer(app);
server.listen(1337, function() {
    console.log('Express server listening on port 1337');
});


var udpListener = require('./services/udp_listener');
udpListener.run();
