import type { DeleteMany } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from './index.js'

import { withSession } from './withSession.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: MongooseAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  const Model = this.collections[collection]
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
  }

  const query = await Model.buildQuery({
    payload: this.payload,
    where,
  })

  await Model.deleteMany(query, options)
}