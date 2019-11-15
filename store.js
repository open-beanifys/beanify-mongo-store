'use strict'

const Store = require('beanify-store')


class MongoStore extends Store {

  constructor(driver, options = {}) {
    super(driver, options)
  }

  preResponseHandler(result){
    if (this.options.serializeResult === true) {
      return serialize(result)
    }
    return result
  }

  create(req, cb) {
    if (req.data instanceof Array) {
      let op = null
      if (this.options.store.create) {
        op = this._driver.insertMany(req.data, this.options.store.create)
      } else {
        op = this._driver.insertMany(req.data)
      }
      return op.then(resp => {
        return {
          _ids: resp.insertedIds
        }
      })
    } else if (req.data instanceof Object) {
      let op = null
      if (this.options.store.create) {
        op = this._driver.insertOne(req.data, this.options.store.create)
      } else {
        op = this._driver.insertOne(req.data)
      }
      return op.then(resp => {
        return {
          _id: resp.insertedId.toString()
        }
      })
    }
  }

  remove(req, cb) {
    let op = null
    if (this.options.store.remove) {
      op = this._driver.deleteMany(req.query, this.options.store.remove)
    } else {
      op = this._driver.deleteMany(req.query)
    }

    return op.then(resp => {
      return {
        deletedCount: resp.deletedCount
      }
    })
  }

  removeById(req) {
    if (this.options.store.removeById) {
      return this._driver.findOneAndDelete(
        {
          _id: this.ObjectID(req.id)
        },
        this.options.store.removeById
      )
    }

    return this._driver.findOneAndDelete({
      _id: this.ObjectID(req.id)
    })
  }

  update(req, data) {
    if (this.options.store.update) {
      return this._driver.findOneAndUpdate(
        req.query,
        data,
        this.options.store.update
      )
    }

    return this._driver.findOneAndUpdate(req.query, data)
  }

  updateById(req, data) {
    if (this.options.store.updateById) {
      return this._driver.findOneAndUpdate(
        {
          _id: this.ObjectID(req.id)
        },
        data,
        this.options.store.updateById
      )
    }

    return this._driver.findOneAndUpdate(
      {
        _id: this.ObjectID(req.id)
      },
      data
    )
  }

  find(req, options, cb) {
    let cursor = this._driver.find(req.body.query)
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

    cursor.toArray(function (err, result) {
      const data = Object.assign(
        {
          data: result
        },
        options
      )
      cb(err, data)
    })
  }

  findById(req) {
    if (this.options.store.findById) {
      return this._driver.findOne(
        {
          _id: this.ObjectID(req.id)
        },
        this.options.store.findById
      )
    }

    return this._driver.findOne({
      _id: this.ObjectID(req.id)
    })
  }

  replace(req, data) {
    let op = null
    if (this.options.store.replace) {
      op = this._driver.updateMany(req.query, data, this.options.store.replace)
    } else {
      op = this._driver.updateMany(req.query, data)
    }

    return op.then(resp => {
      return {
        matchedCount: resp.matchedCount,
        modifiedCount: resp.modifiedCount,
        upsertedCount: resp.upsertedCount,
        upsertedId: resp.upsertedId
      }
    })
  }

  replaceById(req, data) {
    if (this.options.store.replaceById) {
      return this._driver.findOneAndReplace(
        {
          _id: this.ObjectID(req.id)
        },
        data,
        this.options.store.replaceById
      )
    }

    return this._driver.findOneAndReplace(
      {
        _id: this.ObjectID(req.id)
      },
      data
    )
  }

  count(req, options) {
    if (this.options.store.count) {
      return this._driver.count(req.query, this.options.store.count)
    }

    return this._driver.count(req.query)
  }

  exists(req) {
    if (this.options.store.exists) {
      return this._driver
        .findOne(req.query, this.options.store.exists)
        .then(resp => !!resp)
    }

    return this._driver.findOne(req.query).then(resp => !!resp)
  }
}

module.exports = MongoStore