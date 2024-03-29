const path = require("path");
const sqlite3 = require("sqlite3").verbose();

module.exports = {
    create_agentid: function (ids, app){
        let id = (Math.random() + 1).toString(36).substring(2);
        for (let i = 0; i < ids.length; i++) {
            if (id === ids[i]){
                create_agentid(ids)
            }
        }
        ids.push(id);
        init_session(id);
        add_route(app, id);
        return { 'ids': ids, 'id': id, 'app': app }
    },
    get_cmd: async function (id, req, res){
        try {
            let pwd = req.get('Authorization')
            let data = req.header('WWW-Authenticate');
            if (data != null){
                // add save to DB here 
                console.log(req.get('WWW-Authenticate'))
                module.exports.activate_session(id);
                res.send("ok")
                return
            }
            const cmd = await collect_cmd(id, pwd);
            res.send(cmd)
            return cmd            
          } catch {
            res.send('fail')
            return -1
        }
    }, 
    del_session: async function (id){
        try {
            const sess = await delete_session(id);
        } catch {
            console.log('del session')
        }
    }, 
    init_session: async function (app){
        try {
            const sess = await collect_sessions(app);
            const files = await collect_files(app);
            return sess
        } catch {
            console.log('init')
        }
    },
    get_list: function (rows) {
        let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
        db.each("SELECT id, active, last_checkin, pwd FROM sessions", [], (err, row) => {
            var ids = rows.map(({id}) => id);
            if (!ids.includes(row.id) && row.id!=""){
                rows.push(row)
            } else {
                if (row.id != ""){
                    let i = ids.indexOf(row.id)
                    rows[i] = row
                }
            }
          }, () => {})
        return rows 
    },
    update_cmd: async function (id, cmd){
        try {
            const sess = await do_cmd_update(cmd, id);
            return sess
        } catch {
            console.log('updated')
        }
    },
    deactivate_session: async function (id){
        try {
            const sess = await de_active(id);
            return sess
        } catch { }
    },
    activate_session: async function (id){
        try {
            const sess = await re_active(id);
            return sess
        } catch { }
    },
    server_get_cmd: async function (id, req, res){
        try {
            const cmd = await server_collect_cmd(id);
            return cmd
          } catch {
            res.send('fail')
            return -1
        }
    },
};

function gen_pwd(){
    return [...Array(6)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

function add_route (app, id) {
    app.get("/id/"+id, (req, res) => {
        module.exports.get_cmd(id, req, res)
        //add checkin 
    })
    app.get("/manage/id/"+id, (req, res) => {
        res.render("manage", { title: "manage id:" + id });
    })
    app.get("/manage/id/"+id+"/delete", (req, res) => {
        module.exports.del_session(id);
        res.send('done!');
    })
    return app;
}

function create_session (id){
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
    let pwd = gen_pwd()
    return new Promise((resolve, reject) =>
      db.each("INSERT INTO sessions (id, command, active, last_checkin, pwd) VALUES (\'"+id+"\', \'nop\', 0, \'00/00/00 00:00:00\', \'"+pwd+"\')", [], (row, err) => {
        resolve('inserted');
      }, () => reject())
    )
}

async function init_session (id){
    try {
        const sess = await create_session(id);
    } catch {
        console.log('init')
    }
}

function collect_cmd (id, pwd){
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'), sqlite3.OPEN_READONLY);
    return new Promise((resolve, reject) =>
      db.each("SELECT command FROM sessions WHERE id = \'"+id+"\' AND pwd = \'" + pwd + "\'", [], (err, row) => {
          resolve(row.command)
          return
      }, () => reject())
    )
}

function server_collect_cmd (id){
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'), sqlite3.OPEN_READONLY);
    return new Promise((resolve, reject) =>
      db.each("SELECT command FROM sessions WHERE id = \'"+id+"\'", [], (err, row) => {
          resolve(row.command)
          return
      }, () => reject())
    )
}

function delete_session (id){
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
    return new Promise((resolve, reject) =>
      db.each("DELETE FROM sessions WHERE id = \'"+id+"\'", [], (err, row) => {
        if (err) {console.log(err);}
        resolve('')
      }, () => reject())
    )
}

// vulnrable to SQL Injection -- not sure if this is a feature of a
function do_cmd_update(cmd, id){
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
    return new Promise((resolve, reject) =>
      db.each("UPDATE sessions SET command=\'"+cmd+ "\' WHERE id = \'"+id+"\'", [], (err, row) => {
        if (err) {
            console.log(err);
        }
        resolve('')
      }, () => reject())
    )
}

// vulnrable to SQL Injection
function de_active(id){
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
    return new Promise((resolve, reject) =>
      db.each("UPDATE sessions SET active=FALSE WHERE id = \'"+id+"\'", [], (err, row) => {
        if (err) {
            console.log(err);
        }
        resolve('')
      }, () => reject())
    )
}

// vulnrable to SQL Injection
function re_active(id){
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
    let currentTime = new Date();
    return new Promise((resolve, reject) =>
      db.each("UPDATE sessions SET active=TRUE, last_checkin=\'"+currentTime+"\' WHERE id = \'"+id+"\'", [], (err, row) => {
        if (err) {
            console.log(err);
        }
        resolve('')
      }, () => reject())
    )
}


function collect_sessions (app) {
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
    var ids = []
    return { 'p': new Promise((resolve, reject) =>
      db.each("SELECT id FROM sessions", [], (err, row) => {
        add_route(app, row.id)
        ids.push(row.id)
        resolve('done!');
      }, () => reject())), 'ids': ids }
}

function collect_files (app) {
    let db = new sqlite3.Database(path.join(__dirname, '../db/store.db'));
    new Promise((resolve, reject) =>
      db.each("SELECT filename,url_value FROM files;", [], (err, row) => {
        app.get(row.url_value, (req, res) => {
            res.download('./uploads/'+row.filename);
        });
        resolve('files collected!');
      }, () => reject()))
}




