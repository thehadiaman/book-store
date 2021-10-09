const {User} = require("../database/users");
const {validate, sendEmail} = require("../validation/users.js");
const {generateAuthenticationToken, validateVerify, validateEmailOnly, validatePasswordOnly} = require("../validation/users");
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

router.put('/verify', auth, async(req, res)=>{

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

    await User.validateUser(body);
    const response = req.user.validate.invalid<=3? 'Invalid code.': 'New verification code generated';
    if(req.user.validate.invalid>=2) await sendEmail(req.user.email);

    res
        .header('x-auth-token', await generateAuthenticationToken(req.user.email))
        .header('access-control-expose-headers', 'x-auth-token')
        .send(response);
});

router.put('/forgetpassword', async(req, res)=>{

    const {error} = validateEmailOnly(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.getUser({email: req.body.email});
    if(!user) return res.status(404).send('No user found.');

    await User.generateForgetPasswordCode({email: req.body.email})
    await sendEmail(req.body.email);
    res
        .header('email', req.body.email)
        .header('access-control-expose-headers', 'email')
        .send('Code generated');

});

router.put('/resetpassword', async(req, res)=>{

    if(!req.header('email')) return res.status(400).send('Invalid credentials.');

    const {error : EmailError} = validateEmailOnly({email: req.header('email')});
    if(EmailError) return res.status(400).send(EmailError.details[0].message);

    const {error: CodeError} = validateVerify({code: req.header('code')});
    if(CodeError) return res.status(400).send(CodeError.details[0].message);

    let user = await User.getUser({email: req.header('email')});
    if(!user) return res.status(404).send('No user found.');

    if(String(user.validate.code) !== req.header('code')) return res.status(400).send('Invalid credentials.');

    const {error: PasswordError} = validatePasswordOnly({password: req.body.password});
    if(PasswordError) return res.status(400).send(PasswordError.details[0].message);

    await User.validateUser({password: req.body.password, filter: {email: req.header('email')}});
    res.send('Password changed')
});

module.exports = router;