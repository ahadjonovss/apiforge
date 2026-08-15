import { useEffect, useState } from 'react'
import type { RequestDef } from '@/features/request/domain/request'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { TextField } from '@/shared/ui/text-field'
import { DataErrorNote } from '@/shared/ui/data-error-note'
import { flattenFolders } from '../application/tree'
import { useCollectionsStore } from './collections-store'

interface Props {
  workspaceId: string
  open: boolean
  endpoint: RequestDef | null
  parentId: string | null
  onClose: () => void
  onCreated?: (endpoint: RequestDef) => void
}

export function EndpointModal({
  workspaceId,
  open,
  endpoint,
  parentId,
  onClose,
  onCreated,
}: Props) {
  const folders = useCollectionsStore((state) => state.folders)
  const pending = useCollectionsStore((state) => state.pending)
  const error = useCollectionsStore((state) => state.error)
  const addEndpoint = useCollectionsStore((state) => state.addEndpoint)
  const saveEndpoint = useCollectionsStore((state) => state.saveEndpoint)
  const moveEndpoint = useCollectionsStore((state) => state.moveEndpoint)

  const [name, setName] = useState('')
  const [target, setTarget] = useState('')

  useEffect(() => {
    if (!open) return
    setName(endpoint?.name ?? '')
    setTarget((endpoint ? endpoint.folderId : parentId) ?? '')
  }, [open, endpoint, parentId])

  const options = flattenFolders(folders)

  const submit = async () => {
    if (endpoint) {
      const renamed = await saveEndpoint(workspaceId, { ...endpoint, name: name.trim() })
      if (!renamed) return
      if ((endpoint.folderId ?? '') !== target) {
        const moved = await moveEndpoint(
          workspaceId,
          { ...endpoint, name: name.trim() },
          target || null,
        )
        if (!moved) return
      }
      onClose()
      return
    }

    const created = await addEndpoint(workspaceId, name, target || null)
    if (created) {
      setName('')
      onCreated?.(created)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      title={endpoint ? 'Endpointni tahrirlash' : 'Yangi endpoint'}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <TextField
          label="Nomi"
          placeholder="Foydalanuvchilar ro'yxati"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void submit()
          }}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Papka</label>
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">To'plam ildizi</option>
            {options.map(({ folder, depth }) => (
              <option key={folder.id} value={folder.id}>
                {`${' '.repeat(depth * 3)}${folder.name}`}
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
            {endpoint ? 'Saqlash' : "Qo'shish"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
