const bcrypt = require("bcrypt");


exports.userSchema = async(body)=>{

    body.password = await bcrypt.hash(body.password, await bcrypt.genSalt(10));

    const schema = {
        name: body.name,
        email: body.email.toLowerCase(),
        password: body.password,
        address: body.address,
        phone: body.phone,
        zip: body.zip,
        type: body.type,
        validate: {
            valid: false,
            invalid: 0,
            code: Math.floor(Math.random() * 1000000),
            date: Date.now()
        }
    };

    return(schema);
};
