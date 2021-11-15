const app = require('express')();
require('express-async-errors');

require('./startup/logging')();
require('./startup/config')();
require('./startup/database')();
require('./startup/cors')(app);
require('./startup/routes')(app);
require('./startup/prod')(app);

app.listen(process.env.PORT || 3000, ()=>{
    console.log(`Listening on port ${process.env.PORT || 3000}`);
});