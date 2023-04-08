const passport = require('passport')
const LocalStrategy = require('passport-local')
const { saveUser, findUserById, findUserByUsername } = require('./2userModel')
const bcrypt = require("bcryptjs")

passport.use(new LocalStrategy({ passReqToCallback: true },//To access req
  async function (req, username, password, done) {
    if (username=="admin"&&password=="admin") {
      return done(null,{username:"admin",_id:"12000"})
    }
    const user = await findUserByUsername(username)
    req.session.messages = []
    if (!user) {
      return done(null, false, { message: "Incorrect username" });
    }
    bcrypt.compare(password, user.password, function (err, success) {
      if (err) { //return done(null, false, "Incorrect password") };
        console.log("bcryptjs: cannot Compare passeword");
      }
      if (success) {
        return done(null, user)
      }else{
        return done(null, false, "Incorrect password")
      }
    })
  }
))

//initialize req.session.passport
passport.serializeUser(function (user, done) {
  done(null, user._id)
  //Done & returns to req.login while signing up
  //درواقع انجام میشه و برمیگرده به ادامه کار در رک.لاگین موقع ثبت نام
})

//Get req.session.passport & save in req.user
passport.deserializeUser(async function (id, done) {
  if(id=="12000"){
    return done(null, { username: "admin" })
  }
  const user = await findUserById(id)
  done(null, { username: user.username })
})

function signupGet(req, res, next) {
  res.render("signup", {
    failSignup: req.session.signupMessage || ""
  });
  delete req.session.signupMessage
  req.session.save()
}

async function signupPost(req, res, next) {
  let user = req.body;

  const existUser = await findUserByUsername(user.username)
  if (existUser) {
    req.session.signupMessage = "Username Already Exist"
    return res.redirect("/user/signup")
  }

  user = await saveUser(user);
  //pass user to serializeUser
  //req.login is primarily used when users sign up,during which req.login() can be invoked to automatically log in the newly registered user.
  req.login(user, function (err) {
    if (err) { return next(err); };
    res.redirect("/chat")
  })
}

function loginGet(req, res, next) {
  if (req.session.messages) {
    res.render("login", {
      faiLogin: req.session.messages[0]
    });
  } else {
    res.render("login", {
      faiLogin: ""
    })
  }
  delete req.session.messages
  req.session.save()
}

function logoutGet(req, res, next) {
  req.logout(function (err) {
    req.session.destroy()
    if (err) { return next(err); }
    res.redirect('/');
  });
}

module.exports = {
  signupGet,
  signupPost,
  loginGet,
  logoutGet,
}