const mongoose = require('mongoose')

// item is a subdocument for list, each item contains a specific link
const item = require('./item')


const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  customURL: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [ item.schema ]
}, {
  timestamps: true
})

module.exports = mongoose.model('List', listSchema)
