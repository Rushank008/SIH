const mongoose = require('mongoose')
require('dotenv').config()
exports.connect = async () =>{
    mongoose.connect(process.env.uri).then(()=> console.log("Connected to database")).catch(()=> console.log("Failed to connect"))
}
