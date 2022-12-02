const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const generateRandomString = function() {
  let randomUrl = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  for (let i = 0; i < 6; i++) {
    randomUrl += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return randomUrl;
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

const checkIfExistingEmailRegistration = function(newEmail) {
  let returnValue = false;
  Object.keys(users).map(userId => {
    if (users[userId].email === newEmail) {
      returnValue = true;
    }
  });
  return returnValue;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Routing

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if (checkIfExistingEmailRegistration(req.body.email)) {
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

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  res.cookie('user', users[req.cookies["user_id"]]);
  res.redirect("/urls");
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

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
})

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  const templateVars = { id: req.params.id, longURL: req.params.longURL };
  res.render("urls_show", templateVars);
  res.redirect("/urls", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { id: req.params.id, longURL: req.params.longURL, user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: req.params.longURL, user: users[req.cookies["user_id"]]  };
  res.render("urls_show", templateVars);
});

// app.get("/", (req, res) => {
//   res.redirect('/urls');
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});