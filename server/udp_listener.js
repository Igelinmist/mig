function run() {
	let dgram 			= require('dgram');
	let redisClient = require('redis'),
			redisDB 		= redisClient.createClient();
	let udpListener = dgram.createSocket('udp4');
	let rValue 			= require('./utils').rValue;

	udpListener.on('error', (err) => {
		console.error(`udpListener error:\n${err.stack}`);
		udpListener.close();
	});

	redisDB.on('error', (err) => {
		console.error("Redis error: " + err);
	});

	let bcTables 	= require('./parsers').bcTables;
	udpListener.on('message', (msg, rinfo) => {
		// Разбираем заголовок
		let hdr = bcTables.getHdr(msg.slice(0,32));
		redisDB.hmset(`nt${hdr.nt}`,['nt', hdr.nt, 'utime', hdr.t, 'quantity', hdr.q]);
		// Разбираем тэги
		let tags_arr = [];
		for (let i = 0; i < hdr.q; i++) {
			let tag = bcTables.getTag(msg.slice(32 + i*6, 32 + i*6 + 6));
			tags_arr = tags_arr.concat(`ns${i}`, rValue(tag.value), `ns${i}sw`, tag.sw);
		}
		redisDB.hmset(`nt${hdr.nt}`,tags_arr);
	});

	udpListener.on('listening', () => {
		let address = udpListener.address();
		console.log(`udpListener listening ${address.address}:${address.port}`);
	});

	udpListener.bind(13000);
}

if (module.parent) {
	module.exports.run = run;
} else {
	run();
}
