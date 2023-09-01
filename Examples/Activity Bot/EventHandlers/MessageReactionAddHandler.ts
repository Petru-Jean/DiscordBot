import { GatewayDispatchEvent } from "../../../src/Client";
import { EventHandler } from "../EventHandler";
import { Message }      from "../DBSchemas"

/**
 * @classdesc Records reactions to user messages in the database
 */
export class MessageReactionAddHandler extends EventHandler
{
    constructor()
    {
        super(GatewayDispatchEvent.MESSAGE_REACTION_ADD)
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