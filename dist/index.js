
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./botts.cjs.production.min.js')
} else {
  module.exports = require('./botts.cjs.development.js')
}
