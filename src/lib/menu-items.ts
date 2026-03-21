export type MenuItem = {
	label: string
	badge?: "new"
	action: MenuAction
}

export type MenuAction =
	| { type: "link"; url: string }
	| { type: "route"; path: string }

export const MENU_ITEMS: MenuItem[] = [
	{
		label: "FIND GAME",
		action: { type: "link", url: "https://github.com/davidetacchini" },
	},
	{
		label: "ABOUT",
		action: { type: "route", path: "/about" },
	},
	{
		label: "OVERBOT",
		action: { type: "link", url: "https://overbot.net" },
	},
	{
		label: "MIZU",
		badge: "new",
		action: { type: "link", url: "https://mizu.davidet.com" },
	},
	{
		label: "BARRACKS",
		action: { type: "route", path: "/barracks" },
	},
	{
		label: "CHANGELOG",
		action: { type: "route", path: "/changelog" },
	},
]

export const STEAM_PROFILE_URL = "https://steamcommunity.com/id/Smyile/"

export const SITE_VERSION = "0.3.0"
