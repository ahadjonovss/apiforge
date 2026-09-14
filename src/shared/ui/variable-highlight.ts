import { RangeSetBuilder, type Extension } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
  hoverTooltip,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
export const VARIABLE_PATTERN = /\{\{\s*([\w.-]+)\s*\}\}/g

export interface VariableInfo {
  known: boolean
  value: string
  source: string
}

export interface VariableLabels {
  unset: string
  empty: string
  edit: string
  add: string
}

export type VariableLookup = (name: string) => VariableInfo

export interface VariableHighlightOptions {
  lookup: VariableLookup
  labels: VariableLabels
  onEdit?: (name: string) => void
}

const PATTERN = VARIABLE_PATTERN

const KNOWN = Decoration.mark({ class: 'cm-af-var' })
const UNKNOWN = Decoration.mark({ class: 'cm-af-var cm-af-var-unset' })

function decorate(view: EditorView, lookup: VariableLookup): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    PATTERN.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = PATTERN.exec(text)) !== null) {
      const start = from + match.index
      builder.add(start, start + match[0].length, lookup(match[1]).known ? KNOWN : UNKNOWN)
    }
  }
  return builder.finish()
}

function highlighter(lookup: VariableLookup) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations = decorate(view, lookup)
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = decorate(update.view, lookup)
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  )
}

export function variableTooltipDom(
  name: string,
  lookup: VariableLookup,
  labels: VariableLabels,
  onEdit?: (name: string) => void,
): HTMLElement {
  const { known, value, source } = lookup(name)

  const root = document.createElement('div')
  root.className = 'cm-af-tip'

  const title = document.createElement('div')
  title.className = 'cm-af-tip-name'
  title.textContent = name
  root.append(title)

  const body = document.createElement('div')
  body.className = known && value ? 'cm-af-tip-value' : 'cm-af-tip-missing'
  body.textContent = known ? value || labels.empty : labels.unset
  root.append(body)

  if (known && source) {
    const origin = document.createElement('div')
    origin.className = 'cm-af-tip-source'
    origin.textContent = source
    root.append(origin)
  }

  if (onEdit) {
    const action = document.createElement('button')
    action.type = 'button'
    action.className = 'cm-af-tip-action'
    action.textContent = known ? labels.edit : labels.add
    action.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()
      onEdit(name)
    })
    root.append(action)
  }

  return root
}

function tooltips(
  lookup: VariableLookup,
  labels: VariableLabels,
  onEdit?: (name: string) => void,
): Extension {
  return hoverTooltip(
    (view, pos) => {
      const line = view.state.doc.lineAt(pos)
      PATTERN.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = PATTERN.exec(line.text)) !== null) {
        const from = line.from + match.index
        const to = from + match[0].length
        if (pos < from || pos > to) continue
        const name = match[1]
        return {
          pos: from,
          end: to,
          above: true,
          create: () => ({ dom: variableTooltipDom(name, lookup, labels, onEdit) }),
        }
      }
      return null
    },
    { hoverTime: 120 },
  )
}

const theme = EditorView.baseTheme({
  '.cm-af-var': {
    color: 'var(--color-status-success)',
    backgroundColor: 'color-mix(in oklab, var(--color-status-success) 14%, transparent)',
    borderRadius: '3px',
    padding: '0 1px',
    cursor: 'pointer',
  },
  '.cm-af-var-unset': {
    color: 'var(--color-destructive)',
    backgroundColor: 'color-mix(in oklab, var(--color-destructive) 14%, transparent)',
  },
  '.cm-tooltip.cm-tooltip-hover:has(.cm-af-tip)': {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-popover)',
  },
  '.cm-af-tip': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    padding: '6px 8px',
    maxWidth: '320px',
    fontFamily: 'inherit',
  },
  '.cm-af-tip-name': {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-muted-foreground)',
  },
  '.cm-af-tip-value': {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--color-popover-foreground)',
    wordBreak: 'break-all',
  },
  '.cm-af-tip-source': {
    fontSize: '11px',
    color: 'var(--color-muted-foreground)',
  },
  '.cm-af-tip-missing': {
    fontSize: '12px',
    color: 'var(--color-destructive)',
  },
  '.cm-af-tip-action': {
    marginTop: '2px',
    padding: '0',
    border: 'none',
    background: 'none',
    fontSize: '11px',
    color: 'var(--color-primary)',
    cursor: 'pointer',
  },
})

export function variableHighlight({
  lookup,
  labels,
  onEdit,
}: VariableHighlightOptions): Extension[] {
  return [highlighter(lookup), tooltips(lookup, labels, onEdit), theme]
}
