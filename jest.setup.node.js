const { TextEncoder, TextDecoder } = require('util')

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only'
process.env.MONGODB_URI = 'mongodb://localhost:27017/ruzizi-hotel-test'

// Suppress Mongoose Jest warnings
process.env.SUPPRESS_JEST_WARNINGS = 'true'