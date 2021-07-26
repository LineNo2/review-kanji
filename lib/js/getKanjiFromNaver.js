const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const { naver_id, naver_pw } = require("../config/naver_config.json");
const { host, user, password, database } = require("../config/db_config.json");
const mysql = require("mysql2/promise");

module.exports = {
  getKanji: async function (
    speedmode,
    callback_write,
    callback_end,
    callback_console
  ) {
    const db = await mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database,
      charset: "utf8",
    });

    async function getLastKanjiFromDB(section_max) {
      let [result_last_kanji, field2] = await db.execute(
        `SELECT last_kanji FROM section_information WHERE id = ${section_max};`
      );
      console.log(result_last_kanji, section_max);
      last_kanji = result_last_kanji[0]["last_kanji"];
      //    callback_write("the latest kanji is : " + last_kanji, 95);
      console.log(last_kanji);
      return last_kanji;
    }
    async function getSectionMaxFromDB() {
      let [result_section_max, field1] = await db.execute(
        "SELECT MAX(section) FROM kanji"
      );
      section_max = result_section_max[0]["MAX(section)"];
      /* call callback_write after saving process has been done*/
      //callback_write("<br>your database has " + section_max + " sections", 95);
      console.log(section_max);
      return section_max;
    }

    async function saveKanjiToDB() {
      let sql = "INSERT INTO kanji (kanji, oto, section, datetime) VALUES",
        sql2;

      let sync = 0,
        total = 0;
      for (var key in kanjiDict) {
        console.log(key);
        if (key === last_kanji) {
          console.log("kanji is equal to last kanji : total => " + total);
          // if key is the last kanji of the dictionary
          if (total != 0) {
            console.log("total is not 0");
            // if there is more than one kanji in the dictionary
            // => Saving new dictionary to database
            sync = 1;
            sql += ";";
            sql2 = `INSERT INTO section_information (id, uploaded_date, total, last_kanji) VALUES(${
              section_max + 1
            }, "${datetime}", ${total}, "${first_kanji}");`;
            console.log(sql);
            try {
              await db.execute(sql);
            } catch {
              console.log("삽입 과정에서 에러가 발생!");
              responseText = "an error occured during kanji inserting process!";
              callback_end(`<p style="color:red">${responseText}</p>`);
              return;
            }
            console.log(sql);
            try {
              await db.execute(sql2);
            } catch {
              if (error_section_insert) {
                console.log("섹션 삽입에서 에러 발생!");
                responseText =
                  "an error occured during section inserting process!";
                callback_end(`<p style="color:red">${responseText}</p>`);
              }
            }
            responseText =
              "successfully done! new section : " +
              (section_max + 1) +
              " with total : " +
              total +
              " kanjis has been added";
            console.log(responseText);
            callback_console(
              `<script>$('#console').attr({'style':'box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3);overflow:scroll;overflow-x: hidden;width:70vw;height:70vh;margin:auto;text-align:center;background-color: black;color: white;font-size:2vw;'})</script>`
            );
            callback_end(`<p style="color:green">${responseText}</p>`);
            console.log(sql2);
          } else {
            // this kanji is not last kanji(yet)
            if (total == 0) {
              responseText = "There are no new kanji to add!";
              console.log(responseText);
              callback_console(
                `<script>$('#console').attr({'style':'box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.3);overflow:scroll;overflow-x: hidden;width:70vw;height:70vh;margin:auto;text-align:center;background-color: black;color: white;font-size:2vw;'})</script>`
              );
              callback_console(
                `<script>$('#progressbar').css('background-image','repeating-linear-gradient(45deg, #ff4242, #ff4242 10px, #ff2424 10px, #ff2424 20px)');</script>`
              );
              callback_end(`<p style="color:red">${responseText}</p>`);
            }
          }
          break;
        } else {
          if (sync == 0) {
            if (total != 0) sql += ",";
            else first_kanji = key;
            sql += `("${key}","${kanjiDict[key]}",${
              section_max + 1
            },"${datetime}")`;
            callback_write(
              `{${key} : ${kanjiDict[key]}} 을(를) ${
                section_max + 1
              }번째 섹션에 ${datetime}시에 저장 완료했습니다.`,
              100
            );
            total++;
          }
        }
      }
      console.log("process end");
    }
    callback_write("opening browser..", 5);
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto(
      "https://learn.dict.naver.com/wordbook/cckodict/#/my/cards?wbId=d59243d0cf2745a993361be4e0588be5&qt=0&st=0&name=%E6%97%A5%E6%9C%AC%E8%AA%9E%E5%B8%B8%E7%94%A8%E6%BC%A2%E5%AD%972136&tab=list"
    );
    callback_write("login to naver dictionary..", 10);
    await page.evaluate(
      (id, pw) => {
        document.querySelector("#id").value = id;
        document.querySelector("#pw").value = pw;
      },
      naver_id,
      naver_pw
    );

    await page.click(".btn_check");
    await page.waitForNavigation();

    await page.goto(
      "https://learn.dict.naver.com/wordbook/cckodict/#/my/cards?wbId=d59243d0cf2745a993361be4e0588be5&qt=0&st=0&name=%E6%97%A5%E6%9C%AC%E8%AA%9E%E5%B8%B8%E7%94%A8%E6%BC%A2%E5%AD%972136&tab=list"
    );

    let d = new Date();
    let total = 0;
    let nextpage_flag = true;

    let datetime = `${d.getFullYear()}-${
      d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1) : d.getMonth() + 1
    }-${d.getDate()} ${d.getHours()}`;
    let section_max;
    let last_kanji, first_kanji;
    let sync = 0;
    let responseText;
    let kanjiDict = {};

    await page.waitForSelector("div.inner_card");
    let $ = cheerio.load(await page.content());

    let total_page = parseInt($("div.page_num > span.total").text());

    last_kanji = await getLastKanjiFromDB(await getSectionMaxFromDB());

    console.log(last_kanji);

    //last_kanji = "耳"; //hard coded last_kanji for changeing kanji source

    let i = 1;
    do {
      let $ = cheerio.load(await page.content());
      //cheerio를 통해 한자를 dictionary에 저장.
      console.log("saving page no." + i + "...");
      callback_write(
        "saving page no." + i + "...",
        `${20 + (i / total_page) * 70}`
      );

      nextpage_flag = $(".btn.btn_next._next_page_btn").hasClass("disabled");

      $("div.inner_card").each(function () {
        kanji = $(this).find(".title").text().trim();
        console.log(kanji);
        kanjiDict[kanji] = $(this)
          .find(".mean_hanja > div > span")
          .text()
          .split(" ")[1]
          .charAt(0);
        if (kanji === last_kanji) {
          console.log("kanji == last_kanji -> " + kanji);
          nextpage_flag = true;
          return;
        }
      });

      await page.click(".btn.btn_next._next_page_btn");
      await page.waitForTimeout(3000);

      console.log(i + "번 쨰 trial: nextpage_flag : " + nextpage_flag);
      i++;
    } while (!nextpage_flag);
    await browser.close();

    console.log("browser closed");
    await saveKanjiToDB();
    console.log("saved process completed");
  },
};
