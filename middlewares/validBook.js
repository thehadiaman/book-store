const {Book} = require("../database/books");
const {ObjectId} = require("mongodb");
exports.validBook = async function (req, res, next) {

    const book = await Book.getBook({_id: ObjectId(req.params.id)});
    if(!book) return res.status(404).send('No book found.');

    next()

}