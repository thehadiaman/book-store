const Joi = require('joi');

const schema = Joi.object({
    title: Joi.string().min(1).max(100).required(),
    image: Joi.string().min(10).max(200).required(),
    author: Joi.array().min(1).max(100).required(),
    description: Joi.string().min(1).max(700).required(),
    price: Joi.number().min(1).max(25000).required(),
    stock: Joi.number().min(1).max(25000).required(),
    discount: Joi.number().min(0).max(99).required()
});

exports.validate = function(body){
    return schema.validate(body);
};

exports.rateValidation = function (body) {
    return Joi.object({
        rate: Joi.number().min(0).max(5).required()
    }).validate(body);
};

exports.contendValidation = function (body) {
    return Joi.object({
        bookId: Joi.string().min(1).max(100).required(),
        heading: Joi.string().min(1).max(500).required(),
        review: Joi.string().min(1).max(1000).required()
    }).validate(body);
};