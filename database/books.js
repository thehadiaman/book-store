const {
    database
} = require("../startup/database");
const databaseConfig = require('./config.json');
const {
    bookSchema
} = require("../schemas/books");
const {
    Order
} = require("./order");
const {
    ObjectId
} = require("bson");


exports.Book = {
    getBooks: () => {
        return database().collection(databaseConfig.BOOK_COLLECTION).find().toArray();
    },

    getFilteredBooks: (filter) => {
        return database().collection(databaseConfig.BOOK_COLLECTION).find(filter).toArray();
    },

    getBook: (filter) => {
        return database().collection(databaseConfig.BOOK_COLLECTION).findOne(filter ? filter : {});
    },

    saveBook: (body) => {
        const book = bookSchema(body);
        return database().collection(databaseConfig.BOOK_COLLECTION).insertOne(book);
    },

    updateBook: (id, body) => {
        return database().collection(databaseConfig.BOOK_COLLECTION).findOneAndUpdate({
            _id: id
        }, {
            $set: body
        });
    },

    deleteBook: (id) => {
        return database().collection(databaseConfig.BOOK_COLLECTION).findOneAndDelete({
            _id: id
        });
    },

    reviewBook: async (userId, bookId, heading, review) => {

        const book = await Order.isDelivered(userId, bookId);
        if (!book) return false;

        const rate = await database().collection(databaseConfig.BOOK_COLLECTION).aggregate([{
                $match: {
                    "review.userId": ObjectId(userId)
                }
            },
            {
                $project: {
                    review: 1
                }
            },
            {
                $unwind: "$review"
            },
            {
                $match: {
                    "review.rating": {
                        $gt: 0
                    }
                }
            }
        ]).toArray();

        return database().collection(databaseConfig.BOOK_COLLECTION).findOneAndUpdate({
            _id: ObjectId(bookId)
        }, {
            $push: {
                review: {
                    userId,
                    heading,
                    review,
                    rating: (rate[0] ? rate[0].review.rating : 0)
                }
            }
        });
    },

    getReview: async (bookId) => {
        return database().collection(databaseConfig.BOOK_COLLECTION).aggregate([{
                $match: {
                    _id: ObjectId(bookId)
                }
            },
            {
                $project: {
                    review: 1
                }
            },
            {
                $unwind: "$review"
            },
            {
                $addFields: {
                    userId: "$review.userId",
                    heading: "$review.heading",
                    review: "$review.review",
                    rating: "$review.rating"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'buyer'
                }
            },
            {
                $unwind: "$buyer"
            },
            {
                $project: {
                    user: "$buyer.name",
                    heading: 1,
                    review: 1,
                    rating: 1
                }
            }
        ]).toArray();
    },

    rateBook: async (userId, bookId, rate) => {

        const review = await database().collection(databaseConfig.BOOK_COLLECTION).findOne({
            "review.userId": ObjectId(userId)
        });

        if (!review) return "Need to write a review first.";

        await database().collection(databaseConfig.BOOK_COLLECTION).updateOne({
            _id: ObjectId(bookId)
        }, {
            $set: {
                "review.$[rev].rating": rate
            }
        }, {
            arrayFilters: [{
                "rev.userId": userId
            }]
        });

        const ratings = (await database().collection(databaseConfig.BOOK_COLLECTION).aggregate([{
                $match: {
                    "review.userId": ObjectId(userId)
                }
            },
            {
                $project: {
                    "review.userId": 1,
                    "review.rating": 1
                }
            },
            {
                $addFields: {
                    review: {
                        $setUnion: "$review"
                    }
                }
            },
            {
                $addFields: {
                    sum: {
                        $sum: "$review.rating"
                    },
                    count: {
                        $size: "$review"
                    }
                }
            },
            {
                $project: {
                    review: 0
                }
            }
        ]).toArray())[0];

        return database().collection(databaseConfig.BOOK_COLLECTION).findOneAndUpdate({
            _id: ObjectId(bookId)
        }, {
            $set: {
                rating: ratings ? (ratings.sum / ratings.count) : 0
            }
        });
    },

    myReview: async (userId, bookId) => {

        const delivered = await Order.isDelivered(userId, bookId);

        return !delivered;
    },

    getMyRating: async (userId, bookId) => {
        const ratings = (await database().collection(databaseConfig.BOOK_COLLECTION).aggregate([{
                $match: {
                    _id: ObjectId(bookId),
                    "review.userId": ObjectId(userId),
                }
            },
            {
                $project: {
                    "review.userId": 1,
                    "review.rating": 1
                }
            },
            {
                $addFields: {
                    review: {
                        $setUnion: "$review"
                    }
                }
            },
            {
                $unwind: "$review"
            },
            {
                $project: {
                    _id: "$review.userId",
                    rating: "$review.rating"
                }
            },
            {
                $match: {
                    _id: ObjectId(userId)
                }
            }
        ]).toArray())[0];
        return ratings;
    }

};