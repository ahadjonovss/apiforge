import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { TextField } from '@/shared/ui/text-field'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { flattenFolders } from '../application/tree'
import type { Folder } from '../domain/folder'
import { useCollectionsStore } from './collections-store'

interface Props {
  workspaceId: string
  open: boolean
  folder: Folder | null
  parentId: string | null
  onClose: () => void
}

export function FolderModal({ workspaceId, open, folder, parentId, onClose }: Props) {
  const folders = useCollectionsStore((state) => state.folders)
  const pending = useCollectionsStore((state) => state.pending)
  const error = useCollectionsStore((state) => state.error)
  const addFolder = useCollectionsStore((state) => state.addFolder)
  const renameFolder = useCollectionsStore((state) => state.renameFolder)
  const moveFolder = useCollectionsStore((state) => state.moveFolder)

  const [name, setName] = useState('')
  const [target, setTarget] = useState<string>('')

  useEffect(() => {
    if (!open) return
    setName(folder?.name ?? '')
    setTarget((folder ? folder.parentId : parentId) ?? '')
  }, [open, folder, parentId])

  const options = flattenFolders(folders, folder?.id)

  const submit = async () => {
    if (folder) {
      const renamed = await renameFolder(workspaceId, folder, name)
      if (!renamed) return
      if ((folder.parentId ?? '') !== target) {
        const moved = await moveFolder(workspaceId, { ...folder, name }, target || null)
        if (!moved) return
      }
      onClose()
      return
    }

    if (await addFolder(workspaceId, name, target || null)) {
      setName('')
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      title={folder ? 'Papkani tahrirlash' : 'Yangi papka'}
      description="Papkalar bir-birining ichida joylasha oladi"
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <TextField
          label="Nomi"
          placeholder="Auth"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void submit()
          }}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Joylashuvi</label>
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">To'plam ildizi</option>
            {options.map(({ folder: option, depth }) => (
              <option key={option.id} value={option.id}>
                {`${' '.repeat(depth * 3)}${option.name}`}
              </option>
            ))}
          </select>
        </div>

        <DataErrorNote error={error} />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button size="sm" loading={pending} onClick={() => void submit()}>
            {folder ? 'Saqlash' : 'Yaratish'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
