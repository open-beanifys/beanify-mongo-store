
const EJSON = require('mongodb-extended-json')

function createData(mongodb, date) {
  const oid = new mongodb.ObjectID('58c6c65ed78c6a977a0041a8')
  return EJSON.serialize({
    date: date || new Date(),
    objectId: oid,
    ref: mongodb.DBRef('test', oid)
  })
}



function initMongoDB(beanify, topic, testCollection, cb) {
  console.log('..................', `${topic}.dropCollection`)
  beanify.inject({
      url: `${topic}.dropCollection`,
      body:{collection: testCollection}
    })
    .then(() => {
      return beanify.inject({
        url: `${topic}.createCollection`,
        body:{collection: testCollection}
      })
    })
    .catch(err => cb(err))
    .then(() => cb(null, res))
}

exports.initMongoDB = initMongoDB
exports.createData = createData