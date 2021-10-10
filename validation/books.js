const Joi = require('joi');

const schema = Joi.object({
    title: Joi.string().min(1).max(100).required(),
    author: Joi.array().min(1).max(100).required(),
    description: Joi.string().min(1).max(700).required(),
    price: Joi.number().min(1).max(5000).required(),
    stock: Joi.number().min(1).max(10000).required(),
    discount: Joi.number().min(0).max(99).required()
});

exports.validate = function(body){
    return schema.validate(body);
}