const {Book} = require("../database/books");
const router = require('express').Router();
const auth = require('../middlewares/auth');
const seller = require('../middlewares/seller');
const {validate} = require("../validation/books");
const _ = require('lodash');
const {ObjectId} = require('mongodb');
const bcrypt = require('bcrypt');
const valid = require('../middlewares/valid');
const {User} = require("../database/users");

router.get('/', async(req, res)=>{
    const books = await Book.getBooks();
    res.send(books);
});

router.get('/:id', async(req, res)=>{
    const book = await Book.getBook({_id: ObjectId(req.params.id)});
    res.send(book);
});

router.post('/', [auth, valid, seller], async(req, res)=>{
    const {error} = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    const book = await Book.getBook({seller: req.user.name, title: req.body.title});
    if(book) return res.status(400).send('Book already saved.');

    req.body.seller = {
        _id: req.user._id,
        name: req.user.name
    };
    await Book.saveBook(_.pick(req.body, ['title', 'author', 'price', 'stock', 'discount', 'seller']));
    res.send(`"${req.body.title}" saved.`);
});

router.put('/:id', [auth, valid, seller], async(req, res)=>{
    const book = await Book.getBook({_id: ObjectId(req.params.id)});
    if(!book) return res.status(404).send('No book found.');

    const seller = book.seller._id === req.user._id;
    if(!seller) return res.status(401).send('Unauthorized action.');

    const {error} = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    req.body.seller = {
        _id: req.user._id,
        name: req.user.name
    };
    await Book.updateBook(ObjectId(req.params.id), _.pick(req.body, ['title', 'author', 'price', 'stock', 'seller', 'discount']))
    res.send('Book saved.');
})

router.delete('/:id', [auth, valid, seller], async(req, res)=>{
    if(!req.body.password) return res.status(400).send('Invalid password.');

    const book = await Book.getBook({_id: ObjectId(req.params.id)});
    if(!book) return res.status(404).send('No book found.');

    const seller = String(book.seller._id) === String(req.user._id);
    if(!seller) return res.status(401).send('Unauthorized action.');

    const validPassword = await bcrypt.compare(req.body.password, req.user.password);
    if(!validPassword) return res.status(400).send('Invalid password.');

    await Book.deleteBook(ObjectId(req.params.id));
    res.send(`"${book.title}" id deleted.`);
});

router.put('/favorite/:id', [auth, valid], async(req, res)=>{
    const book = await Book.getBook({_id: ObjectId(req.params.id)});
    if(!book) return res.status(404).send('No book found.');

    const favorite = req.user.favorites.includes(req.params.id)
    if(favorite) {
        await User.removeFromFavorite(req.user._id, req.params.id);
        return res.send('Removed from favorites.')
    }

    await User.addToFavorite(req.user._id, req.params.id);
    res.send('Added to favorites.');
});


module.exports = router;