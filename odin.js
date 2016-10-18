//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==
// -- ODIN THE OVERSEER
// Coded by Zedek the Plague Doctor specifically for VGP
//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

var Discord = require("discord.js");
var bot = new Discord.Client();
var mainServer = "Valhalla Game Plays";
var mainVoice = "DOOM BATTLE";
var mainGuild = undefined;
var voiceConnect = undefined;
var voiceDis = undefined;
var PlayerFile = require("./required.js");
var thePlayer = new PlayerFile.Player();
var options = thePlayer.options;

const streamOptions = {seek: 0, volume: 0.5};

// First, let's log in
bot.login("noirsuccubus@yahoo.com","homebrew").then(function(token){}).catch(function(err){console.log(err);})

//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==
// -- THINGS FOR VOICE CHAT --

//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==
// -- ALL THE POSSIBLE COMMANDS THAT THE BOT CAN DO --

var commands = [

	// -- PING COMMAND, PRINTS PONG
	{
		display:"!ping",id:"!ping",description:"Prints a simple pong message back to the user.",process:function(message){
			message.reply("pong");
		}
	},
	
	// -- SOUND COMMAND
	{
		display:"!snd",id:"!snd",description:"Plays a sound in the sounds folder.",process:function(message){
			var A = message.content.slice(message.content.indexOf("!snd")+5,message.content.length);
			message.reply("Playing **"+A+".wav** in voice chat");
			playSoundClip(A+".wav",1.0);
		}
	},
	
	// -- ADD YOUTUBE VID
	{
		display:"!yt",id:"!yt",description:"Plays a youtube video.",process:function(message){
			var A = message.content.slice(message.content.indexOf("!yt")+4,message.content.length);
			thePlayer.addTrack(A,message.channel);
		}
	},
	
	// -- SKIP VID
	{
		display:"!skip",id:"!skip",description:"Skips a youtube video.",process:function(message){
			thePlayer.skipTrack();
		}
	},
	
	// -- PLAYLIST COMMAND, SHOWS THE PLAYLIST
	{
		display:"!plist",id:"!plist",description:"Shows the video playlist.",process:function(message){
			message.reply("\n**Here is the current video playlist:**\n"+thePlayer.getTrackList());
		}
	},
	
	// -- CUCK COMMAND FOR THE FUN OF IT
	{
		display:"!cuck X",id:"!cuck",description:"Cuck another user.",process:function(message){
			var msg = message.content.toLowerCase();
			var RS = msg.slice(msg.indexOf("!cuck") + 6,msg.length);
			
			// -- FIND THE USER IN THE CHANNEL WITH THIS NAME
			var CM = message.channel.members.array();
			var USR = undefined;
			for (var l=0; l<CM.length; l++)
			{
				if (CM[l].user.username.toLowerCase().indexOf(RS) != -1) {USR = CM[l].user; break;}
			}
			
			if (USR == undefined){message.reply("You cucked nobody.");}
			else {message.channel.sendMessage(CM[l].toString()+" has been **CUCKED** by "+message.author.toString()+".")}
		}
	},
	
	// -- STARTS A BASIC FIGHT GAME
	{
		display:"!fight",id:"!fight",description:"Starts a fight.",process:function(message){
			if (battleState == BS_NOTHING){startFight(message);}
		}
	},
	
	// -- SAYS THAT WE'RE READY
	{
		display:"!ready",id:"!ready",description:"Tells the fight that you're ready.",process:function(message){
			if (battleState == BS_WAITING){becomeReady(message.author); message.delete();}
			else{message.reply("Lobby time is over!");}
		}
	},
	
	// -- ACTUALLY ATTACKS IN A FIGHT GAME
	{
		display:"!attack",id:"!attack",description:"Attacks in a fight game.",process:function(message){
			if (battleState == BS_PLAYERTURN){setAction(message,ACT_ATTACK);}
			else{message.reply("Wait your turn!");}
		}
	},
	
	// -- ACTUALLY DODGE IN A FIGHT GAME
	{
		display:"!dodge",id:"!dodge",description:"Dodges in a fight game.",process:function(message){
			if (battleState == BS_PLAYERTURN){setAction(message,ACT_DODGE);}
			else{message.reply("Wait your turn!");}
		}
	},
	
	// -- ACTUALLY SEARCH IN A FIGHT GAME
	{
		display:"!search",id:"!search",description:"Searches in a fight game.",process:function(message){
			if (battleState == BS_PLAYERTURN){setAction(message,ACT_SEARCH);}
			else{message.reply("Wait your turn!");}
		}
	},
	
	// -- JOINS A FIGHT GAME
	{
		display:"!play",id:"!play",description:"Joins a fight game.",process:function(message){
			if (battleState == BS_WAITING)
			{
				var inList = false;
				
				for (var l=0; l<battlePlayers.length; l++){if (battlePlayers[l].user == message.author){inList=true;}}
				
				if (!inList)
				{
					var pusher = {user:message.author,health:100,ready:false,weapon:-1,action:ACT_NONE,dead:false}
					battlePlayers.push(pusher);
					lobbyMessage.edit(battleStartMessage+"\n\n**"+message.author.username+"** has joined the battle! Use *!ready* to be ready.\n\n"+printBattleLobby(true));
					message.delete();
				}
				else{message.reply("You can only join once!");}
			}
			else{message.reply("No battle is going right now.");}
		}
	}

];

//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==
//var BSIM = require('./battlesim');
//var battleSim = new BSIM.BattleSimulator();
//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

// -- ALL OF THE DIFFERENT ITEMS AND SUCH WE CAN PUT INTO THE BATTLE
var weapons = require('./weapons');
var monsters = require('./monsters');
var items = require('./items');
var findChance = 0.5;
var wepChance = 0.25;
var idleChance = 0.25;

// -- DIFFERENT EMOTES FOR DIFFERENT THINGS
const EMT_ATTACK = "falconpunch";							// -- SHOWN WHEN WE ATTACK
const EMT_DODGE = "IDKFA";									// -- SHOWN WHEN WE DODGE
const EMT_SEARCH = "pack";									// -- SHOWN WHEN WE SEARCH
const EMT_GIBBED = "gibs";									// -- WE'RE DEAD AND WE'RE GIBBED
const EMT_DEAD = "IDEAD";									// -- DEAD BUT NOT GIBBED
const EMT_BANNERLEFT = "imp";								// -- LEFT SIDE OF THE BANNER
const EMT_BANNERRIGHT = "deadzimba";						// -- RIGHT SIDE OF THE BANNER
const EMT_PACKICON = "pack";								// -- THE BACKPACKS WE GIVE OUT
const EMT_TURNM = "skullfucker";							// -- MONSTER IS THINKING
const EMT_TURNP = "marine";									// -- PLAYER IS THINKING
const EMT_ALLDIED = "gibs";									// -- BLOODY THING WHEN EVERYONE DIES

const GAMENAME = "DOOM BATTLE";								// -- THE ACTUAL NAME OF THE GAME

const STR_CUBE = "CUBE";									// -- WHAT SPAWNS THE MONSTERS
const STR_PACKS = "backpacks";								// -- WHAT ARE GIVEN TO THE PLAYERS
const STR_CUBELONG = "boss cube";							// -- WHAT APPEARS OUT OF NOWHERE

const SND_CUBESPAWN = "DSBOSPIT.wav";						// -- SOUND THAT PLAYS WHEN A CUBE IS SPAWNED
const SND_BACKPACKS = "DSWPNUP.wav"							// -- PLAYED WHEN PEOPLE GET THEIR WEAPONS

// Constants
const BS_NOTHING = -1;										// -- NOT EVEN FIGHTING
const BS_WAITING = 0;										// -- IN THE LOBBY, WAITING
const BS_BACKPACKS = 1;										// -- GIVING PLAYERS THEIR BACKPACKS
const BS_SPAWNING = 2;										// -- SPAWNING A MONSTER
const BS_PLAYERTURN = 3;									// -- TIME FOR THE PLAYERS TO TAKE TURNS
const BS_MONSTERTURN = 4;									// -- MONSTERS TAKE THEIR TURNS

// -- DIFFERENT ACTIONS --
const ACT_NONE = 0;
const ACT_DODGE = 1;
const ACT_ATTACK = 2;
const ACT_SEARCH = 3;
const backpackTime = 3;
const attackEndTime = 3;
const actionStrings = ["","Dodging","Attacking","Searching"];

const spawnTime = 5;																		// How long it takes in seconds to "spawn" a monster...												
const missChance = 0.5;																		// The chance of missing a dodged player, this will be 50%

// -- ALL OF THE MONSTERS THAT CAN SHOW UP --
var monsterURL = "https://dl.dropboxusercontent.com/u/13049328/vgpimages/";					// All images are stored in this folder
var spawnImage = "bosscube";																// The spawn image to use for the cube

var currentMonster = -1;
var currentMonsterHealth = -1;		
var battleChannel = undefined;
// -- ALL OF THE PEOPLE WHO ARE PARTICIPATING --
var battlePlayers = [];
var battleGuild = undefined;
var battleState = BS_NOTHING;
var backpackCounter = 0;

var lobbyMessage = undefined;
var statusMessage = undefined;
var battleStartMessage = "";
var statusContent = "";
var statusPic = undefined;

//====================================================================================

function startIfReady()
{
	var isReady = true;
	for (var l=0; l<battlePlayers.length; l++){if (!battlePlayers[l].ready){isReady=false;}}
	
	if (isReady){giveBackpacks();}
}

// Is this user in the lobby?
function inLobby(user)
{
	for (var l=0; l<battlePlayers.length; l++){if (battlePlayers[l].user == user){return true;}}
	return false;
}

function endFight(){battleState = BS_NOTHING;}

// This user becomes ready
function becomeReady(user)
{
	for (var l=0; l<battlePlayers.length; l++){if (battlePlayers[l].user == user){battlePlayers[l].ready = true; break;}}
	lobbyMessage.edit(battleStartMessage+"\n\n:white_check_mark: **"+user.username+"** is ready to go!\n\n"+printBattleLobby(true)).then(function(){startIfReady();},function(){})
}

function setAction(mess,act)
{
	if (battleState != BS_PLAYERTURN) {return;}
	
	findBattlePlayer(mess.author).action = act; 
	mess.delete(); 
	
	var allActions = true;
	for (var l=0; l<battlePlayers.length; l++){if (battlePlayers[l].action == ACT_NONE && battlePlayers[l].health > 0){allActions=false;}}
	
	if (!allActions){statusMessage.edit(statusContent+printBattleLobby(false));}
	else{doAttack();}
}

// Find the battle player that corresponds to this user
function findBattlePlayer(user)
{
	var BP = -1;
	for (var l=0; l<battlePlayers.length; l++){if (battlePlayers[l].user == user){BP = l; break;}}
	return battlePlayers[BP];
}

// -- PRINT THE LOBBY INFO, ALL PLAYERS AND SUCH --
function printBattleLobby(usetitle)
{
	var BS = "";
	
	if (usetitle){BS += "**Players in lobby:**\n"};
	for (var l=0; l<battlePlayers.length; l++)
	{
		var RB = ":x:";
		
		if (battlePlayers[l].health <= 0)
		{
			if (battlePlayers[l].health >= -20){RB = findEmoji(battleGuild,EMT_DEAD);}
			else{RB = findEmoji(battleGuild,EMT_GIBBED);}
		}
		else{if (battlePlayers[l].ready) {RB = ":white_check_mark:";}}
		
		BS += RB+" `"+l.toString()+"` "+battlePlayers[l].user.username+" - *"+battlePlayers[l].health.toString()+" HP*";
		
		if (battleState == BS_PLAYERTURN && battlePlayers[l].action != ACT_NONE){BS += "- `"+actionStrings[battlePlayers[l].action]+"`";}
		
		BS += "\n"
	}
	
	return BS;
}

// -- ACTUALLY STARTS A FIGHT --
function startFight(message)
{
	battlePlayers.length = 0;
	battlePlayers = [];
	battleChannel = message.channel;
	battleGuild = message.channel.guild;
	battleState = BS_WAITING;
	
	var DI = findEmoji(message.channel.guild,EMT_BANNERLEFT);
	var DZ = findEmoji(message.channel.guild,EMT_BANNERRIGHT);
	
	battleStartMessage = DI+" "+toRegional(GAMENAME)+" "+DZ+"\n\n**A GAME HAS STARTED, USE** !play **TO JOIN**\n**USE** !ready **TO BECOME READY AND FIGHT**";
	
	battleChannel.sendMessage(battleStartMessage+"\n\n"+printBattleLobby(true)).then(msgd => lobbyMessage = msgd)
}

function giveBackpacks()
{
	lobbyMessage.delete().then(function(){
	battleState == BS_BACKPACKS;
	var BPS = "";
	var BE = findEmoji(battleGuild,EMT_PACKICON);
	
	for (var l=0; l<battlePlayers.length; l++){BPS += BE+" ";}
	BPS += "\n**Giving "+STR_PACKS+" to all of the players, please wait...**\n\n";
	
	battleChannel.sendMessage(BPS);
	setTimeout(backpackFinish,backpackTime*1000)},function(){});
}

function backpackFinish()
{
	var BS = "";
	
	playSoundClip(SND_BACKPACKS,0.5);
	
	for (var l=0; l<battlePlayers.length; l++)
	{
		var theWep = randomFrom(weapons.length);
		battlePlayers[l].weapon = theWep;
		
		BS += findEmoji(battleGuild,weapons[theWep].icon)+" A **"+weapons[theWep].name+"** was given to **"+battlePlayers[l].user.username+"**!\n";
	}

	battleChannel.sendMessage(BS);
	setTimeout(spawnCube,1000);
}
	
function spawnCube()
{
	playSoundClip(SND_CUBESPAWN,0.5);
	battleState = BS_SPAWNING;
	battleChannel.sendFile(monsterURL+spawnImage+".png").then(function(){
		battleChannel.sendMessage("**A "+STR_CUBELONG+" appears out of nowhere...**");
		setTimeout(spawnMonster,spawnTime*1000);
	},function(){});
}

// -- SPAWN A MONSTER --
function spawnMonster()
{
	currentMonster = randomFrom(monsters.length);
	currentMonsterHealth = monsters[currentMonster].health;
	playSoundClip(monsters[currentMonster].soundsight[randomFrom(monsters[currentMonster].soundsight.length)]+".wav",1.0);
	
	// battleChannel.sendFile(monsterURL+monsters[currentMonster].sightsprite+".png").then(picd => firstPlayerTurnPre(picd));
	battleChannel.sendFile(monsterURL+monsters[currentMonster].sightsprite+".png").then(function(thepic) {
		statusPic = thepic;
		battleChannel.sendMessage("**A "+monsters[currentMonster].name.toUpperCase()+" APPEARED FROM THE "+STR_CUBE+"!**\nIt has **"+currentMonsterHealth.toString()+" health**!").then(function(msgd){
			statusMessage = msgd;
			playerTurn();
		},function(msgd){});
	},function(thepic){});
}

// -- LET THE PLAYERS TAKE A TURN --
function playerTurn()
{
	var everyoneDead = true;
	for (var l=0; l<battlePlayers.length; l++){battlePlayers[l].dodging=false; battlePlayers[l].action=ACT_NONE; if (battlePlayers[l].health > 0){everyoneDead = false;}}
	
	if (!everyoneDead)
	{
		battleState = BS_PLAYERTURN;
		var ME = findEmoji(battleGuild,EMT_TURNP);
		statusContent = statusMessage.content+"\n\n"+ME+" *It is now the players' turn to make a move.*\n**Possible actions:** `!attack, !dodge, !search`\n\n";
		statusMessage.edit(statusContent+printBattleLobby(false));
	}
	else
	{
		var GB = findEmoji(battleGuild,EMT_ALLDIED);
		battleChannel.sendMessage(GB+" **YOU ALL DIED, THE BATTLE HAS ENDED.** "+GB+"\n\n"+printBattleLobby());
		endFight();
	}
}

function monsterTurn()
{
	// -- SEE IF THE MONSTER IS DEAD FIRST
	if (currentMonsterHealth > 0)
	{
		var ME = findEmoji(battleGuild,EMT_TURNM);
		statusMessage.edit(statusMessage.content+"\n\n"+ME+" *It is the monster's turn. "+monsters[currentMonster].name+" is thinking...*");
		setTimeout(monsterAttack,attackEndTime*1000);
	}
	else
	{
		var gibbed=false;
		var DS = monsters[currentMonster].deathsprite;
		if (currentMonsterHealth <= monsters[currentMonster].gibhealth){gibbed=true; DS = monsters[currentMonster].gibsprite;}
		battleChannel.sendFile(monsterURL+DS+".png").then( function() {
			
			var SND = monsters[currentMonster].sounddeath[randomFrom(monsters[currentMonster].sounddeath.length)]+".wav";
			if (gibbed){SND = monsters[currentMonster].soundgib[randomFrom(monsters[currentMonster].soundgib.length)]+".wav";}
			
			playSoundClip(SND,1.0);
			
			for (var l=0; l<battlePlayers.length; l++){battlePlayers[l].action = ACT_NONE;}
			battleChannel.sendMessage("**"+monsters[currentMonster].name.toUpperCase()+" WAS DEFEATED IN BATTLE, WELL DONE!**\n\n"+printBattleLobby());
			endFight();
			
		},function(){});
	}
}

// THE MONSTER ATTACKS
function monsterAttack()
{
	var img = "";
	var msg = "";
	var dmg = -1;
	var shouldAttack = true;
	var victim = undefined;
	var missed = false;
	var snd = "";
	if (Math.random() >= 1.0-idleChance){shouldAttack=false;}
	
	if (shouldAttack)
	{
		// First, find a random player and target him
		var finalVictims = [];
		for (var l=0; l<battlePlayers.length; l++) {if (battlePlayers[l].health > 0){finalVictims.push(battlePlayers[l])}}
		
		victim = finalVictims[randomFrom(finalVictims.length)];
		
		// Did we miss?
		if (Math.random() >= 1.0-missChance && victim.action == ACT_DODGE){missed=true;}
		
		// Figure out how much damage to use and what kind of attack
		var useMelee = false;
		
		if (!monsters[currentMonster].hasRanged) {useMelee = true;}
		else if (monsters[currentMonster].hasMelee && monsters[currentMonster].hasRanged)
		{
			if (Math.random() >= 0.5){useMelee = false;}
			else{useMelee = true;}
		}
		
		// Now we know which attack we're going to use, find the damage

		if (useMelee){dmg = monsters[currentMonster].meleeMin + Math.floor( Math.random() * (monsters[currentMonster].meleeMax - monsters[currentMonster].meleeMin));}
		else{dmg = monsters[currentMonster].rangedMin + Math.floor( Math.random() * (monsters[currentMonster].rangedMax - monsters[currentMonster].rangedMin));}
		
		// Which image are we going to use?
		if (useMelee){img = monsters[currentMonster].meleesprite; msg = monsters[currentMonster].meleeString; snd=monsters[currentMonster].soundmelee[randomFrom(monsters[currentMonster].soundmelee.length)]+".wav";}
		else{img = monsters[currentMonster].rangedsprite; msg = monsters[currentMonster].rangedString; snd=monsters[currentMonster].soundranged[randomFrom(monsters[currentMonster].soundranged.length)]+".wav";}
		msg = msg.replace("PLAYER","**"+victim.user.username+"**");
		
		// We know the damage and the player, now let's actually damage it
		if (!missed){victim.health -= dmg;}
	}
	else {msg = "decided to roam around and do nothing."; img=monsters[currentMonster].idlesprite;}
	
	// Actually send the image
	battleChannel.sendFile(monsterURL+img+".png").then( function(picd){
		
		statusPic = picd;
		var SM = "**"+monsters[currentMonster].name+"** "+msg;
		var playTheSound = true;
		
		if (shouldAttack)
		{
			if (missed){SM += " but missed because they dodged!";}
			else{SM += " and did **"+dmg.toString()+" damage!**"; playSoundClip(snd,1.0);}
		}
		else { playSoundClip(monsters[currentMonster].soundidle[randomFrom(monsters[currentMonster].soundidle.length)]+".wav",1.0); }
		
		// Obituaries
		SM += "\n"
		
		if (victim != undefined)
		{
			if (victim.health <= 0 && !victim.dead)
			{
				victim.dead = true; 
				SM += "\n**"+victim.user.username+"** was killed in battle!";
				if (victim.health <= -20){snd = "DSPDIEHI.wav";}
				else{snd = "DSPLDETH.wav";}
				playTheSound = true;
			}
		}
		
		if (playTheSound && snd != undefined && snd != ""){playSoundClip(snd,1.0);}
		
		battleChannel.sendMessage(SM).then(function(themess){
			statusMessage = themess;
			setTimeout(playerTurn,attackEndTime*1000);
		},function(themess){});
		
	},function(picd){});
}

// -- PLAYER TRIES TO ATTACK
function doAttack(){statusMessage.delete(); setTimeout(doRealAttack,1000);}

function doRealAttack()
{
	var SM = "";
	var attackUsers = [];
	var searchUsers = [];
	var atString = "";
	var dmgAdd = -1;
	var BP = undefined;
	var snd = "";
	
	var emtAtk = findEmoji(battleGuild,EMT_ATTACK);
	var emtSearch = "";
	var emtDodge = findEmoji(battleGuild,EMT_DODGE);
	
	battleState = BS_MONSTERTURN;
	
	for (var l=0; l<battlePlayers.length; l++)
	{
		if (battlePlayers[l].action == ACT_ATTACK){attackUsers.push(battlePlayers[l]);}
		else if (battlePlayers[l].action == ACT_SEARCH){searchUsers.push(battlePlayers[l]);}
		else if (battlePlayers[l].action == ACT_DODGE)
		{
			SM += emtDodge+" **"+battlePlayers[l].user.username+"** dodges the next attack.\n";
		}
	}
	
	// So now we conveniently know which players are attacking and searching, start with attack users
	for (var l=0; l<attackUsers.length; l++)
	{
		BP = attackUsers[l];
		atString = weapons[BP.weapon].message.replace("MONSTER",monsters[currentMonster].name);
		dmgAdd = randomRange(weapons[BP.weapon].damageMin,weapons[BP.weapon].damageMax);
		currentMonsterHealth -= dmgAdd;
		
		SM += emtAtk+" **"+BP.user.username+"** "+atString+" and did **"+dmgAdd.toString()+" damage!**\n";
		
		snd = weapons[BP.weapon].sound+".wav";
	}
	
	// Next, we go through the search users
	for (var l=0; l<searchUsers.length; l++)
	{
		emtSearch = findEmoji(battleGuild,EMT_SEARCH);
		var foundWep = false;
		var lowerWep = false;
		
		if (Math.random() >= 1.0-findChance) 
		{
			var fName = "";
			
			// -- WE FOUND SOMETHING, BUT DID WE FIND A WEAPON?
			if (Math.random() >= 1.0-wepChance)
			{
				foundWep = true;
				var WN = randomFrom(weapons.length);
				var fWep = weapons[WN];
				fName = fWep.name;
				
				emtSearch = findEmoji(battleGuild,fWep.icon);
				SM += emtSearch+" **"+searchUsers[l].user.username+"** searched around and ";
				
				// IS THIS WEAPON LOWER THAN THE ONE WE HAVE?
				if (WN < searchUsers[l].weapon){lowerWep = true;}
				else{searchUsers[l].weapon = WN;}
			}
			
			else
			{
				var findItem = randomFrom(items.length);
				fName = items[findItem].name;
				
				emtSearch = findEmoji(battleGuild,items[findItem].icon);
				SM += emtSearch+" **"+searchUsers[l].user.username+"** searched around and ";
				
				var HA = items[findItem].health;
				if (searchUsers[l].health+HA > 100){if (!items[findItem].special){HA = 100-searchUsers[l].health; if (HA<0){HA=0;}}}

				searchUsers[l].health += HA;
			}
			
			SM += "found a `"+fName+"`!";
			if (!foundWep){SM += " *+"+items[findItem].health.toString()+" HP*";}
			else
			{
				if (lowerWep){SM += " They didn't need it though."}
			}
		}
		else{SM += emtSearch+" **"+searchUsers[l].user.username+"** searched around and found nothing.";}
		SM += "\n";
	}
	
	SM +="\n\n*"+monsters[currentMonster].name+"* has *"+currentMonsterHealth.toString()+" health*.";
	
	if (snd != ""){playSoundClip(snd,0.5);}
	
	battleChannel.sendMessage(SM).then(function(themess){
		statusMessage = themess;
		setTimeout(monsterTurn,attackEndTime*1000);
	},function(themess){});
}

//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==
// -- VARIOUS STRINGS AND THINGS --

var welcomeStrings = [
	"Welcome to VGP, USER.",
	"Hey, USER. Welcome to the hell of VGP, don't mess anything up.",
	"Hello hello, USER. Welcome to VGP.",
	"Welcome to the official VGP discord, USER."
];

var leaveStrings = [
	"Are you sure you want to quit this great channel, USER?",
	"Please don't leave USER, there's more demons to toast!",
	"Let's beat it USER, this is turning into a bloodbath!",
	"I wouldn't leave if I were you USER, DOS is much worse.",
	"USER, you're trying to say you like DOS better than me, right?",
	"Don't leave yet USER, there's a demon around that corner!",
	"You know USER, next time you come in here I'm gonna toast ya.",
	"Go ahead and leave USER, see if I care.",
	"You want to quit, USER? Then, thou hast lost an eighth!",
	"Don't go now USER, there's a dimensional shambler waiting at the DOS prompt!",
	"Get outta here and go back to your boring programs, USER.",
	"If I were your boss USER, I'd deathmatch ya in a minute!",
	"Ok, USER. You leave now and you forfeit your body count!",
	"Just leave, USER. When you come back, I'll be waiting with a bat.",
	"You're lucky I don't smack you for thinking about leaving, USER."
];

//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

function randomFrom(thelength) {
    return Math.floor(Math.random() * thelength);
}

function findEmoji(theguild, eid) {
    return theguild.emojis.find("name", eid.toString());
}

function playSoundClip(clip, vol) {
	var SO = {seek:0, volume:vol};
    var theC = bot.voiceConnections.first();
	if (theC != undefined) {voiceDis = theC.playFile("./sounds/"+clip, SO); voiceDis.setVolume(vol);};
}

function randomRange(themin,themax){return (themin + Math.floor( Math.random() * (themax - themin)));}

var alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];

function toRegional(tt)
{
	var STR = tt.toLowerCase();
	var cnt = 0;
	var fSTR = "";
	var inAlphabet = false;
	
	while (cnt < STR.length)
	{
		inAlphabet = false;
		for (var l=0; l<alphabet.length; l++)
		{
			if (STR.charAt(cnt) == alphabet[l]) {inAlphabet = true; fSTR += ":regional_indicator_"+alphabet[l]+":"; break;}
		}
		
		if (!inAlphabet) 
		{
			if (STR.charAt(cnt) == " "){fSTR += "    ";}
			else{fSTR += STR.charAt(cnt);}
		}
		cnt ++;
	}
	
	return fSTR;
}

//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

// Bot is ready!
bot.on("ready", function(){
	console.log("BOT IS READY TO GO!");
	mainGuild = bot.guilds.find("name",mainServer);
	console.log("Main guild is "+mainGuild.name+".");
	joinVoiceChat();
})

function joinVoiceChat() {
	var AR = mainGuild.channels.array();
	var VC = undefined;
	
	for (var l=0; l<AR.length; l++)
	{
		if (AR[l].type == "voice" && AR[l].name == mainVoice){VC = AR[l]; break;}
	}

	// Be sure to catch the connect error
    VC.join().then(connection => {
		voiceConnect = connection; 
		console.log("Connected to voice!");
		voiceConnect.on("error",function(error){console.log(error)});
		thePlayer.initialize(mainGuild,connection);
	}).catch(console.log);
}

// -- A NEW USER JOINED
bot.on("presenceUpdate", function (OU, NU) {
	var VGP = bot.guilds.find("name", "Valhalla Game Plays");
    var chn = VGP.defaultChannel;
	var GM = VGP.members.array();
	var inServer = false;
	
	for (var l=0; l<GM.length; l++){if (GM[l].user == NU) {inServer = true; break;}}

    if (chn != undefined && inServer) 
	{
		if (OU.status === "offline" && NU.status === "online" && OU.game == null && NU.game == null) 
		{
			var men = NU.username;
			var IE = findEmoji(VGP,"imp");

			var PN = Math.floor(Math.random() * welcomeStrings.length);
			var S = welcomeStrings[PN].replace("USER", "`"+men+"`");
			
			chn.sendMessage(IE+" "+S);
		}
		
		else if (OU.status === "online" && NU.status === "offline" && NU.game == null) 
		{
			var DE = findEmoji(VGP,"deadzimba");
			var S = leaveStrings[randomFrom(leaveStrings.length)].replace("USER", "`"+NU.username+"`");
			chn.sendMessage(DE+" "+S);
		}
    }
});

bot.on("message",function(message){
	var msg = message.content.toLowerCase();
	
	// Never reply to our own commands
	if (message.author == bot.user) {return;}
	if (message.channel.guild.name != mainServer) {return;}
	
	// GET HELP
	if (msg.indexOf("!help") != -1)
	{
		var HS = "\n**Here are all of the commands:**\n\n";
		
		for (var l=0; l<commands.length; l++){HS += "`"+commands[l].display+"` - *"+commands[l].description+"*\n";}
		
		message.reply(HS);
		
		return;
	}
	
	// Otherwise check the normal commands
	for (var l=0; l<commands.length; l++) { if (msg.indexOf(commands[l].id) != -1) {commands[l].process(message);} }
})