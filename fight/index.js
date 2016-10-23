const utils = require("../utils"),
	Game = require("./Game"),
	items = utils.requireDir("items", __dirname),
	monsters = utils.requireDir("monsters", __dirname),
	options = require("./options"),
	weapons = utils.requireDir("weapons", __dirname);

module.exports.Game = Game;
module.exports.items = items;
module.exports.monsters = monsters;
module.exports.options = options;
module.exports.weapons = weapons;
