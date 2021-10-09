const Joi = require('joi');

const schema = Joi.object({
    email: Joi.string().min(10).max(75).email().required(),
    password: Joi.string().min(6).max(1024).required()
});


exports.validaLogin = function (body){
    return schema.validate(body)
}