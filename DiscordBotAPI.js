"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = exports.DispatchEvents = exports.ConnectionStatus = void 0;
const { error } = require('console');
const { response } = require('express');
const http = require('http');
const https = require('https');
const EventEmitter = require('events');
const WebSocket = require('ws');
var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus[ConnectionStatus["OPEN"] = 0] = "OPEN";
    ConnectionStatus[ConnectionStatus["CONNECTING"] = 1] = "CONNECTING";
    ConnectionStatus[ConnectionStatus["CLOSED"] = 2] = "CLOSED";
})(ConnectionStatus || (exports.ConnectionStatus = ConnectionStatus = {}));
var DispatchEvents;
(function (DispatchEvents) {
    DispatchEvents["MessageCreate"] = "MESSAGE_CREATE";
    DispatchEvents["MessageReactionAdd"] = "MESSAGE_REACTION_ADD";
    DispatchEvents["MessageReactionRemove"] = "MESSAGE_REACTION_REMOVE";
    DispatchEvents["GuildMemberAdd"] = "GUILD_MEMBER_ADD";
    DispatchEvents["GuildMemberRemove"] = "GUILD_MEMBER_REMOVE";
    DispatchEvents["VoiceStateUpdate"] = "VOICE_STATE_UPDATE";
})(DispatchEvents || (exports.DispatchEvents = DispatchEvents = {}));
class DiscordBot extends EventEmitter {
    constructor(config) {
        super();
        this.botConfig = config;
        this.connectionStatus = ConnectionStatus.CLOSED;
        this.socketURL = "";
        this.heartbeat = 41250;
        this.sequence = 0;
    }
    FetchGatewayURL() {
        return new Promise((resolve, reject) => {
            let gatewayFetchOptions = {
                host: 'discord.com',
                path: '/api/gateway/bot',
                method: 'GET',
                headers: {
                    'authorization': `${this.botConfig.AUTH_TOKEN_TYPE} ${this.botConfig.AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            };
            const req = https.request(gatewayFetchOptions, (response) => {
                response.setEncoding('utf-8');
                response.on('data', (data) => {
                    let json = JSON.parse(data);
                    if (!json.url) {
                        reject(new Error("Failed to fetch Gateway URL: " + data));
                    }
                    this.socketURL = json.url + "?v=10&encoding=json";
                    resolve(() => { });
                });
            }).on('error', function (e) {
                reject(new Error('Failed to fetch Gateway URL: ' + e.message));
            });
            req.end();
        });
    }
    Identify() {
        //console.log("Sending identify event")
        let json = {
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
        };
        this.socket.send(JSON.stringify(json));
    }
    SendHeartbeat() {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.connectionStatus == ConnectionStatus.OPEN) {
                yield new Promise(resolve => setTimeout(resolve, this.heartbeat));
                this.socket.send(JSON.stringify({
                    "op": 1,
                    "d": {}
                }));
            }
        });
    }
    OnMessageRecieve(event) {
        let json = JSON.parse(event.data);
        if (json.op == 0) {
            let eventName = json.t;
            this.sequence = json.s;
            if (json.t === 'READY') {
                console.log("Identification succesful [" + json.d.user.username + "]");
                this.resumeURL = json.d.resume_gateway_url;
                this.sessionId = json.d.session_id;
                console.log("Resume  url: " + this.resumeURL);
                console.log("Session id:  " + this.sessionId);
                this.SendHeartbeat();
            }
            else {
                //console.log(json)
                this.emit(json.t, JSON.parse(event.data));
                console.log(json.t);
            }
        }
        else {
            if (json.op == 10) {
                console.log("Initialized a new connection: " + this.socketURL);
                this.connectionStatus = ConnectionStatus.OPEN;
                this.heartbeat = json.d.heartbeat_interval;
                this.Identify();
            }
            else if (json.op == 11) {
                // if not recieved, reconnect and resume
                //console.log("Heartbeat response recieved")
            }
            else {
            }
        }
    }
    OnConnectionClose(event) {
        this.connectionStatus = ConnectionStatus.CLOSED;
        console.log("Connection closed: " + event.reason + " " + event.code);
        if (this.resumeURL && this.sessionId) {
            this.Connect();
        }
    }
    OnConnectionOpen(event) {
        this.connectionStatus = ConnectionStatus.OPEN;
    }
    Connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connectionStatus === ConnectionStatus.OPEN) {
                console.log("There is already an open connection.");
                return;
            }
            if (this.connectionStatus === ConnectionStatus.CONNECTING) {
                console.log("Connection already in progress.");
                return;
            }
            this.connectionStatus = ConnectionStatus.CONNECTING;
            if (!this.socketURL) {
                yield this.FetchGatewayURL();
            }
            if (this.socket) {
                if (this.socket.readyState === WebSocket.OPEN) {
                    console.log("WebSocket connection already running.");
                    return;
                }
                else if (this.socket.readyState == WebSocket.CLOSED) {
                    console.log("Attempting to resume connection with session id:" + this.sessionId);
                    try {
                        this.socket = new WebSocket(this.resumeURL);
                    }
                    catch (exception) {
                        console.log("WebSocket reconnect attempt failed " + exception);
                        return;
                    }
                }
            }
            else {
                try {
                    this.socket = new WebSocket(this.socketURL);
                }
                catch (exception) {
                    console.log("WebSocket connection failed: " + exception);
                    return;
                }
            }
            this.socket.addEventListener("close", (event) => { this.OnConnectionClose(event); });
            this.socket.addEventListener("open", (event) => { this.OnConnectionOpen(event); });
            this.socket.addEventListener("message", (event) => { this.OnMessageRecieve(event); });
        });
    }
}
exports.DiscordBot = DiscordBot;
