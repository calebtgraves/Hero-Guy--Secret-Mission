//connect to the socket server
const socket = io("ws://192.168.0.182:3000");

//set up a peer to peer connection object
let peer = new Peer();
peer.on('open', id =>{
  console.log(id);
})

//get all of the elements on the webpage required for the program
const joinButton = document.getElementById('join-button');
let invaildCode = document.getElementById("invalid-code");
let username = document.getElementById("name-input");
let gameId = document.getElementById("game-id-input");
let welcome = document.getElementById("welcome");
const entryForm = document.getElementById('entry-form');
const logo = document.getElementById('logo');
const container = document.getElementById('container');
const nameDisplay = document.getElementById('name-display');
const gameSpace = document.getElementById('game-space')

let me = {}
let playerNames = []
joinButton.onclick = () => {
  //tell the server the client is trying to connect to a game, and send the game id and username that was typed in.
  socket.emit('join', [gameId.value.toUpperCase(),username.value])
  //clear the gameId field, in case the game id was invalid.
  gameId.value = ""
}

//Hero Phone
const home = document.getElementById('home');
const chatApp = document.getElementById('chat-app');
const homeButton = document.getElementById('home-button');
const apps = [home,chatApp]

//This function handles the switching of the phone screen, whether in an app or from an app to the home screen.
function switchScreen(scope,target){
  scope.forEach((screen)=>{
    screen.style.display = 'none';
  })
  target.style.display = 'flex';
}
homeButton.onclick = ()=>{
  switchScreen(apps,home);
}
//home screen
const chatIcon = document.getElementById("chat");
chatIcon.onclick = ()=>{
  switchScreen(apps,chatApp);
}
//chat app
const contacts = document.getElementById('contacts');
const chatScreen = document.getElementById('chat-screen');
const contactsList = document.getElementById('contacts-list');
const chatTitle = document.getElementById('chat-title');
const chatAppScreens = [contacts,chatScreen];
let chatNotifications = document.getElementById('chat-notifications');
let conversations = []
let unreadConvos = []

function openChat(recipient){
  switchScreen(chatAppScreens,chatScreen)
  switchScreen(conversations,recipient)
}






//what to do when the client joins a game. info is an array that contains the host's peer id and the username typed in by the user.
socket.on('join',info => {
  let hostId = info[0]
  let user = info[1]
  //connect to the host of the game
  const conn = peer.connect(hostId)
  //when a connection is made between the client and game host
  conn.on('open', () => {
    console.log("connection established")
    entryForm.style.display = "none";
    //This is just a placeholder for now, but it would be similar to the host code, figuring out how to use the data it is sent.
    conn.on('data',(data)=>{
      //The switch statement figures out how to use the data sent based on what kind of data is specified at index 0 of the data array
      switch(data[0]){
        case 'playerinfo':
          me = data[1]
          welcome.innerHTML = `Welcome ${me.name}! See your name on the screen?`
          if (me['playerNumber'] == 1){
            const startGame = document.getElementById('start-game');
            startGame.style.display = "block";            
            startGame.onclick = () => {
              console.log('game started');
              conn.send(['start'])
            }
          }
          break;
        case 'start':
          //when the game is started, make the client page look right
          nameDisplay.innerText = me['name'];
          nameDisplay.style.display = "block";
          container.style.justifyContent = 'start';
          logo.style.backgroundPositionX = '5%';
          logo.style.height = '50px';
          logo.style.marginTop = '10px';
          container.style.height = '70px';
          const watingRoom = document.getElementById('waiting-room');
          watingRoom.style.display = "none";
          if(me['playerNumber']==1){
            console.log('asking for roles')
            conn.send(['roles'])
          }
          //create containers for all other players
          const playerContainers = document.getElementById('player-containers');
          for(var player in data[1]){
            if(player != me['name']){
              playerNames.push(player)
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
              playerName.innerText = data[1][player]['name']
              if (data[1][player]['cape']){
                  cape.classList.add('cape');
              }
              if (data[1][player]['mask']){
                  mask.classList.add('mask');
              }
              if (data[1][player]['stache']){
                  stache.classList.add('mustache');
              }
              playerContainer.appendChild(guyBase);
              playerContainer.appendChild(playerName);
              playerContainers.appendChild(playerContainer)

              //chat app code
              let newContact = document.createElement('div');
              newContact.classList.add('contact');
              let currentPlayer = player
              newContact.setAttribute('id',`${currentPlayer}-contact`);
              newContact.innerHTML = `<p>${currentPlayer}</p>`
              let newConvo = document.createElement('div');
              newConvo.classList.add('conversation');
              newContact.onclick = ()=>{
                if(newContact.classList.contains('new-messages')){
                  newContact.classList.remove('new-messages');
                }
                openChat(newConvo)
              }
              let chatBack = document.createElement('div');
              chatBack.classList.add('back');
              chatBack.innerText = currentPlayer;
              chatBack.onclick = ()=>{
                if(newContact.classList.contains('new-messages')){
                  newContact.classList.remove('new-messages');
                }
                switchScreen(chatAppScreens,contacts)
              }
              //create the chat elements with all other players
              let messageArea = document.createElement('div');
              messageArea.classList.add('message-area');
              newConvo.appendChild(chatBack);
              newConvo.appendChild(messageArea);
              let typing = document.createElement('div');
              typing.classList.add('typing');
              let messageInput = document.createElement('input');
              messageInput.type = "text";
              messageInput.classList.add('message-input')
              messageInput.placeholder = "Type your message...";
              let sendButton = document.createElement('button');
              sendButton.classList.add('send');
              sendButton.innerText = "send";
              sendButton.onclick = ()=>{
                let message = document.createElement('div');
                message.classList.add('message');
                message.classList.add('from-me');
                message.innerText = messageInput.value;
                let messageInfo = {
                  'from':me['name'],
                  'to':currentPlayer,
                  'message':messageInput.value
                }
                messageInput.value = "";
                messageArea.insertBefore(message,messageArea.firstChild);
                conn.send(['sendingMessage',messageInfo])
              }
              messageArea.setAttribute('id',`${player}-messages`)
              typing.appendChild(messageInput);
              typing.appendChild(sendButton);
              newConvo.appendChild(typing)
              contactsList.appendChild(newContact);
              chatScreen.appendChild(newConvo);
              conversations.push(newConvo);
            }
          };
          break;
        case 'role':
          //figure out what to do with my assigned role
          me['role'] = data[1];
          logo.style.backgroundImage = `url('${me['role']['logo']}`
          container.style.backgroundColor = me['role']['color']
          gameSpace.style.display = 'flex';
          const roleName = document.getElementById('role-name');
          roleName.innerText = `You are ${me['role']['article']+me['role']['name']}`
          homeButton.style.backgroundColor = me['role']['color'];
          if(me['role']['alignment'] == 'evil'){
            //make a few changes if my role is evil.
            chatIcon.style.backgroundImage = "url('images/VillianComm.svg')";
            chatTitle.innerText = 'VillianComm'
            chatTitle.style.backgroundColor = "#000000"
          }
          break;
        case 'newMessage':
          //what to do when I recieve a new message
          console.log(data)
          if(data[1]['to'] == me['name']){
            messageContact = document.getElementById(`${data[1]['from']}-contact`)
            messageConversation = document.getElementById(`${data[1]['from']}-messages`);
            newMessage = document.createElement('div');
            //the new-messages class makes it a light salmon color to indicate it is unread.
            messageContact.classList.add('new-messages')
            newMessage.classList.add('message');
            newMessage.innerText=data[1]['message'];
            messageConversation.insertBefore(newMessage,messageConversation.firstChild)
          }
          break;
        default:
          //nada means 'nothing' in spanish. It also means 'it swims.'
          //Que hace un pez? Nada!
          console.log('nada');
          break;
      }
    });
    //This sends the name the user typed in to the host.
    conn.send(['username',user])
  })
})
//When a game code is invalid, it doesn't crash because of these 3 lines!
socket.on('codeinvalid',gameId =>{
  invaildCode.innerHTML = `INVALID CODE: ${gameId}`
})