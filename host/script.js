//connect to the socket server
const socket = io("ws://localhost:3000");

//get the elements on the webpage that are needed for the program
const gameId = document.getElementById("game-id");
const users = document.getElementById("users");
const currentHeroes = document.getElementById("heroes")
const currentEvents = document.getElementById('current-events');
const background = document.getElementById('background');
const events = document.getElementById('events');

const devMode = false;
//This is used to keep track of the users connected to a specific game
let playerNumber = 1
let players = {}
let duplicates = {}

let day = true;

//set up the available roles
let goodPriority = ['Hero Guy'];
let evilPriority = ['Nemesis'];
let basicGood = 'Police Officer';
let basicEvil = 'Villian';
let playerContainers = []

let buildings = {
    "World News":{
        "protected":false,
        "players":[]
    },
    "Abandoned Funhouse":{
        "protected":false,
        "players":[]
    },
    "Grocery Mart":{
        "protected":false,
        "players":[]
    },
    "Jewelry Store":{
        "protected":false,
        "players":[]
    },
    "Tech Tower":{
        "protected":false,
        "players":[]
    },
    "Laboratory of Bizzare Research":{
        "protected":false,
        "players":[]
    },
    "Mystic Manor":{
        "protected":false,
        "players":[]
    }
}

let evilPlayers = [];
let goodPlayers = [];
let currentDay = 0;
let captureAtBuilding = '';
let playersAtBuildings = 0;
let performedActions = 0;
let playerVotes = 0;
let playersReady = 0;
let playersInJail = [];
let guiltyVotes = 0;
let notGuiltyVotes = 0;
let votedPlayers = {}
let currentEvent = "";
let buildingRaided = "";
let playerCaptured = "";
let winners = ''

function checkIfTeamWon(){
    let goodInJail = [];
    let evilInJail = [];
    playersInJail.forEach((inmate)=>{
        if(evilPlayers.includes(inmate)){
            evilInJail.push(inmate);
        }else{
            goodInJail.push(inmate);
        }
    });
    if(goodInJail.sort().toString() == goodPlayers.sort().toString()){
        winners = 'evil';
        return true
    }else if(evilInJail.sort().toString() == evilPlayers.sort().toString()){
        winners = 'good';
        return true
    }
    return false
}

function fillOutElement(text, element, event) {
    currentEvent = event
    if(devMode){
        element.innerText = text;
        connected[0].send(['event',event]);
        element.scrollTop = element.scrollHeight
        return;
    }
    setTimeout(()=>{
        element.innerHTML = "";
        let index = 0;
        let punctuation = ['.','!'];
        function addCharacter() {
            let delay = 40;
            if (index < text.length) {
                punctuation.forEach((item)=>{
                    if(text.charAt(index) == item){
                        delay = 500;
                    }
                })
                if(text.charAt(index) == '\n'){
                    element.innerHTML += "<br/><br/>";
                }else{
                    element.innerHTML += text.charAt(index);
                }
                index++;
                if(currentEvent == event){
                    setTimeout(addCharacter, delay);
                }
                
            }else{
                connected[0].send(['event',event])
            }
            element.scrollTop = element.scrollHeight
        }
        if (currentEvent == event){
            addCharacter();
        }
    },250);
}

//player action functions
function protectTheBuilding(building){
    buildings[building]["protected"] = true;
  }

//define roles
let roles = {
    'Hero Guy':{
        'logo':"images/HeroGuyLogoWhite.svg",
        'color':'#1b75bb',
        'name':'Hero Guy',
        'article':'',
        'alignment':'good',
        'actions':['Protect the Building','Do Nothing']
    },
    'Nemesis':{
        'logo':"images/NemesisWhite.svg",
        'color':'#000000',
        'name':'Nemesis',
        'article':'',
        'alignment':'evil',
        'actions':['Capture','Do Nothing']
    },
    'Police Officer':{
        'logo':"images/PoliceWhite.svg",
        'color':'#000073',
        'name':'Police Officer',
        'article':'a ',
        'alignment':'good'
    },
    'Villian':{
        'logo':"images/villianWhite.svg",
        'color':"#333333",
        'name':'Villian',
        'article':'a ',
        'alignment':'evil'
    }
}
let connected = []
//When the host has the game id from the server, it displays it on the screen.
socket.on('gameid',(id) =>{
    gameId.innerHTML = `Game ID:<br/> ${id}`
})

//set up a peer to peer connection object, allowing connections from other peers.
let peer = new Peer({
    host: 'localhost',
    port: 9000,
    path: '/myapp'
  });
peer.on('open',(peerId)=>{
    //Tell the server that it is ready to accept clients
    socket.emit('host',[socket.id,peerId])
})

//this function sends data to all peers.
function sendToAll(data){
    connected.forEach((conn)=>{
        conn.send(data)
    })
    return ''
}
//this function figures out which roles need to be used based on the amount of players in the game.
function getRoles(){
    let rolesNeeded = [];
    let allignment = 'good';
    connected.forEach(()=>{
        if(allignment == 'good'){
            if(goodPriority.length > 0){
                rolesNeeded.push(goodPriority[0]);
                goodPriority.splice(0,1);
            }else{
                rolesNeeded.push(basicGood);
            }
            allignment = 'evil';
        }else if(allignment == 'evil'){
            if(evilPriority.length > 0){
                rolesNeeded.push(evilPriority[0]);
                evilPriority.splice(0,1);
            }else{
                rolesNeeded.push(basicEvil);
            }
            allignment = 'good';
        }
    });
    return rolesNeeded
}
//this function randomly chooses a role for each player and sends it to them.
function sendRoles(){
    let rolesNeeded = getRoles();
    connected.forEach((conn)=>{
        let choice = rolesNeeded[rolesNeeded.length * Math.random() << 0]
        let role =roles[choice];
        rolesNeeded.splice(rolesNeeded.indexOf(choice),1);
        conn.send(['role',role])
    })
}

//Make the time switch from day to night
function switchTime(){
    day = !day;
    sendToAll(['day', day]);
    if(day){
        background.style.backgroundColor = 'white';
        const map = document.getElementById('map');
        map.style.filter = 'none';
        document.getElementById('meanwhile').style.backgroundColor = 'gold';
        events.style.backgroundColor = "gold";
    }else{
        background.style.backgroundColor = '#12223b';
        const map = document.getElementById('map');
        map.style.filter = 'brightness(0.5)';
        document.getElementById('meanwhile').style.backgroundColor = '#ffe34b';
        events.style.backgroundColor = "#ffe34b";
    }
}

//When a client connects to the host:
peer.on('connection',conn =>{
    connected.push(conn)
    //What to do when data is recieved. Data is an array that contains the type of data, and then the data that it is sending.
    conn.on('data',(data)=>{
        //The switch statement figures out how to use the data sent based on what kind of data is specified at index 0 of the data array
        switch(data[0]){
            case 'username':
                //what to do when a username is recieved
                let username = data[1]
                username = username.toUpperCase()
                //make sure there are no duplicate usernames, add a number if there are so that all usernames are unique.
                if(username in players){
                    if (username in duplicates){
                        duplicates[username] += 1
                    }else{
                        duplicates[username] = 2
                    }
                    username+=duplicates[username]
                }
                //generate what accessories the player has
                players[username] = {
                        'playerNumber':playerNumber ++,
                        'name':username,
                        'cape':Math.round(Math.random()) == 1? true : false,
                        'mask':Math.round(Math.random()) == 1? true : false,
                        'stache':Math.round(Math.random()) == 1? true : false,
                    }
                //if a player does not get any accessories, make sure it gets at least one.
                if (players[username]['cape'] == false && players[username]['mask'] == false && players[username]['stache'] == false){
                    let accessories = ['cape','mask','stache']
                    players[username][accessories[(Math.floor(Math.random() * accessories.length))]] = true
                }
                currentHeroes.style.display = 'block';

                const playerContainer = document.createElement('div');
                playerContainer.classList.add('player-container');
                const guyBase = document.createElement('div');
                guyBase.classList.add('guy-base');
                const cape = document.createElement('div');
                cape.classList.add('accessory');
                const mask = document.createElement('div');
                mask.classList.add('accessory');
                const stache = document.createElement('div');
                stache.classList.add('accessory');
                const playerName = document.createElement('p');
                mask.appendChild(stache);
                cape.appendChild(mask)
                guyBase.appendChild(cape)
                playerName.innerText = username
                if (players[username]['cape']){
                    cape.classList.add('cape');
                }
                if (players[username]['mask']){
                    mask.classList.add('mask');
                }
                if (players[username]['stache']){
                    stache.classList.add('mustache');
                }
                playerContainer.appendChild(guyBase);
                playerContainer.appendChild(playerName);
                if(players[username]['playerNumber'] == 1){
                    playerContainer.setAttribute("id","vip");
                }
                users.appendChild(playerContainer)
                playerContainers.push(playerContainer);
                conn.send(['playerinfo',players[username]])
                break;
            case 'start':
                //what to do when the game is started.
                const lobby = document.getElementById('lobby');
                lobby.style.display = "none";
                const game = document.getElementById('game')
                game.style.display = "flex";
                sendToAll(['start',players]);
                switchTime()
                fillOutElement(
                    `Welcome to Hero Guy: Secret Mission! Each of you has been given a role, and each role has different actions that they can perform.
                    The goal for the heroes is to send all of the villians to Jail, Especially their leader, Nemesis.
                    Nemesis and his minions have the goal to either capture all the heroes or steal all 5 of the devices from among the buildings on the map. For all players who are villians, the other players on your team are marked with red at the bottom of your screen.
                    On your screen, you'll see your role, your hero phone, which is used to play the game, and a list of all other players. On your hero phone, you'll see a chat app which can be used to communicate secretly with other players.
                    To start playing, go ahead and choose which building you will inspect tonight!`
                    ,events,'welcome');
                break;
            case 'nextDay':
                currentDay += 1;
                playersAtBuildings = 0;
                performedActions = 0;
                playerVotes = 0;
                playersReady = 0;
                guiltyVotes = 0;
                notGuiltyVotes = 0;
                votedPlayers = {};
                buildingRaided = "";
                playerCaptured = "";
                captureAtBuilding = '';
                console.log("Hey hey hey! It's a new day!")
                switchTime();
                fillOutElement(
                    `Okay, heroes, it's night once again! Choose another building!`
                    ,events,`night ${currentDay}`);
                break;
            case 'nightTimeEvents':
                playersAtBuildings = 0;
                performedActions = 0;
                let nightEvents = "";
                if(!playerCaptured && !buildingRaided){
                    nightEvents += ` was quiet. Absolutely nothing happened.`
                }else if(playerCaptured){
                    nightEvents += `, ${playerCaptured} was captured by Nemesis`
                    playersInJail.push(playerCaptured);
                    if(checkIfTeamWon()){
                        nightEvents += ', and with that, the villians have captured all of the heroes!'
                    }else{
                        nightEvents += '!'
                    }
                }else if(buildingRaided){
                    nightEvents += `, ${buildingRaided} was raided by Nemesis`
                    if(buildings[buildingRaided]['protected']){
                        nightEvents += `, but the building was protected by Hero Guy.`
                    }else{
                        nightEvents += `and the ${buildings[buildingRaided]['device']} was stolen!`
                    }
                }
                for(var place in buildings){
                    buildings[place]['players'] = []
                    buildings[place]['protected'] = false
                }
                fillOutElement(
                    `Good Morning Heroes!
                    Last night${nightEvents}${!checkIfTeamWon()?"\nNow it's time to vote on players to be sent to jail!":''}
                    ${currentDay==0?'Remember, you can only choose one player, so choose wisely. If any player is voted more than the others, every other player will vote guilty/not guilty to determine if they will go to jail.':''}`,
                    events, `morning ${currentDay}`
                )
                break;
            case 'changeBuilding':
                let building = data[1][0];
                let player = data[1][1];
                buildings[building]['players'].push(player);
                playersAtBuildings += 1;
                sendToAll(['playerAtBuilding',[player,building,buildings[building]['players']]]);
                if(playersAtBuildings == playerNumber-1-playersInJail.length){
                    sendToAll(['doActions']);
                    if(currentDay == 0){
                        fillOutElement(
                            `All of you have now chosen a building. You may notice that other people also went to the same building as you. If anybody else is there, a hero will learn one thing about their apperance, and a villian will learn their identity. You may also see that there are no other players there.
                            Many roles have some kind of action or actions that they can do at night. If yours can, you will see buttons on your screen with your action options.
                            If you don't have any actions, make sure to take note of anything you've learned about other people there, and press "I'm Ready" when you are ready to move on!
                            If your role has any actions available, go ahead and try one!`
                            ,events,'firstActions');
                    }else{
                        fillOutElement(
                            `All players have selected a building. Now perform your actions or indicate that you're ready to move on!`,
                            events, `actionsDay ${currentDay}`
                        );
                    }
                }
                break;
            case 'action':
                if(data[1][0] == 'Protect the Building'){
                    buildings[data[1][2]]['protected'] = true;
                }else if(data[1][0].includes('Capture')){
                    playerCaptured = data[1][0].split(" ")[1];
                    captureAtBuilding = data[1][2];
                }
                performedActions += 1;
                console.log(captureAtBuilding);
                if(performedActions == playerNumber-1-playersInJail.length){
                    if(captureAtBuilding){
                        console.log(buildings[captureAtBuilding])
                        if(buildings[captureAtBuilding]['protected']){
                            playerCaptured = ''
                        }
                    }
                    switchTime()
                }
                break;
            case 'roles':
                //send all roles to players
                sendRoles()
                break;
            case 'sendingMessage':
                sendToAll(['newMessage',data[1]])
                break;
            case 'playerRole':
                let thisPlayer = data[1]
                players[thisPlayer['name']]['role'] = thisPlayer['role'];
                if (thisPlayer['role']['alignment'] == 'evil'){
                    sendToAll(['evilPlayer',thisPlayer['name']])
                    evilPlayers.push(thisPlayer['name'])
                }else{
                    goodPlayers.push(thisPlayer['name'])
                }
                break;
            case 'event':
                let eventInfo = data[1].split(" ");
                if(eventInfo[0] == "morning"){
                    playerVotes = 0
                    votedPlayers = {}
                    if(checkIfTeamWon()){
                        sendToAll(['winningTeam',winners])
                    }else{
                        sendToAll(['captured',playerCaptured])
                        sendToAll(['timeToVote']);
                    }
                }else if(eventInfo[0] == 'finalVoting'){
                    if(checkIfTeamWon()){
                        sendToAll(['winningTeam',winners])
                        fillOutElement(`Congradulations! The ${winners=='good'?'heroes have defeated the villians!':'villians have captured the heroes!'}`,
                        events,'gameOver')
                    }else{
                        sendToAll(['continue']);
                    }
                }
                break;
            case 'continue':
                playersReady += 1;
                console.log(playersReady);
                if(playersReady == playerNumber-1-playersInJail.length){
                    sendToAll(['playersReady'])
                }
                break;
            case 'sendVote':
                console.log(data[1]);
                if(data[1] != 'none'){
                    let chosenPlayer=data[1]['name'];
                    votedPlayers[chosenPlayer] = votedPlayers[chosenPlayer]?votedPlayers[chosenPlayer]+1:1;
                }
                playerVotes += 1;
                if (playerVotes == playerNumber-1-playersInJail.length){
                    let max = [0,'']
                    for(var person in votedPlayers){
                        if (votedPlayers[person] > max[0]){
                            max[0] = votedPlayers[person]
                            max[1] = person
                        }else if(votedPlayers[person] == max[0]){
                            max[0] = votedPlayers[person]
                            max[1] = ''
                        }
                    }
                    if(max[1] != ''){
                        sendToAll(['votesIn',max[1]]);
                        fillOutElement(
                            `Alright! The votes are in! ${max[1]} is on trial! It's time to decide if you think ${max[1]} is guilty or not!`,
                            events, `voting ${currentDay}`
                        );
                    }else{
                        sendToAll(['finalVotesIn','']);
                        fillOutElement(
                            `Looks like no one will be on trial today!
                            All players not in jail must press continue before proceeding.`,
                            events, `finalVoting ${currentDay}`
                        );
                    }
                }
                break;
            case 'guilty':
                //data[1] is a list with the name of the player, and either true(for guilty) or false(for not guilty)
                if(data[1][1]){
                    guiltyVotes += 1;
                }else{
                    notGuiltyVotes += 1;
                }
                if((guiltyVotes+notGuiltyVotes) == playerNumber-2-playersInJail.length){
                    if(guiltyVotes>notGuiltyVotes){
                        playersInJail.push(data[1][0]);
                    }
                    let sentenced = guiltyVotes>notGuiltyVotes?data[1][0]:'';
                    if(sentenced){
                        fillOutElement(
                            `Well, it looks like ${sentenced} has been found guilty of being a villian by The Council of Heroes!
                            ${sentenced}, we hereby sentence you to jail!
                            It's important to keep in mind, players in jail can still send messages to other players, but they are only able to send one message per day. Use that message wisely!
                            All players not in jail must press continue before proceeding.`,
                            events, `finalVoting ${currentDay}`
                        );
                        sendToAll(['finalVotesIn',sentenced]);
                    }else{
                        fillOutElement(
                            `${data[1][0]}, you have been found not guilty by The Council of Heroes!
                            All players not in jail must press continue before proceeding.`,
                            events,`finalVoting ${currentDay}`
                        );
                    }
                }
                break;
            default:
                //nada means 'nothing' in spanish. It also means 'it swims.'
                //Que hace un pez? Nada!
                console.log(data);
                break;
        }
    });
});