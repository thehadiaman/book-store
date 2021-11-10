exports.bookSchema = function(body){
    return {
        title: body.title.toLowerCase(),
        author: body.author,
        image: body.image,
        price: body.price,
        description: body.description,
        discount: body.discount,
        stock: parseInt(body.stock),
        seller: body.seller,
        sales: 0,
        date: Date.now()
    };
};