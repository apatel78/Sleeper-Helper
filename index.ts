import DiscordJS, { Intents } from 'discord.js'
import WOKCommands from 'wokcommands'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

//Init Client with Intents
const client = new DiscordJS.Client({
    
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})


//Bot Launch Configuration
client.on('ready', () => {
    console.log("The bot is now online")

    
    new WOKCommands(client, {
        commandDir: path.join(__dirname, 'commands'),
        typeScript: true,
        testServers: '465559846717227009'
    })
})

//Login
client.login(process.env.TOKEN)

//ts-node index.ts