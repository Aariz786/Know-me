//jshint eversion:6
//require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const nodemailer = require('nodemailer');

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs');

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useUnifiedTopology: true });
mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema({
  email:String,
  password: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const homeStartingContent = "";
const aboutContent = "";
const contactContent = "";

const postSchema = {
  title: String,
  content: String
};
const emailSchema = {
  username: String
};
const Post = mongoose.model("Post", postSchema);
const Email = mongoose.model("Email", emailSchema);

//nodemailer
var transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 600,
  secure: false, // secure:true for port 465, secure:false for port 587
  auth: {
    user: 'mohammadaariz11@gmail.com',
    pass: 'mohammad@786'
  }
});

var email_obj=[];
Email.find({},function(err,emails){
  if(err){
    console.log(err);
  }else{
    //console.log(emails);
    email_obj = [...emails];
  }
});
console.log(email_obj);
//get routes
app.get("/", function(req, res) {
  res.render("entry");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/home", function(req, res) {
  if (req.isAuthenticated()) {
    Post.find({}, function(err, posts){
      res.render("home", {
        startingContent: homeStartingContent,
        posts: posts
        });
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/compose", function(req, res){
  if(req.user.username==="mohammadaariz11@gmail.com")
  {
    res.render("compose");
  }
  else{
    res.redirect("/home");
  }
});

app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });

});

app.get("/logout",function(req,res){
  console.log(req.user);
  req.logout();
  res.redirect("/");
})

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/subscribe",function(req,res){
  const useremail = new Email({
    username: req.user.username
  });
  useremail.save(function(err){
    if(!err){
      //console.log(req.user.username);
      res.redirect("/home");
    }
  })
});

//post routes
app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        Post.find({}, function(err, posts){
          res.render("home", {
            startingContent: homeStartingContent,
            posts: posts
            });
        });
      })
    }
  })
});

app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        Post.find({}, function(err, posts){
          res.render("home", {
            startingContent: homeStartingContent,
            posts: posts
            });
        });
      })
    }
  });
});
app.post("/compose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });


  post.save(function(err){
    if (!err){
      //now send the email to all the people

      //nodemailer
      email_obj.forEach(function (email) {


        var msg = {
          from: 'mohammadaariz11@gmail.com',// sender address
          subject: "New Post", // Subject line
          text: "Hello This is an auto generated Email for testing  from node please ignore it  ✔", // plaintext body
          //  html: "<b>Hello world ✔</b>" // html body
        }
        msg.to = email;
        transport.sendMail(msg, (error, info) => {
          if (error) {
              console.log(error);
            }else{
            console.log('Message sent: %s', info.messageId);
          }
          });
        });
    res.redirect("/home");
  }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
