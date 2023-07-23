const { error }         = require('console');
const { response }      = require('express');
const http              = require('http');
const https             = require('https');
const EventEmitter      = require('events');
const WebSocket         = require('ws');

export interface ConnectionConfig
{
    AUTH_TOKEN_TYPE: string,
    AUTH_TOKEN:      string,
    
    INTENT:          number,
}    

export enum ConnectionStatus
{
    OPEN       = 0,
    CONNECTING = 1,
    CLOSED     = 2
}

export enum DispatchEvents
{
    MessageCreate       = "MESSAGE_CREATE",
    MessageReactionAdd  = "MESSAGE_REACTION_ADD",
    MessageReactionRemove = "MESSAGE_REACTION_REMOVE",

    GuildMemberAdd    = "GUILD_MEMBER_ADD",
    GuildMemberRemove = "GUILD_MEMBER_REMOVE",

    VoiceStateUpdate  = "VOICE_STATE_UPDATE",
    
    
}

class DiscordBot extends EventEmitter
{

botConfig:        ConnectionConfig
    
connectionStatus: ConnectionStatus
socketURL:        string
resumeURL!:       string
sessionId!:       number
socket!:          WebSocket
heartbeat:        number
sequence:         number

constructor(config : ConnectionConfig)
{
    super();

    this.botConfig = config
    
    this.connectionStatus = ConnectionStatus.CLOSED
    
    this.socketURL = ""
    this.heartbeat = 41250
    this.sequence  = 0
    
}
    
FetchGatewayURL()
{
    return new Promise((resolve, reject) =>
    {
        let gatewayFetchOptions =
        {
            host: 'discord.com',
            path: '/api/gateway/bot',
            method: 'GET',
            headers: {
                'authorization': `${this.botConfig.AUTH_TOKEN_TYPE} ${this.botConfig.AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };
    
        const req = https.request(gatewayFetchOptions, (response:any) =>
        {
            response.setEncoding('utf-8')
    
            response.on('data', (data:any) =>
            {
                let json = JSON.parse(data)

                if (!json.url)
                {
                    reject(new Error("Failed to fetch Gateway URL: " + data))
                }

                this.socketURL = json.url + "?v=10&encoding=json"

                resolve(() => {});
            })
        
        }).on('error', function (e : any)
        {
            reject(new Error('Failed to fetch Gateway URL: ' + e.message))
        });
    
    
        req.end();
    })

}
    
Identify()
{
    //console.log("Sending identify event")

    let json: any =
    {
        "op": 2,
        "d": {
            "token": `${this.botConfig.AUTH_TOKEN_TYPE} ${this.botConfig.AUTH_TOKEN}`,
            "properties": {
                "os": "windows",
            },
            "compress": false,
            "presence": {
                "status": "dnd",
                "since": 91879201,
                "afk": false
            },

            "intents": `${this.botConfig.INTENT}`,
        }
    }

    this.socket.send(JSON.stringify(json));

}

async SendHeartbeat()
{
    while (this.connectionStatus == ConnectionStatus.OPEN)
    {
        await new Promise(resolve => setTimeout(resolve, this.heartbeat));
        this.socket.send(JSON.stringify({
            "op": 1,
            "d": {
            }
        }))
    }
}
    
OnMessageRecieve(event: any)
{
    let json = JSON.parse(event.data)

    if (json.op == 0)
    {
        let eventName = json.t
        this.sequence = json.s
        
        if (json.t === 'READY')
        {
            console.log("Identification succesful [" + json.d.user.username + "]")    
            
            this.resumeURL = json.d.resume_gateway_url;
            this.sessionId = json.d.session_id
            
            console.log("Resume  url: " + this.resumeURL)
            console.log("Session id:  " + this.sessionId)
            
            this.SendHeartbeat()
        }

        else 
        {
            //console.log(json)
            this.emit(json.t, JSON.parse(event.data))
            console.log(json.t)
        }

    }
    else
    {
        if (json.op == 10)
        {
            console.log("Initialized a new connection: " + this.socketURL)
        
            this.connectionStatus = ConnectionStatus.OPEN
            this.heartbeat        = json.d.heartbeat_interval
            
            this.Identify()    
        }
        else if (json.op == 11)
        {
            // if not recieved, reconnect and resume
            //console.log("Heartbeat response recieved")
        }
        else
        {

        }

    }


}
    
OnConnectionClose(event: any)
{
    this.connectionStatus = ConnectionStatus.CLOSED

    console.log("Connection closed: " + event.reason + " " + event.code)

    if (this.resumeURL && this.sessionId)
    {
        this.Connect()
    }

}
    
OnConnectionOpen(event : any)
{
    this.connectionStatus = ConnectionStatus.OPEN
}
    
async Connect()
{
    if (this.connectionStatus === ConnectionStatus.OPEN)
    {
        console.log("There is already an open connection.");
        return;
    }

    if (this.connectionStatus ===  ConnectionStatus.CONNECTING)
    {
        console.log("Connection already in progress.");
        return;
    }

    this.connectionStatus = ConnectionStatus.CONNECTING
    
    if (!this.socketURL)
    {
        await this.FetchGatewayURL();
    }

    if (this.socket)
    {
        if (this.socket.readyState === WebSocket.OPEN) 
        {
            console.log("WebSocket connection already running.");
            return;
        }    
        else if (this.socket.readyState == WebSocket.CLOSED)
        {
            console.log("Attempting to resume connection with session id:" + this.sessionId)
            
            try
            {
                this.socket = new WebSocket(this.resumeURL)    
            }
            catch (exception)
            {
                console.log("WebSocket reconnect attempt failed " + exception)
                return
            }
        }
    }
    else
    {
        try
        {
            this.socket = new WebSocket(this.socketURL);
        }
        catch (exception)
        {
            console.log("WebSocket connection failed: " + exception)
    
            return
        }
    
    }

    this.socket.addEventListener("close", (event) =>        { this.OnConnectionClose(event)  })
    this.socket.addEventListener("open",  (event) =>        { this.OnConnectionOpen(event)   });
    this.socket.addEventListener("message", (event: any) => { this.OnMessageRecieve(event)   })
}
    
}


export { DiscordBot }