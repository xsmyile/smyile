import {
	ACESFilmicToneMapping,
	BoxGeometry,
	type BufferGeometry,
	Color,
	FogExp2,
	InstancedBufferAttribute,
	InstancedMesh,
	type Material,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	Object3D,
	PerspectiveCamera,
	PMREMGenerator,
	Scene,
	SRGBColorSpace,
	Vector2,
	type WebGLProgramParametersWithUniforms,
	WebGLRenderer,
} from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import type { Rgb } from "./css-color"

/**
 * The backdrop scene: an endless lattice of glass bars (the inside of a tesseract) with clusters
 * of glowing blocks, recycled in chunks as the camera falls through it, rendered through bloom
 * and a lens pass (radial streaks, chromatic aberration, spectral ring, vignette, grain).
 */

type WorldFrame = {
	time: number
	travel: number
	look: { x: number; y: number }
	roll: number
	twist: number
	palette: readonly [Rgb, Rgb]
	fade: number
	streak: number
}

export type TesseractWorld = {
	render: (frame: WorldFrame) => void
	resize: (width: number, height: number) => void
	dispose: () => void
}

const CELL = 2
const HALF_LINES = 5
const CHUNK_CELLS = 8
const CHUNK_DEPTH = CELL * CHUNK_CELLS
const CHUNKS = 3
const START_Z = 1
const RECYCLE_MARGIN = 2
const BEAM_WIDTH = 0.07
const WALL_BEAM_SCALE = 2.4
const CORNER_SHARE = 0.35
const CORNER_BRIGHT_SHARE = 0.32
const PANEL_RINGS = [
	{ half: CELL, perCell: 6 },
	{ half: CELL * 2, perCell: 4 },
] as const
const PANEL_THICKNESS = 0.012
const PANEL_OPACITY = 0.35
const PANEL_SHADE = 0.1
const PANEL_GLOW = 0.025
const PANEL_SEED = 97
const BLOCKS_PER_CHUNK = 1100
const NEAR_WALL = CELL * 2
const NEAR_WALL_SHARE = 0.75
const NODE_BIAS = 0.6
const BRIGHT_SHARE = 0.12
const FOG_DENSITY = 0.055
const BACKGROUND = 0x050505
const FOV = 74
const NEAR = 0.05
const FAR = 70
const MAX_PIXEL_RATIO = 1.25
const SWAY_X = 0.25
const SWAY_Y = 0.2
const LOOK_PITCH = 0.12
const LOOK_YAW = 0.18
const BLOOM_STRENGTH = 0.75
const BLOOM_RADIUS = 0.4
const BLOOM_THRESHOLD = 0.85
const ENV_BLUR = 0.04
const GLASS_SHADE = 0.12
const EXPOSURE = 0.9

type Segment = { x: number; y: number; z: number; axis: 0 | 1 | 2 }

const TWIST_UNIFORM = "uniform float uTwist;"

const TWISTED_NORMAL = /* glsl */ `
vec4 twistProbe = vec4( position, 1.0 );
#ifdef USE_INSTANCING
	twistProbe = instanceMatrix * twistProbe;
#endif
twistProbe = modelMatrix * twistProbe;
float normalTwist = ( twistProbe.z - cameraPosition.z ) * uTwist;
transformedNormal.xy = vec2(
	cos( normalTwist ) * transformedNormal.x - sin( normalTwist ) * transformedNormal.y,
	sin( normalTwist ) * transformedNormal.x + cos( normalTwist ) * transformedNormal.y
);
#include <normal_vertex>
`

function twistedProject(offset: string): string {
	return /* glsl */ `
vec4 twistedWorld = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	twistedWorld = instanceMatrix * twistedWorld;
#endif
twistedWorld = modelMatrix * twistedWorld;
twistedWorld.xyz += ${offset};
float twistAngle = ( twistedWorld.z - cameraPosition.z ) * uTwist;
float twistCos = cos( twistAngle );
float twistSin = sin( twistAngle );
twistedWorld.xy = vec2(
	twistCos * twistedWorld.x - twistSin * twistedWorld.y,
	twistSin * twistedWorld.x + twistCos * twistedWorld.y
);
vec4 mvPosition = viewMatrix * twistedWorld;
gl_Position = projectionMatrix * mvPosition;
`
}

const PANEL_DECLARATIONS =
	"attribute float aSeed;\nattribute vec3 aWallNormal;\nuniform float uTime;"

const PANEL_SHATTER = /* glsl */ `
#include <begin_vertex>
vec4 panelCenter = modelMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
float panelPhase = fract( uTime * 0.12 + aSeed + panelCenter.z * 0.031 );
float shatter = smoothstep( 0.62, 0.74, panelPhase ) * ( 1.0 - smoothstep( 0.8, 0.97, panelPhase ) );
transformed *= 1.0 - shatter * 0.65;
`

const PANEL_OFFSET =
	"aWallNormal * shatter * 0.9 + vec3( sin( aSeed * 41.0 ), cos( aSeed * 37.0 ), sin( aSeed * 23.0 ) ) * shatter * 0.35"

const BLOCK_UNIFORMS = "uniform float uTime;\nuniform vec3 uColorA;\nuniform vec3 uColorB;"

const BLOCK_COLOR = /* glsl */ `
float blockSeed = vColor.r;
float blockLight = vColor.g;
float blockPick = vColor.b;
float sparkle = pow( 0.5 + 0.5 * sin( uTime * 6.0 + blockSeed * 90.0 ), 8.0 );
vec3 blockBase = mix( uColorA, uColorB, step( 0.5, blockPick ) );
diffuseColor.rgb = blockBase * ( blockLight + sparkle * 3.5 );
`

const LENS_SHADER = {
	name: "LensShader",
	uniforms: {
		tDiffuse: { value: null },
		uResolution: { value: new Vector2(1, 1) },
		uTime: { value: 0 },
		uFade: { value: 0 },
		uStreak: { value: 0 },
	},
	vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	`,
	fragmentShader: /* glsl */ `
		uniform sampler2D tDiffuse;
		uniform vec2 uResolution;
		uniform float uTime;
		uniform float uFade;
		uniform float uStreak;
		varying vec2 vUv;

		const int STREAK_SAMPLES = 8;
		const float ABERRATION = 0.014;
		const float RING_RADIUS = 0.44;
		const float RING_WIDTH = 0.07;
		const float RING_STRENGTH = 0.18;
		const float GRAIN = 0.03;
		const float VIGNETTE_FLOOR = 0.1;

		vec3 split( vec2 uv, vec2 shift ) {
			return vec3(
				texture2D( tDiffuse, uv + shift ).r,
				texture2D( tDiffuse, uv ).g,
				texture2D( tDiffuse, uv - shift ).b
			);
		}

		float noise( vec2 p ) {
			return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
		}

		void main() {
			vec2 centered = vUv - 0.5;
			vec2 aspect = vec2( uResolution.x / uResolution.y, 1.0 );
			float radius = length( centered * aspect );
			vec3 color = vec3( 0.0 );
			for ( int i = 0; i < STREAK_SAMPLES; i++ ) {
				float k = float( i ) / float( STREAK_SAMPLES );
				color += split( vUv - centered * uStreak * k, centered * ABERRATION * radius );
			}
			color /= float( STREAK_SAMPLES );

			float offset = ( radius - RING_RADIUS ) / RING_WIDTH;
			vec3 spectrum = 0.5 + 0.5 * cos( 6.2831 * ( offset * 0.35 + vec3( 0.0, 0.33, 0.67 ) ) );
			color += spectrum * exp( -offset * offset ) * RING_STRENGTH * ( 0.8 + 0.2 * sin( uTime * 0.6 ) );

			float vignette = smoothstep( 1.2, 0.3, length( centered * 2.0 ) );
			color *= mix( VIGNETTE_FLOOR, 1.0, vignette ) * uFade;
			color += ( noise( gl_FragCoord.xy + fract( uTime ) * 100.0 ) - 0.5 ) * GRAIN;
			gl_FragColor = vec4( color, 1.0 );
		}
	`,
}

/** Deterministic PRNG so every chunk is built the same on every visit. */
function mulberry32(seed: number): () => number {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

function insideShaft(x: number, y: number): boolean {
	return Math.max(Math.abs(x), Math.abs(y)) < CELL * 0.999
}

function chunkSegments(): Segment[] {
	const segments: Segment[] = []
	const lines = Array.from({ length: HALF_LINES * 2 + 1 }, (_, i) => (i - HALF_LINES) * CELL)
	for (let layer = 0; layer < CHUNK_CELLS; layer++) {
		const z = -layer * CELL
		for (const x of lines) {
			for (const y of lines) {
				if (!insideShaft(x, y)) segments.push({ x, y, z: z - CELL / 2, axis: 2 })
				if (x < HALF_LINES * CELL && !insideShaft(x + CELL / 2, y))
					segments.push({ x: x + CELL / 2, y, z, axis: 0 })
				if (y < HALF_LINES * CELL && !insideShaft(x, y + CELL / 2))
					segments.push({ x, y: y + CELL / 2, z, axis: 1 })
			}
		}
	}
	return segments
}

function injectTwist(
	shader: WebGLProgramParametersWithUniforms,
	twist: { value: number },
	offset = "vec3( 0.0 )",
) {
	shader.uniforms.uTwist = twist
	shader.vertexShader = shader.vertexShader
		.replace("void main() {", `${TWIST_UNIFORM}\nvoid main() {`)
		.replace("#include <normal_vertex>", TWISTED_NORMAL)
		.replace("#include <project_vertex>", twistedProject(offset))
}

function ringOf(s: { x: number; y: number }): number {
	return Math.max(Math.abs(s.x), Math.abs(s.y))
}

function isCorner(s: Segment): boolean {
	const ax = Math.abs(s.x)
	const ay = Math.abs(s.y)
	if (s.axis === 2) return ax === CELL && ay === CELL
	if (s.axis === 0) return ax === CELL / 2 && ay === CELL
	return ay === CELL / 2 && ax === CELL
}

function buildBeams(
	segments: Segment[],
	geometry: BufferGeometry,
	material: Material,
): InstancedMesh {
	const mesh = new InstancedMesh(geometry, material, segments.length)
	const dummy = new Object3D()
	segments.forEach((s, i) => {
		dummy.position.set(s.x, s.y, s.z)
		dummy.rotation.set(s.axis === 1 ? Math.PI / 2 : 0, s.axis === 0 ? Math.PI / 2 : 0, 0)
		const thickness = ringOf(s) <= CELL ? WALL_BEAM_SCALE : 1
		dummy.scale.set(thickness, thickness, 1)
		dummy.updateMatrix()
		mesh.setMatrixAt(i, dummy.matrix)
	})
	mesh.instanceMatrix.needsUpdate = true
	mesh.frustumCulled = false
	return mesh
}

function buildBlocks(
	segments: Segment[],
	geometry: BufferGeometry,
	material: Material,
	seed: number,
): InstancedMesh {
	const random = mulberry32(seed)
	const nearWall = segments.filter((s) => ringOf(s) <= NEAR_WALL)
	const corners = segments.filter(isCorner)
	const mesh = new InstancedMesh(geometry, material, BLOCKS_PER_CHUNK)
	const dummy = new Object3D()
	const color = new Color()
	for (let i = 0; i < BLOCKS_PER_CHUNK; i++) {
		const pick = random()
		const pool = pick < CORNER_SHARE ? corners : pick < NEAR_WALL_SHARE ? nearWall : segments
		const brightShare = pool === corners ? CORNER_BRIGHT_SHARE : BRIGHT_SHARE
		const s = pool[Math.floor(random() * pool.length)]
		const along =
			random() < NODE_BIAS ? (random() < 0.5 ? random() * 0.2 : 0.8 + random() * 0.2) : random()
		const length = 0.05 + random() ** 2 * 0.4
		const width = 0.03 + random() * 0.1
		const height = 0.03 + random() * 0.1
		const side = random() < 0.5 ? -1 : 1
		const lift = side * (BEAM_WIDTH / 2 + height / 2)
		const offset = (along - 0.5) * CELL
		if (s.axis === 2) {
			dummy.position.set(s.x + lift, s.y + (random() - 0.5) * BEAM_WIDTH, s.z + offset)
			dummy.scale.set(height, width, length)
		} else if (s.axis === 0) {
			dummy.position.set(s.x + offset, s.y + lift, s.z + (random() - 0.5) * BEAM_WIDTH)
			dummy.scale.set(length, height, width)
		} else {
			dummy.position.set(s.x + (random() - 0.5) * BEAM_WIDTH, s.y + offset, s.z + lift)
			dummy.scale.set(width, length, height)
		}
		dummy.updateMatrix()
		mesh.setMatrixAt(i, dummy.matrix)
		const light = random() < brightShare ? 1.6 + random() * 2.4 : 0.02 + random() * 0.1
		mesh.setColorAt(i, color.setRGB(random(), light, random()))
	}
	mesh.instanceMatrix.needsUpdate = true
	if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
	mesh.frustumCulled = false
	return mesh
}

/**
 * Glass panels lining the shaft walls and the next ring out. Each carries a seed and its wall's
 * outward normal, which the vertex shader uses to shatter it away from the wall and pull it back.
 */
function buildPanels(material: Material): InstancedMesh {
	const random = mulberry32(PANEL_SEED)
	const dummy = new Object3D()
	const matrices: number[][] = []
	const seeds: number[] = []
	const normals: number[] = []
	const walls = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	] as const
	for (const ring of PANEL_RINGS) {
		for (let layer = 0; layer < CHUNK_CELLS; layer++) {
			const zc = -layer * CELL - CELL / 2
			for (const [nx, ny] of walls) {
				for (let u = -ring.half + CELL / 2; u < ring.half; u += CELL) {
					for (let n = 0; n < ring.perCell; n++) {
						const w = 0.15 + random() * 0.8
						const d = 0.08 + random() * 0.5
						const along = u + (random() - 0.5) * (CELL - w)
						const z = zc + (random() - 0.5) * (CELL - d)
						const depth = (random() - 0.5) * 0.1
						if (nx !== 0) {
							dummy.position.set(nx * ring.half + depth, along, z)
							dummy.scale.set(PANEL_THICKNESS, w, d)
						} else {
							dummy.position.set(along, ny * ring.half + depth, z)
							dummy.scale.set(w, PANEL_THICKNESS, d)
						}
						dummy.updateMatrix()
						matrices.push(dummy.matrix.toArray())
						seeds.push(random())
						normals.push(nx, ny, 0)
					}
				}
			}
		}
	}
	const geometry = new BoxGeometry(1, 1, 1)
	geometry.setAttribute("aSeed", new InstancedBufferAttribute(new Float32Array(seeds), 1))
	geometry.setAttribute("aWallNormal", new InstancedBufferAttribute(new Float32Array(normals), 3))
	const mesh = new InstancedMesh(geometry, material, matrices.length)
	matrices.forEach((m, i) => {
		dummy.matrix.fromArray(m)
		mesh.setMatrixAt(i, dummy.matrix)
	})
	mesh.instanceMatrix.needsUpdate = true
	mesh.frustumCulled = false
	return mesh
}

/** Builds the scene, its post-processing chain and the per-frame update. */
export function createTesseractWorld(canvas: HTMLCanvasElement, beamColor: Rgb): TesseractWorld {
	const renderer = new WebGLRenderer({
		canvas,
		antialias: false,
		powerPreference: "high-performance",
	})
	try {
		return buildWorld(renderer, beamColor)
	} catch (error) {
		renderer.forceContextLoss()
		renderer.dispose()
		throw error
	}
}

function buildWorld(renderer: WebGLRenderer, beamColor: Rgb): TesseractWorld {
	renderer.toneMapping = ACESFilmicToneMapping
	renderer.toneMappingExposure = EXPOSURE
	renderer.outputColorSpace = SRGBColorSpace
	renderer.setClearColor(BACKGROUND, 1)

	const scene = new Scene()
	scene.background = new Color(BACKGROUND)
	scene.fog = new FogExp2(BACKGROUND, FOG_DENSITY)
	const pmrem = new PMREMGenerator(renderer)
	const room = new RoomEnvironment()
	const environment = pmrem.fromScene(room, ENV_BLUR).texture
	room.dispose()
	scene.environment = environment

	const camera = new PerspectiveCamera(FOV, 1, NEAR, FAR)

	const twist = { value: 0 }
	const blockUniforms = {
		uTime: { value: 0 },
		uColorA: { value: new Color() },
		uColorB: { value: new Color() },
	}

	const glass = new MeshPhysicalMaterial({
		color: new Color(beamColor[0], beamColor[1], beamColor[2]).multiplyScalar(GLASS_SHADE),
		metalness: 0,
		roughness: 0.06,
		clearcoat: 1,
		clearcoatRoughness: 0.04,
		iridescence: 0.9,
		iridescenceIOR: 1.5,
		envMapIntensity: 0.16,
		transparent: true,
		opacity: 0.4,
		depthWrite: false,
	})
	glass.onBeforeCompile = (shader) => injectTwist(shader, twist)

	const panelGlass = glass.clone()
	panelGlass.opacity = PANEL_OPACITY
	panelGlass.color.multiplyScalar(PANEL_SHADE / GLASS_SHADE)
	panelGlass.onBeforeCompile = (shader) => {
		injectTwist(shader, twist, PANEL_OFFSET)
		shader.uniforms.uTime = blockUniforms.uTime
		shader.vertexShader = shader.vertexShader
			.replace("void main() {", `${PANEL_DECLARATIONS}\nvoid main() {`)
			.replace("#include <begin_vertex>", PANEL_SHATTER)
	}

	const glow = new MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
	glow.onBeforeCompile = (shader) => {
		injectTwist(shader, twist)
		Object.assign(shader.uniforms, blockUniforms)
		shader.fragmentShader = shader.fragmentShader
			.replace("void main() {", `${BLOCK_UNIFORMS}\nvoid main() {`)
			.replace("#include <color_fragment>", BLOCK_COLOR)
	}

	const segments = chunkSegments()
	const beamGeometry = new BoxGeometry(BEAM_WIDTH, BEAM_WIDTH, CELL)
	const blockGeometry = new BoxGeometry(1, 1, 1)
	const chunks = Array.from({ length: CHUNKS }, (_, k) => {
		const beams = buildBeams(segments, beamGeometry, glass)
		const blocks = buildBlocks(segments, blockGeometry, glow, k + 1)
		const panels = buildPanels(panelGlass)
		const group = new Object3D()
		group.add(beams, blocks, panels)
		group.position.z = START_Z - k * CHUNK_DEPTH
		scene.add(group)
		return { group, beams, blocks, panels }
	})

	const composer = new EffectComposer(renderer)
	const lens = new ShaderPass(LENS_SHADER)
	const passes = [
		new RenderPass(scene, camera),
		new UnrealBloomPass(new Vector2(1, 1), BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD),
		lens,
		new OutputPass(),
	]
	for (const pass of passes) composer.addPass(pass)

	function recycle() {
		for (const chunk of chunks) {
			if (chunk.group.position.z - CHUNK_DEPTH > camera.position.z + RECYCLE_MARGIN) {
				chunk.group.position.z -= CHUNKS * CHUNK_DEPTH
			}
		}
	}

	return {
		render({ time, travel, look, roll, twist: twistAmount, palette, fade, streak }) {
			camera.position.set(
				Math.sin(time * 0.31) * SWAY_X,
				Math.cos(time * 0.23) * SWAY_Y,
				START_Z - travel,
			)
			camera.rotation.set(-look.y * LOOK_PITCH, -look.x * LOOK_YAW, roll)
			recycle()
			twist.value = twistAmount
			blockUniforms.uTime.value = time
			blockUniforms.uColorA.value.setRGB(palette[0][0], palette[0][1], palette[0][2])
			blockUniforms.uColorB.value.setRGB(palette[1][0], palette[1][1], palette[1][2])
			panelGlass.emissive.copy(blockUniforms.uColorA.value).multiplyScalar(PANEL_GLOW)
			lens.uniforms.uTime.value = time
			lens.uniforms.uFade.value = fade
			lens.uniforms.uStreak.value = streak
			composer.render()
		},
		resize(width, height) {
			const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
			renderer.setPixelRatio(ratio)
			renderer.setSize(width, height, false)
			composer.setPixelRatio(ratio)
			composer.setSize(width, height)
			camera.aspect = width / Math.max(1, height)
			camera.updateProjectionMatrix()
			lens.uniforms.uResolution.value.set(width, height)
		},
		dispose() {
			for (const chunk of chunks) {
				chunk.beams.dispose()
				chunk.blocks.dispose()
				chunk.panels.geometry.dispose()
				chunk.panels.dispose()
			}
			panelGlass.dispose()
			beamGeometry.dispose()
			blockGeometry.dispose()
			glass.dispose()
			glow.dispose()
			environment.dispose()
			pmrem.dispose()
			for (const pass of passes) pass.dispose()
			composer.dispose()
			renderer.forceContextLoss()
			renderer.dispose()
		},
	}
}
