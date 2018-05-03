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
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

//API URL's
const MARKET_DATA_API_URL = 'https://api.cryptonator.com/api/full';
const CHART_DATA_API_URL = 'https://api.coinmarketcap.com/v1/ticker';

// API Endpoints
app.get('/api/v1/coins/:name', (req, res, next) => {
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
app.get('/api/v1/ticker', (req, res, next) => {
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
app.post('/bitfellows', (req, res, next) => {  
    console.log('test');
      client.query(
        `SELECT user_id FROM users WHERE user_name=$1`,
        [req.body.user_name],
        function(err, result) {
          if (err) console.error(err)
          queryTwo(result.rows[0].user_id)
        }
      )
  
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
  app.get('/mybit/:username', (req, res, next) => {
      console.log('test');
    client.query(`
    SELECT coin,qty FROM activity      
    where activity.user_id=(SELECT user_id FROM users WHERE user_name=$1)`,
    [req.params.username]
    )
    .then(result => res.send(result.rows))
    .catch(console.error);
  });
app.get('/test',(req,res, next) => {
  console.log('testing');
  res.send('Hello Bitfellows');
});

app.post('/newUser', (req, res, next) => {
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
    .catch(err => {
      console.error(err);
    })
    .then(() => {
      res.send('User info added to DB');
    });

});
app.listen(PORT,() => console.log(`Listening on PORT: ${PORT}`));