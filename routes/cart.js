const router = require('express').Router();
const auth = require('../middlewares/auth');
const valid = require('../middlewares/valid');
const {Cart} = require("../database/cart");
const ObjectId = require('mongodb').ObjectId;

router.get('/', [auth, valid], async(req, res)=>{
    const CartItems = await Cart.getCartItems(ObjectId(req.user._id));
    res.send(CartItems);
});

router.get('/count', [auth, valid], async(req, res)=>{
    const CartCount = (await Cart.getCartCount(ObjectId(req.user._id)))[0];
    res.send(CartCount ? CartCount : {});
});

router.put('/:id', [auth, valid], async(req, res)=>{
    if(req.body.count !== 1 && req.body.count !== -1) return res.status(400).send('Invalid value');
    await Cart.addToCart(ObjectId(req.user._id), ObjectId(req.params.id), Number(req.body.count))
        .catch((data)=>{
            console.log(data);
        });
    res.send('Item modified in cart');
});

router.get('/getAll', [auth, valid], async(req, res)=>{

    const userId = req.user._id;

    const cartItems = await Cart.getAllFromCart(userId);
    res.send(cartItems);

});

router.get('/getTotalPrice', [auth, valid], async(req, res)=>{

    const userId = req.user._id;

    const totalPrice = await Cart.getTotalPrice(userId);
    res.send(totalPrice[0]);

});

module.exports = router;