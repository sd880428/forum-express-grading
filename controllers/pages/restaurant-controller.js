const { Restaurant, Category, Comment, User, Favorite } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')
const sequelize = require('sequelize')
const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      nest: true,
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ],
      order: [
        [{ model: Comment, include: User }, 'createdAt', 'DESC']
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        return restaurant.increment('viewCounts')
      })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(f => f.id === req.user.id)
        res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    const { id } = req.params
    return Promise.all([
      Comment.count({
        where: {
          restaurantId: id
        },
        raw: true
      }),
      Restaurant.findByPk(id, {
        raw: true,
        nest: true,
        include: [Category]
      }),
      Favorite.count({
        where: {
          restaurantId: id
        },
        raw: true
      })
    ])
      .then(([comments, restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        res.render('dashboard', { restaurant, comments, favorite })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants,
          comments
        })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.sequelize.query('SET SESSION sql_mode = "traditional";')
      .then(() => {
        return Restaurant.findAll({
          subQuery: false,
          attributes: [
            'id', 'name', 'description', 'image', [sequelize.fn('COUNT', sequelize.col('FavoritedUsers.id')), 'favoritedCount']
          ],
          include: [
            {
              model: Category,
              attributes: ['name']
            },
            {
              model: User,
              as: 'FavoritedUsers',
              attributes: []
            }
          ],
          group: ['Restaurant.id'],
          order: [[sequelize.literal('favoritedCount'), 'DESC']],
          limit: 10
        })
      })
      .then(restaurants => {
        const result = restaurants
          .map(r => ({
            ...r.toJSON(),
            description: r.description.substring(0, 50),
            isFavorited: req.user && req.user.FavoritedRestaurants.some(fr => fr.id === r.id)
          }))
        res.render('top-10-restaurants', { restaurants: result })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
