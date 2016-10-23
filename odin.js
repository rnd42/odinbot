//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==
// -- ODIN THE OVERSEER
// Coded by Zedek the Plague Doctor specifically for VGP
//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

// Imports:
const discord = require("discord.js"),
	fight = require("./fight"),
	os = require("os"),
	utils = require("./utils"),
	media = require("./media");

// Variables:
var bot = new discord.Client(),
	commands = {
		help: { // HELP COMMAND, PRINTS THE HELP MESSAGE
			description: "Prints this help message.",
			process: function help() {
				message.reply(usage);
			}
		},
		version: { // VERSION COMMAND, PRINTS THE RUNNING VERSION AND HOSTNAME
			description: "Prints the running version of Odin and what system he is on.",
			process: function version() {
				message.reply(version);
			}
		},
		ping: { // PING COMMAND, PRINTS PONG
			description: "Prints a simple pong message back to the user.",
			process: function ping(message) {
				message.reply("pong");
			}
		},
		snd: { // SOUND COMMAND
			arguments: ["<name>"],
			description: "Plays a sound in the sounds folder.",
			process: function snd(message){
				var name = message.content.replace(/!snd\s+(\S+)/, "$1");
				message.reply("Playing **" + name + ".wav** in voice chat");
				playSoundClip(name + ".wav", 1.0);
			}
		},
		yt: { // ADD YOUTUBE VID
			arguments: ["<YouTube URL or video ID>"],
			description: "Plays a youtube video.",
			process: function yt(message) {
				var videoID = message.content.replace(/!yt\s+(\S+)/, "$1");
				mediaPlayer.addTrack(videoID, message.channel);
			}
		},
		skip: { // SKIP VID
			description: "Skips a youtube video.",
			process: function skip() {
				mediaPlayer.skipTrack();
			}
		},
		plist: { // PLAYLIST COMMAND, SHOWS THE PLAYLIST
			description: "Shows the video playlist.",
			process: function plist(message) {
				message.reply("\n**Here is the current video playlist:**\n" + mediaPlayer.getTrackList());
			}
		},
		cuck: { // CUCK COMMAND FOR THE FUN OF IT
			arguments: ["<user>"],
			description: "Cuck another user.",
			process: function cuck(message) {
				var members = message.channel.members.array(),
					username = message.content.toLowerCase().replace(/!cuck\s+@?([^\s]+)/, "$1"),
					user = members.find(
						function odinCuckFindUser(member) {
							return member.username.toLowerCase().indexOf(username) !== -1;
						}
					);
				
				if (user === undefined) {
					message.reply("You cucked nobody.");
				} else {
					message.channel.sendMessage(user.toString() + " has been **CUCKED** by " + message.author.toString() + ".");
				}
			}
		},
		fight: { // STARTS A BASIC FIGHT GAME
			description: "Starts a fight.",
			process: function fight(message) {
				if (fight.battleState === fight.getState("NOTHING")) {
					fight.startGame(message);
				}
			}
		},
		ready: { // SAYS THAT WE'RE READY
			description: "Tells the fight that you're ready.",
			process: function ready(message){
				if (fight.battleState === fight.getState("WAITING")) {
					fight.becomeReady(message.author);
					message.delete();
				} else {
					message.reply("Lobby time is over!");
				}
			}
		},
		attack: { // ATTACK IN A FIGHT GAME
			description: "Attacks in a fight game.",
			process: function attack(message) {
				if (fight.battleState === fight.getState("PLAYERTURN")) {
					fight.setAction(message, "ATTACK");
				} else {
					message.reply("Wait your turn!");
				}
			}
		},
		dodge: { // DODGE IN A FIGHT GAME
			description: "Dodges in a fight game.",
			process: function dodge(message) {
				if (fight.battleState === fight.getState("PLAYERTURN")) {
					fight.setAction(message, "DODGE");
				} else {
					message.reply("Wait your turn!");
				}
			}
		},
		search: { // SEARCH IN A FIGHT GAME
			description: "Searches in a fight game.",
			process: function search(message) {
				if (fight.battleState == fight.getState("BS_PLAYERTURN")) {
					fight.setAction(message, "SEARCH");
				} else {
					message.reply("Wait your turn!");
				}
			}
		},
		play: { // JOINS A FIGHT GAME
			description: "Joins a fight game.",
			process: function play(message) {
				if (fight.battleState == fight.getState("WAITING")) {
					fight.joinGame(message);
				} else {
					message.reply("No battle is accepting players right now.");
				}
			}
		}
	},
	mainGuild = null,
	mediaPlayer = new MediaPlayer(),
	fight = new fight.Game(),
	VGP = null,
	VGPEmoji = module.exports.VGPEmoji = null,
	voiceChannel = null,
	voiceDis = null;

// Constants:
const leaveStrings = [
		"Are you sure you want to quit this great channel, $USER?",
		"Please don't leave $USER, there's more demons to toast!",
		"Let's beat it $USER, this is turning into a bloodbath!",
		"I wouldn't leave if I were you $USER, DOS is much worse.",
		"$USER, you're trying to say you like DOS better than me, right?",
		"Don't leave yet $USER, there's a demon around that corner!",
		"You know $USER, next time you come in here I'm gonna toast ya.",
		"Go ahead and leave $USER, see if I care.",
		"You want to quit, $USER? Then, thou hast lost an eighth!",
		"Don't go now $USER, there's a dimensional shambler waiting at the DOS prompt!",
		"Get outta here and go back to your boring programs, $USER.",
		"If I were your boss $USER, I'd deathmatch ya in a minute!",
		"Ok, $USER. You leave now and you forfeit your body count!",
		"Just leave, $USER. When you come back, I'll be waiting with a bat.",
		"You're lucky I don't smack you for thinking about leaving, $USER."
	],
	mainServer = "Valhalla Game Plays",
	mainVoice = "DOOM BATTLE",
	streamOptions = {
		seek: 0,
		volume: 0.5
	},
	usage = "\n**Here are all of the commands:**\n\n" + Object.keys(commands).map(
		function odinMapUsage(name) {
			return "`!" + [name].concat(commands[name].arguments).join(" ") + "` - " + commands[name].description;
		}
	).join("\n"),
	version = "2.0 running on " + os.hostname(),
	welcomeStrings = [
		"Welcome to VGP, $USER.",
		"Hey, $USER. Welcome to the hell of VGP, don't mess anything up.",
		"Hello hello, $USER. Welcome to VGP.",
		"Welcome to the official VGP discord, $USER."
	];

//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

function joinVoiceChat() {
	var channel = mainGuild.channels.array().find(
			function joinVoiceChatFindChannel(channel) {
				return channel.type === "voice" && channel.name === mainVoice;
			}
		);

	// Be sure to catch the connect error
    channel.join().then(
	    	function odinJoinVoiceChatJoin(connection) {
				global voiceChannel
				voiceChannel = connection; 
				console.log("Connected to voice!");
				voiceChannel.on(
					"error",
					utils.getErrorCallback("odin.joinVoiceChat.join.voiceChannel.onError")
				);
				mediaPlayer.initialize(mainGuild, connection);
			}
		).catch(utils.getErrorCallback("odin.joinVoiceChat.join.error")
	);
}

function playSoundClip(clip, vol) {
	global voiceChannel;

	if (voiceChannel != null) {
		voiceDis = voiceChannel.playFile("./sounds/" + clip, {seek: 0, volume: vol});
		voiceDis.setVolume(vol);
	}
}

//--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

// Tell the bot what to do when a new message is sent:
bot.on(
	"message",
	function odinBotOnMessage(message) {
		message = message.content.toLowerCase();
		
		// Never reply to our own commands
		if (message.author == bot.user || message.channel.guild.name != mainServer) {
			return;
		}

		var command = Object.keys(commands).find(
			function odinBotOnMessageFindCommand(command) {
				return msg.startsWith("!" + command) &&
					command in commands &&
					typeof(commands[command].process) === "function";
			}
		);

		if (typeof(command) === "string") {
			try {
				commands[command].process(message);	
			} catch(err) {
				console.log("odinBotOnMessage: " + err.stack);
				message.reply("Sorry, an error occurred...  Please try again.");
			}
		}
	}
);

// Tell the bot what to do when a new user joins:
bot.on(
	"presenceUpdate",
	function odinBotOnPresenceUpdate(oldUser, newUser) {
		var channel = VGP.defaultChannel,
			members = VGP.members.array(),
			user = members.find(
				function odinBotOnPresenceUpdateFindMember(member) {
					return member.user === newUser;
				}
			);

	    if (channel !== undefined && user !== undefined) {
			if (oldUser.status === "offline" && newUser.status === "online" && oldUser.game == null && newUser.game == null) {
				channel.sendMessage(
					VGPEmoji("imp")
					+ " "
					+ utils.randomItem(welcomeStrings).replace("$USER", "`" + newUser.username + "`")
				);
			} else if (oldUser.status === "online" && newUser.status === "offline" && newUser.game == null) {
				channel.sendMessage(
					VGPEmoji("deadzimba")
					+ " "
					+ utils.randomItem(leaveStrings).replace("$USER", "`" + newUser.username + "`")
				);
			}
	    }
	}
);

// Tell the bot what to do When it is ready:
bot.on(
	"ready",
	function odinBotOnReady() {
		global mainGuild, module, VGP, VGPEmoji;

		VGP = bot.guilds.find("name", "Valhalla Game Plays");
		VGPEmoji = module.exports.VGPEmoji = utils.getEmojiFactory(VGP);
		console.log("BOT IS READY TO GO!");
		mainGuild = bot.guilds.find("name", mainServer);
		console.log("Main guild is " + mainGuild.name + ".");
		joinVoiceChat();
	}
);

// Now that everything is defined let's log in:
bot.login("noirsuccubus@yahoo.com", "homebrew").
	then(utils.getErrorCallback("odin.bot.login.then")).
	catch(utils.getErrorCallback("odin.bot.login.catch"));

module.exports.playSoundClip = playSoundClip;
