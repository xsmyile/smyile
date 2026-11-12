export type Rgb = readonly [number, number, number]

const BAYER_BITS = 3
const BAYER_SIZE = 1 << BAYER_BITS
const BAYER_MASK = BAYER_SIZE - 1
const BAYER_LEVELS = BAYER_SIZE * BAYER_SIZE
const OPAQUE = 255
const HEX_COLOR = /^#([0-9a-f]{6})$/i

const BAYER = (() => {
	const matrix = new Float32Array(BAYER_LEVELS)
	for (let y = 0; y < BAYER_SIZE; y++) {
		for (let x = 0; x < BAYER_SIZE; x++) {
			let v = 0
			for (let bit = 0; bit < BAYER_BITS; bit++) {
				v = (v << 2) | ((((x ^ y) >> bit) & 1) << 1) | ((y >> bit) & 1)
			}
			matrix[y * BAYER_SIZE + x] = (v + 0.5) / BAYER_LEVELS
		}
	}
	return matrix
})()

/** Ordered-dither threshold in (0, 1) for the cell at (x, y). */
export function bayerThreshold(x: number, y: number): number {
	return BAYER[(y & BAYER_MASK) * BAYER_SIZE + (x & BAYER_MASK)]
}

/** Writes one RGBA pixel: the ink color, fully opaque when on, transparent when off. */
export function writePixel(pixels: Uint8ClampedArray, index: number, ink: Rgb, on: boolean) {
	const o = index * 4
	pixels[o] = ink[0]
	pixels[o + 1] = ink[1]
	pixels[o + 2] = ink[2]
	pixels[o + 3] = on ? OPAQUE : 0
}

/** Reads a `#rrggbb` CSS custom property from the document root. */
export function readCssColor(property: string): Rgb {
	const value = getComputedStyle(document.documentElement).getPropertyValue(property).trim()
	const match = HEX_COLOR.exec(value)
	if (!match) {
		throw new Error(`CSS color ${property} is "${value}", expected #rrggbb: check styles.css`)
	}
	const n = Number.parseInt(match[1], 16)
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
