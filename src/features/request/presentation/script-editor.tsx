import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { Wand2 } from 'lucide-react'
import { useTheme } from '@/app/providers/theme-provider'
import { Button } from '@/shared/ui/button'
import { useT } from '@/app/providers/i18n-provider'

const TOKEN_SNIPPET = `if (af.response.ok) {
  const data = af.response.json()
  if (data.access_token) af.vars.set('token', data.access_token)
}`

const API_LINES = [
  'af.response.status · .ok · .body · .json() · .header(name) · .durationMs',
  'af.request.method · .url',
  "af.vars.get('base') · af.vars.set('token', value)",
  'af.vars.setEnvironment(name, value) · af.vars.setCollection(name, value)',
  'console.log(value)',
]

const PM_LINES = [
  "pm.environment.set('token', value) · pm.environment.get(name)",
  'pm.collectionVariables · pm.globals · pm.variables',
  'pm.response.json() · .text() · .code · .headers.get(name) · .responseTime',
  "pm.test('name', () => pm.expect(pm.response.code).to.eql(200))",
]

export function ScriptEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const t = useT()
  const { resolved } = useTheme()
  const code = value ?? ''

  const insertSnippet = () =>
    onChange(code.trim() ? `${code.trimEnd()}\n\n${TOKEN_SNIPPET}` : TOKEN_SNIPPET)

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="overflow-hidden rounded-md border border-border">
        <CodeMirror
          value={code}
          onChange={onChange}
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
        <p className="mt-2.5 mb-1.5 text-[11px] font-medium">{t('script.pmTitle')}</p>
        {PM_LINES.map((line) => (
          <p key={line} className="font-mono text-[10px] leading-5 text-muted-foreground">
            {line}
          </p>
        ))}
        <p className="mt-1.5 text-[11px] text-muted-foreground">{t('script.pmNote')}</p>
        <p className="mt-1.5 text-[11px] text-muted-foreground">{t('script.sandbox')}</p>
      </div>
    </div>
  )
}
