
let Parser = require('binary-parser').Parser;

var broadcastTables = {
  // Структура заголовка
  udpHeader: new Parser()
    .int32le('nt')
    .int32le('len')
    .int32le('q')
    .int32le('st')
    .int32le('typ')
    .uint32le('t')
    .int32le('tr')
    .uint32('tt'),
  // Структура тэга
  udpTag: new Parser()
    .floatle('value')
    .uint16le('sw'),
  getHdr: function(buf) {return broadcastTables.udpHeader.parse(buf)},
  getTag: function(buf) {return broadcastTables.udpTag.parse(buf)}
}

var last32Resp = {
  // Парсер заголовка
  hdrParser: new Parser()
    .uint32le('L')
    .uint32le('nt')
    .uint32le('ns')
    .uint32le('d'),
  // Парсер исторического значения тэга
  valParser: new Parser()
    .uint32le('tt')
    .int32le('r')
    .floatle('value'),
  getHdr: function(buf) {return last32Resp.hdrParser.parse(buf)},
  getVal: function(buf) {return last32Resp.valParser.parse(buf)}
}

function last32Req(localPort, nt, ns) {
  let t = require('typebase'); 
  reqStruct = t.Struct.define([
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
  return ptr.buf;
}


module.exports = {bcTables:broadcastTables, last32Resp:last32Resp, last32Req:last32Req}


/* Справочно:
  // с++ Структуры широковещательных udp пакетов данных

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

 C++ структуры запроса последних 32 значений параметра AsIs от Марка
запрос
struct ASK_PG_B1
      {
        time_t t_;            0
        int i1;                     0
        time_t t;              0
        int i2;                    0
        int d;                     0
        unsigned short nt;      nt
        unsigned short ns;     ns
        unsigned short typ;      4
        unsigned short q;        32
        int r;                                  0
        int p;                 0 – если local port  динамический,   
                              если задаешь сам то значение local port  (должно быть больше 11000)
      };


ответ
struct TTFL
       {
        time_t t;
        int r;  //reserve
        float f;
       };

struct ANS_4
       {
        uint L;           =400
        uint nt;
        uint ns;
        uint d;          
        struct TTFL tf[32];   
     }
*/