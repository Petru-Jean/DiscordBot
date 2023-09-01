import { GatewayDispatchEvent } from "../../Client";
import { EventHandler } from "../EventHandler";
import { Message }      from "../DBSchemas"

/**
 * @classdesc Removes existing reactions from user messages in the database
 */

export class MessageReactionRemoveHandler extends EventHandler
{
    constructor()
    {
        super(GatewayDispatchEvent.MESSAGE_REACTION_REMOVE)
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