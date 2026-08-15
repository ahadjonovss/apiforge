import type { KeyValue } from '@/core/domain/http'
import { newId } from './id'

export function emptyKeyValue(): KeyValue {
  return { id: newId(), key: '', value: '', enabled: true }
}
