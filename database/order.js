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
const {ObjectId} = require('mongodb');

exports.Order = {
    placeOrder: async (userId) => {
        const cart = await Cart.getCartItems(userId);
        if (cart === null || cart.cart.length <= 0) {
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
                    _id: new ObjectId(),
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

            return database().collection(databaseConfig.ORDER_COLLECTION).insertOne(order);
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
                    _id: new ObjectId(),
                    items: cart.cart,
                    cost: totalCost,
                    status: "ordered",
                    address: user.address,
                    zip: user.zip,
                    contactNumber: user.phone
                }
            }
        });

        return true;
    },

    validateCheckOut: async (userId, payment) => {
        const cart = await Cart.getCartItems(userId);
        if (cart === null || cart.cart.length <= 0) {
            return false;
        }

        const user = await User.getUser({
            _id: userId
        });

        if (payment === 'cod') return true;
        console.log(payment);
        return false;
    },

    getMyOrders: async (userId) => {

        let orders = await database().collection(databaseConfig.ORDER_COLLECTION).aggregate([{
                $match: {
                    userId: userId
                }
            },
            {$unwind: '$orders'},
            {
                $addFields: {
                    cost: '$orders.cost',
                    status: '$orders.status',
                    address: '$orders.address',
                    zip: '$orders.zip',
                    phone: '$orders.contactNumber',
                    order: '$orders.items'
                }
            },
            {
                $project: {
                    orders: 0
                }
            },
            {
                $lookup: {
                    from: 'books',
                    localField: 'order.bookId',
                    foreignField: '_id',
                    as: 'books'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            }

        ]).toArray();

        return orders;

    },

    checkOrder: async (userId) => {
        return database().collection(databaseConfig.ORDER_COLLECTION).findOne({
            userId: userId
        });
    },
};