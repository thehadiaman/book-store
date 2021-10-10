const express = require('express');
const users = require('../routes/users');
const auth = require('../routes/auth');
const books = require('../routes/books');
const cart = require('../routes/cart');

module.exports = function (app){
    app.use(express.json())
    app.use('/api/users', users);
    app.use('/api/auth', auth);
    app.use('/api/books', books);
    app.use('/api/cart', cart);
}