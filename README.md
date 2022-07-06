## 编译原理

编译器的编译原理大多分为三个阶段: 解析、转换和代码生成

**解析(Parsing)**: 将原始代码转化成 **AST 抽象语法树**

**转换(Transformation)**: 对 AST 抽象语法树进行处理，变化结构

**代码生成(Code Generation)**: 把处理后的 AST 抽象语法树转化成代码

### 解析(Parsing)

解析分为两个阶段 词义分析 和 语法分析

**词义分析(Lexical Analysis)**: 词义分析是接收原始代码进行分词，最后生成 token

**语法分析(Syntactic Analysis)**: 接收词义分析的 tokens, 然后分析之间内部关系，最终生成抽象语法树 (Abstract Syntax Tree) 缩写为 AST

### 转换(Transformation)

对 AST 抽象语法树进行处理, 可以在同语言间进行转换，也可以转换成全新的语言

通过遍历器和转换器可以添加、移动、替代、删除 AST 抽象语法树的节点

遍历器为了修改 AST 抽象语法树，首先要对节点进行遍历，采用深度遍历的方法

转换器用于遍历过程转换数据，接收解析构建好的 AST 抽象语法树把它和 visitor 传递进入遍历器，最后得到新的 AST 抽象语法树

### 代码生成(Code Generation)

根据转换好的 AST 抽象语法树的每个结点生成目标代码

#### 参考资料

[the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)
