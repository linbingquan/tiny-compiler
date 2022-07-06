import { codeGenerator, compiler, parser, tokenizer, transformer } from "./compiler.ts";
import { assert, equal } from "https://deno.land/std@0.138.0/testing/asserts.ts";

const input = "(add 2 (subtract 4 2))";
const output = "add(2, subtract(4, 2));";

const tokens = [
  { type: "paren", value: "(" },
  { type: "name", value: "add" },
  { type: "number", value: "2" },
  { type: "paren", value: "(" },
  { type: "name", value: "subtract" },
  { type: "number", value: "4" },
  { type: "number", value: "2" },
  { type: "paren", value: ")" },
  { type: "paren", value: ")" },
];

const ast = {
  type: "Program",
  body: [{
    type: "CallExpression",
    name: "add",
    params: [{
      type: "NumberLiteral",
      value: "2",
    }, {
      type: "CallExpression",
      name: "subtract",
      params: [{
        type: "NumberLiteral",
        value: "4",
      }, {
        type: "NumberLiteral",
        value: "2",
      }],
    }],
  }],
};

const newAst = {
  type: "Program",
  body: [{
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "add",
      },
      arguments: [{
        type: "NumberLiteral",
        value: "2",
      }, {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "subtract",
        },
        arguments: [{
          type: "NumberLiteral",
          value: "4",
        }, {
          type: "NumberLiteral",
          value: "2",
        }],
      }],
    },
  }],
};

assert(equal(tokenizer(input), tokens), "tokenizer error");
assert(equal(parser(tokens), ast), "parser error");
assert(equal(transformer(ast), newAst), "transformer error");
assert(equal(codeGenerator(newAst), output), "codeGenerator error");
assert(equal(compiler(input), output), "compiler error");

console.log("All Passed!");
