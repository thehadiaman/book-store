const {database} = require("../startup/database");
const databaseConfig = require('./config.json');

exports.Cart = {
    getCartItems: (userId)=>{
        return database().collection(databaseConfig.CART_COLLECTION).findOne({userId: userId});
    },

    addToCart: async(userId, bookId, count)=>{
        const cart = await database().collection(databaseConfig.CART_COLLECTION).findOne({userId: userId});
        if(!cart){
            const cartSchema = {
                userId: userId,
                cart: [{
                    bookId: bookId,
                    quantity: 1
                }]
            };
            return database().collection(databaseConfig.CART_COLLECTION).insertOne(cartSchema);
        }

        const userItem = cart.cart? cart.cart.filter(item=>String(item.bookId) === String(bookId)) : [];
        if(userItem.length===0){
            const item = {
                bookId: bookId,
                quantity: 1
            };
            return database().collection(databaseConfig.CART_COLLECTION).findOneAndUpdate({userId: userId}, {
                $push: {'cart': item}
            });
        }

        const newUserItem = {};
        newUserItem.bookId = userItem[0].bookId;
        newUserItem.quantity = userItem[0].quantity + count;

        if(newUserItem.quantity===0){
            return database().collection(databaseConfig.CART_COLLECTION).updateOne({userId: userId}, {$pull: {'cart': userItem[0]}});
        }

        database().collection(databaseConfig.CART_COLLECTION).updateOne({userId: userId}, {$pull: {'cart': userItem[0]}});
        return database().collection(databaseConfig.CART_COLLECTION).updateOne({userId: userId}, {$push: {'cart': newUserItem}});
    },

    getCartCount: (userId)=>{



    }

}