const express = require('express')
const app = express()
const fetch = require("node-fetch")
const http = require('http').Server(app)
const { MongoClient } = require("mongodb")
const bodyParser = require('body-parser')


require('dotenv').config()

const port = process.env.PORT || 3000
const url = process.env.MNG_URL
const dbName = process.env.DB_NAME
const options = {useNewUrlParser: true, useUnifiedTopology: true }


app.use(express.static('public'))
app.use( bodyParser.json() )     // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}))
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.set('view engine', 'ejs')
app.set('views', './views')
app.get('/', function (req, res) {
  getScoreboard()
  .then(data => {
    res.render('index.ejs', {photos: data})
  }) 
})
app.post('/newPhoto', function (req, res) {
  try {
    getData(req.body.category)
    .then(data =>  cleanData(data))
    .then(data => addToScoreboard(data))
    .then(data => getScoreboard(data))
    .then(data => res.render('index.ejs', {photos: data}))
  } catch (err) {
    console.error(err)
  }
})

// API DATA
function getData(category) {
  console.log('getting data')
  try {
    return fetch(`https://api.unsplash.com/photos/random/?count=1&query=${category}&client_id=${process.env.API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.errors) {
        return fetch(`https://api.unsplash.com/photos/random/?count=1&client_id=${process.env.API_KEY}`)
         .then(res => res.json())
      } else {
        return data
      }
    }) 
  }
  catch (err) {
    console.error(err)
  }
}

function cleanData(data) {
  console.log('cleaning data')
  return data.map(data => {
    return {
      id: data.id,
      url: data.urls.regular,
      width: data.width,
      height: data.height,
      color: data.color,
      alt_description: data.alt_description,
      photographer: data.user.name,
      location: data.location.title
    }
  })
}


// GET OR STORE IN SCOREBOARD (DATABASE)
async function addToScoreboard(data) {
  console.log('adding to scoreboard')
  data.map(async (data) => {
    const client = await MongoClient.connect(url, options)
    await client.db(dbName).collection('unsplash_photos_test').findOneAndUpdate({
      "id": data.id
    }, {
      $inc: {
        "score": 1
      },
      $setOnInsert: {
        id: data.id,
        url: data.url,
        width: data.width,
        height: data.height,
        color: data.color,
        alt_description: data.alt_description,
        photographer: data.photographer,
        location: data.location,
        photoid: data.photoid
      }
    }, {
      upsert: true,
      multi: true,
    })
    client.close()
  })
}

async function getScoreboard() {
  try {
    return MongoClient.connect(url, options)
      .then(client => {
        console.log('yeeeeet getting client')
         return client.db(dbName).collection('unsplash_photos_test').find({}).sort([["score", -1]]).limit(30).toArray()
        //  return client.db(dbName).collection('unsplash_photos_test').find({}).sort([["score", -1]]).limit(30).toArray()
      })
  } catch (err) {
    console.log('not happening')
    console.error(err)
  }
}

// PORT
http.listen(port, () => {
  console.log('App listening on: ' + port)
})