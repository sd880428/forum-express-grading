const { User, Restaurant, Comment, Favorite, Like, Followship } = require('../models')
const bcrypt = require('bcryptjs')
const { getUser } = require('../helpers/auth-helpers')
const Sequelize = require('sequelize')

const userController = {
  signUp: (req, cb) => {
    const { name, email, password, passwordCheck } = req.body
    if (password !== passwordCheck) throw new Error('密碼與確認密碼不一致!')
    User.findOne({ where: { email } })
      .then(user => {
        if (user) throw new Error('使用者已存在!')
        return bcrypt.hash(password, 10)
      })
      .then(hash => User.create({
        name,
        email,
        password: hash
      }))
      .then(user => cb(null, user))
      .catch(err => cb(err))
  },
  getUser: (req, cb) => {
    const currentUser = getUser(req)
    const { id } = req.params
    if (currentUser.id !== Number(id)) {
      throw new Error('不可訪問其他使用者!')
    }
    return Promise.all([
      User.findByPk(id, {
        nest: true,
        include: [
          {
            model: User,
            as: 'Followings',
            attributes: ['id', 'image']
          },
          {
            model: User,
            as: 'Followers',
            attributes: ['id', 'image']
          },
          { model: Restaurant, as: 'FavoritedRestaurants' },
          { model: Restaurant, as: 'LikedRestaurants' }
        ]
      }),
      Comment.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('restaurant_id')), 'restaurantId']],
        distinct: true,
        col: 'restaurant_id',
        include: [
          {
            model: Restaurant,
            attributes: ['image']
          }
        ],
        where: { userId: id },
        nest: true,
        raw: true
      })
    ])
      .then(([user, comments]) => {
        if (!user) throw new Error("User didn't exist!")
        cb(null, { user: { ...user.toJSON() }, comments })
      })
      .catch(err => cb(err))
  }
}

module.exports = userController
