export function createKnexMock(overrides: Partial<KnexMockMethods> = {}) {
  const methods: KnexMockMethods = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    ...overrides
  }

  const knexMock = jest.fn().mockReturnValue(methods)

  return {
    knexMock,
    ...methods
  }
}

export interface KnexMockMethods {
  select: jest.Mock
  where: jest.Mock
  first: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  from: jest.Mock
}
