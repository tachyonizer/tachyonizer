// const express = require('express');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');
const generate = require('@babel/generator').default;
const parser = require('@babel/parser');
const cssTree = require('css-tree');

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);

// const app = express();
// const port = process.env.PORT || 8080;

readFileAsync(path.join(__dirname, './css-in-js.js'), { encoding: 'utf8' })
  .then((data) => {
    const ast = parser.parse(data, {
      sourceType: "module",
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
        if (types.isProgram(path.node)) {
          path.node.body.unshift({
            "type": "ImportDeclaration",
            "specifiers": [],
            "source": {
              "type": "StringLiteral",
              "value": `./${elementName}.css`
            }
          })
        }

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

    fs.writeFile(path.join(__dirname, './Title.js'), generate(ast).code, function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("The JS file was saved!");
    });
    fs.writeFile(path.join(__dirname, './Title.css'), CSS, function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("The CSS file was saved!");
    });
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

// app.listen(port);
// console.log(`Listening: localhost:${port}`)