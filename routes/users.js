const {User} = require("../database/users");
const {validate, sendEmail} = require("../validation/users.js");
const router = require('express').Router();

router.post('/', async(req, res)=>{
    const {error} = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.checkUser(req.body.email);
    if(user !== null) return res.status(400).send('Email already used by another account.');

    await User.saveUser(req.body)
        .then(()=>{
            sendEmail(req.body.email);
            res.send('User registered.')
        })
        .catch(()=>{
            res.send('Invalid credentials to register.')
        })
})

module.exports = router;