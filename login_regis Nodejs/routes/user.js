const express = require('express');
const router = express.Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');

//Login Page
router.get('/login', (req, res) => {
    res.render('login')
})

//Register
router.get('/register', (req, res) => {
    res.render('register')
})

//Register handle
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];
    //check required fields
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please Fill In All Fields' });
    }
    //check passwords match
    if (password !== password2) {
        errors.push({ msg: 'Passwords Do not Match' });
    }

    //check pass length
    if (password.length < 6) {
        errors.push({ msg: 'Password Should Be At Least 6 Charecters' });
    }

    if (errors.length > 0) {

    } else {
        //Validation Pass
        User.findOne({ email: email }).then(user => {
            if (user) {
                errors.push({ msg: 'User Exists' });
                //User Exists
                res.render('register', {
                    errors,
                    name,
                    email,
                    password,
                    password2

                });
            } else {
                const newUser = new User({
                    name,
                    email,
                    password
                });

                //Hash Password
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;

                    //Set Password to Hashed
                    newUser.password = hash;

                    //Save The user
                    newUser.save()
                        .then(user => {
                            req.flash('success_msg', 'You Are Now Registered!');
                            res.redirect('/user/login');
                        })
                        .catch(err => console.log(err));

                }))
            }
        });
    }

});

//Login Hqandle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/user/login',
        failureFlash: true

    })(req, res, next);
});

//logout handle
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are Logged Out');
    res.redirect('/user/login');
});

//Profile Picture Handle


module.exports = router;