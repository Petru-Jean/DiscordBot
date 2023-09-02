import { Client, GatewayDispatchEvent } from "../../../src/Client";
import { EventHandler } from "../EventHandler";
import { Message }      from "../DBSchemas"

/**
 * @classdesc Removes existing reactions from user messages
 */

export class MessageReactionRemoveHandler extends EventHandler
{
    constructor(client : Client)
    {
        super(client,GatewayDispatchEvent.MESSAGE_REACTION_REMOVE)
    }

    OnEvent(event: any)
    {
        Message.findOneAndUpdate(
        {
            message_id: event.d.message_id
        },
        {
            $pull: {
                reacts: event.d.emoji.name
            }
        }
        ).then(
            (success : any) => { },
            (error   : any) => { console.log("Failed to remove message reaction: " + error) }
        )
        
    }
    
}