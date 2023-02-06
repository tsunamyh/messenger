const errorHandler = require("http-errors")
const http = require('http');
const path = require("path");
const express = require("express");
const session = require('express-session');
const cookieParser = require("cookie-parser")
const { userRouter, isLoggedIn } = require("./routes/users/4userRouter");
const passport = require("passport");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// app.set("PORT", process.env.PORT || 8080);

app.use(cookieParser())
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

const sessionParser = session({
  secret: "sakethereiswebsocket",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
});

app.use(sessionParser)

//define req.login & req.logout & ...
//کاربری که ثبت نام شده باشه یعنی پاسپورت در رک.سشن توسط اکسپرس-سشن ضمیمه شده باشه پاسپورت.سشن آنرا به دیسریالایز میفرستد
app.use(passport.session()) //in req.login

app.use('/user', userRouter)

app.get("/chat", isLoggedIn, function (req, res, next) {
  res.render("chat", {
    username: req.user.username
  })
});

app.get("/", function (req, res, next) {
  res.render("home");
});

app.get("*", (req, res, next) => {
  if (req.path == "/wsclient" || req.path == "/favicon.ico") {
    return next()
  }
  next(errorHandler(404))  // next(new Error("404"))
})

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
})

const server = http.createServer(app);

module.exports = {
  server,
  sessionParser
};
