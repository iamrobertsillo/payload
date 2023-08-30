import type { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../express/types.js'
import type { Payload } from '../../../index.js'

type Args = {
  collection: SanitizedCollectionConfig
  doc: TypeWithID & Record<string, unknown>
  payload: Payload
  req: PayloadRequest
}

export const incrementLoginAttempts = async ({
  collection,
  doc,
  payload,
  req,
}: Args): Promise<void> => {
  const {
    auth: { lockTime, maxLoginAttempts },
  } = collection

  if ('lockUntil' in doc && typeof doc.lockUntil === 'string') {
    const lockUntil = Math.floor(new Date(doc.lockUntil).getTime() / 1000)

    // Expired lock, restart count at 1
    if (lockUntil < Date.now()) {
      await payload.update({
        collection: collection.slug,
        data: {
          lockUntil: null,
          loginAttempts: 1,
        },
        id: doc.id,
        req,
      })
    }

    return
  }

  const data: Record<string, unknown> = {
    loginAttempts: Number(doc.loginAttempts) + 1,
  }

  // Lock the account if at max attempts and not already locked
  if (typeof doc.loginAttempts === 'number' && doc.loginAttempts + 1 >= maxLoginAttempts) {
    const lockUntil = new Date(Date.now() + lockTime)
    data.lockUntil = lockUntil
  }

  await payload.update({
    collection: collection.slug,
    data,
    id: doc.id,
  })
}