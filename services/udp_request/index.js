function init(waitingResponse, options={}) {  
  let destServ = options.destServ || '192.168.20.5';
  let destPort = options.destPort || 13041;
  let localPort = options.localPort || 13031;
  let exchangeResult = {};
  let requestCounter = 0;

  let Parser = require('binary-parser').Parser;
  // Парсер заголовка
  let udpResHeader = new Parser()
    .uint32le('L')
    .uint32le('nt')
    .uint32le('ns')
    .uint32le('d');

  // Парсер исторического значения тэга
  let udpTagVal = new Parser()
    .uint32le('tt')
    .int32le('r')
    .floatle('value');
  
  let socket = require('dgram').createSocket('udp4');
  
  socket.on('error', (err) => {
     console.log(err);
  });

  // Определение структуры буфера запроса
  let t = require('typebase'); 
  let reqStruct = t.Struct.define([
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

  function sendRequest(nt, ns) {
    let ptr =  new t.Pointer(new Buffer(reqStruct.size), 0); 
    let req = {
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
        p: localPort
    };
    reqStruct.pack(ptr, req);
    socket.send(ptr.buf, destPort, destServ, () => {
      requestCounter++;
    });
  };
  
  let rValue = require('../routines').rValue;

  socket.on('message', (msg, rinfo) => {
    requestCounter--;
    // Разбираем заголовок
    let hdr = udpResHeader.parse(msg.slice(0,16));
    exchangeResult[`nt: ${hdr.nt} ns: ${hdr.ns}`] = [];
    // Разбираем исторические значения
    for (let i = 0; i < hdr.d; i++) {
      let tag = udpTagVal.parse(msg.slice(16 + i * 12, 16 + (i + 1) * 12));
      exchangeResult[`nt: ${hdr.nt} ns: ${hdr.ns}`].push([tag.tt * 1000, rValue(tag.value)]);
    }
    if (requestCounter == 0) {
      waitingResponse.status(200).send(JSON.stringify(exchangeResult));
      socket.close();  
    }
  });

  function UdpRequester() {}
  let udpRequester = new UdpRequester();

  udpRequester.askLast32Values = (tdc) => {
    let async = require('async');
    let ntnsRe = /nt(\d+)ns(\d+)/;
   
    async.each(
      tdc,
      (prm, callback) => {
        let [nt_id, ns_id] = ntnsRe.exec(prm).slice(1, 3);
        sendRequest(nt_id, ns_id);
        callback();
      },
      (err) => {
        if (err) {
          console.error('Error occured in async udp send: ', err);
        } else {
          setTimeout(() => {
            if (requestCounter > 0) {
              waitingResponse.status(200).send(JSON.stringify(exchangeResult));
              socket.close();            
            }
          }, 5000);
        }
      }
    );
  };


  socket.bind(localPort);

  return udpRequester;
}

module.exports = init;