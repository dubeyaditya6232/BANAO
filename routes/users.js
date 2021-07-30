var express = require('express');
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
var User = require('../models/users');

const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
sgMail.setApiKey(process.env['SENDGRID_API_KEY']);

router.post('/register', async (req, res) => {
  User.findOne({ username: req.body.username }, (err, found) => {
    if (err) {
      console.log(err);
      res.statusCode = 500;
      res.json(err);
    } else {
      if (found) {
        res.statusCode = 409
        res.json({ success: false, message: "username already taken" });
      } else {
        User.findOne({ email: req.body.email }, (err, found) => {
          if (err) {
            console.log(err);
            res.statusCode = 500;
            res.json(err);
          }
          else {
            if (found) {
              res.statusCode = 409;
              res.json({ success: false, message: "Email already exists" });
            }
            else {
              var password = req.body.password;
              var username = req.body.username;
              username = username.trim();
              if (username == "") {
                res.statusCode = 209;
                res.json({ success: false, message: "Username must not be empty" })
              }
              password = password.trim();
              if (password === "") {
                res.statusCode = 209;
                res.json({ success: false, message: "Password must not be empty" })
              }
              if (password.length < 6) {
                res.statusCode = 422;
                res.json({ success: false, message: 'Password length should be greater than 6 characters' })
              }
              bcrypt.hash(req.body.password, 10, function (err, hash) {
                if (err) {
                  console.log(err);
                  res.statusCode = 500;
                  res.json(err);
                } else {
                  const user = {
                    email: req.body.email,
                    username: req.body.username,
                    password: hash
                  }
                  const newUser = new User(user);
                  newUser.save(err => {
                    if (err) {
                      console.log(err);
                      res.statusCode = 500;
                      res.json(err);
                    } else {
                      var showUser = {
                        success: true,
                        status: ' Registration Successful',
                        user: {}
                      };
                      showUser.user = user;
                      res.status(200).json(showUser);
                    }
                  });
                }
              });
            }
          }
        });
      }
    }
  });
});

router.post('/login', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  User.findOne({ username: username })
    .then(user => {
      if (user) {
        bcrypt.compare(password, user.password, function (err, result) {
          if (err) {
            console.log(err);
          }
          if (result) {
            token = jwt.sign({ username: username }, process.env.secretKey);
            res.status(200).json({ success: true, status: "Logged in successfully", token });
          } else {
            res.status(403).json({ success: false, message: 'Incorrect userrname or password' });
          }
        });
      } else {
        res.status(404).json({ success: false, message: 'Username not found' });
      }
    });
});

//forgotusername
router.post('/forgotusername', (req, res) => {
  User.findOne({ email: req.body.email }, async (err, foundUser) => {
    if (err) {
      console.log(err);
    }
    else {
      if (foundUser) {
        const data = {
          from: 'fakeforapps0001@gmail.com',
          to: foundUser.email,
          subject: 'Password-reset',
          html: `<p>your username is ${foundUser.username}</p>`
        };
        await sgMail.send(data)
          .then(() => {
            res.status(200).json({ message: "your username is sent to the registered Email ID" })
          }, (err) => console.log(err))
          .catch((err) => console.log(err));
      }
      else {
        res.status(404).json({ message: "Email id not Registered" });
      }
    }
  });
});

//forgot password
router.post('/forgotpassword', (req, res) => {
  User.findOne({ email: req.body.email }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        crypto.randomBytes(48, async (err, buffer) => {
          const token = buffer.toString('hex');
          foundUser.resetPasswordToken = token;
          foundUser.save(err => {
            console.log(err);
          });
          const data = {
            from: 'fakeforapps0001@gmail.com',
            to: foundUser.email,
            subject: 'Password-reset',
            html: `<h2> Hello ${foundUser.username}</h2>
            <p><h4>Click on the following link down below to reset your password, if the link was not requested by you, then don't click here</h4></p>
            <a href="http://localhost:3000/api/v1/passwordReset/${foundUser.resetPasswordToken}">Reset password link</a>`
          };
          await sgMail.send(data)
            .then(() => {
              res.status(200).json({ token:token,message: "The reset link has been sent to the given mail Id" });
            }, (err) => console.log(err))
            .catch((err) => console.log(err));
        });
      } else {
        res.status(404).json({ message: "Email id not found" });
      }
    }
  })
});
router.get('/passwordReset/:verifytoken', function (req, res) {
  const verifyToken = req.params.verifytoken;
  User.findOne({ resetPasswordToken: verifyToken }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        res.status(200).json({ foundUser });
      } else {
        res.status(404).json({ message: "Email verification failed" })
      }
    }
  });
});
router.post('/passwordReset/:verifytoken', (req, res) => {
  const verifyToken = req.params.verifytoken;
  User.findOne({ resetPasswordToken: verifyToken })
    .then((foundUser) => {
      if (foundUser) {
        var password = req.body.password;
        var confirmPassword = req.body.confirmpassword;
        password = password.trim();
        if (password === "") {
          res.statusCode = 209;
          res.json({ success: false, message: "Password must not be empty" });
        }
        else if (password.length < 6) {
          res.statusCode = 422;
          res.json({ success: false, message: 'Password length should be greater than 6 characters' });
        }
        else if (password !== confirmPassword) {
          res.statusCode = 422;
          res.json({ success: false, message: 'Passwords do not match, please try again' });
        }
        else {
          bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
              console.log(err);
              res.statusCode = 500;
              res.json(err);
            }
            else {
              foundUser.resetPasswordToken = "";
              foundUser.password = hash;
              foundUser.save(err => {
                if (err) {
                  console.log(err);
                  res.statusCode = 500;
                  res.json(err);
                } else {
                  const data = {
                    from: 'fakeforapps0001@gmail.com',
                    to: foundUser.email,
                    subject: 'Password-reset successful!',
                    html: `<h1> Hello ${foundUser.username}</h1>
                              <p><h4>Your password has been successfully updated!</h4></p>`
                  };
                  sgMail.send(data)
                    .then(() => {
                      res.status(200).json({ message: "Your password has been successfully updated!" });
                    }, (err) => console.log(err))
                    .catch((err) => console.log(err));
                }
              });
            }
          })
        }
      }
      else {
        res.status(404).json({ message: "USer not found" });
      }
    })
    .catch(err => console.log(err));
});


module.exports = router;
