import { Shard } from "./Shard"

import { setTimeout as promiseTimeout } from 'timers/promises';

import { ClientConfig } from './Client'

import { Client } from './Client'

const  { EventEmitter } = require('events')

export interface FetchedGatewayConnectionData
{
    url:          string,
    shards:       number
    sessionLimit: SessionStartLimit,
    expiresAt:    number
}

export interface SessionStartLimit
{
    total:          number,
	remaining:      number,
    resetAfter:     number,
    maxConcurrency: number
}

export class ShardCluster extends EventEmitter
{
    public client: Client
    
    public  fetchedConnectionData?: FetchedGatewayConnectionData
    private shards:                 Array<Shard>
    
    public constructor(client : Client)
    {
        super();

        this.client        = client
        
        this.shards = new Array<Shard>()
    }
    
    /**
     * Fetches the gateway connection data
     * @returns 
     */
    public async FetchGatewayInformation()
    {
        if (this.fetchedConnectionData)
        {
            if (Date.now() <= this.fetchedConnectionData.expiresAt)
            {
                return 
            }
           
            this.fetchedConnectionData = undefined       
        }
 
        let response = await fetch("https://discord.com/api/v10/gateway/bot",
        {
            method: 'GET',
            
            headers: {
                'Content-type':   'application/json; charset=UTF-8',
                'Authorization':  this.client.clientConfig.authToken
            }
        })
        
        let parsedRequestData = await response.json()
        
        // Check if Unauthorized
        if (parsedRequestData.code === 0)
        {
            throw new Error("Unauthorized FetchGatewayInformation call")    
        }

        const fetchedGatewayData: FetchedGatewayConnectionData = 
        {
            url: parsedRequestData.url,
            shards: parsedRequestData.shards,

            sessionLimit:
            {
                total: parsedRequestData.session_start_limit.total,
                remaining: parsedRequestData.session_start_limit.remaining,
                resetAfter: parsedRequestData.session_start_limit.reset_after,
                maxConcurrency: parsedRequestData.session_start_limit.max_concurrency
            },
            expiresAt: Date.now() + parsedRequestData.session_start_limit.reset_after
        }

        this.fetchedConnectionData  = fetchedGatewayData
        
    }

    /**
     * Creates the shards and connects them to the Discord Gateway
     * @param shards The number of shard to create. When set to zero, the recommended shard number is used
     */
    async Create(shards : number)
    {   
        await this.FetchGatewayInformation()
        
        const connectionDelay = 5000 / this.fetchedConnectionData?.sessionLimit.maxConcurrency!

        if (shards == 0)
        {
            shards = this.fetchedConnectionData?.shards ?? 1 
        }

        for (let i = 0; i < shards; i++)
        {
            let shard = new Shard(this, i, shards)

            this.shards.push(shard)
            
            shard.Connect()
            
            await promiseTimeout(connectionDelay)         
        }

    }

}