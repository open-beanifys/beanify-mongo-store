'use strict'

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


let topic = 'runoob'
const testCollection = 'site'

const options = {
  useDbAsTopicSuffix: true,
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

    tap.test('create', (t) => {
      t.plan(3)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'peter'
            }
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
        }
      )
    })

    tap.test('create multiple documents', (t) => {
      t.plan(4)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: [{ name: 'peter' }, { name: 'parker' }]
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
          t.type(res.ids, Object)
        }
      )
    })

    tap.test('update', (t) => {
      t.plan(6)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'peter'
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
                  $set: {
                    name: 'nadja'
                  }
                },
                query: {
                  name: 'peter'
                }
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

    tap.test('updatebyId', (t) => {
      t.plan(8)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'peter'
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
                  $set: {
                    name: 'nadja'
                  }
                },
                id: res.id
              }
            }, function (err, res) {
              t.error(err)
              t.ok(res)
              t.type(res, Object)
              t.ok(res._id)
              t.ok(res.name)
            }
          )
        }
      )
    })

    tap.test('remove', (t) => {
      t.plan(6)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'olaf'
            }
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
                query: {
                  name: 'olaf'
                }
              }
            }, function (err, res) {
              t.error(err)
              t.type(res, Object)
              t.equal(1, res.deletedCount)
            }
          )
        }
      )
    })

    tap.test('removeById', (t) => {
      t.plan(8)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'olaf'
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
            }
          )
        }
      )
    })

    tap.test('findById', (t) => {
      t.plan(7)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'jens'
            }
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
              t.type(res, Object)
              t.ok(res._id)
              t.ok(res.name)
            }
          )
        }
      )
    })

    tap.test('find', (t) => {
      t.plan(7)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'jens'
            }
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
                query: {}
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
    })

    tap.test('find with pagination', (t) => {
      t.plan(9)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'jens'
            }
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
                query: {},
                options: {
                  limit: 10,
                  offset: 2
                }
              }
            }, function (err, res) {
              t.error(err)
              t.type(res.data, Array)
              t.ok(res.data[0]._id)
              t.ok(res.data[0].name)
              t.equal(10, res.limit)
              t.equal(2, res.offset)
            }
          )
        }
      )
    })

    tap.test('replace', (t) => {
      t.plan(8)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'nadine'
            }
          }
        }, function (err, res) {
          t.error(err)
          t.ok(res)
          t.type(res, Object)
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
                query: {}
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

    tap.test('replaceById', (t) => {
      t.plan(7)
      beanify.inject(
        {
          url: `${topic}.create`,
          body: {
            collection: testCollection,
            data: {
              name: 'nadja'
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
                  name: 'nadja'
                },
                id: res.id
              }
            }, function (err, res) {
              t.error(err)
              t.type(res, Object)
              t.ok(res._id)
              t.ok(res.name)
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

