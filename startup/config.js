const config = require('config');

module.exports = function(){
    if(!config.get('EMAIL_API')) throw new Error('EMAIL_API is not defined');
    if(!config.get('EMAIL')) throw new Error('EMAIL is not defined');
    if(!config.get('jswPrivateKey')) throw new Error('jswPrivateKey is not defined');
};