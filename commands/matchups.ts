import { ICommand } from "wokcommands";
import DiscordJS, { Intents, MessageEmbed, SelectMenuInteraction } from 'discord.js'

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
                    if(String(datum.points).includes('.')) {
                        username_to_matchup[i][1] = datum.points;
                    }
                    else {
                        username_to_matchup[i][1] = datum.points.toFixed(2);
                    }
                    username_to_matchup[i][2] = datum.matchup_id;
                }
            }
        }
        
        
        //Delete all unassigned teams
        for(let i = 0; i < username_to_matchup.length; i++){
            username_to_matchup[i][1] = String(username_to_matchup[i][1]);
            if(!username_to_matchup[i][1].includes('.')) {
                delete username_to_matchup[i];
            }
            try{
                username_to_matchup[i][1] = parseFloat(username_to_matchup[i][1]); 
            }
            catch {}
        }
        
        //Sort Matchups (Matchup Number first, Points second)
        username_to_matchup.sort(function(a,b){
            if(a[2] == b[2]){
                return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0;
            }
            return a[2] < b[2] ? 1 : -1;
        });

        var output_string = ""
        for(let i = 0; i < username_to_matchup.length; i = i + 2) {
            output_string = output_string + username_to_matchup[i][0] + 
            " (" + username_to_matchup[i][1] + ") " +
            "vs " + username_to_matchup[i+1][0] +
            " (" + username_to_matchup[i+1][1] + ") \n"
        }
      
      const embed = new MessageEmbed()
        .setTitle(league_name + " League Standings")
        .setDescription("```" + output_string + "```")
      return embed
      
    }

} as ICommand