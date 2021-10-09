const {validaLogin} = require("../validation/auth");
const {User} = require("../database/users");
const {generateAuthenticationToken} = require("../validation/users");
const router = require('express').Router()
const bcrypt = require('bcrypt');

router.post('/', async(req, res)=>{

    const {error: LoginValueError} = validaLogin(req.body);
    if(LoginValueError) return res.status(400).send(LoginValueError.details[0].message);

    const user = await User.userLogin(req.body);
    if(!user) return res.status(400).send('Invalid Email or Password.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if(!validPassword) return res.status(400).send('Invalid Email or Password.');


    res
        .header('x-auth-token', await generateAuthenticationToken(req.body.email))
        .header('access-control-expose-headers', 'x-auth-token')
        .send('Login successful.')



});

module.exports = router;