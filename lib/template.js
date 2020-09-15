const { Buffer } = require("buffer");

module.exports = {
  HTML: function (title, table, body, chart) {
    return `<!DOCTYPE html>
        <html>
        <head>
        <script>
    function showAnswer(id) {
        if (document.getElementById(id).style.opacity == "1") {
            document.getElementById(id).style.opacity = 0;
        } else {
            document.getElementById(id).style.opacity = 1;
        }
    }
    </script>
    <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
      </script><script type="text/javascript">
      google.charts.load('current', { packages: ['corechart', 'bar'] });
      google.charts.setOnLoadCallback(drawStacked);
  
      function drawStacked() {
        var data = new google.visualization.DataTable();
        data.addColumn('string', '部分');
        data.addColumn('number', '正答');
        data.addColumn('number', '誤答');
  
        data.addRows([
      ${chart}
    ]);

    var options = {
      title: '暗記現況',
      isStacked: true
    };

    var chart = new google.visualization.ColumnChart(document.getElementById('test_result'));
    chart.draw(data, options);
  }
</script>
    <style>
    .list{
        border: 1px solid black;
        border-collapse: collapse;
    }
 a:visited { color: black; text-decoration: none;}
 a:hover { color: blue; text-decoration: underline;}
 #table_${title}
 {background: aliceblue;}
 input[type=submit] {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 16px 32px;
  text-decoration: none;
  margin: 4px 2px;
  cursor: pointer;
}
    </style>
  

            <title>漢字勉強 - ${title}</title>
        </head>
        <body>
        ${table}
        ${body}
        <div style="text-align:center;margin:1vh 2vw 1vh 2vw;"><a href="/update"><input style="font-size:4vw;" type="submit" value="更新"></a></div>
        <div style="text-align:center;margin:auto;margin: 1vh 2vw 1vh 2vw;"><a href="/get"><input type="submit" value="收集" style="font-size:4vw;"></a></div>
        <div id="test_result" style="text-align:center;margin:auto; width: 80vw; height: 50vh"></div>
        </body>
    `;
  },
  list: function (section_number, result_date) {
    var list = '<h1 style="text-align:center;font-size:10vw;"><a href="/">漢字勉強</a></h1><table class="list" style="width:30vw;height:30vw;font-size:5vw;margin:auto;text-align: center;border:1px black;"><tr class="list" style="background:grey"><th class="list" colspan=3>SECTION</th></tr>';
    for (var i = 0; i <= section_number; i = i + 1) {
      if (i % 3 == 0) {
        if (i == 0) { list = list + '<tr>' }
        else {
          list = list + '</tr><tr>'
        }
      }
      if (i != section_number) {
        list = list + `<td class="list" id="table_${i}"><a href="/?id=${i}">${i}</a>
      <p style="font-size:2vw;"><nobr>${result_date[i]}시</nobr></p>
   </td>`}
      else {
        list = list + `<td class="list" id="table_${i}" colspan="${3 - (section_number % 3)}"><a href="/?id=${i}">${i}</a>
      <p style="font-size:2vw;"><nobr>${result_date[i]}시</nobr></p>
   </td>`

      }

    }
    if (i - 1 % 3 != 2) { list = list + '</tr>' }
    list = list + '<tr style="background:grey"><td colspan="3"><a href="/review">復習</a></td></tr></table>';
    return list;
  },
  kanji_table: function (raw_kanji_table, id) {
    var table = `<div style="text-align:center;margin:auto;margin: 1vh 2vw 1vh 2vw;"><a href="/get"><input type="submit" value="收集" style="font-size:4vw;"></a></div><form style="text-align:center;margin: 1vh 2vw 1vh 2vw;" method="post" action="/test">
    <input type="hidden" value="${id}" name="section">
    <input type="submit" value="試驗" style="font-size:4vw">
</form><table id="kanji_table" style="width:20vw;font-size:5vw;margin:auto;">
    <tr style="background-color:darkgray">
      <th>字</th>
      <th>SHOW</th>
      <th>音</th>
    </tr>`;
    var count = 0;
    raw_kanji_table.forEach(function (item) {
      table = table + `<tr>
        <td>${item.kanji}</td>
        <td>
          <p style="text-align:center;cursor:pointer;font-size:3vw;" onclick="showAnswer('2_${count}');" >
            <nobr>${item.datetime}
          </p>
        </td>
        <td>
          <p style="opacity:0" id="2_${count++}">${item.oto}</p>
       </td>
    </tr>`
    })
    table = table + '</table>'
    return table;
  }
}