const app = require('express')();

require('./startup/database')();
require('./startup/cors')(app);
require('./startup/routes')(app);
app.listen(process.env.PORT || 3000, ()=>{
    console.log(`Listening on port ${process.env.PORT || 3000}`);
});