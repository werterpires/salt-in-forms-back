import * as utils from '../utils'

describe('Utils', () => {
  describe('toSnakeCase', () => {
    it('should convert a string to snake case', () => {
      expect(utils.toSnakeCase('HelloWorld')).toBe('hello_world')
    })

    it('should handle empty string', () => {
      expect(utils.toSnakeCase('')).toBe('')
    })

    it('should handle snake case', () => {
      expect(utils.toSnakeCase('hello_world')).toBe('hello_world')
    })
  })
})
