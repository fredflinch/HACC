const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
var crypto = require('crypto');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const { resolve } = require("path");

module.exports = { 
    do_auth: async function(u, p, res, req){
        try {
          const user_auth = await collect_pass(u, p)
          req.session.userid=req.body['username'];
          res.redirect('/')
          return true
        } catch {
          res.redirect('/login')
          console.log("auth failed...")
          return false
        }
      }
}

function collect_pass (u, p){
    var shasum = crypto.createHash('sha1')
    shasum.update(p)
    let phash = shasum.digest('hex')
    let auth = []
    let db = new sqlite3.Database(path.join(__dirname, '../main.db'), sqlite3.OPEN_READONLY);
    return new Promise((resolve, reject) =>
      db.each("SELECT uname, pass_hash FROM login", [], (err, row) => {
        if(row.uname === u && phash == row.pass_hash){
          resolve(row.uname)
          return
        }
      }, () => reject())
    )
}