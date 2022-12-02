/*
----------------------------------- Setup -----------------------------------
*/

const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

/*
----------------------------------- Variables -----------------------------------
*/

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

/*
----------------------------------- Routing -----------------------------------
*/

// route for my urls page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString();
  let newLongURL = req.body.longURL;
  if (!req.body.longURL.includes('http://')) {
    newLongURL = 'http://' + req.body.longURL;
  }
  urlDatabase[shortUrl] = newLongURL;
  res.redirect(`urls/${shortUrl}`);
});

// route for registering for an account
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
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
  const templateVars = { user: users[req.cookies["id"]] };
  res.render("login", templateVars);
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
  const templateVars = { id: req.params.id, longURL: req.params.longURL, user: users[req.cookies["user_id"]]  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  const templateVars = { id: req.params.id, longURL: req.params.longURL, user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
  res.redirect("/urls", templateVars);
});

// route for logout button
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/login");
})

// route for deleting existing url
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// route for editing url
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// route for new url
app.get("/urls/new", (req, res) => {
  const templateVars = { id: req.params.id, longURL: req.params.longURL, user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

// server listening on terminal
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});