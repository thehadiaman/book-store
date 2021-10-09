module.exports = function (req, res, next){
    if(!req.user.validate.valid) return res.status(400).send('Invalid user');

    next()
}