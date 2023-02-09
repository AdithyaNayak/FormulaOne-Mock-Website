if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const { name } = require('ejs')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const mongoose = require("mongoose")


const users = []
const uri =
  "mongodb+srv://adithyadnayak:adithya1@formula1cluster.ovbbqpg.mongodb.net/?retryWrites=true&w=majority";
const port = 3000;


const initializePassport = require('./passport-config')
initializePassport(
    passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id),
)

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended : false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static("public"));

const teamsSchema = {
    Name: {
        type: String,
    },
    Drivers: {
        type: Array,
    },
    Standing: {
        type: String,
    },
    Points: {
        type: String,
    },
};
  
  
const Team = mongoose.model('Team', teamsSchema);


app.set('view engine', 'ejs')

async function connect() {
    try {
        await mongoose.connect(uri)
        console.log("Connected to Mongodb")
    } catch(error) {
        console.error(error);
    }
}

connect();

app.get('/teams', (req, res) => {
    Team.find({}, function(err, teams){
        res.render('teams', {
        teamsList: teams
        })
    })
})

app.get('/drivers', (req, res) => {
Team.find({}, function(err, teams){
    res.render('drivers', {
    teamsList: teams
    })
}).sort({Standing: 1})
})

app.get("/home", (req, res) => {
    res.render('home.ejs')
})

app.get("/schedule", (req, res) => {
  res.render('schedule.ejs')
})

app.get("/", checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name : req.user.name })
})

app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}))

app.get("/register", checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) =>{

    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id : Date.now.toString(),
            name : req.body.name,
            email : req.body.email,
            password : hashedPassword
        })

        res.redirect("/login")
    }
    catch{
        res.redirect("/register")
    }
    console.log(users)
    
})

function checkAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')

}


app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { 
        return next(err); 
        }
      res.redirect('/');
    });
});
  

function checkNotAuthenticated (req, res, next) {
    if(req.isAuthenticated()) {
        return res.redirect('/')
    }

    next()
}

app.listen(3000)
