import { EventHandler }   from "./EventHandler";
import { CommandHandler } from "./CommandHandler";
import { Client, GatewayDispatchEvent }  from '../../src/Client'
import { GuildUser } from "../../src/Cache";


export class EventMiddleman
{
    private client:        Client
    
    private eventHandlers:   Array<EventHandler>
    private commandHandlers: Array<CommandHandler>

    constructor(client: Client, eventHandlers: Array<EventHandler>, commandHandlers: Array<CommandHandler>)
    {
        this.client          = client
        this.eventHandlers   = eventHandlers
        this.commandHandlers = commandHandlers
    }

    Hook()
    {
        for (let handler of this.eventHandlers)
        {
            this.client.on(handler.GetEventType(), (eventData: string) => handler.OnEvent(eventData))
        }
        
        // Event recieved when an user sends any command in a guild
        this.client.on("INTERACTION_CREATE", (parsedJsonData: any) => 
        {
            let commandName = parsedJsonData.d.data.name

            // This can be optimised but the max number of commands (discord-api limit) is very small (~100)
            
            for (let command of this.commandHandlers)
            {
                if (command.commandName === commandName)
                {
                    command.OnCommand(parsedJsonData)    
                }
            }

        })

        this.client.on(GatewayDispatchEvent.GUILD_CREATE, (parsedJsonData: any) =>
        {
            // Check if guild is unavailable in case of a discord outage
            if (parsedJsonData.d.unavailable) return;
            
            
            let guildMembers = parsedJsonData.d.members
            
            for (let i = 0; i < Object.keys(guildMembers).length; i++)
            {
                if (!guildMembers[i].user) continue;
                
                let guildUser: GuildUser =
                {
                    userId:  guildMembers[i].user.id,
                    guildId: parsedJsonData.d.id,
                    username: guildMembers[i].user.username,
                    nickname: guildMembers[i].nick ?? "",
                    joinDate: new Date(guildMembers[i].joined_at).getTime()
                }
                
                this.client.cache.redisClient.hSet(`guild#${guildUser.guildId}:user#${guildUser.userId}`,
                {
                    ...guildUser
                })
                
            }

        })

        this.client.on(GatewayDispatchEvent.GUILD_MEMBER_UPDATE, (parsedJsonData: any) =>
        {
            this.client.cache.redisClient.hSet(`guild#${parsedJsonData.d.guild_id}:user#${parsedJsonData.d.user.id}`,
            {
                username: parsedJsonData.d.user.username,
                nick:     parsedJsonData.d.nick
            })  
        })

    }

}
