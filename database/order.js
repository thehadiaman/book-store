const {
    database
} = require("../startup/database");
const databaseConfig = require('./config.json');
const {
    Cart
} = require("../database/cart");
const {
    User
} = require("./users");

exports.Order = {
    placeOrder: async (userId) => {

        const cart = await Cart.getCartItems(userId);
        if(cart===null || cart.cart.length<=0){
            return false;
        }

        const order = await database().collection(databaseConfig.ORDER_COLLECTION).findOne({
            userId: userId
        });

        const user = await User.getUser({
            _id: userId
        });
        const totalCost = (await Cart.getTotalPrice(userId))[0].total;

        if (!order) {
            const order = {
                userId: userId,
                orders: [{
                    items: cart.cart,
                    cost: totalCost,
                    status: "ordered",
                    address: user.address,
                    zip: user.zip,
                    contactNumber: user.phone
                }]
            };
            database().collection(databaseConfig.CART_COLLECTION).findOneAndUpdate({
                userId: userId
            }, {
                $set: {
                    cart: []
                }
            });

            database().collection(databaseConfig.ORDER_COLLECTION).insertOne(order);
        }

        database().collection(databaseConfig.CART_COLLECTION).findOneAndUpdate({
            userId: userId
        }, {
            $set: {
                cart: []
            }
        });

        database().collection(databaseConfig.ORDER_COLLECTION).findOneAndUpdate({
            userId: userId
        }, {
            $push: {
                orders: {
                    items: cart.cart,
                    cost: totalCost,
                    status: "ordered",
                    address: user.address,
                    zip: user.zip,
                    contactNumber: user.phone
                }
            }
        });

        // const sellers = database().collection(databaseConfig.BOOK_COLLECTION).findOneAndUpdate();
        return;
    },

    validateCheckOut: async(userId, payment)=>{

        const cart = await Cart.getCartItems(userId);
        if(cart===null || cart.cart.length<=0){
            return false;
        }

        const user = await User.getUser({
            _id: userId
        });

        if(payment==='cod') return true;
        console.log(payment);
        return false;

    }

};