const Beanify = require("beanify")
const Init = require('./init')

const beanifyOpts = {
  nats: {
    url: 'nats://127.0.0.1:4222',
    user: 'bimgroup',
    pass: 'commonpwd'
  }
}

const beanify = new Beanify({
  nats: Object.assign({}, beanifyOpts.nats),
  log: { level: 'info' }
})

let topic = 'mongo'

const options = {
  url: "mongodb://127.0.0.1:27017/hemera",
  serializeResult:true
}

beanify.register(require('../index'), options)

beanify.ready((err) => {
  setInterval(() => {
    beanify.inject({
      url: `${topic}.find`,
      $timeout: 50000,
      body: {
        collection: 'site',
        query: { name: '菜鸟教程' } 
      }
    }, function (err, res) {
      
    })
  }, 2000)

})

