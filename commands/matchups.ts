import { ICommand } from "wokcommands";
import DiscordJS, { Intents, MessageEmbed, SelectMenuInteraction } from 'discord.js'
import * as table from 'table'

const sleeper_package = require('sleeper_fantasy');
const fs = require('fs');

export default {
    category: 'Matchups',
    description: 'Returns the matchups for a league',
    slash: true,
    testOnly: true,

    options: [
        {
          name: 'league',
          description: 'The league name you want the standings for',
          required: true,
          type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
        },
        {
            name: 'week',
            description: 'The week you want the standings for',
            required: true,
            type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
          },

      ],

    callback: async ({interaction})  => {

        const { options } = interaction

        const command_line_input = options.getString('league') || "Champions"
        const week = options.getInteger('week') || 1
        const league_name = command_line_input[0].toUpperCase() + command_line_input.substring(1)
        const league_to_position = {"Admiral" : `0`, "Champions" : '1',
        "Dragon" : '2', "Galaxy" : '3', "Monarch" : '4'}

        if(!(league_name in league_to_position)) {
            return "This league does not exist"
        }

        const sleeper_instance = new sleeper_package.sleeper()

        const league_ids = [`732847882851450880`, '732842165142667264',
        '732849644161314816', '732850920748109824', '732852003943862272']

        sleeper_instance.leagues = league_ids;
        await Promise.all(sleeper_instance.league_promises);

        let data : any = {}

        //Get Username and UserID combo
        data = await sleeper_instance.leagues[league_ids[league_to_position[league_name]]].fetch_owners();
        let username_to_matchup : any = [];
        for(const datum of data.owners) {
            username_to_matchup.push([datum.display_name, datum.user_id, 0])
        }
        
        //Get UserID and RosterID combo
        data = await sleeper_instance.leagues[league_ids[league_to_position[league_name]]].fetch_rosters();
        for(const datum of data.rosters) {
            for(let i = 0; i < username_to_matchup.length; i++){
                if(username_to_matchup[i][1] == datum.owner_id) {
                    username_to_matchup[i][1] = datum.roster_id;
                }
            }
        }
        
        //Get matchup and RosterID combo
        data = await sleeper_instance.leagues[league_ids[league_to_position[league_name]]].fetch_matchups(week);
        for(const datum of data.matchups) {
            for(let i = 0; i < username_to_matchup.length; i++){
                if(username_to_matchup[i][1] == datum.roster_id) {
                    username_to_matchup[i][1] = datum.points;
                    username_to_matchup[i][2] = datum.matchup_id;
                }
            }
        }
        
        
        const usernameMatches = username_to_matchup
            .filter(matchup => typeof matchup[1] === 'number')
            .sort((a, b) => {
                if (a[2] === b[2]) return b[1] - a[1];
                return a[2] - b[2];
            });

        //Create a new Array to hold data
        let username_to_matchup_output : any = [];
        var longest_username = 0
        
        for(let i = 0; i < usernameMatches.length; i = i + 2) {
            const input = [usernameMatches[i][0], 
            "(" + usernameMatches[i][1] + ")", "vs", "(" + usernameMatches[i+1][1] + ")",
            usernameMatches[i+1][0]
        ]
            //Grab the longest username
            if(usernameMatches[i][0].length > longest_username){
            longest_username = usernameMatches[i][0].length
            }
            username_to_matchup_output.push(input)
        }

        //Create a table from the data
        const config = {
            border: table.getBorderCharacters(`void`),
            columns: [
            {
                width: longest_username,
            },
            {
                width: 8,
            },
            {
                width: 2,
            },
            {
                width: 8,
            },
            {
                width: longest_username,
            },
            ],
            drawHorizontalLine: () => false,

        };
        const username_to_matchup_table = table.table(username_to_matchup_output, config)

        
        // let output_string = ""
        // for (let i = 0; i < usernameMatches.length; i = i + 2) {
        //     const leftTeam = usernameMatches[i];
        //     const rightTeam = usernameMatches[i+1];

        //     output_string += `${leftTeam[0]} (${leftTeam[1]}) vs ${rightTeam[0]} (${rightTeam[1]})\n`;
        // }
      
      const embed = new MessageEmbed()
        .setTitle(league_name + " Week " + week + " Scoreboard")
        .setDescription("```" + username_to_matchup_table + "```")
      return embed
      
    }

} as ICommand