import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { useTheme } from '@/app/providers/theme-provider'

interface Props {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  minHeight?: string
  placeholder?: string
}

export function JsonEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = '160px',
  placeholder,
}: Props) {
  const { resolved } = useTheme()

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <CodeMirror
        value={value}
        onChange={onChange}
        editable={!readOnly}
        readOnly={readOnly}
        extensions={[json()]}
        theme={resolved === 'dark' ? oneDark : 'light'}
        minHeight={minHeight}
        placeholder={placeholder}
        className="text-xs"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: !readOnly,
        }}
      />
    </div>
  )
}
