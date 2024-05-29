const { test, describe } = require('node:test')
const assert = require('node:assert')
const reverse = require('../utils/for_testing').reverse

describe('reverse', () => {
  test('reverse of a', () => {
    assert.strictEqual(reverse('a'),'a')
  })

  test('reverse of react', () => {
    assert.strictEqual(reverse('react'),'tcaer')
  })

  test('reverse of saippuakauppias', () => {
    assert.strictEqual(reverse('saippuakauppias'), 'saippuakauppias')
  })
})