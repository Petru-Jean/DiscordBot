import { GatewayDispatchEvent } from "../Client";
import { EventHandler } from "../EventHandler";

export class MockHandler extends EventHandler
{
    constructor()
    {
        super(GatewayDispatchEvent.MESSAGE_CREATE)
    
    }

    OnEvent(event: any)
    {
        
    }
}