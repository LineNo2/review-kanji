var fs = require('fs');

module.exports = {
    HTML: function (statuscode, description) {
        return eval('`' + fs.readFileSync(`lib/html/error/1.html`, 'utf8') + '`');
    }
}