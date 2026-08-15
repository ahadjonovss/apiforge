import { MarkdownEditor } from '@/shared/ui/markdown-editor'
import { useTabsStore, type Tab } from '@/features/tabs'

export function DocsEditor({ tab }: { tab: Tab }) {
  const patchRequest = useTabsStore((state) => state.patchRequest)

  return (
    <div className="flex flex-col gap-2 p-4">
      <div>
        <h3 className="text-xs font-semibold">Endpoint hujjati</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Bu so'rov nima qilishi, qanday parametr kutishi va nimaga e'tibor berish kerakligi.
          Status kodlar bo'yicha javob misollari esa javob panelining tepasida.
        </p>
      </div>

      <MarkdownEditor
        value={tab.request.docs}
        onChange={(value) => patchRequest(tab.id, { docs: value })}
        placeholder={'## Nima qiladi\n\n…\n\n## Parametrlar\n\n| Nom | Turi | Izoh |\n| --- | --- | --- |'}
        minHeight="300px"
      />
    </div>
  )
}
