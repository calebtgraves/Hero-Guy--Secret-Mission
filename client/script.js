//connect to the socket server
const socket = io("ws://localhost:3000");

//set up a peer to peer connection object
let peer = new Peer({
  host: 'localhost',
  port: 9000,
  path: '/myapp'
});
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
const gameSpace = document.getElementById('game-space');

let me = {};
let playerNames = [];
let playersInJail = [];
let playersAtBuildings = [];

joinButton.onclick = () => {
  //tell the server the client is trying to connect to a game, and send the game id and username that was typed in.
  if(username.value){
    socket.emit('join', [gameId.value.toUpperCase(),username.value])
  }
}
//Hero Phone
const home = document.getElementById('home');
const chatApp = document.getElementById('chat-app');
const jail = document.getElementById('jail');
const homeButton = document.getElementById('home-button');
const apps = [home,chatApp];
const actions = document.getElementById('actions');
const buildingSection = document.getElementById('buildings');
const waiting = document.getElementById('waiting');
const vote = document.getElementById('vote');
const finalVotes = document.getElementById('final-votes');
const actionSection = document.getElementById('action-section');
const continueScreen = document.getElementById('continue-screen');
const continueButton = document.getElementById('continue-button');
const widgets = [vote,finalVotes,continueScreen,buildingSection,waiting,actions];
const playersNearby = document.getElementById('players-nearby');
const mainScreens = [actionSection,jail];

//This function handles the switching of the phone screen, whether in an app or from an app to the home screen.
function switchScreen(scope,target){
  scope.forEach((screen)=>{
    screen.style.display = 'none';
  })
  target.style.display = 'flex';
}
//home screen
const chatAppIcon = document.getElementById("chat");
chatAppIcon.onclick = ()=>{
  switchScreen(apps,chatApp);
  checkUnreadMessages();
}
//chat app
const contacts = document.getElementById('contacts');
const chatScreen = document.getElementById('chat-screen');
const contactsList = document.getElementById('contacts-list');
const chatTitle = document.getElementById('chat-title');
const chatAppScreens = [contacts,chatScreen];
let chatNotifications = document.getElementById('chat-notifications');
let conversations = [];
let messageAreas = [];
let unreadMessages = 0;

function openChat(recipient){
  switchScreen(chatAppScreens,chatScreen);
  switchScreen(conversations,recipient);
  switchScreen(messageAreas,recipient.childNodes[1])
}

let currentBuilding = ""

function getCurrentBuilding(){
  return currentBuilding
}

function switchBuilding(building,conn){
  currentBuilding = building;
  conn.send(['changeBuilding',[currentBuilding,me]]);
  switchScreen(widgets,waiting);
}

function checkUnreadMessages(){
  let unreadConvos = [];
  contactsList.childNodes.forEach((child)=>{
    if(child.classList && child.classList.contains('new-messages')){
      chatAppIcon.classList.add('chat-notification');
      if(child.innerText){
        unreadConvos.push(child.innerText);
      }
    }
  })
  unreadConvos.forEach((convo)=>{
    area = document.getElementById(`${convo}-messages`);
    if(area.style.display == "flex" && chatApp.style.display == "flex" && contacts.style.display != 'flex'){
      contact = document.getElementById(`${convo}-contact`);
      contact.classList.remove('new-messages');
    }
  })
  if(unreadConvos.length == 0 && chatAppIcon.classList.contains('chat-notification')){
    chatAppIcon.classList.remove('chat-notification');
  }
}

function toggleSendButtons(){
  chatAppIcon.classList.toggle('messaging-available');
  Array.from(document.getElementsByClassName('send')).forEach((sendInput)=>{
    sendInput.classList.toggle('disabled-button');
  })
}

homeButton.onclick = ()=>{
  switchScreen(apps,home);
  checkUnreadMessages()
  switchScreen(chatAppScreens,contacts);
}

const labButton = document.getElementById('lab-button');
const manorButton = document.getElementById('manor-button');
const jewelryButton = document.getElementById('jewelry-button');
const techButton = document.getElementById('tech-button');
const newsButton = document.getElementById('news-button');
const funButton = document.getElementById('fun-button');
const groceryButton = document.getElementById('grocery-button');



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
          logo.style.marginTop = '7px';
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
              playerContainer.setAttribute('id',`${player}-container`);
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
              playerName.innerText = data[1][player]['name'];
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
                  // unreadMessages -= 1;
                  checkUnreadMessages();
                }
                openChat(newConvo);
              }
              let chatBack = document.createElement('div');
              chatBack.classList.add('back');
              chatBack.innerText = currentPlayer;
              chatBack.onclick = ()=>{
                if(newContact.classList.contains('new-messages')){
                  newContact.classList.remove('new-messages');
                  // unreadMessages -= 1;
                  checkUnreadMessages()
                }
                messageAreas.forEach((area)=>{
                  area.style.display = 'none';
                })
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
                if(playersInJail.includes(me['name'])){
                  toggleSendButtons()
                }
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
              messageAreas.push(messageArea);
              typing.appendChild(messageInput);
              typing.appendChild(sendButton);
              newConvo.appendChild(typing)
              contactsList.appendChild(newContact);
              chatScreen.appendChild(newConvo);
              conversations.push(newConvo);
              //Set up the ability to vote for people
              let newVote = document.createElement('button');
              newVote.classList.add('player-vote');
              newVote.setAttribute('id',`vote-${currentPlayer}`);
              newVote.innerText = data[1][player]['name'];
              vote.appendChild(newVote);
              newVote.onclick = ()=>{
                conn.send(['sendVote',data[1][currentPlayer]]);
                switchScreen(widgets,waiting);
              }
            }
          };
          let voteNone = document.createElement('button');
          voteNone.classList.add('player-vote');
          voteNone.innerText="No one";
          console.log(voteNone);
          vote.appendChild(voteNone);
              voteNone.onclick = ()=>{
                conn.send(['sendVote','none']);
                switchScreen(widgets,waiting);
              }
          labButton.onclick = ()=>{
            switchBuilding("Laboratory of Bizzare Research",conn);
          }
          manorButton.onclick = ()=>{
            switchBuilding("Mystic Manor",conn);
          }
          jewelryButton.onclick = ()=>{
            switchBuilding("Jewelry Store",conn);
          }
          techButton.onclick = ()=>{
            switchBuilding("Tech Tower",conn);
          }
          newsButton.onclick = ()=>{
            switchBuilding("World News",conn);
          }
          funButton.onclick = ()=>{
            switchBuilding("Abandoned Funhouse",conn);
          }
          groceryButton.onclick = ()=>{
            switchBuilding("Grocery Mart",conn);
          }
          break;
        case 'role':
          //figure out what to do with my assigned role
          me['role'] = data[1];
          nameDisplay.innerHTML += ` - you are ${me['role']['article']} <span class='highlight'>${me['role']['name']}</span>`
          logo.style.backgroundImage = `url('${me['role']['logo']}`
          container.style.backgroundColor = me['role']['color']
          gameSpace.style.display = 'flex';
          homeButton.style.backgroundColor = me['role']['color'];
          if(me['role']['alignment'] == 'evil'){
            //make a few changes if my role is evil.
            chatAppIcon.style.backgroundImage = "url('images/VillianComm.svg')";
            chatTitle.innerText = 'VillianComm';
            chatTitle.style.backgroundColor = "#000000";
          }

          //Populate the actions section
          if(me['role']['actions']){
            me['role']['actions'].forEach((action)=>{
              if(action != 'Capture'){
                const actionButton = document.createElement('button');
                actionButton.innerText = action;
                actionButton.onclick = ()=>{
                  conn.send(['action',[action,me,currentBuilding]]);
                  switchScreen(widgets,waiting);
                }
                actions.appendChild(actionButton);
              }
            })
          }else{
            let actionsTitle = document.getElementById('actions-title');
            actionsTitle.innerText = 'There are no actions that you can perform.'
            const readyButton = document.createElement('button');
            readyButton.innerText = "I'm Ready!"
            readyButton.onclick = ()=>{
              conn.send(['action','none']);
              switchScreen(widgets,waiting);
            }
            actions.appendChild(readyButton);
          }
          conn.send(['playerRole',me])
          break;
        case 'newMessage':
          //what to do when I recieve a new message
          console.log(data)
          if(data[1]['to'] == me['name']){
            messageContact = document.getElementById(`${data[1]['from']}-contact`)
            messageConversation = document.getElementById(`${data[1]['from']}-messages`);
            newMessage = document.createElement('div');
            //the new-messages class makes it a light salmon color to indicate it is unread.
            messageContact.classList.add('new-messages');
            checkUnreadMessages()
            newMessage.classList.add('message');
            newMessage.innerText=data[1]['message'];
            messageConversation.insertBefore(newMessage,messageConversation.firstChild)
          }
          break;
        case 'day':
          if(data[1]){
            if(playersInJail.includes(me['name'])){
              toggleSendButtons();
            }
            switchScreen(widgets,waiting);
            if(me['playerNumber'] == 1){
              conn.send(['nightTimeEvents']);
            }
          }else if(!data[1]){
            playersAtBuildings = [];
            switchScreen(widgets,buildingSection);
          }
          break;
        case 'playerAtBuilding':
          let thisPlayer = data[1][0];
          let building = data[1][1];
          let playerDescription = document.createElement('p');
          if(me['role']['alignment'] == 'good'){
            let accessories = ['cape','mask','stache']
            let accessory = accessories[Math.floor(Math.random() * accessories.length)]
            playerDescription.innerText = `Someone ${thisPlayer[accessory]?"with a ":"without a "}${accessory == "stache"?"mustache":accessory}`;
          }else{
            playerDescription.innerText = thisPlayer['name'];
          }
          if(thisPlayer['name'] != me['name']){
            playersAtBuildings.push([playerDescription,building]);
          }
          break;
        case 'evilPlayer':
          // console.log(me)
          if(me['role']['alignment'] == 'evil' && me['name'] != data[1]){
            evilContainer = document.getElementById(`${data[1]}-container`);
            evilContainer.style.boxShadow = "4px 4px 0px black,inset 0px 0px 8px red";
            console.log(data[1]);
          }
          break;
        case 'doActions':
          console.log(actions.childNodes)
          Array.from(actions.childNodes).forEach((button)=>{
            console.log(button.tagName)
            if(button.tagName == 'BUTTON'){
              console.log(button);
              if(button.innerText.includes('Capture')){
                actions.removeChild(button);
              }
            }
          })
          console.log(data)
          playersNearby.innerText = '';
          playersAtBuildings.forEach((person)=>{
          const peopleSeen = document.getElementById('people-seen');
          peopleSeen.innerText = "You don't see anyone else."
            if(person[1] == currentBuilding){
              peopleSeen.innerText = "You see:"
              playersNearby.appendChild(person[0]);
              if(me['role']['actions']){
                if(me['role']['actions'].includes('Capture')){
                  captureButton = document.createElement('button');
                  console.log(person)
                  captureTitle = 'Capture ' + person[0].innerText
                  captureButton.innerText = captureTitle;
                  captureButton.onclick = ()=>{
                    conn.send(['action',[captureTitle,me,currentBuilding]]);
                    switchScreen(widgets,waiting);
                  }
                  title = document.getElementById('actions-title');
                  if(title.nextSibling){
                    actions.insertBefore(captureButton,title.nextSibling);
                  }else{
                    actions.appendChild(captureButton);
                  }
                }
              }
            }
          });
          const yourBuilding = document.getElementById('your-building');
          yourBuilding.innerHTML = `You are at the <span class="dark-highlight">${currentBuilding}.</span>`;
          switchScreen(widgets,actions);
          break;
        case 'captured':
          playersInJail.push(data[1])
          if (playersInJail.includes(me['name'])) {
            chatAppIcon.classList.add('messaging-available');
            switchScreen(mainScreens,jail);
          }
          break;
        case 'timeToVote':
          playerNames.forEach((playerName)=>{
            thisVoteButton = document.getElementById(`vote-${playerName}`);
            thisVoteButton.style.display = 'inline-block';
            if(playersInJail.includes(playerName)){
              thisVoteButton.style.display = "none";
            }
          })
          switchScreen(widgets,vote);
          break;
        case 'votesIn':
          if(data[1]){
            if(finalVotes.firstChild.tagName == 'P'){
              finalVotes.removeChild(finalVotes.firstChild);
            }
            const guilty = document.getElementById('guilty');
            const notGuilty = document.getElementById('not-guilty');
            let voted = document.createElement('p');
            voted.innerText = `${data[1]} was voted to go to jail! What do you think?`;
            if(data[1] == me['name']){
              guilty.style.display = 'none';
              notGuilty.style.display = 'none';
              voted.innerText = 'You were voted to be put in jail. Can you convince the others of your innocence?';
            }
            guilty.onclick = ()=>{
              conn.send(['guilty',[data[1],true]]);
              switchScreen(widgets,waiting);
            }
            notGuilty.onclick = ()=>{
              conn.send(['guilty',[data[1],false]]);
              switchScreen(widgets,waiting);
            }
            finalVotes.appendChild(voted);
            switchScreen(widgets,finalVotes);
          }
          break;
        case 'finalVotesIn':
          playersInJail.push(data[1]);
          switchScreen(widgets,waiting);
          break;
        case 'playersReady':
          if(me['playerNumber'] == 1){
            conn.send(['nextDay',data[1]]);
          }
          break;
        case 'winningTeam':
          let victory
          if(data[1] == 'good'){
            victory = document.getElementById('good-victory');
          }else{
            victory = document.getElementById('evil-victory')
          }
          document.getElementById('total').style.display = 'none';
          victory.style.display = 'flex';
          break;
        case 'continue':
          if (playersInJail.includes(me['name'])) {
            chatAppIcon.classList.add('messaging-available');
            switchScreen(mainScreens,jail);
          }
          continueButton.onclick = ()=>{
            switchScreen(widgets,waiting);
            conn.send(['continue']);
          }
          switchScreen(widgets,continueScreen)
          break;
        default:
          conn.send(data)
          break;
      }
    });
    //This sends the name the user typed in to the host.
    conn.send(['username',user])
  })
})
//When a game code is invalid, it doesn't crash because of these 3 lines!
socket.on('codeinvalid',gameCode =>{
  invaildCode.innerHTML = `INVALID CODE: ${gameCode}`
  gameId.value = "";
})