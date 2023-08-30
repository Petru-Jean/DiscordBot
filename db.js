"use strict";
require('dotenv').config();
var mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
    // console.log("Connected to MongoDB database")    
})
    .catch((error) => {
    throw new Error("MongoDB connection failed: " + error);
});
module.exports = { mongoose };
