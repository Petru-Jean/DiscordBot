require('dotenv').config();
require('console-stamp')(console, '[HH:MM:ss.l]');

import { EventMiddleman } from "./EventMiddleman"
import { EventHandler   } from "./EventHandler";

import * as EventHandlers from './EventHandlers/EventHandlers'

import { Client, ClientConfig, GatewayDispatchEvent }  from './Client'
import { Rest }                         from './Rest'
import { CommandHandler } from "./CommandHandler";
import { StatsCommandHandler } from "./CommandHandlers/StatsCommandHandler";

import * as Redis from 'redis';

const db  = require('./db')

let redis: Redis.RedisClientType = Redis.createClient();

redis.on('error', (err : any) => { throw new Error(err) });

redis.connect()
.then(() => { console.log("Redis client connected.") })
.catch((error: any) => { throw new Error(`Redis error: ${error}`) });

const config: ClientConfig =
{
    authToken:       process.env.AUTH_TOKEN ?? "",  
    intent:          131071,
    reconnectDelay:  5000
};

const rest   = new Rest()
const client = new Client(config, redis, rest)

const commandHandlers : Array<CommandHandler> =
[
    new StatsCommandHandler(client)
]

const eventHandlers : Array<EventHandler> =
[
    new EventHandlers.MessageCreateHandler(),
    new EventHandlers.VoiceActivityHandler(),
    new EventHandlers.MessageReactionAddHandler(),
    new EventHandlers.MessageReactionRemoveHandler()
]


new EventMiddleman(client, eventHandlers, commandHandlers).Hook()


client.Start()
