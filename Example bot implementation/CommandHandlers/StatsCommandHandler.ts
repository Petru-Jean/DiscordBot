import { Client, GatewayDispatchEvent } from "../../Client";
import { EventHandler } from "../EventHandler";
import { RequestOptions } from "../../Rest";
import { Message, VoiceActivity } from "../DBSchemas";
import { CommandHandler } from "../CommandHandler";
import { GuildUser } from "../../Cache";


/**
 * @classdesc Sends various user and server stats as a response to the /stats command
 */

export class StatsCommandHandler extends CommandHandler
{
    public constructor(client : Client)
    {
        super(client, "stats")
 
    }   
    
    private async GetServerStatsFormatted(guildId: string) : Promise<string>
    {
        let statsText = "Nu exista stats pentru server";
        
        await Promise.all([
            //Find total number of messages sent
            Message.find({ guild_id: guildId }).count(),
            
            // Find User who sent most messages
            Message.aggregate([
                {
                    $match: {
                        guild_id: guildId
                    }
                },
                {
                    $group: {
                        _id: "$user_id",
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        "count": -1
                    }
                }
            ]).limit(1),
            
            // Find User who spent most time on Voice Chat
            VoiceActivity.aggregate([
                {
                    $match: {
                        guild_id: guildId
                    }
                },
                {
                    $group: {
                        _id: "$user_id",
                        count: {
                            $sum: "$duration_in_ms" 
                        }
                    }
                },
                {
                    $sort: {
                        "count": -1
                    }
                }
            ]).limit(1),
    
            // Find longest voice chat session
            VoiceActivity.find({guild_id: guildId}).sort({duration_in_ms: -1}).limit(1)
        ])
        .then(async (data: any) =>
        {
            let msgCount          = data[0]
            let mostMsgSent       = data[1][0] ?? 0
            let vcMostTimeSpent   = data[2][0] ?? 0
            let longestVcSession  = data[3][0] ?? 0


            // Fetch user data for every user 
            await Promise.allSettled([
                // User who sent most messages
                this.client.cache.GetGuildUser(guildId, mostMsgSent ? mostMsgSent._id : 0),
                
                // User who spent most time on VC
                this.client.cache.GetGuildUser(guildId, vcMostTimeSpent ? vcMostTimeSpent._id : 0),
                
                // User who had the longest VC sesion
                this.client.cache.GetGuildUser(guildId, longestVcSession ? longestVcSession.user_id : 0)
            ]).then((users : any) =>
            {    
                users[0] = users[0].value 
                users[1] = users[1].value
                users[2] = users[2].value
                
                let textMostMsg    = users[0] ? ( `${users[0].nickname ?? users[0].username}  ${mostMsgSent.count}`) : "0"
                let textMostVcTime = users[1] ? (` ${users[1].nickname ?? users[1].username}  ${this.msToTime(vcMostTimeSpent.count)}`) : "0"
                let textLongestVc  = users[2] ? (` ${users[2].nickname ?? users[2].username}  ${this.msToTime(longestVcSession.duration_in_ms)}`) : "0"
                   
                statsText = `Afisez stats pentru **server**\n`
                statsText += `Mesaje trimise în total:       **${msgCount}**\n`
                statsText += `Cele mai multe mesaje trimise: **${textMostMsg}**\n`
                statsText += `Cel mai mult timp petrecut pe voice: **${textMostVcTime}**\n`
                statsText += `Cea mai lunga sesiune de voice:      **${textLongestVc}**\n`
                
            }).catch((error:any) => console.log(error))
        
        })
        
        return Promise.resolve(statsText)
    }
    
    private async GetUserStatsFormatted(guildId: string, userId: string): Promise<string>
    {
        let statsText = "Nu exista stats pentru acest utilizator"

        await Promise.allSettled([
            this.client.cache.GetGuildUser(guildId, userId),

            Message.find({ guild_id: guildId, user_id: userId }).count(),  

            // Total time spent on VoiceChat
            VoiceActivity.aggregate([   
            {
                $match:
                {
                    guild_id: guildId,
                    user_id:  userId
                }
            },
            {
                $group:
                {
                    _id: "$user_id",
                    TotalTimeSpent: { $sum: "$duration_in_ms" }
                },
            }
            ])
            
        ]).then((data : any) => 
        {
            let guildUser    = data[0].value
            let messageCount = data[1].value
            
            // Check if user spent time on VoiceChat
            let vcTimeSpent  = data[2].value.length ? data[2].value[0].TotalTimeSpent : 0
  
            if (guildUser)
            {
                // Date when bot started running [30 Aug 2023]
                let  botStartDate = 1693400400000
                
                let daysInGuild  = Math.floor(Math.max(1, (Date.now() - botStartDate)/86400000))

                let dailyMsgCount  = (messageCount / daysInGuild).toFixed(2)
                let dailyVoiceTime = vcTimeSpent  / daysInGuild
                
                statsText = `Se afiseaza stats pentru  **${guildUser.nickname.length ? guildUser.nickname : guildUser.username}** \n`;
                statsText += `Mesaje trimise în total: **${messageCount}**\n`;
                statsText += `Mesaje trimise zilnic:   **${dailyMsgCount}**\n`;
                statsText += `Timp petrecut pe Voice Chat: **${this.msToTime(vcTimeSpent)}**\n`
                statsText += `Activitate zilnică pe Voice: **${this.msToTime(dailyVoiceTime)}**`
            }
        })
        .catch((error: any) =>
        {
            console.log(error)
        })
        
        return Promise.resolve(statsText)
    }
    
    public override async OnCommand(parsedJsonData: any)
    {
        let interactionId    = parsedJsonData.d.id;
        let interactionToken = parsedJsonData.d.token;
        
        let stats = "A aparut o eroare, te rog sa incerci din nou."

        let guildId = parsedJsonData.d.guild_id

        if (parsedJsonData.d.data.options)
        {
            let userId  = parsedJsonData.d.data.options[0].value

            await this.GetUserStatsFormatted(guildId, userId).then((data:string) => stats = data )
        }
        else
        {
            await this.GetServerStatsFormatted(guildId).then((data:string) => stats = data)
        }

        this.client.rest.SendInteractionResponse(interactionId, interactionToken, stats);
    }

    msToTime(s: number)
    {
      var pad = (n : number, z = 1) => ('00' + n).slice(-z);
      return pad(s/3.6e6|0) + 'h : ' + pad((s%3.6e6)/6e4 | 0) +'m';
    }
    
}

