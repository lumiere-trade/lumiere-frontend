"use client"

interface ExamplePromptsProps {
  prompts: string[]
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function ExamplePrompts({ prompts, onSelect, disabled = false }: ExamplePromptsProps) {
  return (
    <div className="pt-2 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelect(prompt)}
            disabled={disabled}
            className="rounded-xl border border-primary/20 bg-card/50 px-4 py-2.5 text-base text-left transition-all hover:border-primary/40 hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
