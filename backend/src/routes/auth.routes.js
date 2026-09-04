const express = require('express')
const { getCurrentUser, login } = require('../controllers/auth.controller')
const { requireAuth } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/login', login)
router.get('/me', requireAuth, getCurrentUser)

module.exports = router
