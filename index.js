const path = require('path');
const types = require('@babel/types');
const traverse = require('@babel/traverse');
const generate = require('@babel/generator');
const { parse } = require('@babel/parser');
const { readFile } = require('fs');


readFile(path.resolve(__dirname, './src/code.js'), (err, data) => {
    const code = data.toString('utf-8');
    console.log(code);
    const AST = parse(code);
    console.log(AST);
    const generatedCode = generate.default(AST);
    console.log(generatedCode);
});
