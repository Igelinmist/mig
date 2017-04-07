function run() {
	let dgram 			= require('dgram');
	let udpListener = dgram.createSocket('udp4');
	let rValue 			= require('./utils').rValue;
	let data = {};

	udpListener.on('error', (err) => {
		console.error(`udpListener error:\n${err.stack}`);
		udpListener.close();
	});

	let bcTables 	= require('./parsers').bcTables;
	udpListener.on('message', (msg, rinfo) => {
		// Разбираем заголовок
		let hdr = bcTables.getHdr(msg.slice(0,32));
		data[`nt${hdr.nt}`] = {nt: hdr.nt, utime: hdr.t * 1000, quantity: hdr.q};
		// Разбираем тэги
		let tags_arr = [];
		for (let i = 0; i < hdr.q; i++) {
			let tag = bcTables.getTag(msg.slice(32 + i*6, 32 + i*6 + 6));
			data[`nt${hdr.nt}`][`ns${i}`] = rValue(tag.value);
			data[`nt${hdr.nt}`][`ns${i}sw`] = tag.sw;
		}
	});

	udpListener.on('listening', () => {
		let address = udpListener.address();
		console.log(`udpListener listening ${address.address}:${address.port}`);
	});

	udpListener.bind(13000);

	exports.data = data;
}

if (module.parent) {
	module.exports.run = run;
} else {
	run();
}