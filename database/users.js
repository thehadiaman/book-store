const databaseConfig = require('./config.json');
const {database} = require("../startup/database");
const {userSchema} = require("../schemas/user");

exports.User = {

    checkUser : (email)=>{
        return database().collection(databaseConfig.USER_COLLECTION).findOne({email: email});
    },

    saveUser : (body)=>{
        const user = userSchema(body);
        return database().collection(databaseConfig.USER_COLLECTION).insertOne(user)
    },

    getUser: (body)=>{
        const filter = body.email ? {email: body.email}: {_id: body._id}
        return database().collection(databaseConfig.USER_COLLECTION).findOne(filter);
    }
}
