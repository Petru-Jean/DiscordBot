require('dotenv').config();

const { DiscordBot } = require('./DiscordBotAPI')
const { EventLogger, Events } = require('./EventLogger')

const dbURI = "mongodb+srv://rubbishbot:nGHGU6UMZwAp7sXm@prod-aws-bot.xocrf1k.mongodb.net/bot_data?retryWrites=true&w=majority"

const config = {
    AUTH_TOKEN_TYPE: process.env.AUTH_TOKEN_TYPE,
    AUTH_TOKEN:      process.env.AUTH_TOKEN,
    INTENT:          131071
};

let bot = new DiscordBot(config);

new EventLogger(bot, dbURI).Initialize().then(() => {
    bot.Connect()  
})


