// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==
// DATA FILES FOR THE BATTLE SIM, CHANGE THINGS HERE
// MONSTERS, WEAPONS, ETC.
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

var weapons = [
	{
		name:"Fist",
		damageMin:2,
		damageMax:20,
		message:"punched MONSTER",
		icon:"falconpunch",
		sound:"DSPUNCH"
	},
	
	{
		name:"Pistol",
		damageMin:5,
		damageMax:15,
		message:"shot MONSTER with a pistol",
		icon:"pistol",
		sound:"DSPISTOL"
	},
	
	{
		name:"Shotgun",
		damageMin:35,
		damageMax:105,
		message:"shot MONSTER with a shotgun",
		icon:"boomstick",
		sound:"DSSHOTGN"
	},
	
	{
		name:"Super Shotgun",
		damageMin:100,
		damageMax:300,
		message:"shot MONSTER with an SSG",
		icon:"ssg",
		sound:"DSDSHTGN"
	},
	
	{
		name:"Chaingun",
		damageMin:25,
		damageMax:75,
		message:"fired off chaingun rounds at MONSTER",
		icon:"chaingun",
		sound:"DSPISTOL"
	},
	
	{
		name:"Chainsaw",
		damageMin:100,
		damageMax:150,
		message:"stuck a chainsaw in MONSTER",
		icon:"thegreatcommunicator",
		sound:"DSSAWHIT"
	},
	
	{
		name:"Rocket Launcher",
		damageMin:148,
		damageMax:288,
		message:"fired a rocket at MONSTER",
		icon:"rocketlauncher",
		sound:"DSRLAUNC"
	},
	
	{
		name:"Plasma Rifle",
		damageMin:240,
		damageMax:280,
		message:"fired some plasma at MONSTER",
		icon:"plasmagun",
		sound:"DSPLASMA"
	},
	
	{
		name:"Unmaker",
		damageMin:400,
		damageMax:450,
		message:"shot MONSTER with an Unmaker",
		icon:"unmaker",
		sound:"DSUNMAKE"
	},
	
	{
		name:"BFG 9000",
		damageMin:600,
		damageMax:800,
		message:"fired a BFG 9000 at MONSTER",
		icon:"bfg",
		sound:"DSBFG"
	}
];

module.exports = weapons;