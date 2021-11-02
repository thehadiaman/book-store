const router = require('express').Router();
const {Order} = require('../database/order');
const {User} = require('../database/users');
const {Cart} = require('../database/cart');
const auth = require('../middlewares/auth');
const valid = require('../middlewares/valid');


router.post('/', [auth, valid], async(req, res)=>{
    const userId = req.user._id;
    const cart = await Cart.getCartItems(userId);
        if(cart===null || cart.cart.length<=0) return res.status(400).send('Empty cart.');

    const checkOutValidation = await Order.validateCheckOut(userId, req.body.payment);
    if(!checkOutValidation) return res.status(400).send('Invalid credentials to check out.');

    const deliveryPartner = await User.getUser({zip: req.user.zip, type: 'delivery_partner'});
    if(!deliveryPartner) return res.status(400).send(`No delivery available in "${req.user.zip}" this zip code.`);

    const result = await Order.placeOrder(userId);
    if(!result) return res.status(400).send('Order is not placed');
    
    res.send('Order Placed');
});

router.get('/myOrders', [auth, valid],  async(req, res)=>{
    const userId = req.user._id;

    const isOrder = await Order.checkOrder(userId);
    if(!isOrder || isOrder.orders.length<=0) return res.status(400).send('No orders found.');

    const order = await Order.getMyOrders(userId);
    res.send(order);
});

module.exports = router;
