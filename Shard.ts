const WebSocket    = require('ws');
const EventEmitter = require('events');

import { ShardCluster  } from './ShardCluster';
import { GatewayOpcode } from './Client';
import { setTimeout as promiseTimeout } from 'timers/promises';
  
export enum ShardStatus
{
	DISCONNECTED,
	CONNECTING,
	READY,
}

/**
 * Data regarding the current Websocket connection
 */
export interface ShardSessionData
{
    sequence:  number
    
    resumeURL: string
    sessionId: number
    
    heartbeat:         number,
    lastHeartbeatAck:  number,
    heartbeatTimeout?: NodeJS.Timeout

    shardDestroyData?: ShardDestroyData
}

/**
 * Information about why the connection was forcefully closed
 * and how to handle reconnecting
 */
export interface ShardDestroyData
{
	code:       number
    reason:     string
	recovery:   ShardRecoveryMethod;
}

/**
 * Method used for resuming Discord Gateway connection
 * If NONE is selected, then the shard won't attempt to reconnect
 */
export enum ShardRecoveryMethod
{
    NONE,
	IDENTIFY,
	RESUME,
}


export const NoResumeCloseCodes = [4004, 4010, 4011, 4012, 4013, 4014]

export class Shard extends EventEmitter
{
    private cluster:       ShardCluster
    
    private shardId:      number
    private shardCount:   number
    
    private shardStatus:  ShardStatus
    private sessionData:  ShardSessionData
    
    private socket?:      WebSocket
    
    constructor(cluster: ShardCluster, shardId : number, shardCount : number)
    {
        super()

        this.cluster = cluster
        
        this.shardId    = shardId
        this.shardCount = shardCount

        this.shardStatus = ShardStatus.DISCONNECTED
        
        this.sessionData =
        {
            sequence:  0,
            resumeURL: "",
            sessionId: 0,
            
            heartbeat: 0,
            lastHeartbeatAck: 0
        }   
               
    }

    /**
     * Forcefully closes Shard WebSocket connection
     * @param {ShardDestroyData} destroyData
     */
    
    private Destroy(destroyData: ShardDestroyData)
    {
        if (!this.socket || this.socket.readyState != WebSocket.OPEN)
        {
            return
        }

        clearTimeout(this.sessionData.heartbeatTimeout)

        this.shardStatus                  = ShardStatus.DISCONNECTED
        this.sessionData.shardDestroyData = destroyData  

        this.socket?.close(destroyData.code, destroyData.reason)
    }

    /**
     * Initializes the heartbeat loop for the current connection.
     * 
     * Should only be called once after WebSocket connection is estabilished    
     * @param {number} jitter Time jitter used for the first heartbeat
     * @returns 
     */
    private StartHeartbeat(jitter: number = 0)
    {
        if (!this.socket || this.socket.readyState != WebSocket.OPEN)
        {
            return;
        }

        if (Date.now() - this.sessionData.lastHeartbeatAck >= (this.sessionData.heartbeat + 5000))
        {
            const options: ShardDestroyData =
            {
                code:   1000,
                reason: "no heartbeat response",
                recovery: ShardRecoveryMethod.RESUME
            }
            
            return this.Destroy(options)
        }

        this.sessionData.heartbeatTimeout = setTimeout(() =>
        {
            // Send heartbeat event
            this.socket?.send(JSON.stringify(
                {
                    "op": 1,
                    "d":  {}
                }))
            
            this.StartHeartbeat(0)

        }, this.sessionData.heartbeat);        

    }
    
    private OnReconnectEventRecieve(parsedJsonData: any)
    {
        const options: ShardDestroyData =
        {
            code:   1000,
            reason: "reconnect event recieved",
            recovery: ShardRecoveryMethod.RESUME
        }

        this.Destroy(options)
    }

    private OnHelloEventRecieve(parsedJsonData: any)
    {
        this.sessionData.heartbeat        = parsedJsonData.d.heartbeat_interval
        this.sessionData.lastHeartbeatAck = Date.now()   

        this.StartHeartbeat(Math.random() * parsedJsonData.d.heartbeat_interval)
    }

    private OnReadyEventRecieve(parsedJsonData : any)
    {
        console.log(`[Shard ${this.shardId}/${this.shardCount}] Authentification succesful [${parsedJsonData.d.user.username}]`)   

        this.sessionData =
        {
            sequence:  parsedJsonData.s,
            resumeURL: parsedJsonData.d.resume_gateway_url,
            sessionId: parsedJsonData.d.session_id,
            heartbeat: this.sessionData.heartbeat,
            lastHeartbeatAck: Date.now()
        }
        
    }

    private OnInvalidSessionEventRecieve(parsedJsonData : any)
    {
        const options: ShardDestroyData =
        {
            code:   1000,
            reason: "invalid session",
            recovery: parsedJsonData.d ? ShardRecoveryMethod.RESUME : ShardRecoveryMethod.IDENTIFY
        }
        
        return this.Destroy(options)
    }   
    
    

    private OnSocketOpen(data : any)
    {
        if (this.sessionData.shardDestroyData && this.sessionData.shardDestroyData.recovery === ShardRecoveryMethod.RESUME)
        {
            return this.Resume()
        }   

        return this.Identify() 
    }   
    
    private async OnSocketClose(data : any)
    {
        console.log(`[Shard ${this.shardId}/${this.shardCount}] Shard destroyed: ` + (this.sessionData.shardDestroyData ? this.sessionData.shardDestroyData.reason : `connection closed by server (${data.code})`))

        let recoveryMethod = this.sessionData.shardDestroyData ? this.sessionData.shardDestroyData.recovery : ShardRecoveryMethod.RESUME
        
        if (recoveryMethod === ShardRecoveryMethod.NONE)
        {
            return;    
        }

        if (NoResumeCloseCodes.includes(data.code))
        {
            return;
        }    

        console.log(`[Shard ${this.shardId}/${this.shardCount}] Reconnecting to the WebSocket Gateway`)

        await promiseTimeout(2500).then(() =>
        {
            this.Connect(recoveryMethod === ShardRecoveryMethod.RESUME ? this.sessionData.resumeURL : undefined)
        })

    }
    
    private OnSocketMessage(data : any)
    {
        let parsedData = JSON.parse(data.data)
        
        if (parsedData.op === 0)
        {
            if (parsedData.t === 'READY') 
            {
                this.OnReadyEventRecieve(parsedData)
            }

            this.sessionData.sequence = parsedData.s
        }
        else
        {
            if (parsedData.op === GatewayOpcode.HELLO)
            {
                this.OnHelloEventRecieve(parsedData)
            }
            else if (parsedData.op === GatewayOpcode.HEARTBEAT_ACK)
            {
                this.sessionData.lastHeartbeatAck = Date.now()
            }
            else if (parsedData.op === GatewayOpcode.RECONNECT)
            {
                this.OnReconnectEventRecieve(parsedData)
            }
            else if (parsedData.op == GatewayOpcode.INVALID_SESSION)
            {
                this.OnInvalidSessionEventRecieve(parsedData)
            }

        }

        this.cluster.client.emit(parsedData.t ?? parsedData.op, parsedData)
    }   

    /**
     * Attempts to resume the last Gateway session after the connection was closed 
     */
    private Resume()
    {
        let json: any =
        {
            "op": 6,
            "d": {
                "token": `${this.cluster.client.clientConfig.authToken}`,
                "session_id": this.sessionData!.sessionId,
                "seq:":       this.sessionData!.sequence
            }
        }
 
        this.socket!.send(JSON.stringify(json))
    }

     /**
     * Sends the identify event to the discord Gateway
     */
    private Identify()
    {
        let json: any =
        {
            "op": 2,
            "d": {
                "token": `${this.cluster.client.clientConfig.authToken}`,

                "properties":
                {
                    "os": "windows",
                },

                "compress": false,

                "presence":
                {
                    "status": "dnd",
                    "since": 91879201,
                    "afk": false
                },

                "shard": [this.shardId, this.shardCount],

                "intents": `${this.cluster.client.clientConfig.intent}`,
            }
        }

        this.socket!.send(JSON.stringify(json))
    }

    /**
     * 
     * @param {string} [url] URL used when establishing the WebSocket connection. 
     *
     * By default, the connection uses the fetched Gateway URL for connecting. 
     * @returns 
     */
    public async Connect(url? : string)
    {
        if (this.socket)
        {
            const socketState = this.socket.readyState

            if (socketState === WebSocket.OPEN || socketState === WebSocket.CONNECTING)
            {
                return
            }

            if (socketState === WebSocket.CLOSING)
            {
                await promiseTimeout(2500)
            }

        }
        
        if (!url)
        {
            await this.cluster.FetchGatewayInformation()
            
            url = this.cluster.fetchedConnectionData?.url
        }

        try
        {     
            this.socket = new WebSocket(url)

            console.log(`[Shard ${this.shardId}/${this.shardCount}] WebSocket connection estabilished: ${url}`)
        }
        catch (exception: any)
        {
            throw new Error(exception)
        }

        this.socket?.addEventListener("open",    (data: any)   => this.OnSocketOpen(data))
        this.socket?.addEventListener("close",   (data : any)  => this.OnSocketClose(data))
        this.socket?.addEventListener("message", (data: any)   => this.OnSocketMessage(data))
        this.socket?.addEventListener("error",   (error: any)  => console.log(error))

    }


}