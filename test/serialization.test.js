'use strict'

const EJSON = require('mongodb-extended-json')
const Beanify = require("beanify")
const Init = require('./init')
const tap = require("tap")

const beanifyOpts = {
  nats: {
    url: 'nats://127.0.0.1:4222',
    user: 'bimgroup',
    pass: 'commonpwd'
  }
}

const beanify = new Beanify({
  nats: Object.assign({}, beanifyOpts.nats),
  log: { level: 'error' }
})

const now = new Date()
let topic = 'mongo'
const testCollection = 'site'

const options = {
  serializeResult: true,
  url: "mongodb://127.0.0.1:27017/runoob"
}

beanify.register(require('../index'), options)

beanify.ready((err) => {
  if (err) {
    console.log('启动失败...')
    tap.teardown()
    throw err
  }
  console.log('启动成功...')
  Init.initMongoDB(beanify, topic, testCollection, (err, res) => {
    if (err) {
      console.log('初始化失败...')
      tap.teardown()
      throw err
    }
    console.log('初始化成功...')

    const client = beanify.mongodb.client

    tap.test('update will return an extended json result', (t) => {
      t.plan(7)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: EJSON.serialize({
              name: 'jacob',
              date: new Date()
            })
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
          beanify.inject(
            {
              url: `${topic}.update`,
              body: {
                collection: testCollection,
                data: {
                  $set: { name: 'foo' }
                },
                query: {
                  name: 'jacob'
                }
              }
            }, function (err, res) {
              res = EJSON.deserialize(res)
              t.type(res, Object)
              t.error(err)
              t.type(res.date, Date)
              t.type(res._id, client.ObjectID)
            }
          )
        }
      )
    })

    tap.test('updateById will return an extended json result', (t) => {
      t.plan(7)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: EJSON.serialize({
              name: 'jacob',
              date: new Date()
            })
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
          beanify.inject(
            {
              url: `${topic}.updateById`,
              body: {
                collection: testCollection,
                data: {
                  $set: { name: 'foo' }
                },
                id: res.id
              }
            }, function (err, res) {
              res = EJSON.deserialize(res)
              t.type(res, Object)
              t.error(err)
              t.type(res.date, Date)
              t.type(res._id, client.ObjectID)
            }
          )
        }
      )
    })

    tap.test('removeById will return an extended json result', (t) => {
      t.plan(7)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: EJSON.serialize({
              name: 'jacob',
              date: new Date()
            })
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
          beanify.inject(
            {
              url: `${topic}.removeById`,
              body: {
                collection: testCollection,
                id: res.id
              }
            }, function (err, res) {
              res = EJSON.deserialize(res)
              t.type(res, Object)
              t.error(err)
              t.type(res.date, Date)
              t.type(res._id, client.ObjectID)
            }
          )
        }
      )
    })

    tap.test('findById will return an extended json result', (t) => {
      t.plan(8)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: Init.createData(client, now)
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
          beanify.inject(
            {
              url: `${topic}.findById`,
              body: {
                collection: testCollection,
                id: res.id
              },
            }, function (err, res) {
              t.error(err)
              res = EJSON.deserialize(res)
              t.type(res._id, client.ObjectID)
              Init.extendedDoc(client, res, t)
            }
          )
        }
      )
    })

    tap.test('find will return an extended json result', (t) => {
      t.plan(9)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: Init.createData(client, now)
          }
        }, function (err, res) {

          t.error(err)
          t.ok(res)
          t.type(res, Object)
          beanify.inject(
            {
              url: `${topic}.find`,
              body: {
                collection: testCollection,
                query: EJSON.serialize({ date: now })
              }
            }, function (err, res) {
              res = EJSON.deserialize(res)
              t.error(err)
              t.type(res.data, Array)
              t.type(res.data[0]._id, client.ObjectID)
              Init.extendedDoc(client, res.data[0], t)
            }
          )
        }
      )
    })

    tap.tearDown(() => {
      console.log("tap.tearDown")
      beanify.close()
    })
  })
})

