/*
----------------------------------- Setup -----------------------------------
*/

const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
app.use(cookieSession({
  name: 'session',
  keys: ['what-is-this-key']
}));
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
  }
};

/*
----------------------------------- Import Helper Functions -----------------------------------
*/

const { generateRandomString, getUserByEmail, retrieveUrls } = require('./helpers');

/*
----------------------------------- Routing -----------------------------------
*/

// route for initial / home page
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// route for my urls page
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>Please log in to show your urls.</h3>");
  } else {
    const userUrls = retrieveUrls(req.session.user_id, urlDatabase);
    const templateVars = { urls: userUrls, longURL: req.params.longURL, user: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send('Please log in to shorten URLs. ');
  } else {
    const newShortURL = generateRandomString();
    let newLongURL = req.body.longURL;
    if (!req.body.longURL.includes('http://')) {
      newLongURL = 'http://' + req.body.longURL;
    }
    urlDatabase[newShortURL] = {
      longURL: newLongURL,
      userId: req.session.user_id
    };
    res.redirect(`urls/${newShortURL}`);
  }
});

// route for new url
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { id: req.params.id, longURL: req.params.longURL, user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

// route for registering for an account
app.get("/register", (req, res) => {
  if (!req.session.user_id) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if (getUserByEmail(req.body.email, users)) {
      res.statusCode = 400;
      res.send('<h1>400 Bad Request!</h1> <h3>This email is already registered.</h3>');
    } else {
      const newUserId = generateRandomString();
      users[newUserId] = {
        id: newUserId,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.user_id = users[newUserId]['id'];
      res.redirect("/urls");
    }
  } else {
    res.statusCode = 400;
    res.send('<h1>400 Bad Request!</h1> <h3>Please fill out email and password.</h3>');
  }
});

// route for login page
app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  if (req.body.email && req.body.password) {
    if (!getUserByEmail(req.body.email, users)) {
      res.statusCode = 403;
      res.send("<h1>403 Forbidden!</h1> <h3>This email isn't registered. Please register for a new account.</h3>");
    } else {
      const userCreds = getUserByEmail(req.body.email, users);
      if (!bcrypt.compareSync(req.body.password, userCreds["password"])) {
        res.statusCode = 403;
        res.send("<h1>403 Forbidden!</h1> <h3>Invalid Credentials.</h3>");
      } else {
        req.session.user_id = userCreds["id"];
        res.redirect("/urls");
      }
    }
  } else {
    res.statusCode = 403;
    res.send('<h1>403 Bad Request!</h1> <h3>Please fill out email and password.</h3>');
  }
});

// route for logout button
app.post("/logout", (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect("/login");
});

// route for redirecting to long url
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send('This URL does not exist. ');
  } else {
    const longURL = urlDatabase[req.params.id]['longURL'];
    res.redirect(longURL);
  }
});

// route for url details
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>Please log in to show your urls.</h3>");
  }

  if (req.session.user_id !== urlDatabase[req.params.id].userId) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>You do not have access to this URL.</h3>");
  } else {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]['longURL'], user: users[req.session.user_id]  };
    res.render("urls_show", templateVars);
  }
});

// route for url details and edit
app.post("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>Please log in.</h3>");
  }
  
  if (!urlDatabase[req.params.id]) {
    res.statusCode = 404;
    res.send("<h1>404 Not Found!</h1> <h3>This URL does not exist.</h3>");
  }

  if (req.session.user_id !== urlDatabase[req.params.id].userId) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>You do not have access to this URL.</h3>");
  } else {
    let newLongURL = req.body.longURL;
    if (!req.body.longURL.includes('http://')) {
      newLongURL = 'http://' + req.body.longURL;
    }
    urlDatabase[req.params.id]['longURL'] = newLongURL;
    res.redirect("/urls");
  }
});

// route for deleting existing url
app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>Please log in.</h3>");
  }
  
  if (!urlDatabase[req.params.id]) {
    res.statusCode = 404;
    res.send("<h1>404 Not Found!</h1> <h3>This URL does not exist.</h3>");
  }

  if (req.session.user_id !== urlDatabase[req.params.id].userId) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1> <h3>You do not have access to this URL.</h3>");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});


// server listening on terminal
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});