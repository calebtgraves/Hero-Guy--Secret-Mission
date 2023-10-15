//connect to the socket server
const socket = io("ws://localhost:3000");

//get the elements on the webpage that are needed for the program
const gameId = document.getElementById("game-id");
const users = document.getElementById("users");
const currentHeroes = document.getElementById("heroes")
const currentEvents = document.getElementById('current-events');

function createNewEvent(text){
    let newEvent = document.createElement('div');
    newEvent.innerText = text;
    currentEvents.appendChild(newEvent);
};

//This is used to keep track of the users connected to a specific game
let playerNumber = 1
let players = {}
let duplicates = {}

//set up the available roles
let goodPriority = ['Hero Guy'];
let evilPriority = ['Nemesis'];
let basicGood = 'Police Officer';
let basicEvil = 'Villian';
let playerContainers = []

//define roles
let roles = {
    'Hero Guy':{
        'logo':"images/HeroGuyLogoWhite.svg",
        'color':'#1b75bb',
        'name':'Hero Guy',
        'article':'',
        'alignment':'good'
    },
    'Nemesis':{
        'logo':"images/NemesisWhite.svg",
        'color':'#000000',
        'name':'Nemesis',
        'article':'',
        'alignment':'evil'
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
    console.log(id);
    gameId.innerHTML = `Game ID:<br/> ${id}`
})

//set up a peer to peer connection object, allowing connections from other peers.
let peer = new Peer();
peer.on('open',(peerId)=>{
    console.log(peerId)
    //Tell the server that it is ready to accept clients
    socket.emit('host',[socket.id,peerId])
})

//this function sends data to all peers.
function sendToAll(data){
    connected.forEach((conn)=>{
        conn.send(data)
    })
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
        console.log(role);
        console.log(rolesNeeded);
        rolesNeeded.splice(rolesNeeded.indexOf(choice),1);
        console.log(rolesNeeded);
        conn.send(['role',role])
    })
}

//When a client connects to the host:
peer.on('connection',conn =>{
    connected.push(conn)
    console.log(conn)
    console.log(peer.connections)
    //What to do when data is recieved. Data is an array that contains the type of data, and then the data that it is sending.
    conn.on('data',(data)=>{
        //The switch statement figures out how to use the data sent based on what kind of data is specified at index 0 of the data array
        switch(data[0]){
            case 'username':
                //what to do when a username is recieved
                let username = data[1]
                username = username.toUpperCase()
                console.log(username in players)
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
                console.log('game started');
                const lobby = document.getElementById('lobby');
                lobby.style.display = "none";
                const game = document.getElementById('game')
                game.style.display = "flex";
                sendToAll(['start',players]);
                break;
            case 'roles':
                //send all roles to players
                sendRoles()
                break;
            case 'sendingMessage':
                sendToAll(['newMessage',data[1]])
            default:
                //nada means 'nothing' in spanish. It also means 'it swims.'
                //Que hace un pez? Nada!
                console.log('nada');
                break;
        }
    });
});