exports.bookSchema = function(body){
    return {
        title: body.title.toLowerCase(),
        author: body.author,
        price: body.price,
        description: body.description,
        discount: body.discount,
        stock: body.stock,
        seller: body.seller,
        date: Date.now()
    }
}