const databaseConfig = require('./config.json');
const {database} = require("../startup/database");
const {userSchema} = require("../schemas/user");

exports.User = {

    saveUser : async(body)=>{
        const user = await userSchema(body);
        return database().collection(databaseConfig.USER_COLLECTION).insertOne(user)
    },

    getUser: (filter)=>{
        return database().collection(databaseConfig.USER_COLLECTION).findOne(filter);
    },

    validateUser: ({invalid, error, filter})=>{

        if(invalid) {
            return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate(filter, {
                $set: {'validate.invalid': 0, 'validate.code': Math.floor(Math.random() * 1000000)}
            });
        }

        if(error) {
            return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate(filter, {
                $inc: {'validate.invalid': 1}
            });
        }

        database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate(filter, {
            $set: {'validate.valid': true}
        });
    },

}
