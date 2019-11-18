
const EJSON = require('mongodb-extended-json')

function createData(client, date) {
  const oid = new client.ObjectID('58c6c65ed78c6a977a0041a8')
  return EJSON.serialize({
    date: date || new Date(),
    objectId: oid,
    ref: client.DBRef('test', oid)
  })
}

function extendedData(mongodb, testCollection, id, t) {
  mongodb.dbase.collection(testCollection).findOne(
    {
      _id: new mongodb.client.ObjectID(id)
    },
    (err, doc) => {
      t.error(err)
      extendedDoc(mongodb.client, doc, t)
    }
  )
}

function extendedDoc(client, doc, t) {
  const ObjectID = client.ObjectID
  const DBRef = client.DBRef

  t.type(doc.date, Date)
  t.type(doc.objectId, ObjectID)
  t.type(doc.ref, DBRef)
}

function initMongoDB(beanify, topic, testCollection, cb) {

  beanify.inject({
    url: `${topic}.drop`,
    body: { collection: testCollection },
    $timeout: 5000
  }, function (err, res) {
    if (err) {
      cb(err)
    } else {
      beanify.inject({
        url: `${topic}.createCollection`,
        body: {
          collection: testCollection,
          options: {}
        },
        $timeout: 5000
      }, function (err, res) {
        cb(err, res)
      })
    }
  })
}

exports.initMongoDB = initMongoDB
exports.createData = createData
exports.extendedData = extendedData
exports.extendedDoc = extendedDoc