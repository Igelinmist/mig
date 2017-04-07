let express = require('express');
let async = require('async');
let router = express.Router();

router.get('/api', function (req, res) {
    res.send('API is running');
});

router.get('/api/nt/:id', (req, res) => {
  let data = require('./udp_listener').data;
  if (`nt${req.params.id}` in data)
    res.status(200).send(data[`nt${req.params.id}`]);
  else
    res.status(404).send({error: 'table not found'});
});

router.get('/api/micdata', (req, res) => {
  let paramList = req.query.paramList;
  let data = require('./udp_listener').data;
  let res_data = {};
  let ntnsRe = /(nt\d+)(ns\d+)/;
  paramList.map((tag) => {
    let [nt_id, ns_id] = tag.match(ntnsRe).slice(1, 3);
    if (!(nt_id in res_data)) res_data[nt_id] = {};
    // При перезапуске не всегда успевают придти данные по всем таблицам
    // приходится подставлять ноль
    res_data[nt_id][ns_id] = data[nt_id]?(data[nt_id][ns_id]?data[nt_id][ns_id]:0):0;
  });
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(res_data));
});

router.get('/api/nt/:nt_id/ns/:ns_id', (req, res) => {
  let data = require('./udp_listener').data;
  let nt = req.params.nt_id;
  let ns = req.params.ns_id;
  if ((`nt${nt}` in data) && (`ns${ns}` in data[`nt${nt}`])) {
    res.setHeader('Content-Type', 'application/json');
    let res_data = {};
    res_data[`nt${nt}`] = {};
    res_data[`nt${nt}`].nt = data[`nt${nt}`].nt;
    res_data[`nt${nt}`].utime = data[`nt${nt}`].utime;
    res_data[`nt${nt}`][`ns${ns}`] = data[`nt${nt}`][`ns${ns}`];
    res.status(200).send(JSON.stringify(res_data));
  } else {
    res.status(404).send({error: 'param not found'});
  }
});

router.get('/api/tagcache', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let udpRequester = require('./udp_requester')(res);
  let tdc = req.query.tdc;
  udpRequester.askLast32Values(tdc);
});

module.exports.router = router;
module.exports.express = express;