const { Buffer } = require("buffer");
var fs = require('fs');

module.exports = {
  HTML: function (title, table, body, chart) {
    return eval('`'+fs.readFileSync(`lib/html/main/1.html`,'utf8')+'`');
  },
  list: function (section_number, result_date) {
    var list = '<h1 id="dark_title" style="text-align:center"><a href="/" style="color:white;">漢字勉強</a></h1><table id="section_table" class="dark_table"><tr style="background:#111114"><th colspan=3 style="color: white;">SECTION</th></tr>';
    for (var i = 0; i <= section_number; i = i + 1) {
      if (i % 3 == 0) {
        if (i == 0) { list = list + '<tr>' }
        else {
          list = list + '</tr><tr>'
        }
      }
      if (i != section_number) {
        list = list + `<td id="table_${i}"><a href="/?id=${i}">${i}</a>
      <p style="font-size:2vw;"class="dark_date">${result_date[i].split(' ')[0]}</p>
   </td>`}
      else {
        list = list + `<td id="table_${i}" colspan="${3 - (section_number % 3)}"><a href="/?id=${i}">${i}</a>
      <p style="font-size:2vw;"class="dark_date">${result_date[i].split(' ')[0]}</p>
   </td>`

      }

    }
    if (i - 1 % 3 != 2) { list = list + '</tr>' }
    list = list + '<tr style="background:#111114"><td colspan="3"><a href="/review">復習</a></td></tr></table>';
    return list;
  },
  kanji_table: function (raw_kanji_table, id) {
    var table = eval('`'+fs.readFileSync(`lib/html/main/2.html`,'utf8')+'`');
    var count = 0;
    raw_kanji_table.forEach(function (item) {
      table = table + `<tr>
        <td style="color:white;cursor:pointer" onclick="location.href='https://ja.dict.naver.com/#/search?range=all&query=${item.kanji}'";>${item.kanji}</td>
        <td>
          <p class="hovering dark_date" onclick="showAnswer('2_${count}');" >
            ${item.datetime}
          </p>
        </td>
        <td>
          <p style="opacity:0;color:white" id="2_${count++}">${item.oto}</p>
       </td>
    </tr>`
    })
    table = table + '</table>'
    return table;
  }
}