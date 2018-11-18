const express = require('express');
const traverser = require('@babel/traverse');
const types = require('@babel/types');
const generate = require('@babel/generator');
const parser = require('@babel/parser');

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  readFileAsync(path.join(__dirname, './css-in-js.js'), { encoding: 'utf8' })
    .then((data) => {
      res.json(parser.parse(data))
    })
})

app.listen(port);
console.log(`Listening: localhost:${port}`)