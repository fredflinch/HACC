/**
 * Required External Modules
 */
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
var crypto = require('crypto');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const { resolve } = require("path");
const http_c2 = require('./src/http_c2.js')
const auth = require('./src/auth.js')


/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || 8000;

/**
 *  App Configuration
 */

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(sessions({
    // fix secret 
    secret: "111",
    saveUninitialized: true,
    cookie: { 
      maxAge: (1000 * 60) 
    },
    resave: false 
}));
/**
 * Routes Definitions
 */
var session;
var ids = [];

app.get("/", (req, res) => {
  if (req.session.userid){
    res.send("<p>Options: <a href=\"/api/create\">CREATE</a></p>")
  } else {
    res.render("login", { title: "login" });
  }
});
app.get("/login", (req, res) => {res.render("login", { title: "login" });});
app.post('/auth',(req,res) => {
  auth.do_auth(req.body['username'], req.body['password'], res, req);
});

app.get('/api/create', (req, res) => {
  if (req.session.userid){
    var idValues = http_c2.create_agentid(ids);
    ids = idValues.ids;
    res.send("<h1><a href=/id/"+idValues.id+">"+idValues.id+"</a></h1><a href=\"/\">[GO BACK]</a>");
  } else {
    res.redirect("/login")
  }
});

app.get('/logout',(req,res) => {
  req.session.destroy();
  res.redirect('/');
});

http_c2.add_route(app, "123")

/**
 * Server Activation -- run with 'npm run dev'
 */
app.listen(port, () => { console.log(`Listening to requests on http://localhost:${port}`); });


