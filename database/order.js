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
const {
    ObjectId
} = require('mongodb');

exports.Order = {
    placeOrder: async (userId) => {
        const cart = await Cart.getCartItems(userId);
        if (cart === null || cart.cart.length <= 0) {
            return false;
        }

        if (cart !== null || cart.cart.length > 0) {
            const items = cart.cart;

            for (let a = 0; a < items.length; a++) {
                items[a] = {
                    _id: items[a]._id,
                    quantity: items[a].quantity
                };
            }
            cart.cart = items;
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
                    OrderId: new ObjectId(),
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
                    OrderId: new ObjectId(),
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
            {
                $unwind: '$orders'
            },
            {
                $addFields: {
                    OrderId: '$orders.OrderId',
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
                    localField: 'order._id',
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

    cancelOrder: async (userId, OrderId) => {
        const orderItems = await database().collection(databaseConfig.ORDER_COLLECTION).findOne({
            userId: userId,
            'orders.OrderId': OrderId
        });

        if (!orderItems) return false;
        const order = orderItems.orders.find(o => String(o.OrderId) === String(OrderId));

        if (order.status === 'delivered' || order.status === 'cancelled') return false;

        await database().collection(databaseConfig.CART_COLLECTION).findOneAndUpdate({
            userId: userId
        }, {
            $push: {
                cart: {
                    $each: order.items
                }
            }
        });

        const newOrder = {
            ...order
        };
        newOrder.status = 'cancelled';

        database().collection(databaseConfig.ORDER_COLLECTION).findOneAndUpdate({
            userId: userId
        }, {
            $pull: {
                'orders': order
            }
        });

        database().collection(databaseConfig.ORDER_COLLECTION).findOneAndUpdate({
            userId: userId
        }, {
            $push: {
                'orders': newOrder
            }
        });

        return true;
    },

    getDeliveries: async (zip) => {

        return database().collection(databaseConfig.ORDER_COLLECTION).aggregate([{
                $unwind: "$orders"
            },
            {
                $match: {
                    "orders.zip": zip
                }
            },
            {
                $lookup: {
                    from: "books",
                    localField: "orders.items._id",
                    foreignField: "_id",
                    as: "books"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "books.seller._id",
                    foreignField: "_id",
                    as: "sellers"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    "orders.OrderId": 1,
                    "orders.items": 1,
                    "orders.cost": 1,
                    "orders.address": 1,
                    "orders.quantity": 1,
                    "orders.status": 1,
                    "orders.zip": 1,
                    "orders.contactNumber": 1,
                    "books.title": 1,
                    "books._id": 1,
                    "books.seller._id": 1,
                    "books.price": 1,
                    "sellers._id": 1,
                    "sellers.name": 1,
                    "sellers.address": 1,
                    "sellers.phone": 1,
                    "sellers.email": 1,
                    "sellers.zip": 1,
                    "user.name": 1
                }
            }
        ]).toArray();

    },

    orders: (userId) => {
        const orders = database().collection(databaseConfig.ORDER_COLLECTION).aggregate([{
                $unwind: "$orders"
            },
            {
                $addFields: {
                    "OrderId": "$orders.OrderId",
                    "cost": "$orders.cost",
                    "status": "$orders.status",
                    "address": "$orders.address",
                    "zip": "$orders.zip",
                    "contactNumber": "$orders.contactNumber",
                    "orders": "$orders.items"
                }
            },
            {
                $unwind: '$orders'
            },
            {
                $lookup: {
                    from: 'books',
                    localField: 'orders._id',
                    foreignField: '_id',
                    as: 'books'
                }
            },
            {
                $unwind: '$books'
            },
            {
                $match: {
                    "books.seller._id": userId
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'zip',
                    foreignField: 'zip',
                    as: 'delivery_partner'
                }
            },
            {
                $unwind: '$delivery_partner'
            },
            {
                $match: {
                    'delivery_partner.type': 'delivery_partner'
                }
            },
            {
                $addFields: {
                    quantity: "$orders.quantity",
                    bookTitle: "$books.title",
                    _id: "$books._id",
                    price: "$books.price",
                    packed: "$orders.packed",
                    deliveryPartnerName: '$delivery_partner.name',
                    deliveryPartnerPhone: "$delivery_partner.phone"
                }
            },
            {
                $project: {
                    OrderId: 1,
                    deliveryPartnerName: 1,
                    deliveryPartnerPhone: 1,
                    totalCost: {
                        $multiply: [{
                            $toInt: '$price'
                        }, {
                            $toInt: '$quantity'
                        }]
                    },
                    bookTitle: 1,
                    quantity: 1,
                    packed: 1,
                    status: 1
                }
            }
        ]).toArray();

        return orders;
    },
    packBook: async (orderId, bookId) => {
        const orders = await database().collection(databaseConfig.ORDER_COLLECTION).findOne({
            'orders.OrderId': orderId,
            'orders.items._id': bookId
        });

        if (!orders) return false;

        await database().collection(databaseConfig.ORDER_COLLECTION).updateOne({
            'orders.OrderId': orderId,
            'orders.items._id': bookId
        }, {
            $set: {
                "orders.$[order].items.$[item].packed": "packed"
            }
        }, {
            arrayFilters: [{
                "item._id": bookId
            }, {
                "order.OrderId": orderId
            }]
        });


        const books = (await database().collection(databaseConfig.ORDER_COLLECTION).findOne({
            'orders.OrderId': orderId
        })).orders.find(o => String(o.OrderId) === String(orderId)).items;

        let changeOrderState = true;
        for (let a = 0; a < books.length; a++) {
            if (!books[a].packed) {
                changeOrderState = false;
            }
        }

        if (changeOrderState) {
            await database().collection(databaseConfig.ORDER_COLLECTION).updateOne({
                'orders.OrderId': orderId
            }, {
                $set: {
                    "orders.$[order].status": "packed"
                }
            }, {
                arrayFilters: [{
                    "order.OrderId": orderId
                }]
            });
        }

        return true;
    },

    changeOrderState: async (orderId) => {
        const order = await database().collection(databaseConfig.ORDER_COLLECTION).aggregate([{
                $match: {
                    "orders.OrderId": orderId
                }
            },
            {
                $unwind: "$orders"
            },
            {
                $match: {
                    "orders.OrderId": orderId
                }
            },
            {
                $group: {
                    _id: '$orders.OrderId',
                    status: {
                        $first: '$orders.status'
                    }
                }
            }
        ]).toArray();

        if (!order || order[0].status === 'ordered' || order[0].status === 'delivered' || order[0].status === 'cancelled') return false;

        const newStatus = (order[0].status === 'packed' && 'shipped') || (order[0].status === 'shipped' && 'delivered');

        if (newStatus === 'delivered') {

            const books = await database().collection(databaseConfig.ORDER_COLLECTION).aggregate([{
                    $match: {
                        "orders.OrderId": orderId
                    }
                },
                {
                    $unwind: "$orders"
                },
                {
                    $match: {
                        "orders.OrderId": orderId
                    }
                },
                {
                    $addFields: {
                        "books": "$orders.items"
                    }
                },
                {
                    $project: {
                        "books._id": 1
                    }
                },
                {
                    $addFields: {
                        array: []
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        array: {
                            $push: "$books._id"
                        }
                    }
                }
            ]).toArray();

            const allBook = await database().collection(databaseConfig.BOOK_COLLECTION).updateMany({
                _id: {
                    $in: books[0].array[0]
                }
            }, {
                $inc: {
                    sales: 1,
                    stock: -1
                }
            });
        }

        return await database().collection(databaseConfig.ORDER_COLLECTION).updateOne({
            'orders.OrderId': orderId
        }, {
            $set: {
                "orders.$[order].status": newStatus
            }
        }, {
            arrayFilters: [{
                "order.OrderId": orderId
            }]
        });
    },
    
    isDelivered: async(userId, bookId)=>{
        const book = await database().collection(databaseConfig.ORDER_COLLECTION).aggregate([
            {
                $match: {
                    userId: ObjectId(userId)
                }
            },
            {
                $unwind: "$orders"
            },
            {
                $addFields: {
                    orders: "$orders.items",
                    status: "$orders.status"
                }
            },
            {
                $match: {
                    status: 'delivered'
                }
            },
            {
                $unwind: "$orders"
            },
            {
                $match: {
                    "orders._id": ObjectId(bookId)
                }
            }
        ]).toArray();

        return book.length>0?true: false;

    }
};