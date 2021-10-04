const {MongoClient} = require("mongodb");
const config = require('../database/config.json')

let database;

module.exports = async function (){
    const uri = `mongodb://localhost:27017`;
    const client = new MongoClient(uri);

    await client.connect()
        .then((data)=>{
            console.log('Mongodb connection successful.')
            database = data.db(config.DATABASE_NAME)
        })
        .catch(()=>console.log('Mongodb connection failed.'));
};

module.exports.database = function (){
    return database;
}