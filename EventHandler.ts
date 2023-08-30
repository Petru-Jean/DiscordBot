import { Client, GatewayDispatchEvent } from "./Client";
const db = require('./db')

export abstract class EventHandler
{
    eventType: GatewayDispatchEvent
    
    constructor(eventType : GatewayDispatchEvent)
    {
        this.eventType = eventType
    }

    GetEventType() : GatewayDispatchEvent
    {
        return this.eventType;
    }

    abstract OnEvent(event: any) : void
}

