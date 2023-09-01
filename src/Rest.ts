const https = require("https")

export interface RequestOptions
{
    authorization?:  string
    body?:           string 
    headers?:        Record<string, string>,
    contentType?:    string,
    encoding?:       string
}

export class Rest
{   
    constructor()
    {
        
    }
    
    /**
     * 
     * @param {number} interactionId Interaction id fetched from the interaction data
     * @param {number} interactionToken Interaction token fetched from the interaction data
     * @param {string} content The response sent by the bot 
     * @returns 
     */
    public async SendInteractionResponse(interactionId: number, interactionToken: number, content: string)
    {
        const reqUrl = `https://discord.com/api/v10/interactions/${interactionId}/${interactionToken}/callback`

        return fetch(reqUrl,
        {
            method: 'POST',

            body: JSON.stringify({
                type: 4,
                data: {
                    "content": content
                }
            }),

            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },

        }).catch((error : any) => console.log("InteractionResponse error"))
        
    }
    
}