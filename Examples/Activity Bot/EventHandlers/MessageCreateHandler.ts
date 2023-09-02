import { Client, GatewayDispatchEvent } from "../../../src/Client";
import { EventHandler } from "../EventHandler";
import { Message }      from "../DBSchemas"

export class MessageCreateHandler extends EventHandler
{
    constructor(client : Client)
    {
        super(client, GatewayDispatchEvent.MESSAGE_CREATE)
    }

    OnEvent(event: any)
    {
        let message = event

        let ephemeralFlag = 1 << 6

        // Check if message is ephemeral
        if (message.d.flags && (message.d.flags & ephemeralFlag))
        {
            return;
        }
        
        const msg = new Message(
        {
            guild_id:   message.d.guild_id,
            user_id:    message.d.author.id,
            message_id: message.d.id,
            content: message.d.content ?? "Attachment"
        })
        
        msg.save().then(() => { }).catch((error : any) =>
        {
            console.log("Failed to save message: " + error)
        })
        
    }
    
}