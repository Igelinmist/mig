let route = require('./controllers/api').router;
let express = require('./controllers/api').express;
let udpListener = require('./controllers/udp_listener');
let app = express();

let http = require('http');

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use('/', route);

app.use(function(req, res){
    console.error('Not found URL: %s',req.url);
    res.status(404).send({ error: 'Not found' });
});

app.use(function(err, req, res){
    console.error('Internal error(%d): %s',res.statusCode,err.message);
    res.status(err.status || 500).send({ error: err.message });
});

let server = http.createServer(app);
server.listen(1337, function() {
    console.log('Express server listening on port 1337');
});


udpListener.run();
