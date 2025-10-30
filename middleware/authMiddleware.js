const jwt = require('jsonwebtoken');
require('dotenv').config()

module.exports = {
  createToken: (userData) => {
    return new Promise((resolve, reject) => {
      if (Object.keys(userData).length > 0) {
        const token = jwt.sign(JSON.parse(JSON.stringify(userData),true), process.env.SECRET_KEY, {
          expiresIn: process.env.TOKEN_EXPIRATION
        });
        resolve(token)
      } else {
        reject('No Object Found')
      }
    })
  },
  authenticateToken: (req, res, next) => {
    if (req.cookies){
      const token = req.cookies ? req.cookies.auth_token : true;
      if (!token) return res.redirect('/login');
  
      try {
        const verified = jwt.verify(token, process.env.SECRET_KEY);
        req.user = verified;
        next();
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          console.error("Token has expired!");
        } else {
          console.error("Invalid token:", err.message);
        }
        res.redirect('/login');
        // res.status(400).send('Invalid token');
      }
    }else{
      res.redirect('/login');
    }
  },
  authCheckForLogin: (req, res, next) => {
    if (req.cookies) {
      const token = req.cookies.auth_token;
      if (token){
        try {
          const verified = jwt.verify(token, process.env.SECRET_KEY);
          req.user = verified;
        } catch (err) {
          if (err.name === 'TokenExpiredError') {
            console.error("Token has expired!");
          } else {
            console.error("Invalid token:", err.message);
          }
        }
      }
    }
    next()
  },
  setUserMiddleware: (req, res, next) => {
    res.locals.user = req.user ? req.user : {};
    res.locals.userToken = req.cookies.auth_token;
    // res.locals.path = req.path;
    next();
  },
  socketMiddleware: (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split("=")[1];
    
    if (!token) return next(new Error("Authentication error"));
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) return next(new Error("Authentication error"));
      socket.user = decoded;
      next();
    });
  }
}