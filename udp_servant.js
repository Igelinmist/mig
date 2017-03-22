var Parser = require('binary-parser').Parser;

// Парсер заголовка
var udpResHeader = new Parser()
  .uint32le('L')
  .uint32le('nt')
  .uint32le('ns')
  .uint32le('d');

// Парсер исторического значения тэга
var udpTagVal = new Parser()
  .uint32le('tt')
  .int32le('r')
  .floatle('value');

// Объект для обслуживания UDP запрос-ответов
var udpServant = {
    destServ: '192.168.20.5',
    destPort: 13041,
    localPort: 13031,
    init: function() {
      var self = udpServant;
      var dgram = require('dgram');
      self.server = dgram.createSocket('udp4');
      self.server.bind(self.localPort);   
    },
    closePort: function() {
      var self = udpServant;
      self.server.close();
    },
    sendReq: function(buf) {
      var self = udpServant;
      self.server.send(buf, self.destPort, self.destServ, () => {
        //console.log('Sent message: ', buf);
      });
    },
    serveError: function(err) {
      var self = udpServant;
      console.error(`server error:\n${err.stack}`);
      self.server.close();
    },
    serveListening: function() {
      var self = udpServant;
      var address = self.server.address();
      console.log(`server listening ${address.address}:${address.port}`);
    },
    serveMessage: function(msg, rinfo) {
      var self = udpServant;
      //console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
      // Разбираем заголовок
      var hdr = udpResHeader.parse(msg.slice(0,16));
      console.log(`nt: ${hdr.nt} ns: ${hdr.ns}`);
      for (var i = 0; i < hdr.d; i++) {
        var tag = udpTagVal.parse(msg.slice(16 + i * 12, 16 + (i + 1) * 12));
        console.log(`tt: ${tag.tt} val: ${tag.value}`);
      }
    }
};

udpServant.init();

udpServant.server.on('error', (err) => {
  udpServant.serveError(err);
});

udpServant.server.on('listening', () => {
  udpServant.serveListening()
});

udpServant.server.on('message', (msg, rinfo) => {
  udpServant.serveMessage(msg, rinfo)
});


var t = require('typebase');
var reqStruct = t.Struct.define([
    ['time_t1', t.i32],
    ['i1', t.i32],
    ['time_t', t.i32],
    ['i2', t.i32],
    ['d', t.i32],
    ['nt', t.ui16],
    ['ns', t.ui16],
    ['typ', t.ui16],
    ['q', t.ui16],
    ['r', t.i32],
    ['p', t.i32]
]);
 
var p = new t.Pointer(new Buffer(reqStruct.size), 0);
var req = {
    time_t1: 0,
    i1: 0,
    time_t: 0,
    i2: 0,
    d: 0,
    nt: 104,
    ns: 1,
    typ: 4,
    q: 32,
    r: 0,
    p: udpServant.localPort
};
reqStruct.pack(p, req);

udpServant.sendReq(p.buf);

// console.log(p.buf);
