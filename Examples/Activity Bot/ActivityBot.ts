const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

import { Client } from "../../src/Client";

import { CommandHandler      } from "./CommandHandler";
import { StatsCommandHandler } from "./CommandHandlers/StatsCommandHandler";

import { EventHandler }   from "./EventHandler";
import * as EventHandlers from "./EventHandlers/EventHandlers"

import { EventMiddleman } from "./EventMiddleman";

var mongoose = require('mongoose')

export class ActivityBot
{
    public client:    Client
    public middleman: EventMiddleman
    
    public constructor(client: Client)
    {
        const commandHandlers : Array<CommandHandler> =
        [
            new StatsCommandHandler(client)
        ]

        const eventHandlers : Array<EventHandler> =
        [
            new EventHandlers.MessageCreateHandler(client),
            new EventHandlers.VoiceActivityHandler(client),
            new EventHandlers.MessageReactionAddHandler(client),
            new EventHandlers.MessageReactionRemoveHandler(client),
            new EventHandlers.MemberLeaveHandler(client)
        ]

        this.middleman = new EventMiddleman(client, eventHandlers, commandHandlers)
        this.client    = client
    }
    
    public async Init()
    {
        console.log("Initializing Mongoose connection...")
        
        await mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .catch((error: any) => {
            return Promise.reject(new Error(`Failed to connect to mongoose: ${error}`))
        })
        
        this.middleman.Hook()
    }

    
    
}