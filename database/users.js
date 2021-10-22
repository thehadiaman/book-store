const databaseConfig = require('./config.json');
const {database} = require("../startup/database");
const {userSchema} = require("../schemas/user");
const bcrypt = require('bcrypt');

exports.User = {

    saveUser : async(body)=>{
        const user = await userSchema(body);
        return database().collection(databaseConfig.USER_COLLECTION).insertOne(user)
    },

    getUser: (filter)=>{
        return database().collection(databaseConfig.USER_COLLECTION).findOne(filter);
    },

    generateForgetPasswordCode: (filter)=>{
        return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate(filter, {
            $set: {'resetPassword.code': Math.floor(Math.random() * 1000000)}
        });
    },

    validateUser: async({invalid, error, filter, password})=>{

        if(invalid) {
            return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate(filter, {
                $set: {'validate.invalid': 0, 'validate.code': Math.floor(Math.random() * 1000000),
                'validate.date': Date.now()
                }
            });
        }

        if(error) {
            return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate(filter, {
                $inc: {'validate.invalid': 1}
            });
        }

        if(password){
            return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate(filter, {
                $set: {'password': await bcrypt.hash(password, await bcrypt.genSalt(10)),
                    'validate.code': Math.floor(Math.random() * 1000000)
                }
            });
        }

        database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate(filter, {
            $set: {'validate.valid': true}
        });
    },

    userLogin: (body)=>{
        return database().collection(databaseConfig.USER_COLLECTION).findOne({email: body.email});
    },

    getVerificationCode: (filter)=>{
        return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate(filter, {
            $set: {'validate.invalid': 0, 'validate.code': Math.floor(Math.random() * 1000000),
                'validate.date': Date.now()
            }
        });
    },

    addToFavorite: (_id, id)=>{
        return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate({_id: _id},
            {$push: {"favorites": id}}
        )
    },

    removeFromFavorite: (userId, bookId)=>{
        return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate({_id: userId},
            {$pull: {"favorites": bookId}}
        )
    },

    newPasswordResetCode: async(email, invalid)=>{
        
        if(invalid===2){
            return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate({email: email}, {
                $set: {'resetPassword.invalid' : 0}
            })
        }

        return database().collection(databaseConfig.USER_COLLECTION).findOneAndUpdate({email: email}, {
            $inc: {'resetPassword.invalid': 1}
        })

    }

}
