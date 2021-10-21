const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient

// intentional use of var, for scoping
let db, collection;
const url = ""
const dbName = 'thumbsDown';

// setting up server to listen on 3000 + everything it needs to connect to DB then logs confirmations
app.listen(3000, () => {
  MongoClient.connect(
    url,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (error, client) => {
      if (error) {
        throw error;
      }
      db = client.db(dbName);
      console.log('Connected to `' + dbName + '`!');
    }
  );
});

// setting ejs as our templating lang
app.set('view engine', 'ejs');
// so we can "look" at the request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// any of our static files -> so long as theyre in a public folder, they'll work
// no need to explicitly create routes for each static file
app.use(express.static('public'));

app.get('/', (req, res) => {
  // app goes to DB and finds all documents in messages collection then turn them into an array
  db.collection('messages')
    .find()
    .toArray((err, result) => {
      if (err) return console.log(err);
      // pass in an object named messages containing our array of DB documents, into EJS
      res.render('index.ejs', { messages: result });
    });
});

app.post('/messages', (req, res) => {
  db.collection('messages').insertOne(
    {
      name: req.body.name,
      msg: req.body.msg,
      count: 0,
    },
    (err, result) => {
      if (err) return console.log(err);
      console.log('saved to database');
      res.redirect('/');
    }
  );
});

app.put('/upVote', (req, res) => {
  db.collection('messages').findOneAndUpdate(
    { name: req.body.name, msg: req.body.msg },
    {
      $set: {
        count: req.body.count + 1,
      },
    },
    {
      sort: { _id: -1 },
      upsert: true,
    },
    (err, result) => {
      if (err) return res.send(err);
      console.log(result);
      res.send(result);
    }
  );
});

app.put('/downVote', (req, res) => {
  db.collection('messages').findOneAndUpdate(
    { name: req.body.name, msg: req.body.msg },
    {
      $set: {
        count: req.body.count - 1,
      },
    },
    {
      sort: { _id: -1 },
      upsert: true,
    },
    (err, result) => {
      if (err) return res.send(err);
      res.send(result);
    }
  );
});

app.delete('/messages', (req, res) => {
  db.collection('messages').findOneAndDelete(
    { name: req.body.name, msg: req.body.msg },
    (err, result) => {
      if (err) return res.send(500, err);
      res.send('Message deleted!');
    }
  );
});