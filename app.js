const express = require('express');
const app = express();
const mongoose = require('mongoose'); 
const favicon = require('serve-favicon');
const User = require('./models/user');
const path = require('path');
const bodyParser = require('body-parser');
const uniqid = require('uniqid');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');
const arraySort = require("array-sort");
const sortArray = require("sort-array");
const axios = require("axios");
const request = require("request");
// console.log(arraySort([3, 4, 5, 1, 2, 8, 9, 6, 7, 10, 127391892, 1212112312, 2131213123, 4345233242]))

const defaultAvatarUrl = 'https://usercontent.one/wp/adtpest.com/wp-content/uploads/2018/08/default-avatar.jpg';

app.use(cookieParser());



const HOSTNAME = '0.0.0.0'; 
const PORT = process.env.PORT || 3000;  
const URI = 'mongodb+srv://Shabbar:Shabbar52@userinfologinsystem.fimrz.mongodb.net/Users?retryWrites=true&w=majority';

let SIGNED_IN = false;

app.set('view engine', 'ejs') 
app.use('/style', express.static('style')) 
app.use('/img', express.static('img'))
app.use('/sounds', express.static('sound'))
app.use(favicon(path.join(__dirname, 'img', 'cash.jpg')))

var urlencodedParser = bodyParser.urlencoded({ extended: false })

mongoose.connect(URI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(()=>{app.listen(PORT, HOSTNAME, ()=>console.log(`App running on http://localhost:${PORT}`))})
    .catch(err=>console.log("An error has occured during connection: ", err))


function signInValidationCookie(req, res, next){
    let {cookies} = req;
        User.findOne({"id": cookies.id}).exec()
        .then(result=>{
            res.render('index', {personName: result.name, personAvatar: result.avatarUrl})
            SIGNED_IN = true;
            return;
        
        })
        .catch(err=>{
            console.log("An error occured while using the cookie, error: ")
            console.log(err)
            next();
        })
}

app.get('/', signInValidationCookie, (req, res)=>{
    console.log("did not work")
    res.render('index', {personName: '', personAvatar: ''})
})

app.post('/', urlencodedParser, (req, res)=>{
    if(req.body.id){
        res.cookie('id', req.body.id)
    }else{
        console.log("That is not the right way")
    }
})

app.get('/sign_in', (req, res)=>{
    if(SIGNED_IN){
        res.redirect("/sign_out")
        return;
    }else{
        res.render('sign-in')
    }
})

app.post('/sign_in', urlencodedParser, (req, res)=>{
    console.log(req.body.email)
    User.findOne({"email": req.body.email}).exec()
        .then(result=>{
            let passwordCheck = bcrypt.compare(req.body.password, result.password, (err, res)=>{
                if(err)console.log(err)
            })
            // SIGNED_IN = true;
            res.cookie("id", result.id, {maxAge: 90000000, overwrite: true})
            res.redirect('/')
            return;
        })
        .catch(err=>{
         if(err){
            res.send("The email does not exist")
            console.log(err)
        }
        })
})

app.get('/sign_up', (req, res)=>{
    if(SIGNED_IN){
        res.redirect("/sign_out")
        return;
    }else{
        res.render('sign-up')
    }
})

app.post('/sign_up', urlencodedParser, async (req, res)=>{

    let hashedPassword = '';

    try{
        hashedPassword = await bcrypt.hash(req.body.password, 10);
    }
    catch{
        res.status(500).send('An Error has occurred during saving try again, in a few seconds')
        console.log('An Error has occurred during saving try again, in a few seconds')
    }



    let newId = uniqid();
    const newUser = new User({
        name: req.body.name,
        id: newId,
        email: req.body.email,
        password: hashedPassword,
        avatarUrl: req.body.avatarUrl || defaultAvatarUrl,
        profile: {
            coins: 0,
            streak: 0,
            level: 0,
            reqxp: 1,
            currentxp: 0,
            xpBooster: 1,
            permanentxpbooster: 1,
            moneyBooster: 1,
            boostersBought: 0
        }
    })

    newUser.save(err=>{
        if(err)res.redirect('/sign_in'), console.log(err)
        else{
            // SIGNED_IN = true;
            // res.cookie('id', newId, {maxAge: 2628000000})
            res.redirect("/sign_in")
        }
    })

    // res.redirect('/')
})

app.get('/sign_out', (req, res)=>{
    res.render('sign-out')
})

app.post('/sign_out', (req, res)=>{
    SIGNED_IN = false;
    res.clearCookie("id")
    res.redirect('/')
})