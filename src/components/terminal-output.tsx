import type { OutputLine } from "../lib/terminal-commands"

export function Line({ line }: { line: OutputLine }) {
	const style = line.color ? { color: line.color } : undefined
	if (line.href) {
		return (
			<div className="whitespace-pre-wrap wrap-break-word">
				<a
					href={line.href}
					target="_blank"
					rel="noopener noreferrer"
					style={style}
					className="hover:underline"
				>
					{line.text}
				</a>
			</div>
		)
	}
	return (
		<div className="whitespace-pre-wrap wrap-break-word text-soft" style={style}>
			{line.text || " "}
		</div>
	)
}

export function Prompt({ id }: { id: string }) {
	return (
		<>
			<span className="text-ink">{id}@smyile</span>
			<span className="text-muted">:~$ </span>
		</>
	)
}
