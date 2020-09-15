const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { naver_id, naver_pw } = require('./lib/config');
var db = require('./lib/db.js');

module.exports = {
    getKanji: async function (callback, nextSection) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"]
        });
        const page = await browser.newPage();

        await page.goto('https://learn.dict.naver.com/m/jpdic/wordbook/my/words.nhn?wordbookCode=261159209&filterType=0&orderType=2&pageNo=1');

        await page.evaluate((id, pw) => {
            document.querySelector('#id').value = id;
            document.querySelector('#pw').value = pw;
        }, naver_id, naver_pw);

        await page.click('.btn_global');
        await page.waitForNavigation();

        const currentURL = "https://learn.dict.naver.com/m/jpdic/wordbook/my/words.nhn?wordbookCode=261159209";
        const nextpageARGS = "&filterType=0&orderType=2&pageNo=";

        await page.goto(currentURL + nextpageARGS + "1");

        var oto, kanji;
        var d = new Date();
        var total = 0;

        var $ = cheerio.load(await page.content());

        var total_page_html = $(".u_pg2_total").text();
        var total_page = total_page_html.split(' ')[1];
        var page_html = new Array(total_page);
        var datetime = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}`;
        var section_max;
        var last_kanji, first_kanji;
        var sync = 0;
        var responseText;
        kanjiDict = {};

        total_page = 5;

        for (var i = 1; i <= total_page; i++) {
            console.log(i + "th page saving..");
            await page.goto(currentURL + nextpageARGS + i);
            page_html[i] = await page.content();
        }

        console.log("let's close the browser..");
        await browser.close();
        console.log("browser closed");

        function getKanjiOto(callback) {
            for (var i = 1; i <= total_page; i++) {
                $ = cheerio.load(page_html[i]);
                oto = $(".kr_read");
                kanji = $(".tit_ent.jp");
                console.log("hi");
                kanji.each(function (j, elem) {
                    kanjiDict[$(this).text().trim()] = oto[j].children[0].data.trim();
                });
            }
            console.log("gotocallback");
            callback();
        };

        function printKanjiOto() {
            for (var key in kanjiDict) {
                console.log(`${key} : ${kanjiDict[key]}`);
            }
        }

        new Promise(function (resolve, reject) {
            getKanjiOto(function () {
                resolve();
            });
        }).then(function () {
            return new Promise(function (resolve_1, reject) {
                printKanjiOto();
                resolve_1();
            })
        }).then(function () {
            return new Promise(function (resolve_2, reject) {
                db.query(`SELECT MAX(section) FROM kanji`, function (error_1, result_max, field) {
                    if (error_1) {
                        console.log("There are no inforamtion about section MAX");
                    }
                    section_max = result_max[0]['MAX(section)'];
                    console.log(section_max);
                    resolve_2();
                });
            });
        }).then(function () {
            return new Promise(function (resolve_3, reject) {
                db.query(`SELECT last_kanji FROM section_information WHERE id = ${section_max};`, function (error_last_kanji, result_last_kanji, field) {
                    if (error_last_kanji) {
                        console.log("There are no inforamtion about section MAX");
                    }
                    last_kanji = result_last_kanji[0]['last_kanji'];
                    if (last_kanji == undefined) {
                        console.log("DB 관리자가 일을 똑바로 안했습니다!");
                    }
                    console.log(last_kanji);
                    resolve_3();
                });
            });
        }).then(function () {
            return new Promise(async function () {
                sql = "INSERT INTO kanji (kanji, oto, section, datetime) VALUES";
                for (var key in kanjiDict) {
                    if (key === last_kanji) {
                        if (total != 0) {
                            sync = 1;
                            sql += ";";
                            sql2 = `INSERT INTO section_information (id, uploaded_date, total, last_kanji) VALUES(${section_max + 1}, "${datetime}", ${total}, "${first_kanji}");`;
                            db.query(sql, function (error_insert) {
                                if (error_insert) {
                                    console.log("삽입 과정에서 에러가 발생!");
                                    responseText = "an error occured during kanji inserting process!";
                                    callback(responseText, "/");
                                }
                                console.log(sql);
                                db.query(sql2, function (error_section_insert) {
                                    if (error_section_insert) {
                                        console.log("섹션 삽입에서 에러 발생!");
                                        responseText = "an error occured during section inserting process!";
                                        callback(responseText, "/");
                                    }
                                    responseText = "successfully done! new section:" + section_max + 1 + "has been added";
                                    callback(responseText, `?id=${section_max + 1}`);
                                });
                                console.log(sql2);
                            });
                        }
                        else {
                            responseText = "There are no new kanji to add!";
                            callback(responseText, "/");
                        }
                    }
                    else {
                        if (sync == 0) {
                            if (total != 0)
                                sql += ',';
                            else
                                first_kanji = key;
                            sql += `("${key}","${kanjiDict[key]}",${section_max + 1},"${datetime}")`;
                            total++;
                        }

                    }
                }
            })
        });
    }
}
