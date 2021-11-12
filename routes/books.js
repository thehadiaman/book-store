const {Book} = require("../database/books");
const router = require('express').Router();
const auth = require('../middlewares/auth');
const seller = require('../middlewares/seller');
const {validate, rateValidation, contendValidation} = require("../validation/books");
const _ = require('lodash');
const {ObjectId} = require('mongodb');
const bcrypt = require('bcrypt');
const valid = require('../middlewares/valid');
const {User} = require("../database/users");

router.get('/', async(req, res)=>{
    const books = await Book.getBooks();
    res.send(books);
});

router.get('/seller/:id', async(req, res)=>{
    const books = await Book.getFilteredBooks({'seller._id': ObjectId(req.params.id)});
    res.send(books);
});

router.get('/findByName', [auth, seller, valid] ,async(req, res)=>{
    const title = req.query.title? req.query.title.toLowerCase(): '';
    const books = await Book.getFilteredBooks({'seller._id': req.user._id, title: title});
    res.send(books);
});

router.get('/:id', async(req, res)=>{
    const checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
    if(!checkForHexRegExp.test(req.params.id)) return res.status(400).send('Invalid ObjectId.');
    const book = await Book.getBook({_id: ObjectId(req.params.id)});
    res.send(book);
});

router.post('/', [auth, valid, seller], async(req, res)=>{
    const {error} = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    const book = await Book.getBook({'seller._id': req.user._id, title: req.body.title.toLowerCase()});
    if(book) return res.status(400).send('Book already saved.');

    req.body.seller = {
        _id: req.user._id,
        name: req.user.name
    };
    await Book.saveBook(_.pick(req.body, ['title', 'image', 'author', 'price', 'stock', 'seller', 'sales', 'description']));
    res.send(`"${req.body.title}" saved.`);
});

router.put('/:id', [auth, valid, seller], async(req, res)=>{

    const book = await Book.getBook({_id: ObjectId(req.params.id)});

    const seller = String(book.seller._id) === String(req.user._id);
    if(!seller) return res.status(401).send('Unauthorized action.');

    const {error} = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    req.body.seller = {
        _id: req.user._id,
        name: req.user.name
    };
    await Book.updateBook(ObjectId(req.params.id), _.pick(req.body, ['title', 'author', 'price', 'stock', 'seller']));
    res.send('Book saved.');
});

router.delete('/', [auth, valid, seller], async(req, res)=>{
    if(req.body[0]===undefined) return res.status(400).send('Invalid credentials.');

    const books = [];
    for(let item in req.body){
        books[item] = ObjectId(req.body[item]);
    }

    const data = await Book.deleteBook(books, req.user._id);
    console.log(data);
    res.send(`Selected books have been deleted.`);
});

router.put('/favorite/:id', [auth, valid], async(req, res)=>{
    const favorite = req.user.favorites.includes(req.params.id);
    if(favorite) {
        await User.removeFromFavorite(req.user._id, req.params.id);
        return res.send('Removed from favorites.');
    }

    await User.addToFavorite(req.user._id, req.params.id);
    res.send('Added to favorites.');
});

router.post('/review', [auth, valid], async(req, res)=>{
    const validRequest = req.body.bookId && req.body.heading || req.body.review;
    if(!validRequest) return res.status(400).send('Invalid credentials.');

    const {error} = contendValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    const review = await Book.reviewBook(req.user._id, req.body.bookId, req.body.heading, req.body.review);
    if(!review) return res.status(400).send('Invalid credentials.');

    res.send(review);
});
 
router.put('/rate/:bookId', [auth, valid], async(req, res)=>{
    const validRequest = req.params.bookId && req.body.rate;
    if(!validRequest) return res.status(400).send('Invalid credentials.');

    const {error} = rateValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    const rate = await Book.rateBook(req.user._id, req.params.bookId, req.body.rate);
    if(!rate) return res.status(400).send('Invalid credentials.');

    res.send(rate);
});

router.get('/review/:bookId', async(req, res)=>{
    if(!req.params.bookId) return res.status(400).send('Invalid credentials');

    const reviews = (await Book.getReview(req.params.bookId)).reverse();

    res.send(reviews);
});

router.get('/myReview/:bookId', [auth, valid], async(req, res)=>{
    const review = await Book.myReview(req.user._id, req.params.bookId);
    if(!review) return res.send(false);

    res.send(true);
});

router.get('/myRating/id/:bookId', [auth, valid], async(req, res)=>{
    if(!req.params.bookId) return res.status(400).send('Invalid credentials');

    const ratings = await Book.getMyRating(req.user._id, req.params.bookId);
    if(!ratings) return res.send("0");

    res.send(String(ratings.rating?ratings.rating:0));
});

module.exports = router;