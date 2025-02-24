if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const { pages, apis } = require('./routes')
const handlebars = require('express-handlebars')
const app = express()
const flash = require('connect-flash')
const session = require('express-session')
const passport = require('./config/passport')
const { getUser } = require('./helpers/auth-helpers')
const handlebarsHelpers = require('./helpers/handlebars-helpers')
const port = process.env.PORT || 3000
const SESSION_SECRET = 'secret'
const methodOverride = require('method-override')
const path = require('path')

// 註冊 Handlebars 樣板引擎，並指定副檔名為 .hbs
app.engine('hbs', handlebars({ extname: '.hbs', helpers: handlebarsHelpers }))
// 設定使用 Handlebars 做為樣板引擎
app.set('view engine', 'hbs')

app.use(session({ secret: SESSION_SECRET, resave: true, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages')
  res.locals.error_messages = req.flash('error_messages')
  res.locals.USER = getUser(req)
  next()
})
app.use(methodOverride('_method'))
app.use('/upload', express.static(path.join(__dirname, 'upload')))
app.use(express.static('public'))

app.use(express.urlencoded({ extended: true }))// req.body
app.use(express.json())// json
app.use('/api', apis)
app.use(pages)

app.listen(port, () => {
  console.info(`Example app listening on port ${port}!`)
})

module.exports = app
