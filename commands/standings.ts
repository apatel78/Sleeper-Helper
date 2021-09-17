import { ICommand } from "wokcommands";
import DiscordJS, { Intents, MessageEmbed, SelectMenuInteraction } from 'discord.js'
import * as table from 'table'

const sleeper_package = require('sleeper_fantasy');
const fs = require('fs');

export default {
    category: 'Standings',
    description: 'Returns the standings for a league',
    slash: true,
    testOnly: true,

    options: [
        {
          name: 'league',
          description: 'The league name you want the standings for',
          required: true,
          type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
        },
      ],

    callback: async ({interaction})  => {

      const { options } = interaction

      //Get leaguename

      const command_line_input = options.getString('league') || "Champions"
      const league_name = command_line_input[0].toUpperCase() + command_line_input.substring(1)
      const league_to_position = {"Admiral" : `0`, "Champions" : '1',
       "Dragon" : '2', "Galaxy" : '3', "Monarch" : '4'}

      if(!(league_name in league_to_position)) {
        return "This league does not exist"
      }

      const sleeper_instance = new sleeper_package.sleeper()

      const league_ids = [`732847882851450880`, '732842165142667264',
       '732849644161314816', '732850920748109824', '732852003943862272']
      sleeper_instance.leagues = league_ids
      await Promise.all(sleeper_instance.league_promises);

      var users_dict = {};
      let data : any = {}
      
      //Get Users for the league
      data = await sleeper_instance.leagues[league_ids[league_to_position[league_name]]].fetch_owners();
      
      for(const user of data.owners) {
          users_dict[user.user_id] = user.display_name;
      }
  
      let roster_standings_list: any = [];
  
      //Get Rosters for the league
      data = await sleeper_instance.leagues[league_ids[league_to_position[league_name]]].fetch_rosters();
      
      //Extract wanted data and push to a list
      for(const roster of data.rosters){
          const wins = roster["settings"]["wins"];
          const points = roster["settings"]["fpts"] + (0.01 * roster["settings"]["fpts_decimal"]);
          const name = roster["owner_id"];
          const losses = roster["settings"]["losses"];
  
          let roster_list: any = [wins, losses, points, users_dict[name]];
  
          roster_standings_list.push(roster_list)
      }
  
      //Sort the list (Wins first PF second)
      roster_standings_list.sort(function(a,b){
          if(a[0] == b[0]){
            return a[2] < b[2] ? 1 : a[2] > b[2] ? -1 : 0;
          }
          return a[0] < b[0] ? 1 : -1;
      });

      //Find the longest username
      var longest_username = 0

      //Create a new Array to hold data
      let roster_standings_ouput : any = [];
      const header = ["Name", "W/L", "PF"]
      roster_standings_ouput.push(header)
      
      for(let i = 0; i < roster_standings_list.length; i++) {
        const input = [roster_standings_list[i][3], 
        roster_standings_list[i][0] + '-' + roster_standings_list[i][1], 
        roster_standings_list[i][2]
      ]
        //Grab the longest username
        if(roster_standings_list[i][3].length > longest_username){
          longest_username = roster_standings_list[i][3].length
        }
        roster_standings_ouput.push(input)
      }

      //Create a table from the data
      const config = {
        border: table.getBorderCharacters(`void`),
        columns: [
          {
            width: longest_username,
          },
          {
            width: 3,
          },
          {
            width: 8,
          },
        ],
        drawHorizontalLine: () => false,

      };
      const roster_standings_table = table.table(roster_standings_ouput, config)
      
      const embed = new MessageEmbed()
        .setTitle(league_name + " League Standings")
        .setDescription("```" + roster_standings_table + "```")
      return embed
      

      
      /*
      await interaction.deferReply({
      })

      await new Promise(resolve => setTimeout(resolve, 5000))

      await interaction.editReply({
        content: "```" + roster_standings_table + "```",
      })
      */
      
    }

} as ICommand