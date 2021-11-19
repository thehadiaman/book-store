const router = require('express').Router();
const {Order} = require('../database/order');
const {User} = require('../database/users');
const {Cart} = require('../database/cart');
const auth = require('../middlewares/auth');
const valid = require('../middlewares/valid');
const { ObjectId } = require('mongodb');


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

router.put('/cancelOrder', [auth, valid], async(req, res)=>{
    if(!req.body.OrderId) return res.status(400).send('Invalid credentials.');

    const userId = req.user._id;
    const isOrder = await Order.checkOrder(userId);
    if(!isOrder || isOrder.orders.length<=0) return res.status(400).send('No orders found.');

    const cancelling = await Order.cancelOrder(userId, ObjectId(req.body.OrderId));
    if(!cancelling) return res.status(400).send('Invalid credentials.');

    res.send('Order cancelled');
});


router.get('/deliveries', [auth, valid], async(req, res)=>{
    const zip = req.user.zip;
    const deliveries = await Order.getDeliveries(zip);
    if(!deliveries) return res.status(400).send('No deliveries');
    res.send(deliveries);
});

router.get('/orders', [auth, valid], async(req, res)=>{
    const userId = req.user._id;
    const orders = await Order.orders(userId);
    if(orders.length<=0) return res.send('No orders found');

    res.send(orders);
});

router.put('/packBook', [auth, valid], async(req, res)=>{
    const checkValues = req.body.orderId && req.body.bookId;
    if(!checkValues) return res.status(400).send('Invalid credentials');

    const order = await Order.packBook(ObjectId(req.body.orderId), ObjectId(req.body.bookId));
    if(!order) return res.status(400).send('Invalid credentials.');

    res.send("Book packed");
});

router.put('/changeStatus', [auth, valid], async(req, res)=>{
    if(!req.body.orderId) return res.status(400).send('Invalid credentials.');
    
    const order = await Order.changeOrderState(ObjectId(req.body.orderId));
    if(!order) return res.status(400).send('Invalid credentials.');

    res.send(order);
});

module.exports = router;
