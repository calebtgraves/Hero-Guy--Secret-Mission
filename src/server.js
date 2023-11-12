import {createServer} from "http";
import {Server} from "socket.io";

//create the server
const httpServer = createServer();

//setting up the socket server
const io = new Server(httpServer, {
    cors: {
        //Specifying from which urls the clients can connect to the server.
        origin: ["http://localhost:8080","http://localhost:8081"]
    }
})
//The users array is used to keep track of all connected sockets, whether hosts or clients
let users = [];
//The hosts object is used to keep track of the game ids of the hosts and the peer id that is associated with the host of the game
let hosts = {};
//generateGameId is a function that generates a 4-character code to use as the game id
function generateGameId(){
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 4) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}
//On the connection of any socket from the host or the client, it does these things.
io.on("connection", socket => {
    users.push(socket)
    console.log(`User ${socket.id} connected`)
    //This specifies what to do when a socket sends a 'host' event. ids is an array that includes the socket id and the peer id of the host.
    socket.on('host', ids =>{
        console.log(`User ${ids[0]} is hosting`)
        //The game id is created and then used as the key in the 'hosts' object.
        let gameId = generateGameId()
        hosts[gameId] = {
            "peerId":ids[1],
            "hostId":ids[0]
        }
        //this sends the game id to the host.
        io.to(ids[0]).emit('gameid',gameId)
    })

    //this specifies what happens when a client joins a game. info is an array that contains the game id that they are joining with, and the name they specify.
    socket.on('join', info=>{
        let gameId = info[0]
        let name = info[1]
        console.log(`User ${socket.id} is joining game ${gameId}`)
        //this looks to see if the game id the user typed in is valid. If it isn't, it sends the 'codeinvalid' event, which tells the user that it was invalid.
        if (gameId in hosts){
            io.to(socket.id).emit('join', [hosts[gameId]["peerId"],name])
        }else{
            io.to(socket.id).emit('codeinvalid', gameId)
        }
    })
})

//makes the server listen for connections.
httpServer.listen(3000, () => console.log('listening on port 3000'))