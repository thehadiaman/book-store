const {User} = require("../database/users");
const {validate, sendEmail} = require("../validation/users.js");
const {generateAuthenticationToken, validateVerify} = require("../validation/users");
const auth = require("../middlewares/auth");
const router = require('express').Router();

router.post('/', async(req, res)=>{
    const {error} = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.getUser({email: req.body.email});
    if(user !== null) return res.status(400).send('Email already used by another account.');

    await User.saveUser(req.body)
        .then(async()=>{
            await sendEmail(req.body.email);
            res
                .header('x-auth-token', await generateAuthenticationToken(req.body.email))
                .header('access-control-expose-headers', 'x-auth-token')
                .send('User registered.')
        })
        .catch((error)=>{
            res.send(error)
        })
})

router.post('/verify', auth, async(req, res)=>{

    const {error} = validateVerify(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    if(req.user.validate.valid) return res.send('User already verified.');

    const body = {};
    body.filter = req.filter;

    if(String(req.user.validate.code) !== req.body.code) body.error = true;
    else{
        await User.validateUser(body);
        return res.status(400).send('User verified.');
    }

    body.invalid = req.user.validate.invalid >= 2;

    const data = await User.validateUser(body);
    const response = req.user.validate.invalid<=3? 'Invalid code.': 'New verification code generated';
    if(req.user.validate.invalid>=2) await sendEmail(req.user.email);

    res.header('x-auth-token', await generateAuthenticationToken(req.user.email))
        .header('access-control-expose-headers', 'x-auth-token')
        .send(response);
});

module.exports = router;