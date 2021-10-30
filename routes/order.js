const router = require('express').Router();
const {Order} = require('../database/order');
const auth = require('../middlewares/auth');
const valid = require('../middlewares/valid');


router.post('/', [auth, valid], async(req, res)=>{
    const userId = req.user._id;
    const result = await Order.placeOrder(userId);

    if(!result) return res.status(400).send('Order is not placed');
    
    res.send('Order Placed');
});

router.post('/checkOutValidation', [auth, valid], async(req, res)=>{
    const userId = req.user._id;
    const checkOutValidation = await Order.validateCheckOut(userId, req.body.payment);

    if(!checkOutValidation) return res.status(400).send('Invalid credentials to check out.');

    res.send('Valid credentials to check out.');
});

module.exports = router;
