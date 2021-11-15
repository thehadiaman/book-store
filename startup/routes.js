const express = require('express');
const users = require('../routes/users');
const auth = require('../routes/auth');
const books = require('../routes/books');
const cart = require('../routes/cart');
const order = require('../routes/order');
const error = require('../middlewares/error');

module.exports = function (app){
    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/auth', auth);
    app.use('/api/books', books);
    app.use('/api/cart', cart);
    app.use('/api/order', order);
    app.use(error);
};