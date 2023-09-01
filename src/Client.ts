const EventEmitter = require('events')

import { ShardCluster } from "./ShardCluster"
import { Rest }         from './Rest'
import * as Redis from 'redis';
import { Cache } from "./Cache"

export interface ClientConfig
{
    authToken:       string,
    intent:          number,
    reconnectDelay:  number
}  

export enum GatewayOpcode
{
    DIPSATCH  = 0,
    HEARTBEAT = 1,
    IDENTIFY = 2,
    
    RESUME    = 6,
    RECONNECT = 7,
    INVALID_SESSION  = 9,
    HELLO            = 10,
    HEARTBEAT_ACK    = 11
}

export enum GatewayDispatchEvent
{
    MESSAGE_CREATE          = "MESSAGE_CREATE",
    MESSAGE_REACTION_ADD    = "MESSAGE_REACTION_ADD",
    MESSAGE_REACTION_REMOVE = "MESSAGE_REACTION_REMOVE",

    GUILD_MEMBER_ADD    = "GUILD_MEMBER_ADD",
    GUILD_MEMBER_REMOVE = "GUILD_MEMBER_REMOVE",

    VOICE_STATE_UPDATE   = "VOICE_STATE_UPDATE",
    RESUMED              = "RESUMED",
    INVALID_SESSION      = "INVALID_SESSION",
    
    GUILD_MEMBER_UPDATE = "GUILD_MEMBER_UPDATE",

    GUILD_CREATE         = "GUILD_CREATE"
}

export class Client extends EventEmitter
{
    public clientConfig: ClientConfig
    
    private cluster: ShardCluster
    public  rest:    Rest
    
    public  cache:   Cache
    
    constructor(clientConfig : ClientConfig, redisClient : Redis.RedisClientType, rest : Rest)
    {
        super()

        this.cluster     = new ShardCluster(this)
        this.cache       = new Cache(redisClient)
        
        this.rest        = rest

        this.clientConfig = clientConfig
    }

    private async ConnectToRedis()
    {
        this.cache.redisClient.on('error', (err: any) => { throw new Error(err) });
    
        return this.cache.redisClient.connect()
        .catch((error: any) =>
        {
            throw new Error(`Redis error: ${error}`)
        });
    }
    
    public Start(shards: number = 0)
    {
        this.ConnectToRedis().then(() =>
        {
            this.cluster.Create(shards)
        })
    }

}