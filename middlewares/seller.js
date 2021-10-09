module.exports = async function seller(req, res, next){
    if(req.user.type !== 'seller') return res.status(401).send('Access Denied.')
    next()
}