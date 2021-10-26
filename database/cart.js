const {database} = require("../startup/database");
const databaseConfig = require('./config.json');

exports.Cart = {
    getCartItems: (userId)=>{
        return database().collection(databaseConfig.CART_COLLECTION).findOne({userId: userId});
    },

    addToCart: async(userId, bookId, count)=>{
        const cart = await database().collection(databaseConfig.CART_COLLECTION).findOne({userId: userId});
        if(!cart){
            console.log(123);
            const cartSchema = {
                userId: userId,
                cart: [{
                    bookId: bookId,
                    quantity: 1
                }]
            };
            return database().collection(databaseConfig.CART_COLLECTION).insertOne(cartSchema);
        }

        const userItem = cart.cart!==[]? cart.cart.find(item=>String(item.bookId) === String(bookId)) : [];
        if(userItem===undefined){
            const item = {
                bookId: bookId,
                quantity: 1
            };
            return database().collection(databaseConfig.CART_COLLECTION).findOneAndUpdate({userId: userId}, {
                $push: {'cart': item}
            });
        }

        if((userItem.quantity + count)===0){
            return database().collection(databaseConfig.CART_COLLECTION).updateOne({userId: userId}, {$pull: {'cart': userItem}});
        }

        return database().collection(databaseConfig.CART_COLLECTION).updateOne({'cart.bookId': bookId}, {$inc:{'cart.$.quantity': count}});
    },

    getCartCount: async(userId)=>{

        const cart = await database().collection(databaseConfig.CART_COLLECTION).findOne({userId: userId});
        if(!cart) return 0;

        return await database().collection(databaseConfig.CART_COLLECTION).aggregate([
            {
                $match: {userId: userId}
            },
            {
                $unwind: '$cart'
            },
            {
                $group: {
                    _id: Date.now(),
                    count: {$sum: "$cart.quantity"}
                }
            }
        ]).toArray();
    },

    getAllFromCart: async()=>{

        return await database().collection(databaseConfig.CART_COLLECTION).aggregate([
            {$unwind: '$cart'},
            {
                $lookup:{
                    from: "books",
                    localField: "cart.bookId",
                    foreignField: "_id",
                    as: "cartItems"
                }
            },
            {
                $project: {
                    _id: "$cartItems._id",
                    quantity: "$cart.quantity",
                    cartItems: "$cartItems"
                }
            },
            {$unwind: '$cartItems'},
            {$unwind: '$_id'},
            {
                $set: {
                    "cartItems.quantity": "$quantity"
                }
            }
        ]).toArray();
    }
};