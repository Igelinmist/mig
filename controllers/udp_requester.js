function init(waitingResponse, options={}) {
  const STATUS_OK = 0;
  const STATUS_SOCKET_ERROR = 1;
  const STATUS_TIMEOUT = 2;

  let destServ = options.destServ || '192.168.20.5';
  let destPort = options.destPort || 13041;
  let localPort = options.localPort || 13031;
  let exchangeResult = {};

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
  
  socket.on('error', () => {
     pushResult(STATUS_SOCKET_ERROR);
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
    socket.send(ptr.buf, destPort, destServ);
  }
  
  let rValue = require('../routines/index').rValue;

  socket.on('message', (msg) => {
    // Разбираем заголовок
    let hdr = udpResHeader.parse(msg.slice(0,16));
    // Разбираем исторические значения
    for (let i = 0; i < hdr.d; i++) {
      let tag = udpTagVal.parse(msg.slice(16 + i * 12, 16 + (i + 1) * 12));
      exchangeResult[`nt${hdr.nt}ns${hdr.ns}`].data.push([(tag.tt + 21600) * 1000, rValue(tag.value)]);
    }
    // console.log(`получил nt${hdr.nt}ns${hdr.ns}`);
    iterator.next(true);
  });

  function pushResult(status) {
    socket.close();
    for (let key in exchangeResult) {
      exchangeResult[key].data.sort((a, b) => {
        return a[0] - b[0];
      });
    }
    waitingResponse.status(200).send({dataSet: exchangeResult, status: status});   
  }

  function* reqIterator(tdc) {
    let mesRes = false;
    for (let key in tdc) {
      // Each tdc element look like 'nt54ns32'
      let [nt, ns] = tdc[key].substring(2).split('ns').map((el) => parseInt(el));
      sendRequest(nt, ns);
      timeoutId = setTimeout(() => {
        pushResult(STATUS_TIMEOUT);
      }, 5000);
      mesRes = yield;
      if (mesRes) clearTimeout(timeoutId);
    }
    pushResult(STATUS_OK);
  }

  let iterator;

  function UdpRequester() {}
  let udpRequester = new UdpRequester();

  udpRequester.askLast32Values = (tdc) => {
    // Инициализация объекта ответа (хоть чем-то ответить...)
    let names = require('../db/names');
    tdc.map((tag) => {
      exchangeResult[tag] = {
        data: [],
        label: names[tag]
      }
    });
    iterator = reqIterator(tdc); // Инициализация итератора
    iterator.next();  // Первый пинок итератору. Дальше управляется ответами.
  };

  socket.bind(localPort);
  return udpRequester;
}

module.exports = init;