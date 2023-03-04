const { User, Restaurant, Comment, Favorite } = require('../models')
const bcrypt = require('bcryptjs')
const { imgurFileHandler } = require('../helpers/file-helpers')
const Sequelize = require('sequelize')
const userController = {
  singUpPage: (req, res) => {
    return res.render('signup')
  },
  signUp: (req, res, next) => {
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
      .then(() => {
        req.flash('success_messages', '註冊成功!')
        res.redirect('/signin')
      })
      .catch(error => next(error))
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },
  getUser: (req, res, next) => {
    const { id } = req.params
    return Promise.all([
      User.findByPk(id, {
        raw: true
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
        res.render('users/profile', { user, comments })
      })
      .catch(err => next(err))
  },
  editUser: (req, res, next) => {
    const USER = req.user || User._defaults// 訪問的使用者
    const id = req.params.id // 欲修改之使用者id
    if (USER.id !== Number(id)) throw new Error('不可編輯其他使用者的資料!')
    return User.findByPk(id, { raw: true })
      .then(user => {
        res.render('users/edit', { user })
      })
      .catch(err => next(err))
  },
  putUser: (req, res, next) => {
    const USER = req.user || User._defaults// 訪問的使用者
    const id = req.params.id // 欲修改之使用者id
    if (USER.id !== Number(id)) throw new Error('不可編輯其他使用者的資料!')
    const { file } = req
    return Promise.all([
      User.findByPk(req.params.id),
      imgurFileHandler(file)
    ])
      .then(([user, filePath]) => user.update({ ...req.body, image: filePath || user.image }))
      .then(() => {
        req.flash('success_messages', '使用者資料編輯成功')
        res.redirect(`/users/${req.user.id}`)
      })
      .catch(err => next(err))
  },
  addFavorite: (req, res, next) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (favorite) throw new Error('You have favorited this restaurant!')

        return Favorite.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFavorite: (req, res, next) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(favorite => {
        if (!favorite) throw new Error("You haven't favorited this restaurant")

        return favorite.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}

module.exports = userController
