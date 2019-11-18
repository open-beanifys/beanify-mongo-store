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

let topic = 'mongo'
const testCollection = 'site'

const options = {
  url: "mongodb://127.0.0.1:27017/runoob",
  store: {
    update: { returnOriginal: false },
    updateById: { returnOriginal: false },
    removeById: { projection: { name: 1 } },
    replace: { upsert: false },
    replaceById: { projection: { name: 1 } }
  }
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

    tap.test('update with `returnOriginal`', (t) => {
      t.plan(8)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'matthew'
            }
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
                  $set: { name: 'elektra' }
                },
                query: {
                  name: 'matthew'
                }
              }
            }, function (err, res) {
              t.error(err)
              t.ok(res)
              t.type(res, Object)
              t.ok(res._id)
              t.equal('elektra', res.name)
            }
          )
        }
      )
    })

    tap.test('updateById with `returnOriginal`', (t) => {
      t.plan(8)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'matthew'
            }
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
                  $set: { name: 'elektra1' }
                },
                id: res.id
              }
            }, function (err, res) {
              t.error(err)
              t.ok(res)
              t.type(res, Object)
              t.ok(res._id)
              t.equal('elektra1', res.name)
            }
          )
        }
      )
    })

    tap.test('removeById with `projection`', (t) => {
      t.plan(9)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'bullseye',
              side: 'villain'
            }
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
              t.error(err)
              t.ok(res)
              t.type(res, Object)
              t.ok(res._id)
              t.ok(res.name)
              t.notOk(res.side)
            }
          )
        }
      )
    })

    tap.test('replace with `upsert`', (t) => {
      t.plan(5)
      beanify.inject(
        {
          url: `${topic}.replace`,
          body: {
            collection: testCollection,
            data: {
              $set: {
                name: 'stick'
              }
            },
            query: { side: 'allies' }
          }
        }, function (err, res) {
          t.error(err)
          t.type(res, Object)
          t.equal(0, res.matchedCount)
          t.equal(0, res.modifiedCount)
          t.equal(0, res.upsertedCount)
        }
      )
    })

    tap.test('replaceById with `projection`', (t) => {
      t.plan(9)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'the hand',
              side: 'villain'
            }
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
          beanify.inject(
            {
              url: `${topic}.replaceById`,
              body: {
                collection: testCollection,
                data: {
                  name: 'kirigi',
                  side: 'villain'
                },
                id: res.id
              }
            }, function (err, res) {
              t.error(err)
              t.ok(res)
              t.type(res, Object)
              t.ok(res._id)
              t.ok(res.name)
              t.notOk(res.side)
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

