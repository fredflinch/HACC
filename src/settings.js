const fs = require('fs');
const path = require("path");
var global_settings = {"max_timeout":-1}
module.exports = {
    read_settings: function (pathv) {
        let settings = fs.readFileSync(path.join(__dirname, '../'+pathv), 'utf8');
        settings = settings.split('\r\n')
        for (i=0; i < settings.length; i++){
            let vp = settings[i].split(':')
            if (Object.keys(global_settings).includes(vp[0])){
                global_settings[vp[0]] = vp[1]
            }
        }
        return global_settings
    }
}