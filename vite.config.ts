import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { execFileSync } from "node:child_process"
import { defineConfig } from "vite"

const GIT_TIMEOUT_MS = 5000
const DESCRIBE_PATTERN = /^v(\d+\.\d+\.\d+)(?:-(\d+)-(g[0-9a-f]+))?$/

/** Site version from the nearest `vX.Y.Z` tag: `X.Y.Z` on the tag, `X.Y.Z+N.gSHA` after it. */
function versionFromGitTag(): string {
	let described: string
	try {
		described = execFileSync("git", ["describe", "--tags", "--match", "v[0-9]*"], {
			encoding: "utf8",
			timeout: GIT_TIMEOUT_MS,
		}).trim()
	} catch (error) {
		throw new Error(
			"Cannot derive the site version: git describe found no vX.Y.Z tag. Fetch tags (git fetch --tags) or build from a full clone.",
			{ cause: error },
		)
	}
	const match = DESCRIBE_PATTERN.exec(described)
	if (!match) {
		throw new Error(`Cannot derive the site version: "${described}" is not a vX.Y.Z tag.`)
	}
	const [, release, commits, sha] = match
	return commits ? `${release}+${commits}.${sha}` : release
}

export default defineConfig({
	plugins: [react(), tailwindcss()],
	define: {
		__APP_VERSION__: JSON.stringify(versionFromGitTag()),
	},
	server: {
		host: "localhost",
		proxy: {
			"/api": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
		},
	},
})
