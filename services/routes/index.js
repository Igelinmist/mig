let express = require('express');
let async = require('async');

let router = express.Router();

let redisClient = require('redis'),
    redisDB = redisClient.createClient();


router.get('/api', function (req, res) {
    res.send('API is running');
});

router.get('/api/nt/:id', (req, res) => {
  redisDB.hgetall(`nt${req.params.id}`, (err, nt_data) => {
    if (!nt_data) {
      console.error('Redis error. Not found nt:%s', req.params.id);
      return res.status(404).send({error: `Not found nt:${req.params.id}`});
    }
    if (!err) {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(nt_data);
    } else {
      console.error("Redis error: " + err);
      res.status(500).send({error: "Redis error: " + err})
    }
  });
});

router.get('/api/micdata', (req, res) => {
  let paramList = req.query.paramList;
  let mdata = {};
  let ntnsRe = /nt(\d+)ns(\d+)/;
   
  async.each(
    paramList,
    function(prm, callback) {
      let [nt_id, ns_id] = ntnsRe.exec(prm).slice(1, 3);
      redisDB.hmget(`nt${nt_id}`, `ns${ns_id}`, (err, ns_value) => {
        if (err) {
          console.error(err);
          res.status(200).end("Server error");
          return;
        }
        if (!(`nt${nt_id}` in mdata)) mdata[`nt${nt_id}`] = {};

        mdata[`nt${nt_id}`][`ns${ns_id}`] = ns_value[0];
        callback();
      });
    },
    function(err) {
      if (err) {
        console.error(err);
        res.status(200).end("Server error");
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify(mdata));
    }
  );
});

router.get('/api/nt/:nt_id/ns/:ns_id', (req, res) => {
  redisDB.hmget(`nt${req.params.nt_id}`, `ns${req.params.ns_id}`, (err, ns_value) => {
    if (!ns_value) {
      return res.status(404).send({error: `Not found param nt:${req.params.nt_id} ns:${req.params.ns_id}`});
    }
    if (!err) {
      res.send(ns_value);
    } else {
      console.error("Redis error: " + err);
      res.status(500).send({error: "Redis error: " + err})
    }
  });
});

router.get('/api/tagcache', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  var udpRequester = require('../udp_request')(res);
  let tdc = req.query.tdc;
  udpRequester.askLast32Values(tdc);
});

module.exports.router = router;
module.exports.express = express;