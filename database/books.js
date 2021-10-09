const {database} = require("../startup/database");
const databaseConfig = require('./config.json');
const {bookSchema} = require("../schemas/books");


exports.Book = {
    getBooks: ()=>{
        return database().collection(databaseConfig.BOOK_COLLECTION).find().toArray();
    },

    getBook: (filter)=>{
        return database().collection(databaseConfig.BOOK_COLLECTION).findOne(filter? filter: {})
    },

    saveBook: (body)=>{
        const book = bookSchema(body);
        return database().collection(databaseConfig.BOOK_COLLECTION).insertOne(book);
    },

    updateBook: (id, body)=>{
        return database().collection(databaseConfig.BOOK_COLLECTION).findOneAndUpdate({_id: id}, {$set: body});
    },

    deleteBook: (id)=>{
        return database().collection(databaseConfig.BOOK_COLLECTION).findOneAndDelete({_id: id});
    }

}
