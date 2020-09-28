var http = require('http');
var url = require('url');
var qs = require('querystring');

var template = require('./lib/js/template.js');
var db = require('./lib/js/db.js');
var getKanji = require('./lib/js/getKanjiFromNaver.js');
var fs = require('fs');

setInterval(function () { db.query('SELECT 1'); }, 5000);

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
      var total_kanji = 0;
      var memorized_kanji = 0;
      var section_number = result_section.length - 1;
      var result_date = new Array(result_section.length);
      console.log(section_number);
      for (var i = 0; i <= section_number; i++) {
        result_date[i] = result_section[i]['uploaded_date'];
        total_kanji += result_section[i]['total'];
        memorized_kanji += result_section[i]['memorized'];
      }
      // memorized_kanji += result_section[i]['memorized'];
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
        var HTML = template.HTML(title, list, `<div id="totalboard">${memorized_kanji}/${total_kanji}</div>`, chart);
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
      html = eval('`' + fs.readFileSync(`./lib/html/test/1.html`, 'utf8') + '`');
      db.query(`SELECT * FROM kanji WHERE section=${post.section} ORDER BY RAND();`, function (error3, results_kanji, fields) {
        var index = 0;
        var kanji_count = results_kanji.length;
        html += `var item_total=${kanji_count};var kanji_table = {`
        results_kanji.forEach(function (item) {
          html += `${index++} : "${item.kanji}"`
          if (index != kanji_count) { html += `,` }
          else {
            html += eval('`' + fs.readFileSync(`./lib/html/test/2.html`, 'utf8') + '`');
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
        var html = eval('`' + fs.readFileSync(`./lib/html/result/1.html`, 'utf8') + '`');
        if (error_result) {
          console.log("error occured");
        }
        html += eval('`' + fs.readFileSync(`./lib/html/result/2.html`, 'utf8') + '`');
        var count_O = 0;
        var count_tot = 0;
        result.forEach(function (item) {
          html += `<tr ${item.result != 0 ? `` : `class="wrongAnswer"`}><th>${item.kanji}</th><th>${item.oto}</th><th ${item.result != 0 ? `style="color:violet"` : `style="color:#3700b3"`}>${item.result == 0 ? "X" : "O"}</th></tr>`
          if (item.result == 1) { count_O++; }
          count_tot++;
        })
        db.query(`UPDATE section_information SET memorized = ${count_O} WHERE id = ${post.section};`, function (error_result_2, result_2, fields22) {
          if (error_result_2) {
            console.log("error_result_2 has an error");
          }
          html += eval('`' + fs.readFileSync(`./lib/html/result/3.html`, 'utf8') + '`');
          response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
          response.end(html);
        });
      });
    });
  }
  else if (pathname === '/review') {
    var html = '';
    response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    html = eval('`' + fs.readFileSync(`./lib/html/review/1.html`, 'utf8') + '`');
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
          html += eval('`' + fs.readFileSync(`./lib/html/review/2.html`, 'utf8') + '`');
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
    response.write(eval('`' + fs.readFileSync(`./lib/html/get/1.html`, 'utf8') + '`'));
    getKanji.getKanji(
      function (text) {
        response.write(`<script>$('#console').append('${text}<br>');$('#console').scrollTop($('#console').prop('scrollHeight'))</script>`);
      },
      function (text) {
        response.end(`<script>$('#console').append('${text}<br>');$('#console').scrollTop($('#console').prop('scrollHeight'));</script><div style="margin:auto;text-align:center"><input type="submit" class="dark_button" style="text-align:center;font-size:4vw;width:50vw;margin-top:5vh;"onclick="location.href='/'" value="歸還" ></div>`);
      },
      function (text) {
        response.write(text);
      }
    );
  }
  else {
    response.writeHead(404);
    response.end(fs.readFileSync('./lib/html/notfound/1.html', 'utf8'));
  }
});

app.listen(process.env.PORT || 3000);