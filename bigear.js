const dgram = require('dgram');

const server = dgram.createSocket('udp4');

const Parser = require('binary-parser').Parser;

const dateFormat = require('dateformat');

var udpHeader = new Parser()
	.int32le('nt')
	.int32le('len')
	.int32le('q')
	.int32le('st')
	.int32le('typ')
	.uint32le('t')
	.int32le('tr')
	.uint32('tt');

server.on('error', (err) => {
	console.log(`server error:\n${err.stack}`);
	server.close();
});

server.on('message', (msg, rinfo) => {
	var headBuf = msg.slice(0,32);
	var hdr = udpHeader.parse(headBuf)

	console.log(`server got: nt=${hdr.nt} data_cnt=${hdr.q} time_stamp=${dateFormat(hdr.t * 1000, ' dd.mm.yyyy hh:MM:ss')}`);
});

server.on('listening', () => {
	var address = server.address();
	console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(13000);
