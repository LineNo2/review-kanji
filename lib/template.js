const { Buffer } = require("buffer");

module.exports = {
  HTML: function (title, table, body, chart) {
    return `<!DOCTYPE html>
        <html>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
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
      isStacked: true,
      backgroundColor: '#1a1a1f',
      legendTextStyle: { color: 'white' },
      titleTextStyle: { color: 'white' },
      hAxis: {
          textStyle: { color: 'white' }
      },
      vAxis: {
        ticks: [0, 30, 40, 45, 50, 55],
        textStyle: { color: 'white' }
    },
    colors: ['#3700b3', '#BB86FC']
    };

    var chart = new google.visualization.ColumnChart(document.getElementById('test_result'));
    chart.draw(data, options);
  }
</script>
    <style>
    body {
      background-color: #1a1a1f;
  }

  .list,#kanji_table {
      border-width: 1px;
      border-radius: 8px;
      border-collapse: collapse;
  }

  a {
      text-decoration: none;
      color: white;
  }

  a:visited {
      color: rgb(48, 48, 51);
      text-decoration: none;
  }


  #table_ {
      background: aliceblue;
  }

  input[type=submit] {
      box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3);
      background-color: #111114;
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      margin: none;
      cursor: pointer;
      border-collapse: collapse;
      border-width: 1px;
      border-radius: 8px;
      border-color: transparent;
  }

  nobr {
      color: #787878;
  }
  #table_${title}>a,  a:hover, input[type=submit]:hover {
    animation: color-change 1.5s infinite;
  }
  
  @keyframes color-change {
    0% { color: white; }
    50% { color: #1a1a1f; }
    100% { color: white; }
  }


  #section_table{width:80vw;box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3);font-size:5vw;margin:auto;text-align: center;}
  #kanji_table{width:80vw;box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3);font-size:5vw;margin:auto;text-align: center;}
  @media (min-width: 768px) {
    #section_table{
      width:60vw;
    }
    #kanji_table{
      width:60vw;
    }
  }
  @media (min-width: 1023px) {
    #section_table{
      width:50vw;
    }
    #kanji_table{
      width:50vw;
    }
  }

  ::-moz-selection { background-color:white; color: black}::selection {background-color:white;color: black;}::-webkit-scrollbar { width: 2vw;}::-webkit-scrollbar-track { background: white; } ::-webkit-scrollbar-thumb { background: #888; }::-webkit-scrollbar-thumb:hover { background: #555; }
    </style>
  

            <title>漢字勉強 - ${title}</title>
        </head>
        <body>
        ${table}
        ${body}
        <div style="text-align:center;margin:3vh 2vw 3vh 2vw;"><a href="/update"><input style="font-size:4vw;margin-right:3vw ;" type="submit"
                value="更新"></a><a href="/get"><input type="submit" value="收集" style="font-size:4vw;margin-left:3vw ;"></a></div>
        <div id="test_result" style="text-align:center;margin:auto; width: 80vw; height: 50vh"></div>
        </body>
    `;
  },
  list: function (section_number, result_date) {
    var list = '<h1 style="text-align:center;font-size:10vw;"><a href="/" style="color: white">漢字勉強</a></h1><table id="section_table" class="list"><tr class="list" style="background:#111114"><th class="list" colspan=3 style="color: white;">SECTION</th></tr>';
    for (var i = 0; i <= section_number; i = i + 1) {
      if (i % 3 == 0) {
        if (i == 0) { list = list + '<tr>' }
        else {
          list = list + '</tr><tr>'
        }
      }
      if (i != section_number) {
        list = list + `<td class="list" id="table_${i}"><a href="/?id=${i}">${i}</a>
      <p style="font-size:2vw;"><nobr>${result_date[i].split(' ')[0]}</nobr></p>
   </td>`}
      else {
        list = list + `<td class="list" id="table_${i}" colspan="${3 - (section_number % 3)}"><a href="/?id=${i}">${i}</a>
      <p style="font-size:2vw;"><nobr>${result_date[i].split(' ')[0]}</nobr></p>
   </td>`

      }

    }
    if (i - 1 % 3 != 2) { list = list + '</tr>' }
    list = list + '<tr style="background:#111114"><td colspan="3"><a href="/review">復習</a></td></tr></table>';
    return list;
  },
  kanji_table: function (raw_kanji_table, id) {
    var table = `<div style="text-align:center;margin:auto;margin: 3vh 2vw 3vh 2vw;"><a href="/get"><input type="submit" value="收集" style="font-size:4vw;margin-right:3vw"></a><form style="text-align:center;margin: 1vh 2vw 1vh 2vw;display:inline-block;" method="post" action="/test">
    <input type="hidden" value="${id}" name="section">
    <input type="submit" value="試驗" style="font-size:4vw; margin-left:3vw">
</form></div><table id="kanji_table">
    <tr style="background-color:#111114;color: white;">
      <th>字</th>
      <th>SHOW</th>
      <th>音</th>
    </tr>`;
    var count = 0;
    raw_kanji_table.forEach(function (item) {
      table = table + `<tr>
        <td style="color:white">${item.kanji}</td>
        <td>
          <p class="hovering" style="text-align:center;cursor:pointer;font-size:3vw;" onclick="showAnswer('2_${count}');" >
            <nobr>${item.datetime}
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