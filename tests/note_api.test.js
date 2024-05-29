const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const Note = require('../models/note')
const User = require('../models/user')
const bcrypt = require('bcrypt')

const api = supertest(app)

const initializeDatabase = async () => {
  await Note.deleteMany({})
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('testpassword',10)
  const user = new User({
    username: 'testuser',
    name: 'Test User',
    passwordHash,
  })

  await user.save()

  // Insert initial notes with a reference to the test user
  const notesWithUser = helper.initialNotes.map(note => ({
    ...note,
    user: user._id,
  }))

  await Note.insertMany(notesWithUser)
}

const loginUserAndGetToken = async () => {
  const loginResponse = await api
    .post('/api/login')
    .send({
      username: 'testuser',
      password: 'testpassword',
    })
    .expect(200)

  return loginResponse.body.token
}

describe('where there are initially some notes saved', () => {
  beforeEach(initializeDatabase)

  test('notes are returned as json', async () => {
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all notes are returned', async () => {
    const response = await api.get('/api/notes')
    assert.strictEqual(response.body.length, helper.initialNotes.length)
  })

  test('a specific note is within the returned notes', async () => {
    const response = await api.get('/api/notes')
    const contents = response.body.map(note => note.content)
    assert(contents.includes('HTML is easy'))
  })
})

describe('viewing a specific note', () => {
  beforeEach(initializeDatabase)

  test('a specific note can be viewed', async () => {
    const notesAtStart = await helper.notesInDb()
    const noteToView = notesAtStart[0]

    const expectedNote = {
      ...noteToView,
      user: noteToView.user.toString()
    }

    const resultNote = await api
      .get(`/api/notes/${noteToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.deepStrictEqual(resultNote.body, expectedNote)
  })

  test('fails with status code 404 if note does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId()

    await api
      .get(`/api/notes/${validNonexistingId}`)
      .expect(404)
  })

  test('fails with status code 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .get(`/api/notes/${invalidId}`)
      .expect(400)
  })
})

describe('addition of a new note', () => {
  let token

  beforeEach(async () => {
    await initializeDatabase()
    token = await loginUserAndGetToken()
  })

  test('a valid note can be added', async () => {
    const newNote = {
      content: 'async/await simplifies making async calls',
      important: true
    }

    await api
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send(newNote)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const notesAtEnd = await helper.notesInDb()
    assert.strictEqual(notesAtEnd.length, helper.initialNotes.length + 1)

    const contents = notesAtEnd.map(n => n.content)
    assert(contents.includes('async/await simplifies making async calls'))
  })

  test('note without content is not added', async () => {
    const newNote = {
      important: true
    }

    await api
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send(newNote)
      .expect(400)

    const notesAtEnd = await helper.notesInDb()
    assert.strictEqual(notesAtEnd.length, helper.initialNotes.length)
  })
})

describe('deletion of a note', () => {
  beforeEach(initializeDatabase)

  test('a note can be deleted', async () => {
    const notesAtStart = await helper.notesInDb()
    const noteToDelete = notesAtStart[0]

    await api
      .delete(`/api/notes/${noteToDelete.id}`)
      .expect(204)

    const notesAtEnd = await helper.notesInDb()
    const contents = notesAtEnd.map(r => r.content)
    assert(!contents.includes(noteToDelete.content))

    assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1)
  })
})

after(async () => {
  await mongoose.connection.close()
})