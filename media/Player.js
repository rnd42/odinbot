// -- VOICE PLAYER AND SHIT, GOOD FOR PLAYING AND OTHER JUNK --
//--====================================================================--

// Imports:
var cheerio = require("cheerio"),
	request = require("request"),
	utils = require("../utils"),
	media = require("."),
	youtube_dl = require("youtube-dl");

class Player {
	
	constructor() {
		this.defaultVolume = 0.5;
		this.playVolume = this.defaultVolume;
		this.playlist = [];
		this.isPlaying = false;
		this.targetChannel = null;
		
		// Variables for voice connection
		this.voiceConnection = null;
		this.voiceStream = null;
	}

	// Initializes the bot and sets the channel to send shit to
	initialize(guild, connection) {
		this.targetChannel = guild.defaultChannel;
		this.voiceConnection = connection;
		this.voiceConnection.on(
			"error",
			utils.getErrorCallback("mediaPlayer.initialize.onError: ")
		);
		
		console.log("**YOUTUBE PLAYER INITIALIZED**");
	}
	
	// PLAYS THE APPROPRIATE PLAYLIST TRACK --
	playlistPlay() {
		var par = this;

		console.log("PlaylistPlay() " + this.playlist[0].url);
		youtube_dl.getInfo(
			this.playlist[0].url,
			["-q", "--no-warnings", "--force-ipv4"],
			function mediaPlayerPlaylistGetInfo(err, info) {
				par.voiceStream = par.voiceConnection.playStream(request(info.url), {seek: 0, volume: par.playVolume});
				par.targetChannel.sendMessage("Now playing: **" + info.title + "**.");
				this.voiceStream.on(
					"end",
					function mediaPlayerPlaylistVoiceStreamOnEnd() {
						par.playlist.shift();
						
						if (par.playlist.length > 0){
							par.playlistPlay();
						} else {
							par.targetChannel.sendMessage("The playlist has ended.");
							par.isPlaying = false;
						}
					}
				);
			}
		);
	}
	
	// SKIPS A TRACK IN THE PLAYLIST --
	skipTrack() {
		if (this.playlist.length > 1) {
			this.targetChannel.sendMessage("Playing next video.");
		} else {
			this.voiceStream.end();
		}
	}

const youTubeURL = /^(((https?:\/\/)?(www\.)?(youtube\.com|youtu\.be))?\/watch\?v=)?([-a-zA-Z0-9_]{11})$/;

	// ADD A TRACK TO THE PLAYLIST --
	addTrack(URL, channel) {
		var par = this,
			youTubeMatch = URL.match(youtubeURL);

		this.targetChannel = channel;

		if (youTubeMatch === null) {
			// TODO: pass message into this function!
			message.reply("I don't recognize that video, try copying and pasting the URL/id again");
		} else {
			URL = "https://www.youtube.com/watch?v=" + youtubeURLMatch[6];
		}
		
		request(
			URL,
			function (error, response, body) {
				var title = "";
				if (!error && response.statusCode == 200) {
					var $ = cheerio.load(body),
						title = $("title").text().replace(" - YouTube","");

					console.log(title + " Added to the playlist.");
				}
				
				if (par.playlist.length > 0) {
					par.targetChannel.sendMessage("Added video **" + title + "**.");
				}
				
				par.playlist.push({url: URL, title: title});
				
				console.log("Playing " + title);
				
				if (!par.isPlaying) {
					par.playlistPlay();
					par.isPlaying = true;
				}
			}
		)
	}
	
	// RECEIVE A LIST OF ALL THE TRACKS
	getTrackList() {
		var TL = "";
		
		for (var l = 0; l < this.playlist.length; l++) {
			TL += "`" + l.toString() + "` " + this.playlist[l].title + "\n";
		}
		return TL;
	}
}

module.exports = Player;