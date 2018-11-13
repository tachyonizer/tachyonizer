const express = require('express');
const acorn = require('acorn');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  readFileAsync(path.join(__dirname, './css-in-js.js'), { encoding: 'utf8' })
    .then((data) => {
      res.json(acorn.parse(data))
    })
})

app.listen(port);
console.log(`Listening: localhost:${port}`)