import { Client, GatewayDispatchEvent } from "../../../src/Client";
import { EventHandler } from "../EventHandler";
import { ExMembers }      from "../DBSchemas"
import { GuildUser } from "../../../src/Cache";

/**
 * @classdesc Records when users leave the guild
 */
export class MemberLeaveHandler extends EventHandler
{
    constructor(client : Client)
    {
        super(client, GatewayDispatchEvent.GUILD_MEMBER_REMOVE)
    }

    OnEvent(event: any)
    {
        this.client.cache.GetGuildUser(event.d.guild_id, event.d.user.id).then((user : GuildUser | undefined) =>
        {
            if (!user)
            {
                console.log(`User ${event.d.user.id} was not found in redis cache when removed from guild ${event.d.guild_id}`)
                return
            }
            
            ExMembers.create
            ({
                guild_id:  user.guildId,
                user_id:   user.userId,
                join_date: user.joinDate,
                name:      user.username
            })
            .then(
                (success : any) => { },
                (error   : any) => { console.log("Failed to save user removal: " + error )  }
            )   
            
        })  
        
    }
    
}