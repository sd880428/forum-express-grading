const express = require('express')
const router = express.Router()
const adminController = require('../../../controllers/apis/admin-controller')
const { apiErrorHandler } = require('../../../middleware/error-handler')
const upload = require('../../../middleware/multer')
router.get('/restaurants', adminController.getRestaurants)
router.delete('/restaurants/:id', adminController.deleteRestaurant)
router.post('/restaurants', upload.single('image'), adminController.postRestaurant)// 增

router.use('/', (req, res) => res.redirect('/admin/restaurants'))
router.use('/', apiErrorHandler)

module.exports = router
