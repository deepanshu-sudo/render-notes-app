const usersRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')

usersRouter.get('/', async (req,res) => {
  const users = await User.find({}).populate('notes', { content: 1, important: 1 })
  res.json(users)
})

usersRouter.post('/', async (req, res) => {
  const { username, name, password } = req.body

  // Basic strength criteria check before creating User
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/

  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      error: 'Password is not strong enough. It must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character.'
    })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = new User({
    username,
    name,
    passwordHash
  })

  const savedUser = await user.save()
  res.status(201).json(savedUser)
})

module.exports = usersRouter