const fetch = require("node-fetch")
const express = require('express')
const app = express()
const session = require('express-session')
const http = require('http').Server(app)
const { MongoClient } = require("mongodb")
const MongoDBSession = require('connect-mongodb-session')(session)
const bodyParser = require('body-parser')
// const multer = require('multer')
require('dotenv').config() 

const sessionID = 'sessionID'
const port = process.env.PORT || 3000 // set the port
const url = process.env.MNG_URL // mongoDB url from '.env' file
const dbName = process.env.DB_NAME // database name
const options = { 
  useNewUrlParser: true,
  useUnifiedTopology: true
}

const mongoSession = new MongoDBSession({
  uri: url,
  collection: process.env.C_NAME
})

mongoSession.on('error', (err) => {
  console.log('MongoDB-session error:' + err)
})


app.set('view engine', 'ejs') // we are using ejs as our view engine (can also be handlebars if you prefer)
app.set('views', './views') // where the page templates are
app.use(express.static('public')) // serve static files from the 'public' folder
// I think a few of those body-parsers are deprecated/unnecessary..
app.use(bodyParser.json()) // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}))
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(session({
  name: sessionID,
  secret: process.env.SESSION_SECRET,
  store: mongoSession,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: true,
    secure: false
  }
}))
app.get('/', function (req, res) { // when the user visits the homepage
  getGallery() // first, get the gallery data
    .then(data => { // then, render the homepage with the data
      res.render('index.ejs', {
        photos: data // data is an array of objects, and we pass this data under the keyword 'photos' to the homepage 'index.ejs'
      })
    })
})
app.post('/newPhoto', (req, res) => { // when the user submits a new photo (when the form button is clicked, the form is submitted to this URL and the data is sent to the server and now accessible within this function)
  newPhoto(req, res) // execute function 'newPhoto' below
})


function newPhoto(req, res) {
  try {
    getData(req.body.category)
      .then(data => cleanData(data))
      .then(data => addToGallery(data))
      .then(() => res.redirect('/'))
  } catch (err) {
    console.error(err)
  }
}

// UNSPLASH API DATA
function getData(category) {
  console.log(`getting unsplash data with '${category}' keyword`)

  try {
    return fetch(`https://api.unsplash.com/photos/random/?count=1&query=${category}&client_id=${process.env.API_KEY}`)
      .then(res => res.json()) // parse the response as JSON
      .then(data => {
        if (data.errors) { // if there are errors (if the keyword is not found), return a random photo
          return fetch(`https://api.unsplash.com/photos/random/?count=1&client_id=${process.env.API_KEY}`)
            .then(res => res.json())
        } else {
          return data
        }
      })
  } catch (err) {
    console.error(err)
  }
}

function cleanData(data) {
  console.log('cleaning unsplash data')

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


// GET OR STORE IN GALLERY (DATABASE STUFF BELOW)
async function addToGallery(data) {
  console.log('adding new photo to database')

  data.map(async (data) => {
    const client = await MongoClient.connect(url, options) // connect to the database
    await client.db(dbName).collection('unsplash_photos_test').findOneAndUpdate({ // find the photo in the database and update it (or insert if it doesn't exist yet)
      "id": data.id // find the photo with the same id as the one we are adding
    }, {
      $inc: {
        "score": 1 // if this picture is already in the database, increment 'score' by 1 (popularity)
      },
      $setOnInsert: { // if this picture is not in the database, add it
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
    client.close() // close the connection
  })
}

async function getGallery() {
  try {
    return MongoClient.connect(url, options) // connect to the database
      .then(client => {
        console.log('getting client db and retrieving photos from collection')
       
        return client.db(dbName).collection('unsplash_photos_test').find({}).sort([["score", -1]]).limit(40).toArray() // get all the photos from the database and sort them by 'score' (popularity), limit the list to 40 photos and return them as an array
      })
  } catch (err) {
    console.error(err)
  }
}
// PORT
http.listen(port, () => {
  console.log('App listening on: ' + port)
})