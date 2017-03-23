function run() {
	var dgram = require('dgram');

	var Parser = require('binary-parser').Parser;

	var redisClient = require('redis'),
			redisDB = redisClient.createClient();

	var udpListener = dgram.createSocket('udp4');

	/*
		// с++ Структуры udp пакетов данных

		struct UDP_T_H //заголовок UDP_T
		{
		    int n;   // N таблицы (nt)
		    int len; // длина пакета
		    int q;   // кол-во тегов
		    int st;  // стартовый тег (=0)
		    int typ; // тип пакета (0 - реальное время; 3,4 - для интегральных мостов)
		    struct FILE_T_H fh; // метка времени
		};
		struct FILE_T_H
		{
		    uint t;//time_t t;
		    int tr; // резерв
		    struct TIM_AND_ZONE tt; // микросекунды
		};
		{
		    uint mks : 20;  //mikrosec
		    uint r0 : 6;   //reserve
		    int   tz : 6;   // (localtim-UTC) in hour
		};
		// Затем идут q штук тегов структуры WTEG_1
		struct WTEG_1 //структура данных
		{
		    float f;     // значение тега
		    STATE_WORDU sw; // статус
		};
		union STATE_WORDU // статус
		{
		    struct STATE_WORD s;
		    unsigned short u;
		    short h;
		};
	*/

	function rValue(val) {
		if (Math.abs(val) < 10) return val.toFixed(2);
		if (Math.abs(val) < 1000) return val.toFixed(1);
		return Math.round(val);
	}

	// Парсер заголовка
	var udpHeader = new Parser()
		.int32le('nt')
		.int32le('len')
		.int32le('q')
		.int32le('st')
		.int32le('typ')
		.uint32le('t')
		.int32le('tr')
		.uint32('tt');

	// Парсер тэга
	var udpTag = new Parser()
		.floatle('value')
		.uint16le('sw');

	udpListener.on('error', (err) => {
		console.error(`udpListener error:\n${err.stack}`);
		udpListener.close();
	});

	redisDB.on('error', (err) => {
		console.error("Redis error: " + err);
	});

	udpListener.on('message', (msg, rinfo) => {
		// Разбираем заголовок
		var hdr = udpHeader.parse(msg.slice(0,32));
		redisDB.hmset(`nt${hdr.nt}`,['nt', hdr.nt, 'utime', hdr.t, 'quantity', hdr.q]);
		// Разбираем тэги
		var tags_arr = [];
		for (var i = 0; i < hdr.q; i++) {
			var tag = udpTag.parse(msg.slice(32 + i*6, 32 + i*6 + 6));
			tags_arr = tags_arr.concat(`ns${i}`, rValue(tag.value), `ns${i}sw`, tag.sw);
		}

		redisDB.hmset(`nt${hdr.nt}`,tags_arr);
	});

	udpListener.on('listening', () => {
		var address = udpListener.address();
		console.log(`udpListener listening ${address.address}:${address.port}`);
	});

	udpListener.bind(13000);

}

if (module.parent) {
	module.exports.run = run;
} else {
	run();
}
