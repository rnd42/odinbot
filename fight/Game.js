// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==
// -- D I S C O R D   B A T T L E   S I M U L A T O R --
// Coded by Zedek the Plague Doctor, simple turn-based "battle" simulator
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

// Imports:
const actions = {
		"ATTACK": "Attacking",
		"DODGE": "Dodging",
		"NONE": "",
		"SEARCH": "Searching",
	},
	defaultOptions = require("./options.json"),
	emojis = {
		"ATTACK": "falconpunch",	 // -- SHOWN WHEN WE ATTACK
		"DODGE": "IDKFA",	 // -- SHOWN WHEN WE DODGE
		"SEARCH": "pack",	 // -- SHOWN WHEN WE SEARCH
		"GIBBED": "gibs",	 // -- WE'RE DEAD AND WE'RE GIBBED
		"DEAD": "IDEAD",	 // -- DEAD BUT NOT GIBBED
		"BANNERLEFT": "imp",	 // -- LEFT SIDE OF THE BANNER
		"BANNERRIGHT": "deadzimba",	 // -- RIGHT SIDE OF THE BANNER
		"PACKICON": "pack",	 // -- THE BACKPACKS WE GIVE OUT
		"TURNM": "skullfucker",	 // -- MONSTER IS THINKING
		"TURNP": "marine",	 // -- PLAYER IS THINKING
		"ALLDIED": "gibs",	 // -- BLOODY THING WHEN EVERYONE DIES
	},
	fight = require("."),
	items = fight.items,
	monsters = fight.monsters,
	odin = require("../odin"),
	states = {
		"NOTHING": -1,	// -- NOT EVEN FIGHTING
		"WAITING": 0,	// -- IN THE LOBBY, WAITING
		"BACKPACKS": 1,	// -- GIVING PLAYERS THEIR BACKPACKS
		"SPAWNING": 2,	// -- SPAWNING A MONSTER
		"PLAYERTURN": 3,	// -- TIME FOR THE PLAYERS TO TAKE TURNS
		"MONSTERTURN": 4,	// -- MONSTERS TAKE THEIR TURNS
	},
	sounds = {
		"CUBESPAWN": "DSBOSPIT.wav",	 // -- SOUND THAT PLAYS WHEN A CUBE IS SPAWNED
		"BACKPACKS": "DSWPNUP.wav",	 // -- PLAYED WHEN PEOPLE GET THEIR WEAPONS
	},
	utils = require("../utils"),
	weapons = fight.weapons;

class Game {

	constructor(overrides) {
		overrides = overrides || {};
		this.backpackCounter = 0;
		this.channel = null;	
		this.currentMonster = -1;
		this.enemy = null;
		this.enemyName = null;
		this.guild = null;
		this.lobbyMessage = null;

		// Make an Object with defaultOptions as the prototype so that unset
		// options have a default value:
		this.options = Object.create(defaultOptions);

		// Override any specified options:
		Object.keys(overrides).forEach(
			function fightConstructorOptionsCloner(key) {
				if (key in defaultOptions) {
					this.options[key] = overrides[key];
				}
			}
		);

		this.players = {};
		this.startMessage = "";
		this.state = this.getState("NOTHING");
		this.statusContent = "";
		this.statusMessage = null;
		this.statusPic = null;
	}

	getActionString(name) {
		return actions[name.toUpperCase()];
	}

	getEmoji(name) {
		return VGPEmoji(emojis[name.toUpperCase()]);
	}
	
	getOption(key) {
		return this.options[key.toUpperCase()];
	}

	getSound(name) {
		return sounds[name.toUpperCase()];
	}

	getState(name) {
		return states[name.toUpperCase()];
	}
	
	joinGame(message) {
		if (message.author.username in this.players) {
			message.reply("You can only join once!");
		} else {
			this.players[message.author.username] = {
				user: message.author,
				health: 100,
				ready: false,
				weapon: -1,
				action: "",
				dead: false
			};
			this.lobbyMessage.edit(
				this.startMessage
				+ "\n\n**"
				+ message.author.username
				+ "** has joined the battle! Use *!ready* to be ready.\n\n"
				+ this.printLobby(true)
			);
			message.delete();
		}
	}
	
	// -- START THE BATTLE IF WE'RE READY --
	startIfReady() {
		if (this.players.find(function(player) { return !player.ready})) {
			return
		}
		this.giveBackpacks();
	}

	// Is this user in the lobby?
	inLobby(user) {
		return user.username in this.players;
	}

	endGame() {
		this.state = this.getState("NOTHING");
	}

	// This user becomes ready
	becomeReady(user) {
		var par = this;

		this.players[user.username].ready = true;
		
		this.lobbyMessage.edit(
			this.startMessage
			+ "\n\n:white_check_mark: **"
			+ user.username
			+ "** is ready to go!\n\n"
			+ this.printLobby(true)
		).then(
			function() {
				par.startIfReady();
			},
			utils.getErrorCallback("odin.fight.game.becomeReady.lobbbyMessage.edit.error");
		);
	}

	setAction(mess, act) {
		var par = this;

		if (this.state != this.getState("PLAYERTURN")) {
			return
		}
		
		this.findPlayer(mess.author).action = this.getActionString(act); 
		mess.delete();

		var slacker = this.players.find(
				function findUnreadyPlayer(player) {
					return player.action === "" && player.health > 0;
				}
			);

		if (slacker) {
			this.statusMessage.edit(this.statusContent + this.printLobby(false));
			return
		}
		this.doAttack();
	}

	// Find the battle player that corresponds to this user
	findPlayer(user) {
		return this.players[user.username];
	}

	// -- PRINT THE LOBBY INFO, ALL PLAYERS AND SUCH --
	printLobby(includeTitle) {
		var message = includeTitle && "**Players in lobby:**\n" || "";

		for (var username in this.players) {
			var emoji = ":x:",
				i = 0,
				player = this.findPlayer(username);
			
			if (player.health <= 0) {
				if (player.health >= -20) {
					emoji = this.getEmoji("DEAD");
				} else {
					emoji = this.getEmoji("GIBBED");
				}
			} else {
				if (player.ready) {
					emoji = ":white_check_mark:";
				}
			}
			
			message += emoji + " `" + ++i + "` " + username + " - *" + player.health + " HP*";
			
			if (this.state == this.getState("PLAYERTURN") && player.action != "") {
				message += "- `" + player.action + "`";
			}
		}
		
		return message + "\n";
	}

	// -- ACTUALLY STARTS A FIGHT --
	startGame(message) {
		this.players = {};
		this.channel = message.channel;
		this.guild = message.channel.guild;
		this.state = this.getState("WAITING");
		
		var DI = this.getEmoji("BANNERLEFT"),
			DZ = this.getEmoji("BANNERRIGHT");
		
		this.startMessage = DI + " " + utils.toRegional(this.options.GAMENAME) + " " + DZ + "\n\n**A GAME HAS STARTED, USE** !play **TO JOIN**\n**USE** !ready **TO BECOME READY AND FIGHT**";
		
		this.channel.sendMessage(this.startMessage + "\n\n" + this.printLobby(true))
			.then(msgd => this.lobbyMessage = msgd);
	}

	giveBackpacks() {
		var par = this;
		this.lobbyMessage.delete()
			.then(
				function() {
					var BP = this.getEmoji(par.options.PACKICON) + " ",
						BPS = BP.repeat(Object.keys(this.players).length);
					par.state == par.options.BS_BACKPACKS;
					BPS += "\n**Giving " + par.options.STR_PACKS + " to all of the players, please wait...**\n\n";
					par.channel.sendMessage(BPS);
					setTimeout(par.backpackFinish(par), par.options.backpackTime*1000);
				},
				utils.getErrorCallback("odin.fight.game.giveBackpacks.lobbyMessage.delete.error")
			);
	}

	backpackFinish() {
		var BS = "";
		
		odin.playSoundClip(this.getSound("BACKPACKS"), 0.5);

		this.players.forEach(
			function odinFightGameBackpackFinishEquipWeapon(username, player) {
				player.weapon = utils.randomItem(weapons);
				BS += this.getEmoji(player.weapon.icon) + " A **" + player.weapon.name + "** was given to **" + username + "**!\n";
			}
		);

		this.channel.sendMessage(BS);
		setTimeout(this.spawnCube(), 1000);
	}
		
	spawnCube() {
		odin.playSoundClip(this.getSound("CUBESPAWN"), 0.5);
		this.state = this.getState("SPAWNING");
		
		var par = this;
		
		this.channel.sendFile(this.options.monsterURL + this.options.spawnImage + ".png")
			.then(
				function() sendMessage{
					par.channel.sendMessage("**A " + par.options.STR_CUBELONG + " appears out of nowhere...**");
					setTimeout(par.spawnMonster), par.options.spawnTime*1000);
				},
				utils.getErrorCallback("odin.fight.game.spawnCube.sendFile.error")
			);
	}

	// -- SPAWN A MONSTER --
	spawnMonster() {
		this.enemyName = utils.randomIndex(monsters);
		this.enemy = Object.create(monsters[this.enemyName]);
		odin.playSoundClip(this.enemy.soundsight[this.randomRange(this.enemy.soundsight.length)] + ".wav", 1.0);
		
		// channel.sendFile(monsterURL + this.enemy.sightsprite+".png").then(picd => firstPlayerTurnPre(picd));
		var par = this;
		par.channel.sendFile(this.options.monsterURL + this.enemy.sightsprite + ".png")
			.then(
				function(thepic) {
					par.statusPic = thepic;
					par.channel.sendMessage("**A " + par.enemyName.toUpperCase() + " APPEARED FROM THE " + par.options.STR_CUBE + "!**\nIt has **" + par.enemy.health + " health**!")
						.then(
							function(msgd){
								par.statusMessage = msgd;
								par.playerTurn.bind(par)(par);
							},
							odin.genericErrorCallback
						);
				},
				utils.getErrorCallback("odin.fight.game.spawnMonster.sendFile.error")
			);
	}

	// -- LET THE PLAYERS TAKE A TURN --
	playerTurn() {
		var isAnyoneAlive = Object.keys(this.players).some(
				function playerTurnFindSomeAlive(player) {
					return player.health > 0;
				}
			);
		
		if (isAnyoneAlive) {
			this.state = this.getState("PLAYERTURN");
			var ME = this.getEmoji("TURNP");
			this.statusContent = this.statusMessage.content + "\n\n" + ME + " *It is now the players' turn to make a move.*\n**Possible actions:** `!attack, !dodge, !search`\n\n";
			this.statusMessage.edit(this.statusContent + this.printLobby(false));
		} else {
			var GB = this.getEmoji("ALLDIED");
			this.channel.sendMessage(GB + " **YOU ALL DIED, THE BATTLE HAS ENDED.** " + GB + "\n\n" + this.printLobby());
			this.endGame();
		}
	}

	monsterTurn() {
		// -- SEE IF THE MONSTER IS DEAD FIRST
		if (this.enemy.health > 0) {
			var ME = this.getEmoji("TURNM");
			this.statusMessage.edit(this.statusMessage.content + "\n\n" + ME + " *It is the monster's turn. " + this.enemyName + " is thinking...*");
			setTimeout(this.monsterAttack(this), this.options.attackEndTime * 1000);
		} else {
			var DS = this.enemy.deathsprite,
				gibbed=false,
				par = this;
			if (this.enemy.health <= this.enemy.gibhealth) {
				gibbed=true;
				DS = this.enemy.gibsprite;
			}
			this.channel.sendFile(this.options.monsterURL + DS + ".png").then(
				function monsterTurnSendFileCallback() {
					var SND = utils.randomItem(par.enemy.sounddeath) + ".wav";

					if (gibbed){
						SND = utils.randomItem(par.enemy.soundgib) + ".wav";
					}
					par.bot.playSoundClip(SND, 1.0);

					Objects.keys(par.players).forEach(
						function clearPlayerAction(username) {
							par.players[username].action = "";
						}
					);
					par.channel.sendMessage("**" + par.enemyName.toUpperCase() + " WAS DEFEATED IN BATTLE, WELL DONE!**\n\n" + par.printLobby());
					par.endGame();
					
				},
				utils.getGenericErrorCallback("battleSimulator.monsterTurn.sendFile.error")
			);
		}
	}

	// THE MONSTER ATTACKS
	monsterAttack()
	{
		var attack = null,
			damage = null,
			image = "",
			message = "**" + this.enemyName + "** ",
			par = this,
			sounds = null,
			victim = null;
		
		if (Math.random() - this.options.idleChance >= 1) {

			// The monster is attacking:
			attack = utils.randomItem(this.enemy.attacks);
			image = attack.sprite;
			victim = utils.randomItem(this.players);
			if (!Math.random() >= 1.0-this.missChance && victim.action == "Dodging") {

				// The monster attacked the victim
				damage = utils.randomRange(attack.min, attack.max);
				message += attack.string + " and did **" + damage + " damage!**";
				sounds = attack.sounds;
				victim.health -= damage;
			} else {

				// The monster missed the victim
				message += "tried to " + attack.string + " however $PLAYER dodged!";
			}
			message = message.replace("$PLAYER", "**" + victim.user.username + "**");
		} else {

			// The monster is idly wandering around.
			image = this.enemy.sprites.idle;
			sounds = this.enemy.sounds.idle;
			message += "decided to roam around and do nothing.";
		}
		
		// Actually send the image
		this.channel.sendFile(this.options.monsterURL + image + ".png").then(
			function monsterAttackSendFileCallback(file) {
				var sound = null;
				par.statusPic = file;
				par.bot.playSoundClip(utils.randomItem(sounds) + ".wav", 1);
				
				// Obituaries
				if (victim && victim.health <= 0 && !victim.dead) {
					victim.dead = true; 
					message += "\n\n**" + victim.user.username + "** was killed in battle!";
					par.bot.playSoundClip(victim.health <= -20 && "DSPDIEHI.wav" || "DSPLDETH.wav", 1.0);
				}
				
				par.channel.sendMessage(message).then(
					function monsterAttackSendMessageCallback(message){
						par.statusMessage = message;
						setTimeout(par.playerTurn(), par.options.attackEndTime * 1000);
					},
					utils.getErrorCallback("odin.fight.game.monsterAttack.sendMessage.error")
				);
			
			},
			utils.getErrorCallback("odin.fight.game.monsterAttack.sendfile.error")
		);
	}

	// -- PLAYER TRIES TO ATTACK
	doAttack() {
		var atString = "",
			attackers = [],
			BP = null,
			dmgAdd = -1,
			emtAtk = this.getEmoji("ATTACK"),
			emtDodge = this.getEmoji("DODGE"),
			message = "",
			par = this,
			searchEmoji = null,
			searchers = [],
			sound = null;

		this.statusMessage.delete();
		
		for (var username in this.players) {
			var player = this.players[username];
			if (player.action == "Attacking") {
				attackers.push(player);
			} else if (player.action == "Searching") {
				searchers.push(player);
			} else if (player.action == "Dodging") {
				message += emtDodge + " **" + username + "** dodges the next attack.\n";
			}
		}
		
		// So now we conveniently know which players are attacking and searching, start with attack users
		for (var index in attackers) {
			var attacker = attackers[index],
				message = attacker.weapon.message.replace("$MONSTER", this.enemy.name),
				damage = this.randomRange(attacker.weapon.damage.min, attacker.weapon.damage.max);
			
			this.enemy.health -= damage;
			message += emtAtk + " **" + attacker.user.username + "** " + message + " and did **" + damage + " damage!**\n";
			sound = attacker.weapon.sound + ".wav";
		}
		
		// Next, we go through the search users
		for (var index in searchers) {
			var foundWeapon = false,
				lowerWep = false,
				searcher = searchers[index];

			searchEmoji = this.getEmoji("Searching");
			if (Math.random() >= 1.0 - this.options.findChance) {
				var weapon = null,
					itemName = "";
				
				// -- WE FOUND SOMETHING, BUT DID WE FIND A WEAPON?
				if (Math.random() >= 1 - this.options.wepChance) {
					itemName = this.randomIndex(weapons);
					weapon = weapons[itemName];
					foundWeapon = true;
					
					searchEmoji = this.getEmoji(weapon.icon);
					message += searchEmoji + " **" + searcher.user.username + "** searched around and ";
					
					// IS THIS WEAPON LOWER THAN THE ONE WE HAVE?
					if (weapon.damage.min + weapon.damage.max < searcher.weapon.damage.min + searcher.weapon.damage.max) {
						lowerWep = true;
					} else {
						searcher.weapon = weapon;
					}
				} else {
					var itemName = this.randomIndex(items),
						item = items[itemName];
					
					searchEmoji = this.getEmoji(item.icon);
					message += searchEmoji + " **" + searcher.user.username + "** searched around and ";
					
					var healing_points = item.health;
					if (!item.special) {
						healing_points = Math.min(100, Math.max(0, 100 - searchers[index].health));
					}

					searchers[index].health += healing_points;
				}
				
				message += "found a `" + itemName + "`!";
				if (!foundWeapon) {
					message += " *+" + item.health + " HP*";
				} else if (lowerWep) {
					message += " They didn't need it though.";
				}
			} else {
				message += searchEmoji + " **" + searcher.user.username + "** searched around and found nothing.";
			}
			message += "\n";
		}
		
		message += "\n\n*" + this.enemy.name + "* has *" + this.enemy.health + " health*.";
		
		if (sound !== null) {
			odin.playSoundClip(sound, 0.5);
		}
		
		this.channel.sendMessage(message).then(
			function odinFightGameDoAttackSendMessageCallback(message) {
				par.statusMessage = message;
				setTimeout(par.monsterTurn(par), par.options.attackEndTime * 1000);
			},
			odin.getErrorCallback("odin.fight.game.doAttack.sendMessage.error")
		);
		
		this.state = this.getState("BS_MONSTERTURN");
	}
}

module.exports = Game;