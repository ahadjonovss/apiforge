import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { Wand2 } from 'lucide-react'
import { useTheme } from '@/app/providers/theme-provider'
import { Button } from '@/shared/ui/button'
import { useTabsStore, type Tab } from '@/features/tabs'
import { useT } from '@/app/providers/i18n-provider'

const TOKEN_SNIPPET = `if (af.response.ok) {
  af.vars.set('token', af.response.json().access_token)
}`

const API_LINES = [
  'af.response.status · .ok · .body · .json() · .header(name) · .durationMs',
  'af.request.method · .url',
  "af.vars.get('base') · af.vars.set('token', value)",
  'console.log(value)',
]

export function ScriptEditor({ tab }: { tab: Tab }) {
  const t = useT()
  const { resolved } = useTheme()
  const patchRequest = useTabsStore((state) => state.patchRequest)
  const code = tab.request.script ?? ''

  const insertSnippet = () =>
    patchRequest(tab.id, {
      script: code.trim() ? `${code.trimEnd()}\n\n${TOKEN_SNIPPET}` : TOKEN_SNIPPET,
    })

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <h3 className="text-xs font-semibold">{t('script.title')}</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{t('script.hint')}</p>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <CodeMirror
          value={code}
          onChange={(next) => patchRequest(tab.id, { script: next })}
          extensions={[javascript()]}
          theme={resolved === 'dark' ? oneDark : 'light'}
          minHeight="180px"
          placeholder={TOKEN_SNIPPET}
          className="text-xs"
          basicSetup={{ lineNumbers: true, foldGutter: true }}
        />
      </div>

      <div>
        <Button size="sm" variant="outline" onClick={insertSnippet}>
          <Wand2 className="size-3.5" />
          {t('script.insertExample')}
        </Button>
      </div>

      <div className="rounded-md border border-dashed border-border p-3">
        <p className="mb-1.5 text-[11px] font-medium">{t('script.apiTitle')}</p>
        {API_LINES.map((line) => (
          <p key={line} className="font-mono text-[10px] leading-5 text-muted-foreground">
            {line}
          </p>
        ))}
        <p className="mt-1.5 text-[11px] text-muted-foreground">{t('script.sandbox')}</p>
      </div>
    </div>
  )
}
