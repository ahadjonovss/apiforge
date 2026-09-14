import { useCallback, useMemo } from 'react'
import { useT } from '@/app/providers/i18n-provider'
import {
  variableHighlight,
  type VariableInfo,
  type VariableLabels,
  type VariableLookup,
} from '@/shared/ui/variable-highlight'
import type { InheritedConfig } from '../domain/request'

const EMPTY = {}

export interface VariableTools {
  lookup: VariableLookup
  labels: VariableLabels
  extension: ReturnType<typeof variableHighlight>
}

export function useVariables(
  inherited: InheritedConfig | null | undefined,
  onEdit?: (name: string) => void,
): VariableTools {
  const t = useT()
  const scope = inherited?.variables ?? EMPTY
  const sources = inherited?.variableSources
  const environmentName = inherited?.environmentName ?? ''

  const lookup = useCallback<VariableLookup>(
    (name) => {
      const known = Object.prototype.hasOwnProperty.call(scope, name)
      const source = sources?.[name]
      const info: VariableInfo = {
        known,
        value: (scope as Record<string, string>)[name] ?? '',
        source: !known
          ? ''
          : source === 'environment'
            ? t('variable.sourceEnvironment', { name: environmentName })
            : t('variable.sourceCollection'),
      }
      return info
    },
    [scope, sources, environmentName, t],
  )

  const labels = useMemo<VariableLabels>(
    () => ({
      unset: t('variable.unset'),
      empty: t('variable.empty'),
      edit: t('variable.edit'),
      add: t('variable.add'),
    }),
    [t],
  )

  const extension = useMemo(
    () => variableHighlight({ lookup, labels, onEdit }),
    [lookup, labels, onEdit],
  )

  return { lookup, labels, extension }
}
