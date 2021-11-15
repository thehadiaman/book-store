const {MongoClient} = require("mongodb");
const config = require('../database/config.json');
const conf = require('config');

let database;

module.exports = async function (){
    let uri;
    if(conf.get('NODE_ENV')==='production')
    {
        uri = conf.get('DATABASE');
    }else{
        uri = `mongodb://localhost:27017`;
    }
    const client = new MongoClient(uri);

    await client.connect()
        .then((data)=>{
            console.log('Mongodb connection successful.');
            database = data.db(config.DATABASE_NAME);
        })
        .catch(()=>console.log('Mongodb connection failed.'));
};

module.exports.database = function (){
    return database;
};