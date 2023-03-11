const express = require('express')
const router = express.Router()
const restController = require('../../controllers/apis/restaurant-controller')
const admin = require('./modules/admin')
const passport = require('passport')
const userController = require('../../controllers/apis/user-controller')
const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth')

router.use('/admin', authenticated, authenticatedAdmin, admin)

router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)
router.post('/signup', userController.signUp)

router.get('/restaurants', authenticated, restController.getRestaurants)

module.exports = router
