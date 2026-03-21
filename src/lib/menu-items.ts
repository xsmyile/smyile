export type MenuItem = {
	label: string
	badge?: "new" | null
	action: MenuAction
}

export type MenuAction =
	| { type: "link"; url: string }
	| { type: "route"; path: string }
	| { type: "submenu"; items: SubMenuItem[] }

export type SubMenuItem = {
	label: string
	url: string
	icon?: string
}

export const MENU_ITEMS: MenuItem[] = [
	{
		label: "FIND GAME",
		action: {
			type: "submenu",
			items: [
				{ label: "DISCORD", url: "https://discord.gg/" },
				{ label: "GITHUB", url: "https://github.com/Sitido" },
				{ label: "STEAM", url: "https://steamcommunity.com/id/Smyile/" },
			],
		},
	},
	{
		label: "ABOUT",
		action: { type: "route", path: "/" },
	},
	{
		label: "OVERBOT",
		badge: "new",
		action: { type: "link", url: "https://github.com/Sitido" },
	},
	{
		label: "MIZU",
		badge: "new",
		action: { type: "link", url: "https://github.com/Sitido" },
	},
	{
		label: "BARRACKS",
		action: { type: "route", path: "/" },
	},
	{
		label: "INVITE",
		action: { type: "link", url: "https://discord.gg/" },
	},
]

export const STEAM_PROFILE_URL = "https://steamcommunity.com/id/Smyile/"

export const SITE_VERSION = "0.1.0"
