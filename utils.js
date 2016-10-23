const errors = require("errors"),
	fs = require("fs"),
	path = require("path");

function getEmojiFactory(theguild) {
	var emoji_cache = {};
	return function emojiFactory(name) {
		emoji = emoji_cache[name]
	    if (emoji === undefined) {
	    	emoji = theguild.emojis.find("name", name);
	    	emoji_cache[name] = emoji;
	    }
	    return emoji;
	}
}

function getErrorCallback(name) {
	return function NamedErrorCallback() {
		console.log(name + "(" + arguments + ")");
	}
}

function randomIndex(items) {
	switch(typeof(items)) {
		case "array":
			return randRange(0, items.length);
			break;
		case "object":
			return randomItem(Object.keys(items));
			break;
		default:
			throw errors.typeError("randomIndex only accepts arrays and objects.");
			break;
	}
	
}

function randomItem(items) {
	if (typeof(items) in ["array", "object"]) {
		return items[randomIndex(items)];
	}
	throw errors.typeError("randomItem only accepts arrays and objects.");
}

function randomRange(min, max) {
	// If only one argument is provided then use it as max and default min to 0.
	if (max === undefined) {
		max = min;
		min = 0;
	}
	return min + Math.floor(Math.random() * (max - min));
}

function requireDir(directory, relativeTo) {
	relativeTo = relativeTo || __dirname;
	var result = {};

	directory = path.resolve(relativeTo || __dirname, directory);
	fs.readdir(
		directory,
		function requireDirReadDir(err, files) {
			if (err) {
				throw err;
			}
			files.forEach(
				function requireDirForEachFile(name) {
					match = name.match(/\.(js|json)$/
					if (match === null) {
						return
					}
					result[match[1]] = require(path.join(directory, name));
				}
			);
		}
	);
	return result;  // returned immediately, populated asyncronusly...
}

// Will empty the provided array but this is often not a problem for example
// when you do something like myArray = shuffle(myArray) you're replacing the
// original in place anyways...  This is only unsafe if some other variable is
// also holding the source array or if you are assigning the result to a
// different variable...  In those cases use safeShuffle...
function shuffle(in_) {
    var out = [];
    while (in_.length > 0) {
        out.push(in_.splice(randomIndex(in_), 1)[0]);
    }
    return out;
}

function safeShuffle(in_) {
    return shuffle(in_.slice(0));
}

function toRegional(text) {
	return text.replace(/[a-zA-Z]/g, ":regional_indicator_$&:");
}

module.exports.getEmojiFactory = getEmojiFactory;
module.exports.getErrorCallback = getErrorCallback;
module.exports.randomIndex = randomIndex;
module.exports.randomItem = randomItem;
module.exports.randRange = randomRange;
module.exports.requireDir = requireDir;
module.exports.shuffle = shuffle;
module.exports.safeShuffle = safeShuffle;
module.exports.toRegional = toRegional;
