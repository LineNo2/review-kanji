var http = require('http');
var url = require('url');
var qs = require('querystring');

var template = require('./lib/template.js');
var db = require('./lib/db.js');
var getKanji = require('./getKanjiFromNaver.js');


var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === '/') {
    db.query(`SELECT * FROM section_information;`, function (error_1, result_section, fields2) {
      if (error_1) {
        console.log("error_1");
      }
      console.log(result_section);
      var section_number = result_section.length - 1;
      var result_date = new Array(result_section.length);
      console.log(section_number);
      for (var i = 0; i <= section_number; i++)
        result_date[i] = result_section[i]['uploaded_date'];
      console.log(result_date);
      var list = template.list(section_number, result_date);
      var chart = '';
      var count = 0;
      result_section.forEach(function (item) {
        if (section_number + 1 != count && count != 0) { chart += ","; }
        chart += `['部分${item.id}', ${item.memorized} ,${item.total - item.memorized} ]`;
        count++;
      });
      if (queryData.id === undefined) {
        var title = '';
        var HTML = template.HTML(title, list, '', chart);
        response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        response.end(HTML);
      } else {
        var title = queryData.id;
        console.log(title);
        db.query(`SELECT * FROM kanji WHERE section=${title} ORDER BY RAND();`, function (error_2, results_kanji, fields) {
          if (error_2) {
            console.log(error_2);
          }
          var kanji_table = template.kanji_table(results_kanji, title);
          var HTML = template.HTML(title, list, kanji_table, chart);
          response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
          response.end(HTML);
        });
      }
    });
  }
  else if (pathname === '/test') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var html = '';
      response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
      // fs.readFile("./test_page.html", 'utf-8', function (err, data) {
      //   response.end(data);
      // });
      html = `<!DOCTYPE html> <html> <head> <title>TEST - ${post.section}</title> </head> <script>var item_total; var index=0; `
      db.query(`SELECT * FROM kanji WHERE section=${post.section} ORDER BY RAND();`, function (error3, results_kanji, fields) {
        var index = 0;
        var kanji_count = results_kanji.length;
        html += `var item_total=${kanji_count};var kanji_table = {`
        results_kanji.forEach(function (item) {
          html += `${index++} : "${item.kanji}"`
          if (index != kanji_count) { html += `,` }
          else {
            html += `}</script> <script src="https://code.jquery.com/jquery-3.5.1.min.js"integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script><style> ::-webkit-scrollbar { width: 2vw;}::-webkit-scrollbar-track { background: white; } ::-webkit-scrollbar-thumb { background: #888; }::-webkit-scrollbar-thumb:hover { background: #555; }::-moz-selection { background-color:white; color: black}::selection {background-color:white;color: black;} body { background-color: #1a1a1f; overflow: hidden; } a { text-decoration: none; color: white; } a:visited { text-decoration: none; } input[type=submit], button { box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3); background-color: #111114; color: white; padding: 16px 32px; text-decoration: none; margin: none; cursor: pointer; border-collapse: collapse; border-width: 1px; border-radius: 8px; border-color: transparent; } input::placeholder{ color: white; } </style><body> <a href="/"> <h1 style="text-align: center;font-size: 3vw;">漢字勉強</h1> </a> <div id="scoreboard" style="text-align:center; font-size:5vw;color:white;"><span id="current_index">1</span>/<span id="total_index"></span></div><div style="text-align: center;"><h2 style="display:inline-block;font-size:15vw; text-align: center; margin-top: 0;margin-bottom: 0;margin-right: 3vw;color:white;" id="kanji">${results_kanji[0].kanji}</h2>  <input type="text" id="textbox" placeholder="音" style="width:13vw;background-color:#111114;color: white; font-size:13vw;margin-left:3vw;"> <p> <button id="execute" style="width:20vw; font-size:7vw;">堤出</button></p> <form method="post" action="/result"> <input type="hidden" name="section" value="${post.section}"> <input id ="move" style="width:20vw; font-size:7vw; opacity:0;margin:10vh" type="submit" value="移動"> </form> </div> <div class="getScript"></div> <script> $('#total_index').text(item_total);function ajaxSend() { $.ajax({ url: "https://review-kanji.herokuapp.com/score_process", data: { answer: $('#textbox').val(), kanji: $('#kanji').text(), }, type: "POST", success: function (result) { $(".getScript").html(result); $('#kanji').text(kanji_table[index]);$('#current_index').text(index+1); $('#textbox').val(''); if(index==item_total){ $('#execute').fadeOut(); $('#textbox').fadeOut();  $('#scoreboard').fadeOut(); $('#kanji').fadeOut(); $('#move').css('opacity','1'); } } });} $('#execute').click(function () { ajaxSend(); }); $(document).keypress(function(event){ var keycode = (event.keyCode ? event.keyCode : event.which); if(keycode == '13'){ ajaxSend(); } }); </script></body></html>`;
          }
        });
        response.end(html);
      });
    });
  }
  else if (pathname === '/score_process') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var title = post.answer;
      db.query(`SELECT oto FROM kanji WHERE kanji="${post.kanji}";`, function (error_score_process, result, fields2) {
        if (error_score_process) {
          console.log("error occured");
        }
        else {
          sql = `UPDATE kanji SET result=0 WHERE kanji="${post.kanji}";`
          if (post.answer == result[0]['oto']) {
            if (request.headers.referer.split("/")[3] === "test") {
              response.writeHead(200);
              response.end(`<script>alert("you are right");index++;</script>`);
            }
            sql = `UPDATE kanji SET result=1 WHERE kanji="${post.kanji}";`
            db.query(sql, function (error_score_process_if, result, fields2) {
              if (error_score_process_if) {
                console.log("error_score_process_if has an error");
              }
              response.writeHead(200);
              response.end(`<script>alert("you are right");index++;</script>`);
            });
          }
          else {
            if (request.headers.referer.split("/")[3] === "test") {
              response.writeHead(200);
              response.end(`<script>alert("you are wrong");index++;</script>`);
            }
            db.query(sql, function (error_score_process_else, result, fields2) {
              if (error_score_process_else) {
                console.log("error_score_process_else  has an error");
              }
              response.writeHead(200);
              response.end(`<script>alert("you are wrong");index++;</script>`);
            });
          }
        }
      });
    });
  }
  else if (pathname === '/result') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      db.query(`SELECT * FROM kanji WHERE section="${post.section}";`, function (error_result, result, fields2) {
        var html = `<!DOCTYPE html> <html> <head> <title>RESULT: TEST-${post.section}</title><style> .slideUp { animation-name: slideUp; -webkit-animation-name: slideUp; animation-duration: 1s; -webkit-animation-duration: 1s; visibility: visible !important; } @keyframes slideUp { 0% { opacity: 0; -webkit-transform: translateY(70%); } 100% { opacity: 1; -webkit-transform: translateY(0%); } } @-webkit-keyframes slideUp { 0% { opacity: 0; -webkit-transform: translateY(70%); } 100% { opacity: 1; -webkit-transform: translateY(0%); } } ::-webkit-scrollbar { width: 2vw; } ::-webkit-scrollbar-track { background: white; } ::-webkit-scrollbar-thumb { background: #888; } ::-webkit-scrollbar-thumb:hover { background: #555; } ::-moz-selection { background-color: white; color: black } ::selection { background-color: white; color: black; } body { background-color: #1a1a1f; } a { text-decoration: none; color: white; } a:visited { text-decoration: none; } input[type=submit], button { box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3); background-color: #111114; color: white; padding: 16px 32px; text-decoration: none; margin: none; cursor: pointer; border-collapse: collapse; border-width: 1px; border-radius: 8px; border-color: transparent; } input::placeholder { color: white; } </style><script>window.onscroll = function () { scrollAnimation() };function scrollAnimation() { window.onscroll = function (ev) { if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) { document.getElementById('scrollUp').className = "slideUp"; } }; }</script></head><body> <div id="top"> <h1 style="text-align:center;font-size:3vw;"><a href="/" style="color: white">漢字勉強</a></h1> <h2 style="text-align: center;">RESULT: TEST-${post.section}</h2>`;
        if (error_result) {
          console.log("error occured");
        }
        html += `<table id="result_table" style="color:white;border-width: 1px;border-radius: 8px;border-collapse: collapse;width:50vw;box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3);font-size:5vw;margin:auto;text-align: center;"> <tr style="background-color:#111114;"> <th>字</th> <th>音</th> <th><nobr>結果</th> </tr>`
        var count_O = 0;
        var count_tot = 0;
        result.forEach(function (item) {
          html += `<tr><th>${item.kanji}</th><th>${item.oto}</th><th ${item.result != 0 ? `style="color:violet"` : `style="color:#3700b3"`}>${item.result == 0 ? "X" : "O"}</th></tr>`
          if (item.result == 1) { count_O++; }
          count_tot++;
        })
        db.query(`UPDATE section_information SET memorized = ${count_O} WHERE id = ${post.section};`, function (error_result_2, result_2, fields22) {
          if (error_result_2) {
            console.log("error_result_2 has an error");
          }
          html += `</table></div><h2 style="text-align: center;color: white;text-align: center;font-size: 7vw;">Your Result</h2><div id="scrollUp" style="visibility: hidden;"><p style="font-size:17vw; text-align:center; margin:5vh 0 5vh 0;color:white">${count_O}/${count_tot}</p><div style="margin:auto;text-align:center; margin-bottom: 5vh;"><input type="submit" style="text-align:center;font-size:4vw;" onclick="location.href='/'" value="歸還"></div></div></body></html>`
          response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
          response.end(html);
        });
      });
    });
  }
  else if (pathname === '/review') {
    var html = '';
    response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    html = `<!DOCTYPE html> <html> <head> <title>TEST - 復習</title> </head> <script>var item_total; var index=0;`
    db.query(`SELECT * FROM kanji WHERE result=0 ORDER BY RAND();`, function (error_review, results_kanji, fields) {
      if (error_review) {
        console.log("An error occured at error_review");
      }
      var index = 0;
      var kanji_count = results_kanji.length;
      html += `var item_total=${kanji_count};var kanji_table = {`
      results_kanji.forEach(function (item) {
        html += `${index++} : "${item.kanji}"`
        if (index != kanji_count) { html += `,` }
        else {
          html += `}</script> <script src="https://code.jquery.com/jquery-3.5.1.min.js"integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script><style> ::-webkit-scrollbar { width: 2vw;}::-webkit-scrollbar-track { background: white; } ::-webkit-scrollbar-thumb { background: #888; }::-webkit-scrollbar-thumb:hover { background: #555; }::-moz-selection { background-color:white; color: black}::selection {background-color:white;color: black;} body { background-color: #1a1a1f; overflow: hidden; } a { text-decoration: none; color: white; } a:visited { text-decoration: none; } input[type=submit], button { box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3); background-color: #111114; color: white; padding: 16px 32px; text-decoration: none; margin: none; cursor: pointer; border-collapse: collapse; border-width: 1px; border-radius: 8px; border-color: transparent; } input::placeholder{ color: white; } </style><body> <a href="/"> <h1 style="text-align: center;font-size: 3vw;">漢字勉強</h1> </a> <div id="scoreboard" style="text-align:center; font-size:5vw;color:white;"><span id="current_index">1</span>/<span id="total_index"></span></div><div style="text-align: center;"><h2 style="display:inline-block;font-size:15vw; text-align: center; margin-top: 0;margin-bottom: 0;margin-right: 3vw;color:white;" id="kanji">${results_kanji[0].kanji}</h2>  <input type="text" id="textbox" placeholder="音" style="width:13vw;background-color:#111114;color: white; font-size:13vw;margin-left:3vw;"> <p> <button id="execute" style="width:20vw; font-size:7vw;">堤出</button></p>  </div><div class="getScript"></div> <script> $('#total_index').text(item_total);function ajaxSend() { $.ajax({ url: "https://review-kanji.herokuapp.com/score_process", data: { answer: $('#textbox').val(), kanji: $('#kanji').text(), }, type: "POST", success: function (result) { $(".getScript").html(result); $('#kanji').text(kanji_table[index]);$('#current_index').text(index+1); $('#textbox').val(''); if(index==item_total){ $('#execute').fadeOut(); $('#textbox').fadeOut();  $('#scoreboard').fadeOut(); $('#kanji').fadeOut(); $('#move').css('opacity','1'); } } });} $('#execute').click(function () { ajaxSend(); }); $(document).keypress(function(event){ var keycode = (event.keyCode ? event.keyCode : event.which); if(keycode == '13'){ ajaxSend(); } }); </script></body></html>`;
        }
      });
      response.end(html);
    });
  }
  else if (pathname === '/update') {
    db.query(`SELECT MAX(section) FROM kanji;`, function (error, results, fields) {
      if (error) {
        console.log("error");
      }
      var section_number = results[0]['MAX(section)'];
      db.query(`SELECT * FROM kanji;`, function (error_update, result_kanji, fields2) {
        if (error_update) {
          console.log("error update");
        }
        var memorized = new Array(section_number + 1).fill(0);
        for (var i = 0; i < result_kanji.length; i++) {
          memorized[result_kanji[i]['section']] += result_kanji[i]['result'];
        }
        sql = 'UPDATE section_information SET memorized = (case ';
        for (var i = 0; i <= section_number; i++) {
          sql += `when id = ${i} then "${memorized[i]}" 
          `;
        }
        sql += `end) WHERE id in (`
        for (var i = 0; i < section_number; i++) {
          sql += `'${i}',`
        }
        sql += `'${section_number}'`
        sql += ')'
        console.log(sql);
        db.query(sql, function (error_update_total, result_kanji2, fields2) {
          if (error_update_total) {
            console.log("an error occured while updating memorized database");
          }
          response.writeHead(302, {
            'Location': '/'
          });
          response.end();
        });
      });
    });
  } else if (pathname === '/get') {
    response.write(`<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>漢子勉强 - GET</title> <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script> <style> input[type=submit] { box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3); background-color: #111114; color: white; padding: 16px 32px; text-decoration: none; margin: none; cursor: pointer; border-collapse: collapse; border-width: 1px; border-radius: 8px; border-color: transparent; } ::-moz-selection { background-color:white; color: black}::selection {background-color:white;color: black;}::-webkit-scrollbar { width: 2vw;}::-webkit-scrollbar-track { background: white; } ::-webkit-scrollbar-thumb { background: #888; }::-webkit-scrollbar-thumb:hover { background: #555; } body { background-color: #1a1a1f; }</style> </head> <body> <div id="console" style="box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3);overflow:hidden;width:70vw;height:70vh;margin:auto;text-align:center;background-color: black;color: white;font-size:2vw;"> [Updating Kanji Database]<br> </div> <!-- <button onclick="$('p').append('text<br>');">hi</button> --> </body> </html>`);
    getKanji.getKanji(
      function (text) {
        response.write(`<script>$('#console').append('${text}<br>');$('#console').scrollTop($('#console').prop('scrollHeight'))</script>`);
      },
      function (text) {
        response.end(`<script>$('#console').append('${text}<br>');$('#console').scrollTop($('#console').prop('scrollHeight'));</script><div style="margin:auto;text-align:center"><input type="submit" style="text-align:center;font-size:4vw;"onclick="location.href='/'" value="歸還" ></div>`);
      }
    );
    // response.writeHead(302, {
    //   'Location': "/"
    // });
    // response.end();
  }
  else {
    response.writeHead(404);
    response.end('Not found in this server!');
  }
});

app.listen(process.env.PORT || 3000);