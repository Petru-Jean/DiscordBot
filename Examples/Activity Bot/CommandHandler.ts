// import { GatewayDispatchEvent } from "./DiscordBotAPI";
import { Client } from "../../src/Client";
import { EventHandler } from "./EventHandler";
import * as Redis from 'redis';

export abstract class CommandHandler
{
    public readonly commandName : string
    protected client            : Client;

    public constructor(client : Client, cmdName : string,)
    {
        this.commandName = cmdName;
        this.client      = client;
    }

    public abstract OnCommand(parsedJsonData: any) : void

}