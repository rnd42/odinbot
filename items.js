// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==
// DATA FILES FOR THE BATTLE SIM, CHANGE THINGS HERE
// MONSTERS, WEAPONS, ETC.
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==

var items = [
	{
		name:"medikit",
		health:25,
		icon:"guts",
		special:false
	},
	
	{
		name:"stimpack",
		health:15,
		icon:"guts",
		special:false
	},
	
	{
		name:"stimpack collection",
		health:45,
		icon:"guts",
		special:false
	},
	
	{
		name:"health bonus",
		health:1,
		icon:"guts",
		special:true
	},
	
	{
		name:"pile of health bonuses",
		health:5,
		icon:"guts",
		special:true
	}
];

module.exports = items;