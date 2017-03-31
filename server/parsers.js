
/*
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
*/
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
  getHdr: function(buf) {
    return broadcastTables.udpHeader.parse(buf);
  },
  getTag: function(buf) {
    return broadcastTables.udpTag.parse(buf);
  }
}

module.exports = {bcTables:broadcastTables}