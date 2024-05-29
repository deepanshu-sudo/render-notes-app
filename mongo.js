// helper file to access database

require('dotenv').config()
const mongoose = require('mongoose')

const url = process.env.TEST_MONGODB_URL

mongoose.set('strictQuery', false)
mongoose.connect(url).then(() => {
  const noteSchema = new mongoose.Schema({
    content: String,
    important: Boolean,
  })

  const Note = mongoose.model('Note', noteSchema)

  const note = new Note({
    content: 'Browser can execute only JavaScript',
    important: true,
  })

  note.save().then(() => {
    console.log('note saved!')
    mongoose.connection.close()
  })

})