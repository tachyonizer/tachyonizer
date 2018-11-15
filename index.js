const fs = require('fs');
const util = require('util');
const path = require('path');
const types = require('@babel/types');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse');

const readFile = util.promisify(fs.readFile);

readFile(path.resolve(__dirname, './src/code.js')).then((data) => {
    const code = data.toString('utf-8');
    console.log(code);
    const AST = parser.parse(code);
    console.log(AST);
});
