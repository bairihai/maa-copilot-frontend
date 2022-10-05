import { compact, uniqueId } from 'lodash-es'
import { DeepPartial, FieldArrayWithId } from 'react-hook-form'
import snakeCaseKeys from 'snakecase-keys'

import type { CopilotDocV1 } from 'models/copilot.schema'
import { MinimumRequired } from 'models/operation'

import { findOperatorDirection } from '../../models/operator'
import { findActionType } from '../../models/types'

/**
 * Creates an operation that can be used in editor. Used for importing.
 */
export function toEditableOperation(
  operation: CopilotDocV1.Operation,
): CopilotDocV1.Operation {
  operation = JSON.parse(JSON.stringify(operation))

  // generate IDs
  compact(
    [
      operation.actions,
      operation.opers,
      operation.groups,
      operation.groups?.map(({ opers }) => opers),
    ].flat(2),
  ).forEach((item) => {
    item._id = uniqueId()
  })

  operation.actions.forEach((action) => {
    const type = findActionType(action.type)

    // normalize action type, e.g. '部署' -> 'Deploy'
    if (type.value !== 'Unknown') {
      action.type = type.value
    }

    if (type.value === 'Deploy') {
      const deployAction = action as CopilotDocV1.ActionDeploy
      const direction = findOperatorDirection(deployAction.direction).value

      // normalize direction, e.g. '上' -> 'Up'
      if (direction !== null) {
        deployAction.direction = direction
      }
    }
  })

  return operation
}

/**
 * Creates an operation in MAA's standard format. Used for exporting.
 */
export function toMaaOperation(
  operation: DeepPartial<CopilotDocV1.Operation>,
): DeepPartial<CopilotDocV1.OperationSnakeCased> {
  operation = JSON.parse(JSON.stringify(operation))

  operation.minimumRequired ||= MinimumRequired.V4_0_0

  // strip IDs
  compact(
    [
      operation.actions,
      operation.opers,
      operation.groups,
      operation.groups?.map((group) => group?.opers),
    ].flat(2),
  ).forEach((item) => {
    delete item._id

    // the id may leak out when editing
    delete (item as Partial<FieldArrayWithId>).id
  })

  return snakeCaseKeys(operation, { deep: true })
}

/**
 * Attempts to patch the operation to satisfy the JSON schema.
 */
export function patchOperation(
  operation: DeepPartial<CopilotDocV1.OperationSnakeCased>,
) {
  if (operation.doc) {
    operation.doc.details ||= operation.doc.title
  }
}
