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

    const mongodb = beanify.mongodb
    const client = beanify.mongodb.client

    tap.test('测试用扩展的json创建', (t) => {
      t.plan(7)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: Init.createData(client)
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
          Init.extendedData(mongodb, testCollection, res.id, t)
        }
      )
    })

    tap.test('测试使用扩展的json创建（手动）', (t) => {
      t.plan(7)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              date: { $date: new Date() },
              objectId: { $oid: new client.ObjectID() },
              ref: { $ref: 'test', $id: 1234 }
            }
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
          Init.extendedData(mongodb, testCollection, res.id, t)
        }
      )
    })

    tap.test('测试更新可以使用扩展的json查询', (t) => {
      t.plan(6)
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
              url: `${topic}.update`,
              body: {
                collection: testCollection,
                data: {
                  $set: { name: 'foo' }
                },
                query: EJSON.serialize({ date: now })
              }
            }, function (err, res) {
              t.error(err)
              t.ok(res)
              t.type(res, Object)
            }
          )
        }
      )
    })

    tap.test('测试用扩展的json更新', (t) => {
      t.plan(12)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'jacob'
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
                  $set: Init.createData(client)
                },
                query: {
                  name: 'jacob'
                }
              }
            }, function (err, res) {
              t.error(err)
              t.ok(res)
              t.type(res, Object)
              t.ok(res._id)
              t.ok(res.name)
              Init.extendedData(mongodb, testCollection, res._id, t)
            }
          )
        }
      )
    })

    tap.test('测试具有扩展json的updateById更新', (t) => {
      t.plan(12)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'jacob'
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
                  $set: Init.createData(client)
                },
                id: res.id
              }
            }, function (err, res) {
              t.error(err)
              t.ok(res)
              t.type(res, Object)
              t.ok(res._id)
              t.ok(res.name)
              Init.extendedData(mongodb, testCollection, res._id, t)
            }
          )
        }
      )
    })

    tap.test('测试可以扩展JSON删除及查询', (t) => {
      t.plan(6)
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
              url: `${topic}.remove`,
              body: {
                collection: testCollection,
                query: EJSON.serialize({ date: now })
              }
            }, function (err, res) {
              t.error(err)
              t.type(res, Object)
              t.equal(2, res.deletedCount)
            }
          )
        }
      )
    })

    tap.test('测试可以扩展JSON查询', (t) => {
      t.plan(7)
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
              },
              $timeout: 5000
            }, function (err, res) {
              t.error(err)
              t.type(res.data, Array)
              t.ok(res.data[0]._id)
              t.ok(res.data[0].date)
            }
          )
        }
      )
    })

    tap.test('测试可以正则表达式查询', (t) => {
      t.plan(11)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: { name: 'Jacob' }
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
                query: EJSON.serialize({ name: new RegExp(/^jac/, 'i') })
              }
            }, function (err, res) {
              t.error(err)
              t.type(res.data, Array)
              t.ok(res.data[0]._id)
              t.ok(res.data[0].name)
              beanify.inject(
                {
                  url: `${topic}.find`,
                  body: {
                    collection: testCollection,
                    query: { name: { $regex: '^jac', $options: 'i' } }
                  }
                }, function (err, res) {
                  t.error(err)
                  t.type(res.data, Array)
                  t.ok(res.data[0]._id)
                  t.ok(res.data[0].name)
                }
              )
            }
          )
        }
      )
    })

    tap.test('测试用扩展的json替换', (t) => {
      t.plan(12)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'jacob'
            }
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
          const id = new client.ObjectID(res.id)
          beanify.inject(
            {
              url: `${topic}.replace`,
              body: {
                collection: testCollection,
                data: {
                  $set: Init.createData(client)
                },
                query: EJSON.serialize({ _id: id })
              }
            }, function (err, res) {
              t.error(err)
              t.type(res, Object)
              t.ok(res.matchedCount)
              t.ok(res.modifiedCount)
              t.equal(0, res.upsertedCount)
              Init.extendedData(mongodb, testCollection, id, t)
            }
          )
        }
      )
    })

    tap.test('测试用扩展的json替换可以查询', (t) => {
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
          const id = new client.ObjectID(res.id)
          beanify.inject(
            {
              url: `${topic}.replace`,
              body: {
                collection: testCollection,
                data: {
                  $set: {
                    name: 'nadja'
                  }
                },
                query: EJSON.serialize({ date: now })
              }
            }, function (err, res) {
              t.error(err)
              t.type(res, Object)
              t.ok(res.matchedCount)
              t.ok(res.modifiedCount)
              t.equal(0, res.upsertedCount)
            }
          )
        }
      )
    })

    tap.test('测试扩展的json替换replaceById', (t) => {
      t.plan(11)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'jacob'
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
                data: Init.createData(client),
                id: res.id
              }
            }, function (err, res) {
              t.error(err)
              t.type(res, Object)
              t.ok(res._id)
              t.ok(res.name)
              Init.extendedData(mongodb, testCollection, res._id, t)
            }
          )
        }
      )
    })

    tap.test('测试count统计', (t) => {
      t.plan(4)
      beanify.inject(
        {
          url: `${topic}.count`,
          body: {
            collection: testCollection,
            query: EJSON.serialize({ name: new RegExp(/^nad/, 'i') })
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.equal(2, res)
        }
      )
    })

    tap.tearDown(() => {
      console.log("tap.tearDown")
      beanify.close()
    })
  })
})

