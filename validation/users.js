const Joi = require('joi');
const {User} = require("../database/users");
const sgMail = require("@sendgrid/mail");
const config = require("config");
const jwt = require('jsonwebtoken');

const schema = Joi.object({
    name: Joi.string().min(3).max(75).required(),
    email: Joi.string().min(10).max(75).required().email(),
    password: Joi.string().min(6).max(50).required(),
    address: Joi.string().min(6).max(60).required(),
    phone: Joi.string().min(8).max(13).required(),
    type: Joi.string().min(5).max(6).required().valid('seller', 'buyer')
});

exports.validate = function (body) {
    return schema.validate(body);
}

exports.validateVerify = function (body){
    const schema = Joi.object({
        code: Joi.string().min(5).max(6).required()
    });
    return schema.validate(body);
}

exports.validateEmailOnly = function (body){
    const schema = Joi.object({
        email: Joi.string().min(10).max(75).email().required()
    });
    return schema.validate(body);
}

exports.validatePasswordOnly = function (body){
    const schema = Joi.object({
        password: Joi.string().min(6).max(50).required()
    });
    return schema.validate(body);
}

exports.sendEmail = async(email)=>{
    let user = await User.getUser({email: email});

    sgMail.setApiKey(config.get('EMAIL_API'))
    const msg = {
        to: user.email,
        from: config.get('EMAIL'),
        subject: 'Book Store account code',
        text: 'Book Store - Debating messenger application',
        html: `<p>Your Debenger code is <u><b>${user.validate.code}</b></u>. </p>`,
    }

    return sgMail
        .send(msg)
        .then((data)=>console.log(data))
        .catch((error)=>console.log(error.response.body.errors[0].message))
}

exports.generateAuthenticationToken = async function(email){
    let user = await User.getUser({email: email});
    const payload = {_id: user._id, name: user.name, password: user.password, valid: user.validate.valid, type: user.type};
    const jswPrivateKey = config.get('jswPrivateKey');

    return jwt.sign(payload, jswPrivateKey);
}