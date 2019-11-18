'use strict'

const Bp = require('beanify-plugin')
const Mongodb = require('mongodb')
const ObjectID = Mongodb.ObjectID
const MongoStore = require('./store')
const StorePattern = require('beanify-store/pattern')

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
      mongoDrive.close(done)
    })

    beanify.route(StorePattern.drop(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      
      store.drop(res)
    })

    beanify.route(StorePattern.createCollection(topic), function (req, res) {
      const store = new MongoStore(dbase, opts)
      
      store.createCollection(req, res)
    })

    beanify.route(StorePattern.create(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      
      store.create(req, res)
    })

    beanify.route(StorePattern.update(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID
      
      store.update(req, res)
    })

    beanify.route(StorePattern.updateById(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.updateById(req, res)
    })

    beanify.route(StorePattern.remove(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.remove(req, res)
    })

    beanify.route(StorePattern.removeById(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.removeById(req, res)
    })

    beanify.route(StorePattern.replace(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.replace(req, res)
    })

    beanify.route(StorePattern.replaceById(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.replaceById(req, res)
    })

    beanify.route(StorePattern.findById(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.findById(req, res)
    })


    beanify.route(StorePattern.find(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.find(req, res)

    })

    beanify.route(StorePattern.count(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.count(req, res)
    })

    beanify.route(StorePattern.exists(topic), function (req, res) {
      const collection = dbase.collection(req.body.collection)
      const store = new MongoStore(collection, opts)
      store.ObjectID = ObjectID

      store.exists(req, res)
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