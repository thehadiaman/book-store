const {User} = require("../database/users");
const config = require('config');
const jsw = require('jsonwebtoken');
const ObjectId = require("mongodb").ObjectId;

module.exports = async function auth(req, res, next){

    try {
        const decoded = jsw.verify(req.header('x-auth-token'), config.get('jswPrivateKey'));
        const filter = {_id: ObjectId(decoded._id) , password: decoded.password};

        let user = await User.getUser(filter);
        if(user === null) return res.status(404).send('Invalid user credentials.');
        req.user = user;
        req.filter = filter;
        next()

    }catch (ex){
        res.send(ex.message)
    }

}