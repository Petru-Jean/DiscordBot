require('dotenv').config();
require('console-stamp')(console, '[HH:MM:ss.l]');

import { ActivityBot } from "./ActivityBot";
import { Client, ClientConfig }  from '../Client'
import { Rest }                  from '../Rest'

import * as Redis from 'redis';

let redis: Redis.RedisClientType = Redis.createClient({
    socket: {
        port: Number(process.env.REDIS_PORT ?? 6379),
        host: process.env.REDIS_HOST        ?? 'redis'
    }
})

const config: ClientConfig =
{
    authToken:       process.env.AUTH_TOKEN ?? "",  
    intent:          131071,
    reconnectDelay:  5000   
};

const client = new Client(config, redis, new Rest())

new ActivityBot(client).Init()
client.Start()
