type Token = {
  type: string;
  value: string;
};

type Visitor = {
  enter?: Function;
  exit?: Function;
};

type VisitorContext = Record<string, Visitor>;

type StringLiteral = {
  type: "StringLiteral";
  value: string;
};

type NumberLiteral = {
  type: "NumberLiteral";
  value: string;
};

type TypeLiteral = {
  type: string;
  value: string;
};

type Params = TypeLiteral | TypeCallParamsExpression | CalleeExpression | TypeExpressionStatement;

type TypeCallParamsExpression = {
  type: string;
  name: string;
  params: Params[];
};

type CallParamsExpression = {
  type: string;
  name: string;
  params: Params[];
};

type AST = {
  type: string;
  body: Params[];
};

type AstProgramContext = {
  type: string;
  body: Params[];
  _context: Params[];
};

type TypeExpressionStatement = {
  type: string;
  expression: CalleeExpression;
};

type ExpressionStatement = {
  type: "ExpressionStatement";
  expression: CalleeExpression;
};

type Callee = {
  type: string;
  name: string;
};

type Identifier = {
  type: "Identifier";
  name: string;
};

type CallExpression = {
  type: "CallExpression";
  callee: Callee;
  arguments: any[];
};

type CalleeExpression = {
  type: string;
  callee: Callee;
  arguments: any[];
};

/**
 * 词义分析
 */
function tokenizer(input: string) {
  let current = 0;

  let tokens: Token[] = [];

  while (current < input.length) {
    let char = input[current];

    // 匹配左括号
    if (char === "(") {
      tokens.push({ type: "paren", value: "(" });
      current++;
      continue;
    }

    // 匹配右括号
    if (char === ")") {
      tokens.push({ type: "paren", value: ")" });
      current++;
      continue;
    }

    // 跳过空格符
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // 匹配数字
    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      let value = "";
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({ type: "number", value });
      continue;
    }

    // 匹配双引号里的字符串
    if (char === '"') {
      let value = "";
      // 跳过当前的双引号
      char = input[++current];
      while (char !== '"') {
        value += char;
        char = input[++current];
      }
      // 跳过当前的双引号
      char = input[++current];
      tokens.push({ type: "string", value });
      continue;
    }

    // 匹配方法名的字符串
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = "";
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({ type: "name", value });
      continue;
    }

    throw new TypeError("解析未成功的字符: " + char);
  }

  return tokens;
}

/**
 * 语法分析
 */
function parser(tokens: Token[]) {
  let current = 0;

  function walk(): TypeLiteral | TypeCallParamsExpression {
    let token = tokens[current];

    // 数字类型
    if (token.type === "number") {
      current++;

      return { type: "NumberLiteral", value: token.value };
    }

    // 字符串类型
    if (token.type === "string") {
      current++;
      return { type: "StringLiteral", value: token.value };
    }

    // 调用表达式
    if (token.type === "paren" && token.value === "(") {
      // 跳过当前的左括号
      token = tokens[++current];

      // 存放当前表达式的参数
      let node: TypeCallParamsExpression = {
        type: "CallExpression",
        name: token.value,
        params: [],
      };

      // 跳过方法名
      token = tokens[++current];

      while (token.type !== "paren" || (token.type === "paren" && token.value !== ")")) {
        // 调用 walk 方法获取表达式的参数
        node.params.push(walk());
        token = tokens[current];
      }

      // 最后跳过右括号
      current++;

      return node;
    }

    // 当前未识别的类型
    throw new TypeError(token.type);
  }

  let ast: AST = {
    type: "Program",
    body: [],
  };

  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
}

/**
 * 遍历器
 */
function traverser(ast: AstProgramContext, visitors: VisitorContext) {
  // 数组遍历器
  function traverseArray(array: any[], parent: any | null) {
    array.forEach((child: any) => {
      traverseNode(child, parent);
    });
  }

  // 节点遍历器
  function traverseNode(node: AstProgramContext | TypeCallParamsExpression, parent: any | null) {
    // 获取访问器上的方法
    let methods: Visitor | undefined = visitors[node.type];

    // 判断当前节点的访问器是否有入口方法
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    // 按当前节点类型拆分内容
    switch (node.type) {
      // 程序(Program) 节点需要遍历 body
      case "Program":
        traverseArray((node as AST).body, node);
        break;

      // 调用表达式(CallExpression) 节点需要遍历 params

      case "CallExpression":
        traverseArray((node as CallParamsExpression).params, node);
        break;

      // 数字标识符(NumberLiteral) 字符串标识符(StringLiteral) 没有子节点所以跳过

      case "NumberLiteral":
      case "StringLiteral":
        break;

      // 如果没有识别出节点就抛出错误

      default:
        throw new TypeError(node.type);
    }

    // 判断当前节点的访问器是否有退出方法
    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  // 最后用 AST 调用 traverseNode 来启动遍历器，当前 AST 没有父类所以传 null
  traverseNode(ast, null);
}

/**
 * 转换
 */
function transformer(ast: AST) {
  let newAst: AST = {
    type: "Program",
    body: [],
  };

  const astContext: AstProgramContext = {
    ...ast,
    // 为了简单实现，直接引用, 注意 context 是一个从旧的 AST 到新 AST 的引用
    _context: newAst.body,
  };

  // 调用 AST 和 visitor 的遍历函数
  traverser(astContext, {
    // 第一个是数字标识符(NumberLiteral)
    NumberLiteral: {
      enter(node: TypeLiteral, parent: AstProgramContext) {
        // 创建一个 数字标识符(NumberLiteral) 新节点
        parent._context.push({ type: "NumberLiteral", value: node.value });
      },
    },

    // 接下来是字符串标识符(StringLiteral)
    StringLiteral: {
      enter(node: TypeLiteral, parent: AstProgramContext) {
        // 创建一个 字符串标识符(StringLiteral) 新节点
        parent._context.push({ type: "StringLiteral", value: node.value });
      },
    },

    // 接下来是调用表达式(CallExpression)
    CallExpression: {
      enter(node: any, parent: AstProgramContext) {
        // 创建一个 嵌套标识符(Identifier)的调用表达式(CallExpression) 新节点
        let expression: CalleeExpression | TypeExpressionStatement = {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: node.name,
          },
          arguments: [],
        };

        // 给当前节点上下文的参数做引用
        node._context = expression.arguments;

        // 当父节点不是调用表达式(CallExpression) 给 expression 做 javascript 的 ExpressionStatement 语法包装
        if (parent.type !== "CallExpression") {
          expression = {
            type: "ExpressionStatement",
            expression: expression,
          };
        }

        // 最后把 expression 存放在 parent._context
        parent._context.push(expression);
      },
    },
  });

  return newAst;
}

type CodeGeneratorProps =
  | {
    type: string;
    name?: string;
    value?: string;
    body?: Params[] | TypeExpressionStatement[];
    expression?: CalleeExpression;
    callee?: Callee;
    arguments?: any[];
  }
  | AST
  | TypeLiteral
  | StringLiteral
  | NumberLiteral
  | TypeCallParamsExpression
  | TypeExpressionStatement
  | CalleeExpression
  | Callee;

/**
 * 代码生成
 */
function codeGenerator(node: CodeGeneratorProps): string {
  // 判断 node.type 的类型
  switch (node.type) {
    // 对于 Program 节点 将 node.body 中的每个节点调用代码生成器，最后用换行符连接
    case "Program":
      return (node as AST).body.map(codeGenerator).join("\n");

    // 对于 ExpressionStatement 将调用嵌套的代码生成器

    case "ExpressionStatement":
      return codeGenerator((node as ExpressionStatement).expression) + ";";

    // 调用表达式(CallExpression) 返回 callee 代码生成器的代码和参数
    // 在 arguments 数组中的每个节点通过代码生成器，用逗号连接并添加左右括号
    // 表达式后面添加分号

    case "CallExpression":
      return codeGenerator((node as CallExpression).callee) + "(" +
        (node as CallExpression).arguments.map(codeGenerator).join(", ") + ")";

    // 标识符(Identifier) 返回 node.name

    case "Identifier":
      return (node as Identifier).name;

    // 数字标识符(NumberLiteral) 返回 node.value

    case "NumberLiteral":
      return (node as NumberLiteral).value;

    // 字符串标识符(StringLiteral) 添加引号 并返回 node.value

    case "StringLiteral":
      return '"' + (node as StringLiteral).value + '"';

    // 如果没有识别出节点就抛出错误

    default:
      throw new TypeError(node.type);
  }
}

/**
 * 编译器
 * 1. input  => tokenizer   => tokens
 * 2. tokens => parser      => ast
 * 3. ast    => transformer => newAst
 * 4. newAst => generator   => output
 */
function compiler(input: string) {
  let tokens = tokenizer(input);
  let ast = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);

  return output;
}

export { codeGenerator, compiler, parser, tokenizer, transformer, traverser };
