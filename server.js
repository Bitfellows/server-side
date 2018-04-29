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
const MARKET_DATA_API_URL = 'https://api.cryptonator.com/api/full'

// API Endpoints
app.get('/api/v1/coins/:name', (req, res) => {
    superagent.get(`${MARKET_DATA_API_URL}/${req.params.name}-usd`)
    .then(results => {
        var coinMarketData = JSON.parse(results.text);
           res.send(coinMarketData.ticker.markets);       
    });
});

app.get('/test',(req,res) => {
    res.send("Hello Bitfellows");
})

app.listen(PORT,() => console.log(`Listening on PORT: ${PORT}`));

