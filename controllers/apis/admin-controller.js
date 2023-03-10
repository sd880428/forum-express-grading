const adminServices = require('../../services/admin-controller')

const adminController = {
  getRestaurants: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) => { err ? next(err) : res.json(data) })
  }
}

module.exports = adminController
