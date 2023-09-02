import { Client, GatewayDispatchEvent } from "../../src/Client";

export abstract class EventHandler
{
    eventType: GatewayDispatchEvent
    client:    Client
    
    constructor(client : Client, eventType : GatewayDispatchEvent)
    {
        this.eventType = eventType
        this.client    = client
    }

    GetEventType() : GatewayDispatchEvent
    {
        return this.eventType;
    }

    abstract OnEvent(event: any) : void
}

