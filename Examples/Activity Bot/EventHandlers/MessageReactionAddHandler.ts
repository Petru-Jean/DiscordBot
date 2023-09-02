import { Client, GatewayDispatchEvent } from "../../../src/Client";
import { EventHandler } from "../EventHandler";
import { Message }      from "../DBSchemas"

/**
 * @classdesc Records reactions to user messages
 */
export class MessageReactionAddHandler extends EventHandler
{
    constructor(client : Client)
    {
        super(client, GatewayDispatchEvent.MESSAGE_REACTION_ADD)
    }

    OnEvent(event: any)
    {
        Message.findOneAndUpdate(
        {
            message_id: event.d.message_id
        },
        {
            $push: {
                reacts: event.d.emoji.name
            }
        }
        ).then(
            (success : any) => { },
            (error   : any) => { console.log("Failed to save message reaction: " + error )  }
        )

    }
    
}