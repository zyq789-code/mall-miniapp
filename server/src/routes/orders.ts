import { Router } from 'express'

const router = Router()

/** Placeholder: real order queries land in S3. Orders table starts empty. */
router.get('/', (_req, res) => {
  res.json({ success: true, data: { list: [], total: 0 } })
})

export default router
