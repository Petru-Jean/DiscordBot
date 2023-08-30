import { test } from 'node:test'
import * as Redis from 'redis'

export interface GuildUser
{
    userId:      string,
    guildId: string,

    username:  string,
    nickname:  string,

    joinDate:  number
}

export class ClientCache
{
    public redisClient: Redis.RedisClientType 
    
    public constructor(redisClient : Redis.RedisClientType)
    {
        this.redisClient = redisClient
    }

    public async GetGuildUser(guildId: string, userId: string) : Promise<GuildUser | undefined>
    {
        return new Promise(async (resolve, reject) =>
        {
            this.redisClient.hmGet(`guild#${guildId}:user#${userId}`, ["userId", "guildId", "username", "nickname", "joinDate"]).then((data) =>
            {
                if (!data[0])
                {
                    return reject(undefined)
                }
                
                return resolve({
                    userId: data[0],
                    guildId: data[1],
                    username: data[2],
                    nickname: data[3],
                    joinDate: Number(data[4])
                })

            }).catch((error: any) => reject(error))
            
        })
    }

    public SetGuildUser(guildUser: GuildUser)
    {
        this.redisClient.hSet(`guild#${guildUser.guildId}:user#${guildUser.userId}`,
        {
            ...guildUser
        })
    }


}
