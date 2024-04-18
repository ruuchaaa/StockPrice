const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

// Define a simple caching mechanism
let stockCache = {};

// Function to fetch stock data from an external API
const fetchStockData = async (ticker) => {
  try {
    const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=_5ZkEOGd3_JzW4_GWJsCiN1fWtMA0lRV`);
    return response.data.results[0]; // Assuming you want only the first result for each ticker
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
};

// Function to get stock data either from cache or fetch it from the API
const getStockData = async (ticker) => {
  // Check if stock data is already cached
  if (stockCache[ticker]) {
    return stockCache[ticker];
  } else {
    // Fetch stock data from the API
    const data = await fetchStockData(ticker);
    // Cache the fetched data
    stockCache[ticker] = data;
    return data;
  }
};

// Define route to handle requests for individual stocks
app.get('/stocks/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase(); // Convert ticker to uppercase for consistency
  const stockData = await getStockData(ticker);
  if (stockData) {
    res.json(stockData);
  } else {
    res.status(404).send('Stock not found');
  }
});

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
