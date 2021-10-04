const config = require("config");


exports.userSchema = (body)=>{
    const schema = {
        name: body.name,
        email: body.email,
        password: body.password,
        address: body.password,
        phone: body.phone,
        type: body.type,
        validate: {
            valid: false,
            invalid: 0,
            code: Math.floor(Math.random() * 1000000),
            date: Date.now()
        }
    };
    console.log(schema);

    return(schema);
};