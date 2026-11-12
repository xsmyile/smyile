export type Rgb = readonly [number, number, number]

const HEX_COLOR = /^#([0-9a-f]{6})$/i

/** Reads a `#rrggbb` CSS custom property from the document root as 0..1 channels. */
export function readCssColor(property: string): Rgb {
	const value = getComputedStyle(document.documentElement).getPropertyValue(property).trim()
	const match = HEX_COLOR.exec(value)
	if (!match) {
		throw new Error(`CSS color ${property} is "${value}", expected #rrggbb: check styles.css`)
	}
	const n = Number.parseInt(match[1], 16)
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
