'use strict'

const Bp = require('beanify-plugin')
const Mongodb = require('mongodb')
const ObjectID = Mongodb.ObjectID
const MongoStore = require('./store')
const StorePattern = require('beanify-store/pattern')
const serialize = require('mongodb-extended-json').serialize
const deserialize = require('mongodb-extended-json').deserialize

module.exports = Bp((beanify, opts, done) => {

  let topic = 'mongo'

  Mongodb.MongoClient.connect(opts.url, opts.options, function (err, mongoDrive) {
    if (err) {
      done(err)
      return
    }

    const dbName = mongoDrive.s.options.dbName

    const dbase = mongoDrive.db(dbName)

    if (opts.useDbAsTopicSuffix) {
      topic = dbName
    }

    beanify.decorate('mongodb', {
      client: Mongodb,
      dbase,
      mongoDrive
    })


    //服务退出释放mongodb连接
    beanify.addHook('onClose', (ctx, done) => {
      console.log('Mongodb connection closed!')
      db.close(done)
    })

    beanify.route(
      {
        url: `${topic}.dropCollection`,
        schema: {
          request: {
            type: 'object',
            properties: {
              body: {
                type: 'object',
                properties: {
                  collection: { type: 'string' }
                },
                required: ['collection']
              }
            }
          }
        }
      }, function (req, res) {
        res(null, req)
        dbase.collection(req.body.collection).drop(function (err) {
          console.log('===============', `${topic}.dropCollection`, req.body.collection)
        })

      })

    beanify.route(
      {
        url: `${topic}.createCollection`,
        schema: {
          request: {
            type: 'object',
            properties: {
              body: {
                type: 'object',
                properties: {
                  collection: { type: 'string' }
                },
                required: ['collection']
              }
            }
          }
        }
      }, function (req, res) {
        dbase.createCollection(req.collection, req.options).then(() => true).catch(() => false)
        res(null, req)
      })

    beanify.route(StorePattern.create(topic), function (req) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.data = deserialize(req.body.data)

      return store.create(req)
    })

    beanify.route(StorePattern.update(topic), function (req) {
      const collection = dbase.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store
        .update(req, deserialize(req.data))
        .then(resp => resp.value)
        .then(preResponseHandler)
    })

    beanify.route(StorePattern.updateById(topic), function (req) {
      const collection = dbase.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      return store
        .updateById(req, deserialize(req.data))
        .then(resp => resp.value)
        .then(preResponseHandler)
    })

    beanify.route(StorePattern.remove(topic), function (req) {
      const collection = dbase.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store.remove(req)
    })

    beanify.route(StorePattern.removeById(topic), function (req) {
      const collection = dbase.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      return store
        .removeById(req)
        .then(resp => resp.value)
        .then(preResponseHandler)
    })

    beanify.route(StorePattern.replace(topic), function (req) {
      const collection = dbase.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store.replace(req, deserialize(req.data))
    })

    beanify.route(StorePattern.replaceById(topic), function (req) {
      const collection = dbase.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      return store
        .replaceById(req, deserialize(req.data))
        .then(resp => resp.value)
        .then(preResponseHandler)
    })

    beanify.route(StorePattern.findById(topic), function (req) {
      const collection = dbase.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      return store.findById(req).then(preResponseHandler)
    })


    beanify.route(StorePattern.find(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.body.query = deserialize(req.body.query)
      store.find(req, req.body.options, res)

    })

    beanify.route(StorePattern.count(topic), function (req) {
      const collection = dbase.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store.count(req, req.options)
    })

    beanify.route(StorePattern.exists(topic), function (req) {
      const collection = dbase.collection(req.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      req.query = deserialize(req.query)

      return store.exists(req, req.options)
    })

    console.log('DB connected!')
    done()
  })
}, {
  beanify: '>=1.0.8',
  name: require('./package.json').name,
  options: {
    url: 'mongodb://localhost:27017/',
    options: {},
    serializeResult: false,
    store: {
      replace: { upsert: true }
    }
  }
})