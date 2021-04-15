// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for items
const List = require('../models/list')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { items: { title: '', text: 'foo' } } -> { items: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /items/listID
router.get('/items/:lid', requireToken, (req, res, next) => {
    List.findById(req.params.lid)
    .then(handle404)
    .then(parent => {
      return parent.items.map(item => item.toObject())
    })
    // respond with status 200 and JSON of the items
    .then(items => res.status(200).json({ items: items }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /items/listID
router.post('/items/:lid', requireToken, (req, res, next) => {
  // set owner of new items to be current user
  req.body.item.owner = req.user.id

  List.findById(req.params.lid)
    .then(parent => {
      parent.items.push(req.body.item)
      return parent.save()
    })
    .then(savedParent => {
      res.status(201).json({ item: req.body.item })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /items/listID/5a7db6c74d55bc51bdf39793
router.patch('/items/:lid/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.item.owner

  List.findById(req.params.lid)
    .then(handle404)
    .then(parent => {
      const item = parent.items.id(req.params.id)
      requireOwnership(req, item)
      item.set(req.body.item)
      return parent.save()
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /items/listID/5a7db6c74d55bc51bdf39793
router.delete('/items/:lid/:id', requireToken, (req, res, next) => {
  List.findById(req.params.lid)
    .then(handle404)
    .then(parent => {
      const item = parent.items.id(req.params.id)
      // throw an error if current user doesn't own `items`
      requireOwnership(req, item)
      // delete the items ONLY IF the above didn't throw
      review.remove()
      return parent.save()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
