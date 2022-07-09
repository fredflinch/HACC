const path = require("path");
const sqlite3 = require("sqlite3").verbose();
var fs = require('fs');

module.exports = {
    update_upload: async function (fname, user, url_v, res){
        try {
            const f = await do_update_upload(fname, user, url_v);
            return f
          } catch {
            // res.send('fail')
            return -1
        }
    },
    delete_file: async function (fname, user, url_v, res){
        try {
            const f = await do_delete_file(fname);
            return f
          } catch {
            // res.send('fail')
            return -1
        }
    },
    get_url: function(fname){
        return "/"+[...Array(6)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')+"/"+fname;
    },
    get_files: function (rows) {
        let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
        db.each("SELECT filename, uname, url_value FROM files", [], (err, row) => {
            var files = rows.map(({filename}) => filename);
            if (!files.includes(row.filename) && row.filename!=""){
                rows.push(row)
            } else {
                if (row.id != ""){
                    let i = files.indexOf(row.filename)
                    rows[i] = row
                }
            }
        }, () => {})
        return rows 
    }
}

function do_update_upload (fname, user, url_v){
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
    return new Promise((resolve, reject) =>
      db.each("INSERT INTO files (filename, uname, url_value) VALUES (\'"+fname+"\', \'"+user+"\',\'"+url_v+"\')", [], 
      (row, err) => {
        resolve('inserted');
      }, () => reject())
    )
}

function do_delete_file (fname){
    fs.unlinkSync('./uploads/'+fname);
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
    return new Promise((resolve, reject) =>
      db.each("DELETE FROM files WHERE filename = \'"+fname+"\'", [], (err, row) => {
        if (err) {console.log(err);}
        resolve('')
      }, () => reject())
    )
}
