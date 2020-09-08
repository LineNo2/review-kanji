var http = require('http');
var url = require('url');
var qs = require('querystring');
var template = require('./template.js');
var db = require('./db.js');

var connection;
function handleDisconnect() {
  connection = db; // Recreate the connection, since
  // the old one cannot be reused.
  connection.connect(function (err) {              // The server is either down
    if (err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  connection.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === '/') {
    db.query(`SELECT MAX(section) FROM kanji;`, function (error, results, fields) {
      if (error) {
        console.log("error");
      }
      section_number = results[0]['MAX(section)'];

      db.query(`SELECT uploaded_date FROM section_information ORDER BY id;`, function (error2, result_date, fields2) {
        if (error2) {
          console.log("error2");
        }
        db.query(`SELECT * FROM section_information;`, function (error3, result_section, fields2) {
          if (error3) {
            console.log("error3");
          }
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
            db.query(`SELECT * FROM kanji WHERE section=${title} ORDER BY RAND();`, function (error4, results_kanji, fields) {
              if (error4) {
                console.log(error4);
              }
              var kanji_table = template.kanji_table(results_kanji, title);
              var HTML = template.HTML(title, list, kanji_table, chart);
              response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
              response.end(HTML);
            });
          }
        });
      });
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
            html += `}</script> <script src="https://code.jquery.com/jquery-3.5.1.min.js"integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script><body> <a href="/"> <h1 style="text-align: center;">漢字勉強</h1> </a> <div id="scoreboard" style="text-align:center; font-size:5vw;"><span id="current_index">1</span>/<span id="total_index"></span></div><h2 style="font-size:20vw; text-align: center;" id="kanji">${results_kanji[0].kanji}</h2> <div style="text-align: center;"> <input type="text" id="textbox" placeholder="音" style="width:15vw; font-size:15vw;"> <p> <button id="execute" style="width:30vw; font-size:10vw;">堤出</button></p> <form method="post" action="/result"> <input type="hidden" name="section" value="${post.section}"> <input id ="move" style="width:30vw; font-size:10vw; opacity:0;margin:10vh" type="submit" value="移動"> </form> </div> <div class="getScript"></div> <script> $('#total_index').text(item_total);function ajaxSend() { $.ajax({ url: "https://review-kanji.herokuapp.com/score_process", data: { answer: $('#textbox').val(), kanji: $('#kanji').text(), }, type: "POST", success: function (result) { $(".getScript").html(result); $('#kanji').text(kanji_table[index]+1);$('#current_index').text(index); $('#textbox').val(''); if(index==item_total){ $('#execute').fadeOut(); $('#textbox').fadeOut();  $('#scoreboard').fadeOut(); $('#kanji').fadeOut(); $('#move').css('opacity','1'); } } });} $('#execute').click(function () { ajaxSend(); }); $(document).keypress(function(event){ var keycode = (event.keyCode ? event.keyCode : event.which); if(keycode == '13'){ ajaxSend(); } }); </script></body></html>`;
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
        var html = `<!DOCTYPE html> <html> <head> <title>RESULT: TEST-${post.section}</title> </head><body> <h1 style="text-align: center;">RESULT: TEST-${post.section}</h1> <a href="/"><h1 style="text-align: center;">歸還</h1></a>`;
        if (error_result) {
          console.log("error occured");
        }
        html += `<table style="width:10vw;font-size:10vw;margin:auto;"> <tr style="background-color:darkgray"> <th>字</th> <th>音</th> <th><nobr>結果</th> </tr>`
        var count_O = 0;
        var count_tot = 0;
        result.forEach(function (item) {
          html += `<tr><th>${item.kanji}</th><th>${item.oto}</th><th>${item.result == 0 ? "X" : "O"}</th></tr>`
          if (item.result == 1) { count_O++; }
          count_tot++;
        })
        db.query(`UPDATE section_information SET memorized = ${count_O} WHERE id = ${post.section};`, function (error_result_2, result_2, fields22) {
          if (error_result_2) {
            console.log("error_result_2 has an error");
          }
          html += `</table><p style="font-size:20vw; text-align:center">${count_O}/${count_tot}</p></body></html>`
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
          html += `}</script> <script src="https://code.jquery.com/jquery-3.5.1.min.js"integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script><body> <a href="/"> <h1 style="text-align: center;">漢字勉強</h1> </a> <h2 style="font-size:20vw; text-align: center;" id="kanji">${results_kanji[0].kanji}</h2> <div style="text-align: center;"> <input type="text" id="textbox" placeholder="音" style="width:15vw; font-size:15vw;"> <p> <button id="execute" style="width:30vw; font-size:10vw;">堤出</button></p>  </div> <div class="getScript"></div> <script> function ajaxSend() { $.ajax({ url: "https://review-kanji.herokuapp.com/score_process", data: { answer: $('#textbox').val(), kanji: $('#kanji').text(), }, type: "POST", success: function (result) { $(".getScript").html(result); $('#kanji').text(kanji_table[index]); $('#textbox').val(''); if(index==item_total){ $('#execute').fadeOut(); $('#textbox').fadeOut(); $('#kanji').fadeOut(); $('#move').css('opacity','1'); } } });} $('#execute').click(function () { ajaxSend(); }); $(document).keypress(function(event){ var keycode = (event.keyCode ? event.keyCode : event.which); if(keycode == '13'){ ajaxSend(); } }); </script></body></html>`;
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
  }
  else {
    response.writeHead(404);
    response.end('Not found in this server');
  }
});

app.listen(process.env.PORT || 3000);