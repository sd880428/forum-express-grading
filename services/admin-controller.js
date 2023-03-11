const { Restaurant, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const { imgurFileHandler } = require('../helpers/file-helpers')

const adminController = {
  getRestaurants: (req, cb) => {
    const DEFAULT_LIMIT = 12
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)
    return Restaurant.findAndCountAll({
      raw: true,
      nest: true,
      offset,
      limit,
      include: [Category]
    })
      .then(restaurants => {
        return cb(null,
          {
            restaurants: restaurants.rows,
            pagination: getPagination(limit, page, restaurants.count),
            limit
          }
        )
      })
      .catch(err => cb(err))
  },
  deleteRestaurant: async (req, cb) => {
    try {
      const restaurant = await Restaurant.findByPk(req.params.id)
      if (!restaurant) throw new Error("Restaurant didn't exist!")
      const deleteRestaurant = await restaurant.destroy()
      cb(null, { restaurant: deleteRestaurant })
    } catch (err) {
      cb(err)
    }
  },
  postRestaurant: (req, cb) => {
    const { name } = req.body

    if (!name) throw new Error('Restaurant name is required!')

    const { file } = req
    return imgurFileHandler(file)
      .then(filePath => Restaurant.create({ ...req.body, image: filePath || null }))
      .then(createdRestaurant => cb(null, { restaurant: createdRestaurant })
      )
      .catch(err => cb(err))
  }
}

module.exports = adminController
