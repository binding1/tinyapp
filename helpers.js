const generateRandomString = function() {
  let randomUrl = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  for (let i = 0; i < 6; i++) {
    randomUrl += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return randomUrl;
};

const getUserByEmail = function(newEmail, userDatabase) {
  let returnValue = null;
  Object.keys(userDatabase).map(userId => {
    if (userDatabase[userId].email === newEmail) {
      returnValue = userDatabase[userId];
    }
  });
  return returnValue;
};

const retrieveUrls = function(id, urlDatabase) {
  const userUrlDatabase = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL]['userId'] === id) {
      userUrlDatabase[shortURL] = urlDatabase[shortURL]['longURL'];
    }
  }
  return userUrlDatabase;
};


module.exports = {
  generateRandomString,
  getUserByEmail,
  retrieveUrls
};