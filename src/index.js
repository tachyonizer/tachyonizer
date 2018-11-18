const express = require('express');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');
const generate = require('@babel/generator').default;
const parser = require('@babel/parser');
const cssTree = require('css-tree');
var astCSS = cssTree.parse('.example { world: "!" }; .test { font-size: 32px; }');

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  readFileAsync(path.join(__dirname, './css-in-js.js'), { encoding: 'utf8' })
    .then((data) => {
      const ast = parser.parse(data, {
        plugins: [
          "jsx"
        ]
      });
      let babelCssAst;
      let elementName;


      // get css
      traverse(ast, {
        enter(path) {
          if (types.isAssignmentExpression(path.node)
            && types.isMemberExpression(path.node.left)
            && types.isIdentifier(path.node.left.object)
            && types.isIdentifier(path.node.left.property, { name: 'style' })
            && types.isMemberExpression(path.node.left)
            && types.isObjectExpression(path.node.right)
          ) {
              babelCssAst = path.node.right;
              elementName = path.node.left.object.name;
              path.remove();
            }
        }
      })


      const styles = {};

      babelCssAst.properties.forEach((cssRule) => {
        const name = cssRule.key.name;
        const value = cssRule.value.value;
        styles[name] = value;
      })

      const CSS = getCssFromStylesObject(styles);


      // update JSX element
      traverse(ast, {
        enter(path) {
          if (types.isReturnStatement(path.node)
            && types.isJSXElement(path.node.argument)
          ) {
              path.node.argument.openingElement.attributes.push(
                {
                  "type": "JSXAttribute",
                  "name": {
                    "type": "JSXIdentifier",
                    "name": "className"
                  },
                  "value": {
                    "type": "StringLiteral",
                    "value": "tachyonizer"
                  }
                }
              )
            }
        }
      })

      res.json(ast);
    })
})


function getCssFromStylesObject(stylesObject) {
  let cssRule = '.tachyonizer {';

  if (Object(stylesObject) !== stylesObject || typeof stylesObject === 'function') {
    throw new TypeError('Expect a object, by got ' + typeof stylesObject);
  }

  Object.keys(stylesObject).forEach((ruleName) => {
    cssRule += `${camelCaseToKebabCase(ruleName)}: ${stylesObject[ruleName]};`
  })

  cssRule += '}';

  return cssRule;
}


function camelCaseToKebabCase(str, toLowerCase) {
  if (typeof str !== 'string') {
    throw new TypeError('Expect a string, but got ' + typeof str)
  }

  toLowerCase = toLowerCase === undefined ? true : toLowerCase
  str = str.replace(/[a-z]([A-Z])+/g, function (m) {
    return m[0] + '-' + m.substring(1)
  })
  return toLowerCase ? str.toLowerCase() : str
}

app.listen(port);
console.log(`Listening: localhost:${port}`)