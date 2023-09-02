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

    }

}
