const { Restaurant, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

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
  }
}

module.exports = adminController
