'use strict'

const Store = require('beanify-store')
const serialize = require('mongodb-extended-json').serialize
const deserialize = require('mongodb-extended-json').deserialize

class MongoStore extends Store {

  constructor(driver, options = {}) {
    super(driver, options)
  }

  drop(cb) {
    this._driver.drop((err, result) => {
      if (err) {
        cb(null, false)
      } else {
        cb(err, true)
      }
    })
  }

  createCollection(req, cb) {
    this._driver.createCollection(req.body.collection, req.body.options, (err, result) => {
      if (err) {
        cb(null, false)
      } else {
        cb(err, true)
      }
    })
  }

  create(req, cb) {
    const data = deserialize(req.body.data)
    if (data instanceof Array) {
      if (this.options.store.create) {
        this._driver.insertMany(data, this.options.store.create, (err, result) => {
          cb(err, { ids: result.insertedIds })
        })
      } else {
        this._driver.insertMany(data, (err, result) => {
          cb(err, { ids: result.insertedIds })
        })
      }
    } else if (data instanceof Object) {
      if (this.options.store.create) {
        this._driver.insertOne(data, this.options.store.create, (err, result) => {
          cb(err, { id: result.insertedId.toString() })
        })
      } else {
        this._driver.insertOne(data, (err, result) => {
          cb(err, { id: result.insertedId.toString() })
        })
      }
    }
  }

  remove(req, cb) {
    const query = deserialize(req.body.query)
    if (this.options.store.remove) {
      this._driver.deleteMany(query, this.options.store.remove, (err, result) => {
        cb(err, result)
      })
    } else {
      this._driver.deleteMany(query, (err, result) => {
        cb(err, result)
      })
    }
  }

  removeById(req, cb) {
    if (this.options.store.removeById) {
      this._driver.findOneAndDelete({ _id: this.ObjectID(req.body.id) }, this.options.store.removeById, (err, result) => {
        cb(err, preResponseHandler(result.value, this.options.serializeResult))
      })
    } else {
      this._driver.findOneAndDelete({
        _id: this.ObjectID(req.body.id)
      }, (err, result) => {
        cb(err, preResponseHandler(result.value, this.options.serializeResult))
      })
    }
  }

  update(req, cb) {
    const query = deserialize(req.body.query)
    const data = deserialize(req.body.data)
    if (this.options.store.update) {
      this._driver.findOneAndUpdate(query, data, this.options.store.update, (err, result) => {
        cb(err, preResponseHandler(result.value, this.options.serializeResult))
      })
    } else {
      this._driver.findOneAndUpdate(query, data, (err, result) => {
        cb(err, preResponseHandler(result.value, this.options.serializeResult))
      })
    }
  }

  updateById(req, cb) {
    const data = deserialize(req.body.data)
    if (this.options.store.updateById) {
      this._driver.findOneAndUpdate({ _id: this.ObjectID(req.body.id) }, data, this.options.store.updateById, (err, result) => {
        cb(err, preResponseHandler(result.value, this.options.serializeResult))
      })
    } else {
      this._driver.findOneAndUpdate({ _id: this.ObjectID(req.body.id) }, data, (err, result) => {
        cb(err, preResponseHandler(result.value, this.options.serializeResult))
      })
    }
  }

  find(req, cb) {
    const query = deserialize(req.body.query)
    const options = deserialize(req.body.options)
    let cursor = this._driver.find(query)
    if (options) {
      if (options.limit) {
        cursor = cursor.limit(options.limit)
      }
      if (options.offset) {
        cursor = cursor.skip(options.offset)
      }
      if (options.fields) {
        cursor = cursor.project(options.fields)
      }
      if (options.orderBy) {
        cursor = cursor.sort(options.orderBy)
      }
    }
    
    cursor.toArray((err, result) => {
      const data = Object.assign(
        {
          data: result
        },
        options
      )
      cb(err, preResponseHandler(data, this.options.serializeResult))
    })
  }

  findById(req, cb) {
    if (this.options.store.findById) {
      this._driver.findOne({ _id: this.ObjectID(req.body.id) }, this.options.store.findById, (err, result) => {
        cb(err, preResponseHandler(result, this.options.serializeResult))
      })
    } else {
      this._driver.findOne({ _id: this.ObjectID(req.body.id) }, (err, result) => {
        cb(err, preResponseHandler(result, this.options.serializeResult))
      })
    }
  }

  replace(req, cb) {
    const query = deserialize(req.body.query)
    const data = deserialize(req.body.data)
    if (this.options.store.replace) {
      this._driver.updateMany(query, data, this.options.store.replace, (err, result) => {
        cb(err, {
          matchedCount: result.matchedCount, modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount, upsertedId: result.upsertedId
        })
      })
    } else {
      this._driver.updateMany(query, data, (err, result) => {
        cb(err, {
          matchedCount: result.matchedCount, modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount, upsertedId: result.upsertedId
        })
      })
    }
  }

  replaceById(req, cb) {
    const data = deserialize(req.body.data)
    if (this.options.store.replaceById) {
      this._driver.findOneAndReplace({ _id: this.ObjectID(req.body.id) }, data, this.options.store.replaceById, (err, result) => {
        cb(err, preResponseHandler(result.value, this.options.serializeResult))
      })
    } else {
      this._driver.findOneAndReplace({ _id: this.ObjectID(req.body.id) }, data, (err, result) => {
        cb(err, preResponseHandler(result.value, this.options.serializeResult))
      })
    }
  }

  count(req, cb) {
    const query = deserialize(req.body.query)
    if (this.options.store.count) {
      this._driver.count(query, this.options.store.count, (err, result) => {
        cb(err, result)
      })
    } else {
      this._driver.count(query, (err, result) => {
        cb(err, result)
      })
    }
  }

  exists(req, cb) {
    const query = deserialize(req.body.query)
    if (this.options.store.exists) {
      this._driver.findOne(query, this.options.store.exists, (err, result) => {
        cb(err, !!result)
      })
    } else {
      this._driver.findOne(query, (err, result) => {
        cb(err, !!result)
      })
    }
  }
}

function preResponseHandler(result, serializeResult) {
  if (serializeResult === true) {
    return serialize(result)
  }
  return result
}

module.exports = MongoStore