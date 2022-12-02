/*
----------------------------------- Setup -----------------------------------
*/

const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const e = require("express");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

/*
----------------------------------- Variables -----------------------------------
*/

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "userRandomID",
  },
  "2Sjd3D": {
    longURL: "http://www.youtube.com",
    userId: "user2RandomID"
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};



/*
----------------------------------- Helper Functions -----------------------------------
*/

const generateRandomString = function() {
  let randomUrl = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  for (let i = 0; i < 6; i++) {
    randomUrl += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return randomUrl;
};

const checkIfExistingEmail = function(newEmail) {
  let returnValue = null;
  Object.keys(users).map(userId => {
    if (users[userId].email === newEmail) {
      returnValue = users[userId];
    }
  });
  return returnValue;
};

const retrieveUrls = function(id) {
  const userUrlDatabase = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL]['userId'] === id) {
      userUrlDatabase[shortURL] = urlDatabase[shortURL]['longURL'];
    }
  }
  return userUrlDatabase;
};

/*
----------------------------------- Routing -----------------------------------
*/

// route for my urls page
app.get("/urls", (req, res) => {
  if (!req.cookies['user_id']) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>Please log in to show your urls.</h3>");
  } else {
    const userUrls = retrieveUrls(req.cookies['user_id']);
    console.log(userUrls);
    const templateVars = { urls: userUrls, longURL: req.params.longURL, user: users[req.cookies["user_id"]] };
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!req.cookies['user_id']) {
    res.send('Please log in to shorten URLs. ');
  } else {
    const newShortURL = generateRandomString();
    let newLongURL = req.body.longURL;
    if (!req.body.longURL.includes('http://')) {
      newLongURL = 'http://' + req.body.longURL;
    }
      urlDatabase[newShortURL] = {
        longURL: newLongURL,
        userId: req.cookies['user_id']
    }
    res.redirect(`urls/${newShortURL}`);
  }
});

// route for new url
app.get("/urls/new", (req, res) => {
  if (!req.cookies['user_id']) {
    res.redirect("/login");
  } else {
    const templateVars = { id: req.params.id, longURL: req.params.longURL, user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  }
});

// route for registering for an account
app.get("/register", (req, res) => {
  if (!req.cookies['user_id']){
    const templateVars = { user: users[req.cookies['user_id']] };
    res.render("register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if (checkIfExistingEmail(req.body.email)) {
      res.statusCode = 400;
      res.send('<h1>400 Bad Request!</h1> <h3>This email is already registered.</h3>')
    } else {
      const newUserId = generateRandomString();
      users[newUserId] = {
        id: newUserId,
        email: req.body.email,
        password: req.body.password
      };
      res.cookie('user_id', users[newUserId]['id']);
      res.redirect("/urls");
    }
  } else {
    res.statusCode = 400;
    res.send('<h1>400 Bad Request!</h1> <h3>Please fill out email and password.</h3>')
  }
});

// route for login page
app.get("/login", (req, res) => {
  if (!req.cookies['user_id']){
    const templateVars = { user: users[req.cookies["id"]] };
    res.render("login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  if (req.body.email && req.body.password) {
    if (!checkIfExistingEmail(req.body.email)) {
      res.statusCode = 403;
      res.send("<h1>403 Forbidden!</h1> <h3>This email isn't registered. Please register for a new account.</h3>")
    } else {
      const userCreds = checkIfExistingEmail(req.body.email)
      if (req.body.password !== userCreds.password) {
        res.statusCode = 403
        res.send("<h1>403 Forbidden!</h1> <h3>Invalid Credentials.</h3>")
      } else {
        res.cookie('user_id', userCreds["id"]);
        res.redirect("/urls");
      }
    }
  } else {
    res.statusCode = 403;
    res.send('<h1>403 Bad Request!</h1> <h3>Please fill out email and password.</h3>')
  }
});

// route for url details
app.get("/urls/:id", (req, res) => {
  if(!req.cookies["user_id"]) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>Please log in to show your urls.</h3>");
  }

  if (req.cookies["user_id"] !== urlDatabase[req.params.id].userId){
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>You do not have access to this URL.</h3>");
  } else {
    const templateVars = { id: req.params.id, longURL: req.params.longURL, user: users[req.cookies["user_id"]]  };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  if(!req.cookies["user_id"]) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>Please log in.</h3>");
  }
  
  if (!urlDatabase[req.params.id]){
    res.statusCode = 404;
    res.send("<h1>404 Not Found!</h1> <h3>This URL does not exist.</h3>");
  } 

  if (req.cookies["user_id"] !== urlDatabase[req.params.id].userId){
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>You do not have access to this URL.</h3>");
  } else {
     urlDatabase[req.params.id]['longURL'] = req.body.longURL;
    const templateVars = { id: req.params.id, longURL: req.params.longURL, user: users[req.cookies["user_id"]] };
    res.render("urls_show", templateVars)
  }
});

// route for logout button
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/login");
});

// route for editing url
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]){
    res.send('This URL does not exist. ');
  } else {
    const longURL = urlDatabase[req.params.id]['longURL'];
    res.redirect(longURL);
  }
});

// route for deleting existing url
app.post("/urls/:id/delete", (req, res) => {
  if(!req.cookies["user_id"]) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>Please log in.</h3>");
  }
  
  if (!urlDatabase[req.params.id]){
    res.statusCode = 404;
    res.send("<h1>404 Not Found!</h1> <h3>This URL does not exist.</h3>");
  } 

  if (req.cookies["user_id"] !== urlDatabase[req.params.id].userId){
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>You do not have access to this URL.</h3>");
  } else {
  delete urlDatabase[id];
  res.redirect("/urls");
  }
});

// server listening on terminal
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});