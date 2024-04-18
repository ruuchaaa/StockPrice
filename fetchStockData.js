const fs = require('fs');
const axios = require('axios');
const axiosRateLimit = require('axios-rate-limit');
require('dotenv').config();

const fetchPreviousClose = async (ticker, apiKey) => {
  try {
    const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev`, {
      params: {
        apiKey: apiKey
      }
    });
    const previousClose = response.data.results[0].c.toFixed(2);
    return previousClose;
  } catch (error) {
    console.error(`Error fetching previous close for ${ticker}:`, error.response?.data || error.message);
    return null;
  }
};

const updateStockPrices = async (stocksData) => {
  try {
    for (const stock of stocksData) {
      // Update the price with a random value
      stock.openPrice = (parseFloat(stock.openPrice) * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2);
    }
    // Update the JSON file with the new prices
    fs.writeFileSync('stocksData.json', JSON.stringify(stocksData, null, 2)); // Pretty print JSON
    console.log('Stock prices updated:', new Date().toLocaleString());
  } catch (error) {
    console.error('Error updating stock prices:', error);
  }
};

const fetchAndStoreStockData = async () => {
  try {
    const API_KEY = process.env.POLYGON_API_KEY;
    if (!API_KEY) {
      console.error('Polygon API key is not provided. Make sure to set the POLYGON_API_KEY environment variable.');
      return;
    }

    const api = axiosRateLimit(axios.create(), { maxRPS: 10 });

    const response = await api.get('https://api.polygon.io/v3/reference/tickers', {
      params: {
        apiKey: API_KEY,
        active: true,
        sort: 'ticker',
        perpage: 20
      }
    });

    const stocksData = [];
    for (const stock of response.data.results) {
      const refreshInterval = Math.floor(Math.random() * 5) + 1;
      const openPrice = parseFloat(stock.lastTrade?.p) || 0;
      const previousClose = await fetchPreviousClose(stock.ticker, API_KEY);
      if (previousClose !== null) {
        console.log(`${stock.ticker} - Open Price: ${openPrice}, Previous Close: ${previousClose}`);
        stocksData.push({ ...stock, refreshInterval, openPrice, previousClose });
      } else {
        console.log(`Failed to fetch previous close of ${stock.ticker}`);
      }
    }

    fs.writeFileSync('stocksData.json', JSON.stringify(stocksData, null, 2)); // Pretty print JSON
    console.log('Stock data stored in stocksData.json');

    // Periodically update stock prices
    setInterval(() => updateStockPrices(stocksData), 5000); // Update every 5 seconds
  } catch (error) {
    console.error('Error fetching and storing stock data:', error);
  }
};

fetchAndStoreStockData();
