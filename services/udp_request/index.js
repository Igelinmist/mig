function init(options={}) {
  
  var Parser = require('binary-parser').Parser;

  function UdpRequester() {}

  var udpRequester = new UdpRequester();
    
  udpRequester.destServ = options.destServ || '192.168.20.5';
  udpRequester.destPort = options.destPort || 13041;
  udpRequester.localPort = options.localPort || 13031;

  function openPort(port) {
    var socket = require('dgram').createSocket('udp4');
    socket.bind(port);
    return socket;
  }

  function sendReq(buf) {
    udpRequester.udpSocket.send(buf, udpRequester.destPort, udpRequester.destServ, () => {})
  }

  // Парсер заголовка
  udpRequester.udpResHeader = new Parser()
    .uint32le('L')
    .uint32le('nt')
    .uint32le('ns')
    .uint32le('d');

  // Парсер исторического значения тэга
  udpRequester.udpTagVal = new Parser()
    .uint32le('tt')
    .int32le('r')
    .floatle('value');


  // Открытый сокет
  udpRequester.udpSocket = openPort(udpRequester.localPort);
  
  udpRequester.udpSocket.on('listening', () => {
    var address = udpRequester.udpSocket.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });

  udpRequester.udpSocket.on('error', (err) => {
    console.error(`server error:\n${err.stack}`);
    udpRequester.udpSocket.close();
  });

  udpRequester.udpSocket.on('message', (msg, rinfo) => {
    // Разбираем заголовок
    var hdr = udpRequester.udpResHeader.parse(msg.slice(0,16));
    console.log(`nt: ${hdr.nt} ns: ${hdr.ns}`);
    for (var i = 0; i < hdr.d; i++) {
      var tag = udpRequester.udpTagVal.parse(msg.slice(16 + i * 12, 16 + (i + 1) * 12));
      console.log(`tt: ${tag.tt} val: ${tag.value}`);
    }
  });

  // Определение структуры буфера запроса
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
    ]
  );

  udpRequester.askLast32Values = (nt, ns) => {
  
    var p =  new t.Pointer(new Buffer(reqStruct.size), 0);
    
    var req = {
        time_t1: 0,
        i1: 0,
        time_t: 0,
        i2: 0,
        d: 0,
        nt: nt,
        ns: ns,
        typ: 4,
        q: 32,
        r: 0,
        p: udpRequester.localPort
    };
    
    reqStruct.pack(p, req);

    sendReq(p.buf);
  }

  udpRequester.getLast32Values = function(nt, ns) {
    var res = {};
    console.log('getLast32Values ', udpRequester.destServ);
    return res;
  }

  return udpRequester;
}

module.exports = init;