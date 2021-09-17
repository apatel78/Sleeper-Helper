//Sleeper API Wrapper https://github.com/bladenum1/sleeper
const sleeper_package = require('sleeper_fantasy');
const fs = require('fs');

//Standings
(async () => {

    const command_line_input = "Monarch"
    const league_to_position = {"Monarch" : `0`, "RUFFLWhite" : '1'}

    const sleeper_instance = new sleeper_package.sleeper();
    const league_ids = [`732852003943862272`, '728306032106962944'];

    sleeper_instance.leagues = league_ids;
    await Promise.all(sleeper_instance.league_promises);

    var users_dict = {};
    var data = {};

    //Get Users for the league
    data = await sleeper_instance.leagues[league_ids[league_to_position[command_line_input]]].fetch_owners();
    for(const user of data.owners) {
        users_dict[user.user_id] = user.display_name;
    }

    var roster_standings_list = [];

    //Get Rosters for the league
    data = await sleeper_instance.leagues[league_ids[league_to_position[command_line_input]]].fetch_rosters();
    //Extract wanted data and push to a list
    for(const roster of data.rosters){
        const wins = roster["settings"]["wins"];
        const points = roster["settings"]["fpts"] + (0.01 * roster["settings"]["fpts_decimal"]);
        const name = roster["owner_id"];
        const losses = roster["settings"]["losses"];

        roster_list = [wins, losses, points, users_dict[name]];

        roster_standings_list.push(roster_list)
    }

    //Sort the list (Wins first PF second)
    roster_standings_list.sort(function(a,b){
        if(a[0] == b[0]){
          return a[2] < b[2] ? 1 : a[2] > b[2] ? -1 : 0;
        }
        return a[0] < b[0] ? 1 : -1;
      });

    //Print proof of concept
    console.log(roster_standings_list);
    
 
})();

//Matchups
(async () => {

    const command_line_input = "Monarch"
    const week = 1;
    const league_to_position = {"Monarch" : `0`, "RUFFLWhite" : '1'}

    const sleeper_instance = new sleeper_package.sleeper();
    const league_ids = [`732852003943862272`, '728306032106962944'];

    sleeper_instance.leagues = league_ids;
    await Promise.all(sleeper_instance.league_promises);
    
    var username_to_matchup = [];
    var data = {};

    //Get Username and UserID combo
    data = await sleeper_instance.leagues[league_ids[league_to_position[command_line_input]]].fetch_owners();
    for(const datum of data.owners) {
        username_to_matchup.push([datum.display_name, datum.user_id, 0])
    }
    
    //Get UserID and RosterID combo
    data = await sleeper_instance.leagues[league_ids[league_to_position[command_line_input]]].fetch_rosters();
    for(const datum of data.rosters) {
        for(let i = 0; i < username_to_matchup.length; i++){
            if(username_to_matchup[i][1] == datum.owner_id) {
                username_to_matchup[i][1] = datum.roster_id;
            }
        }
    }
    
    //Get matchup and RosterID combo
    data = await sleeper_instance.leagues[league_ids[league_to_position[command_line_input]]].fetch_matchups(week);
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
    

    console.log(username_to_matchup);

})();