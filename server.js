// Application dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');

//Application setup
const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;

//Database setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

//Application Middleware
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());

//API URL's
const MARKET_DATA_API_URL = 'https://api.cryptonator.com/api/full';
const CHART_DATA_API_URL = 'https://api.coinmarketcap.com/v1/ticker';

// API Endpoints
app.get('/api/v1/coins/:name', (req, res) => {
  superagent.get(`${MARKET_DATA_API_URL}/${req.params.name}-usd`)
    .then(results => {
      var coinMarketFullData = (JSON.parse(results.text));
      var coinMarketData = coinMarketFullData.ticker.markets;
      var changeFromLastHour = coinMarketFullData.ticker.change;
      coinMarketData.map(obj=>obj.change = changeFromLastHour);
      console.log(coinMarketData);
      res.send(coinMarketData);       
    }).catch(console.error);
});
app.get('/api/v1/ticker', (req, res) => {
  superagent.get(`${CHART_DATA_API_URL}`)
    .then(results => {
      var chartMarketFullData = (JSON.parse(results.text));
      // var coinMarketData = coinMarketFullData.ticker.markets;
      // var changeFromLastHour = coinMarketFullData.ticker.change;
      // coinMarketData.map(obj=>obj.change = changeFromLastHour);
      console.log(chartMarketFullData);
      res.send(chartMarketFullData);       
    }).catch(console.error);
});
app.post('/bitfellows', (req, res) => {  
  console.log('test');
  client.query(
    `SELECT user_id FROM users WHERE user_name=$1`,
    [req.body.user_name],
    function(err, result) {
      if (err) console.error(err);
      queryTwo(result.rows[0].user_id);
    }
  );
  
  function queryTwo(user_id) {
    client.query(
      `INSERT INTO
        activity(user_id, coin, qty)
        VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`,
      [
        user_id,
        req.body.coin,
        req.body.qty
      ],
      function(err) {
        if (err) console.error(err);
        res.send('insert complete');
      }
    );
  }
});
app.get('/mybit', (req, res) => {
  console.log('test');
  client.query(`
    SELECT activity_id,user_name,coin,qty FROM activity
    INNER JOIN users
      ON activity.user_id=users.user_id;`
  )
    .then(result => res.send(result.rows))
    .catch(console.error);
});
app.get('/test',(req,res) => {
  console.log('testing');
  res.send('Hello Bitfellows');
});

app.post('/newUser', (req, res) => {
  console.log(req.body);

  client.query(
    `INSERT INTO users(user_name, fname, lname, email)
    VALUES($1, $2, $3, $4)
    ON CONFLICT DO NOTHING;`,
    [req.body.user_name,
      req.body.fname,
      req.body.lname,
      req.body.email
    ])
    .then(() => {
      res.send('User info added to DB');
    })
    .catch(err => {
      res.send('Username already exists, please choose another username.');
      console.error(err);
    });

});

app.put('/updateUser:id', (req, res) => {
  console.log(req.body);

  client.query(
    `UPDATE users 
    SET user_name = $1, fname = $2, lname = $3, email = $4
    WHERE user_id = ${req.params.id}`,
    [req.body.user_name,
      req.body.fname,
      req.body.lname,
      req.body.email
    ])
    .then(() => {
      res.send('Profile updated');
    })
    .catch(err => {
      res.send('Oops, something didn\'t go as expected');
      console.error(err);
    });

});

app.listen(PORT,() => console.log(`Listening on PORT: ${PORT}`));