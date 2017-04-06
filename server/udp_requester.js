function init(waitingResponse, options={}) {

  let destServ = options.destServ || '192.168.20.5';
  let destPort = options.destPort || 13041;
  let localPort = options.localPort || 13031;
  let exchangeResult = {};
  let socket = require('dgram').createSocket('udp4');

  const STATUS_OK = 0;
  const STATUS_SOCKET_ERROR = 1;
  const STATUS_TIMEOUT = 2;

  let timeEdge = new Date().getTime() - 1800000;
  
  socket.on('error', () => {
     pushResult(STATUS_SOCKET_ERROR);
  });

  last32Req = require('./parsers').last32Req;
  
  function sendRequest(nt, ns) {
    socket.send(last32Req(localPort, nt, ns), destPort, destServ);
  }
  
  let rValue = require('./utils').rValue;
  let last32Resp = require('./parsers').last32Resp;

  socket.on('message', (msg) => {
    let hdr = last32Resp.getHdr(msg.slice(0,16));
    for (let i = 0; i < hdr.d; i++) {
      let tag = last32Resp.getVal(msg.slice(16 + i * 12, 16 + (i + 1) * 12));
      if (tag.tt * 1000 > timeEdge) {
        exchangeResult[`nt${hdr.nt}ns${hdr.ns}`].data.push([(tag.tt + 21600) * 1000, rValue(tag.value)]);
      }
    }
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
      let [nt, ns] = tdc[key].match(/^nt(\d+)ns(\d+)$/).slice(1, 3);
      sendRequest(nt, ns);
      timeoutId = setTimeout(pushResult, 5000, STATUS_TIMEOUT);
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
    tdc.map((tag) => exchangeResult[tag] = {data: [], label: names[tag]});
    iterator = reqIterator(tdc); // Инициализация итератора
    iterator.next();  // Первый пинок итератору. Дальше управляется ответами.
  };

  socket.bind(localPort);
  return udpRequester;
}

module.exports = init;