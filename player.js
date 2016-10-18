// -- VOICE PLAYER AND SHIT, GOOD FOR PLAYING AND OTHER JUNK --
//--====================================================================--

const YoutubeDL = require('youtube-dl');
const Request = require('request');
const cheerio = require('cheerio');

class ThePlayer {
	
	constructor() 
	{
		this.defaultVolume = 0.5;
		this.playVolume = this.defaultVolume;
		this.playlist = [];
		this.isPlaying = false;
		this.targetChannel = undefined;
		
		// -- Variables for voice connection
		this.voiceConnection = undefined;
		this.voiceStream = undefined;
	}

	// -- Initializes the bot and sets the channel to send shit to
	initialize(guild,connection)
	{
		console.log(this.options);
		this.targetChannel = guild.defaultChannel;
		this.voiceConnection = connection;
		this.voiceConnection.on("error", function (err) {console.log("ERROR WITH STREAM: "+err);});
		
		console.log("**YOUTUBE PLAYER INITIALIZED**");
	}
	
	// -- PLAYS THE APPROPRIATE PLAYLIST TRACK --
	playlistPlay()
	{
		console.log("PlaylistPlay() "+this.playlist[0].url);
		
		YoutubeDL.getInfo(this.playlist[0].url, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
		
		this.voiceStream = this.voiceConnection.playStream( Request(info.url), {seek:0,volume:this.playVolume} );
		this.targetChannel.sendMessage("Now playing: **"+info.title+"**.");
		
		this.voiceStream.on("end",(function(){
			this.playlist.shift();
			
			if (this.playlist.length > 0){this.playlistPlay();}
			else{this.targetChannel.sendMessage("The playlist has ended."); this.isPlaying = false;}
		}).bind(this));
		
		});
	}
	
	// -- SKIPS A TRACK IN THE PLAYLIST --
	skipTrack()
	{
		if (this.playlist.length > 1){this.targetChannel.sendMessage("Playing next video.");}
		this.voiceStream.end();
	}
	
	// -- ADD A TRACK TO THE PLAYLIST --
	addTrack(URL,channel)
	{
		var that = this;
		this.targetChannel = channel;
		
		if (URL.indexOf("://") == -1) {URL = "http://www.youtube.com/watch?v=" + URL;}
		
		Request(URL, function (error, response, body) 
		{
			var tit = "";
			if (!error && response.statusCode == 200) 
			{
				var $ = cheerio.load(body);
				tit = $("title").text();
				console.log("TIT IS "+tit);
				tit = tit.replace(" - YouTube","");
			}
			
			if (that.playlist.length > 0){that.targetChannel.sendMessage("Added video **"+tit+"**.");}
			
			that.playlist.push( {url:URL,title:tit} );
			
			console.log("Playing the actual vid");
			
			if (!that.isPlaying)
			{
				that.playlistPlay();
				that.isPlaying = true;
			}
		})
	}
	
	// -- RECEIVE A LIST OF ALL THE TRACKS
	getTrackList()
	{
		var TL = "";
		
		for (var l=0; l<this.playlist.length; l++){TL += "`"+l.toString()+"` "+this.playlist[l].title+"\n";}
		
		return TL;
	}
}

module.exports = ThePlayer;