require('dotenv').config();
require('console-stamp')(console, '[HH:MM:ss.l]');

import { Client, ClientConfig }  from './Client'
import { Rest }                  from './Rest'

import * as Redis from 'redis';

import { ActivityBot } from "./ActivityBot";

(async () => {
    
let redisPort = Number(process.env.REDIS_PORT ?? 6379)
let redisHost = process.env.REDIS_HOST        ?? 'redis'

let redis: Redis.RedisClientType = Redis.createClient(
{
socket: {
    port: redisPort,
    host: redisHost
}
}
)

redis.on('error', (err: any) => { throw new Error(err) });
    
await redis.connect()
.catch((error: any) =>
{
    throw new Error(`Redis error: ${error}`)
});

const config: ClientConfig =
{
    authToken:       process.env.AUTH_TOKEN ?? "",  
    intent:          131071,
    reconnectDelay:  5000   
};

const client = new Client(config, redis, new Rest())

new ActivityBot(client).Init().then(() => {
    client.Start()
})


})()