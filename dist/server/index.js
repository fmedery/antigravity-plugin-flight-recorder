/* flight-recorder v0.4.2 */
import { createRequire as __frCreateRequire } from "node:module"; const require = __frCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: !0 }) : target,
  mod
));

// node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS({
  "node_modules/ajv/dist/compile/codegen/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
    var _CodeOrName = class {
    };
    exports._CodeOrName = _CodeOrName;
    exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    var Name = class extends _CodeOrName {
      constructor(s) {
        if (super(), !exports.IDENTIFIER.test(s))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = s;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return !1;
      }
      get names() {
        return { [this.str]: 1 };
      }
    };
    exports.Name = Name;
    var _Code = class extends _CodeOrName {
      constructor(code) {
        super(), this._items = typeof code == "string" ? [code] : code;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return !1;
        let item = this._items[0];
        return item === "" || item === '""';
      }
      get str() {
        var _a;
        return (_a = this._str) !== null && _a !== void 0 ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
      }
      get names() {
        var _a;
        return (_a = this._names) !== null && _a !== void 0 ? _a : this._names = this._items.reduce((names, c) => (c instanceof Name && (names[c.str] = (names[c.str] || 0) + 1), names), {});
      }
    };
    exports._Code = _Code;
    exports.nil = new _Code("");
    function _(strs, ...args) {
      let code = [strs[0]], i = 0;
      for (; i < args.length; )
        addCodeArg(code, args[i]), code.push(strs[++i]);
      return new _Code(code);
    }
    exports._ = _;
    var plus = new _Code("+");
    function str(strs, ...args) {
      let expr = [safeStringify(strs[0])], i = 0;
      for (; i < args.length; )
        expr.push(plus), addCodeArg(expr, args[i]), expr.push(plus, safeStringify(strs[++i]));
      return optimize(expr), new _Code(expr);
    }
    exports.str = str;
    function addCodeArg(code, arg) {
      arg instanceof _Code ? code.push(...arg._items) : arg instanceof Name ? code.push(arg) : code.push(interpolate(arg));
    }
    exports.addCodeArg = addCodeArg;
    function optimize(expr) {
      let i = 1;
      for (; i < expr.length - 1; ) {
        if (expr[i] === plus) {
          let res = mergeExprItems(expr[i - 1], expr[i + 1]);
          if (res !== void 0) {
            expr.splice(i - 1, 3, res);
            continue;
          }
          expr[i++] = "+";
        }
        i++;
      }
    }
    function mergeExprItems(a, b) {
      if (b === '""')
        return a;
      if (a === '""')
        return b;
      if (typeof a == "string")
        return b instanceof Name || a[a.length - 1] !== '"' ? void 0 : typeof b != "string" ? `${a.slice(0, -1)}${b}"` : b[0] === '"' ? a.slice(0, -1) + b.slice(1) : void 0;
      if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
        return `"${a}${b.slice(1)}`;
    }
    function strConcat(c1, c2) {
      return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
    }
    exports.strConcat = strConcat;
    function interpolate(x) {
      return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
    }
    function stringify(x) {
      return new _Code(safeStringify(x));
    }
    exports.stringify = stringify;
    function safeStringify(x) {
      return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    exports.safeStringify = safeStringify;
    function getProperty(key) {
      return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
    }
    exports.getProperty = getProperty;
    function getEsmExportName(key) {
      if (typeof key == "string" && exports.IDENTIFIER.test(key))
        return new _Code(`${key}`);
      throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
    }
    exports.getEsmExportName = getEsmExportName;
    function regexpCode(rx) {
      return new _Code(rx.toString());
    }
    exports.regexpCode = regexpCode;
  }
});

// node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS({
  "node_modules/ajv/dist/compile/codegen/scope.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
    var code_1 = require_code(), ValueError = class extends Error {
      constructor(name) {
        super(`CodeGen: "code" for ${name} not defined`), this.value = name.value;
      }
    }, UsedValueState;
    (function(UsedValueState2) {
      UsedValueState2[UsedValueState2.Started = 0] = "Started", UsedValueState2[UsedValueState2.Completed = 1] = "Completed";
    })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
    exports.varKinds = {
      const: new code_1.Name("const"),
      let: new code_1.Name("let"),
      var: new code_1.Name("var")
    };
    var Scope = class {
      constructor({ prefixes, parent } = {}) {
        this._names = {}, this._prefixes = prefixes, this._parent = parent;
      }
      toName(nameOrPrefix) {
        return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
      }
      name(prefix) {
        return new code_1.Name(this._newName(prefix));
      }
      _newName(prefix) {
        let ng = this._names[prefix] || this._nameGroup(prefix);
        return `${prefix}${ng.index++}`;
      }
      _nameGroup(prefix) {
        var _a, _b;
        if (!((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0) && _b.has(prefix) || this._prefixes && !this._prefixes.has(prefix))
          throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
        return this._names[prefix] = { prefix, index: 0 };
      }
    };
    exports.Scope = Scope;
    var ValueScopeName = class extends code_1.Name {
      constructor(prefix, nameStr) {
        super(nameStr), this.prefix = prefix;
      }
      setValue(value, { property, itemIndex }) {
        this.value = value, this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
      }
    };
    exports.ValueScopeName = ValueScopeName;
    var line = (0, code_1._)`\n`, ValueScope = class extends Scope {
      constructor(opts) {
        super(opts), this._values = {}, this._scope = opts.scope, this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
      }
      get() {
        return this._scope;
      }
      name(prefix) {
        return new ValueScopeName(prefix, this._newName(prefix));
      }
      value(nameOrPrefix, value) {
        var _a;
        if (value.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        let name = this.toName(nameOrPrefix), { prefix } = name, valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref, vs = this._values[prefix];
        if (vs) {
          let _name = vs.get(valueKey);
          if (_name)
            return _name;
        } else
          vs = this._values[prefix] = /* @__PURE__ */ new Map();
        vs.set(valueKey, name);
        let s = this._scope[prefix] || (this._scope[prefix] = []), itemIndex = s.length;
        return s[itemIndex] = value.ref, name.setValue(value, { property: prefix, itemIndex }), name;
      }
      getValue(prefix, keyOrRef) {
        let vs = this._values[prefix];
        if (vs)
          return vs.get(keyOrRef);
      }
      scopeRefs(scopeName, values = this._values) {
        return this._reduceValues(values, (name) => {
          if (name.scopePath === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return (0, code_1._)`${scopeName}${name.scopePath}`;
        });
      }
      scopeCode(values = this._values, usedValues, getCode) {
        return this._reduceValues(values, (name) => {
          if (name.value === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return name.value.code;
        }, usedValues, getCode);
      }
      _reduceValues(values, valueCode, usedValues = {}, getCode) {
        let code = code_1.nil;
        for (let prefix in values) {
          let vs = values[prefix];
          if (!vs)
            continue;
          let nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
          vs.forEach((name) => {
            if (nameSet.has(name))
              return;
            nameSet.set(name, UsedValueState.Started);
            let c = valueCode(name);
            if (c) {
              let def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
              code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
            } else if (c = getCode?.(name))
              code = (0, code_1._)`${code}${c}${this.opts._n}`;
            else
              throw new ValueError(name);
            nameSet.set(name, UsedValueState.Completed);
          });
        }
        return code;
      }
    };
    exports.ValueScope = ValueScope;
  }
});

// node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS({
  "node_modules/ajv/dist/compile/codegen/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
    var code_1 = require_code(), scope_1 = require_scope(), code_2 = require_code();
    Object.defineProperty(exports, "_", { enumerable: !0, get: function() {
      return code_2._;
    } });
    Object.defineProperty(exports, "str", { enumerable: !0, get: function() {
      return code_2.str;
    } });
    Object.defineProperty(exports, "strConcat", { enumerable: !0, get: function() {
      return code_2.strConcat;
    } });
    Object.defineProperty(exports, "nil", { enumerable: !0, get: function() {
      return code_2.nil;
    } });
    Object.defineProperty(exports, "getProperty", { enumerable: !0, get: function() {
      return code_2.getProperty;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: !0, get: function() {
      return code_2.stringify;
    } });
    Object.defineProperty(exports, "regexpCode", { enumerable: !0, get: function() {
      return code_2.regexpCode;
    } });
    Object.defineProperty(exports, "Name", { enumerable: !0, get: function() {
      return code_2.Name;
    } });
    var scope_2 = require_scope();
    Object.defineProperty(exports, "Scope", { enumerable: !0, get: function() {
      return scope_2.Scope;
    } });
    Object.defineProperty(exports, "ValueScope", { enumerable: !0, get: function() {
      return scope_2.ValueScope;
    } });
    Object.defineProperty(exports, "ValueScopeName", { enumerable: !0, get: function() {
      return scope_2.ValueScopeName;
    } });
    Object.defineProperty(exports, "varKinds", { enumerable: !0, get: function() {
      return scope_2.varKinds;
    } });
    exports.operators = {
      GT: new code_1._Code(">"),
      GTE: new code_1._Code(">="),
      LT: new code_1._Code("<"),
      LTE: new code_1._Code("<="),
      EQ: new code_1._Code("==="),
      NEQ: new code_1._Code("!=="),
      NOT: new code_1._Code("!"),
      OR: new code_1._Code("||"),
      AND: new code_1._Code("&&"),
      ADD: new code_1._Code("+")
    };
    var Node = class {
      optimizeNodes() {
        return this;
      }
      optimizeNames(_names, _constants) {
        return this;
      }
    }, Def = class extends Node {
      constructor(varKind, name, rhs) {
        super(), this.varKind = varKind, this.name = name, this.rhs = rhs;
      }
      render({ es5, _n }) {
        let varKind = es5 ? scope_1.varKinds.var : this.varKind, rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${varKind} ${this.name}${rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (names[this.name.str])
          return this.rhs && (this.rhs = optimizeExpr(this.rhs, names, constants)), this;
      }
      get names() {
        return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
      }
    }, Assign = class extends Node {
      constructor(lhs, rhs, sideEffects) {
        super(), this.lhs = lhs, this.rhs = rhs, this.sideEffects = sideEffects;
      }
      render({ _n }) {
        return `${this.lhs} = ${this.rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (!(this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects))
          return this.rhs = optimizeExpr(this.rhs, names, constants), this;
      }
      get names() {
        let names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
        return addExprNames(names, this.rhs);
      }
    }, AssignOp = class extends Assign {
      constructor(lhs, op, rhs, sideEffects) {
        super(lhs, rhs, sideEffects), this.op = op;
      }
      render({ _n }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
      }
    }, Label = class extends Node {
      constructor(label) {
        super(), this.label = label, this.names = {};
      }
      render({ _n }) {
        return `${this.label}:` + _n;
      }
    }, Break = class extends Node {
      constructor(label) {
        super(), this.label = label, this.names = {};
      }
      render({ _n }) {
        return `break${this.label ? ` ${this.label}` : ""};` + _n;
      }
    }, Throw = class extends Node {
      constructor(error2) {
        super(), this.error = error2;
      }
      render({ _n }) {
        return `throw ${this.error};` + _n;
      }
      get names() {
        return this.error.names;
      }
    }, AnyCode = class extends Node {
      constructor(code) {
        super(), this.code = code;
      }
      render({ _n }) {
        return `${this.code};` + _n;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(names, constants) {
        return this.code = optimizeExpr(this.code, names, constants), this;
      }
      get names() {
        return this.code instanceof code_1._CodeOrName ? this.code.names : {};
      }
    }, ParentNode = class extends Node {
      constructor(nodes = []) {
        super(), this.nodes = nodes;
      }
      render(opts) {
        return this.nodes.reduce((code, n) => code + n.render(opts), "");
      }
      optimizeNodes() {
        let { nodes } = this, i = nodes.length;
        for (; i--; ) {
          let n = nodes[i].optimizeNodes();
          Array.isArray(n) ? nodes.splice(i, 1, ...n) : n ? nodes[i] = n : nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      optimizeNames(names, constants) {
        let { nodes } = this, i = nodes.length;
        for (; i--; ) {
          let n = nodes[i];
          n.optimizeNames(names, constants) || (subtractNames(names, n.names), nodes.splice(i, 1));
        }
        return nodes.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((names, n) => addNames(names, n.names), {});
      }
    }, BlockNode = class extends ParentNode {
      render(opts) {
        return "{" + opts._n + super.render(opts) + "}" + opts._n;
      }
    }, Root = class extends ParentNode {
    }, Else = class extends BlockNode {
    };
    Else.kind = "else";
    var If = class _If extends BlockNode {
      constructor(condition, nodes) {
        super(nodes), this.condition = condition;
      }
      render(opts) {
        let code = `if(${this.condition})` + super.render(opts);
        return this.else && (code += "else " + this.else.render(opts)), code;
      }
      optimizeNodes() {
        super.optimizeNodes();
        let cond = this.condition;
        if (cond === !0)
          return this.nodes;
        let e = this.else;
        if (e) {
          let ns = e.optimizeNodes();
          e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
        }
        if (e)
          return cond === !1 ? e instanceof _If ? e : e.nodes : this.nodes.length ? this : new _If(not(cond), e instanceof _If ? [e] : e.nodes);
        if (!(cond === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(names, constants) {
        var _a;
        if (this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants), !!(super.optimizeNames(names, constants) || this.else))
          return this.condition = optimizeExpr(this.condition, names, constants), this;
      }
      get names() {
        let names = super.names;
        return addExprNames(names, this.condition), this.else && addNames(names, this.else.names), names;
      }
    };
    If.kind = "if";
    var For = class extends BlockNode {
    };
    For.kind = "for";
    var ForLoop = class extends For {
      constructor(iteration) {
        super(), this.iteration = iteration;
      }
      render(opts) {
        return `for(${this.iteration})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (super.optimizeNames(names, constants))
          return this.iteration = optimizeExpr(this.iteration, names, constants), this;
      }
      get names() {
        return addNames(super.names, this.iteration.names);
      }
    }, ForRange = class extends For {
      constructor(varKind, name, from, to) {
        super(), this.varKind = varKind, this.name = name, this.from = from, this.to = to;
      }
      render(opts) {
        let varKind = opts.es5 ? scope_1.varKinds.var : this.varKind, { name, from, to } = this;
        return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
      }
      get names() {
        let names = addExprNames(super.names, this.from);
        return addExprNames(names, this.to);
      }
    }, ForIter = class extends For {
      constructor(loop, varKind, name, iterable) {
        super(), this.loop = loop, this.varKind = varKind, this.name = name, this.iterable = iterable;
      }
      render(opts) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (super.optimizeNames(names, constants))
          return this.iterable = optimizeExpr(this.iterable, names, constants), this;
      }
      get names() {
        return addNames(super.names, this.iterable.names);
      }
    }, Func = class extends BlockNode {
      constructor(name, args, async) {
        super(), this.name = name, this.args = args, this.async = async;
      }
      render(opts) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(opts);
      }
    };
    Func.kind = "func";
    var Return = class extends ParentNode {
      render(opts) {
        return "return " + super.render(opts);
      }
    };
    Return.kind = "return";
    var Try = class extends BlockNode {
      render(opts) {
        let code = "try" + super.render(opts);
        return this.catch && (code += this.catch.render(opts)), this.finally && (code += this.finally.render(opts)), code;
      }
      optimizeNodes() {
        var _a, _b;
        return super.optimizeNodes(), (_a = this.catch) === null || _a === void 0 || _a.optimizeNodes(), (_b = this.finally) === null || _b === void 0 || _b.optimizeNodes(), this;
      }
      optimizeNames(names, constants) {
        var _a, _b;
        return super.optimizeNames(names, constants), (_a = this.catch) === null || _a === void 0 || _a.optimizeNames(names, constants), (_b = this.finally) === null || _b === void 0 || _b.optimizeNames(names, constants), this;
      }
      get names() {
        let names = super.names;
        return this.catch && addNames(names, this.catch.names), this.finally && addNames(names, this.finally.names), names;
      }
    }, Catch = class extends BlockNode {
      constructor(error2) {
        super(), this.error = error2;
      }
      render(opts) {
        return `catch(${this.error})` + super.render(opts);
      }
    };
    Catch.kind = "catch";
    var Finally = class extends BlockNode {
      render(opts) {
        return "finally" + super.render(opts);
      }
    };
    Finally.kind = "finally";
    var CodeGen = class {
      constructor(extScope, opts = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...opts, _n: opts.lines ? `
` : "" }, this._extScope = extScope, this._scope = new scope_1.Scope({ parent: extScope }), this._nodes = [new Root()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(prefix) {
        return this._scope.name(prefix);
      }
      // reserves unique name in the external scope
      scopeName(prefix) {
        return this._extScope.name(prefix);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(prefixOrName, value) {
        let name = this._extScope.value(prefixOrName, value);
        return (this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set())).add(name), name;
      }
      getScopeValue(prefix, keyOrRef) {
        return this._extScope.getValue(prefix, keyOrRef);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(scopeName) {
        return this._extScope.scopeRefs(scopeName, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(varKind, nameOrPrefix, rhs, constant) {
        let name = this._scope.toName(nameOrPrefix);
        return rhs !== void 0 && constant && (this._constants[name.str] = rhs), this._leafNode(new Def(varKind, name, rhs)), name;
      }
      // `const` declaration (`var` in es5 mode)
      const(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
      }
      // `var` declaration with optional assignment
      var(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
      }
      // assignment code
      assign(lhs, rhs, sideEffects) {
        return this._leafNode(new Assign(lhs, rhs, sideEffects));
      }
      // `+=` code
      add(lhs, rhs) {
        return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
      }
      // appends passed SafeExpr to code or executes Block
      code(c) {
        return typeof c == "function" ? c() : c !== code_1.nil && this._leafNode(new AnyCode(c)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...keyValues) {
        let code = ["{"];
        for (let [key, value] of keyValues)
          code.length > 1 && code.push(","), code.push(key), (key !== value || this.opts.es5) && (code.push(":"), (0, code_1.addCodeArg)(code, value));
        return code.push("}"), new code_1._Code(code);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(condition, thenBody, elseBody) {
        if (this._blockNode(new If(condition)), thenBody && elseBody)
          this.code(thenBody).else().code(elseBody).endIf();
        else if (thenBody)
          this.code(thenBody).endIf();
        else if (elseBody)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(condition) {
        return this._elseNode(new If(condition));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new Else());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(If, Else);
      }
      _for(node, forBody) {
        return this._blockNode(node), forBody && this.code(forBody).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(iteration, forBody) {
        return this._for(new ForLoop(iteration), forBody);
      }
      // `for` statement for a range of values
      forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
        let name = this._scope.toName(nameOrPrefix);
        return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
        let name = this._scope.toName(nameOrPrefix);
        if (this.opts.es5) {
          let arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
          return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
            this.var(name, (0, code_1._)`${arr}[${i}]`), forBody(name);
          });
        }
        return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
        let name = this._scope.toName(nameOrPrefix);
        return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(For);
      }
      // `label` statement
      label(label) {
        return this._leafNode(new Label(label));
      }
      // `break` statement
      break(label) {
        return this._leafNode(new Break(label));
      }
      // `return` statement
      return(value) {
        let node = new Return();
        if (this._blockNode(node), this.code(value), node.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(Return);
      }
      // `try` statement
      try(tryBody, catchCode, finallyCode) {
        if (!catchCode && !finallyCode)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        let node = new Try();
        if (this._blockNode(node), this.code(tryBody), catchCode) {
          let error2 = this.name("e");
          this._currNode = node.catch = new Catch(error2), catchCode(error2);
        }
        return finallyCode && (this._currNode = node.finally = new Finally(), this.code(finallyCode)), this._endBlockNode(Catch, Finally);
      }
      // `throw` statement
      throw(error2) {
        return this._leafNode(new Throw(error2));
      }
      // start self-balancing block
      block(body, nodeCount) {
        return this._blockStarts.push(this._nodes.length), body && this.code(body).endBlock(nodeCount), this;
      }
      // end the current self-balancing block
      endBlock(nodeCount) {
        let len = this._blockStarts.pop();
        if (len === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        let toClose = this._nodes.length - len;
        if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount)
          throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
        return this._nodes.length = len, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(name, args = code_1.nil, async, funcBody) {
        return this._blockNode(new Func(name, args, async)), funcBody && this.code(funcBody).endFunc(), this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(Func);
      }
      optimize(n = 1) {
        for (; n-- > 0; )
          this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(node) {
        return this._currNode.nodes.push(node), this;
      }
      _blockNode(node) {
        this._currNode.nodes.push(node), this._nodes.push(node);
      }
      _endBlockNode(N1, N2) {
        let n = this._currNode;
        if (n instanceof N1 || N2 && n instanceof N2)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
      }
      _elseNode(node) {
        let n = this._currNode;
        if (!(n instanceof If))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = n.else = node, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        let ns = this._nodes;
        return ns[ns.length - 1];
      }
      set _currNode(node) {
        let ns = this._nodes;
        ns[ns.length - 1] = node;
      }
    };
    exports.CodeGen = CodeGen;
    function addNames(names, from) {
      for (let n in from)
        names[n] = (names[n] || 0) + (from[n] || 0);
      return names;
    }
    function addExprNames(names, from) {
      return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
    }
    function optimizeExpr(expr, names, constants) {
      if (expr instanceof code_1.Name)
        return replaceName(expr);
      if (!canOptimize(expr))
        return expr;
      return new code_1._Code(expr._items.reduce((items, c) => (c instanceof code_1.Name && (c = replaceName(c)), c instanceof code_1._Code ? items.push(...c._items) : items.push(c), items), []));
      function replaceName(n) {
        let c = constants[n.str];
        return c === void 0 || names[n.str] !== 1 ? n : (delete names[n.str], c);
      }
      function canOptimize(e) {
        return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== void 0);
      }
    }
    function subtractNames(names, from) {
      for (let n in from)
        names[n] = (names[n] || 0) - (from[n] || 0);
    }
    function not(x) {
      return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
    }
    exports.not = not;
    var andCode = mappend(exports.operators.AND);
    function and(...args) {
      return args.reduce(andCode);
    }
    exports.and = and;
    var orCode = mappend(exports.operators.OR);
    function or(...args) {
      return args.reduce(orCode);
    }
    exports.or = or;
    function mappend(op) {
      return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
    }
    function par(x) {
      return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
    }
  }
});

// node_modules/ajv/dist/compile/util.js
var require_util = __commonJS({
  "node_modules/ajv/dist/compile/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
    var codegen_1 = require_codegen(), code_1 = require_code();
    function toHash(arr) {
      let hash = {};
      for (let item of arr)
        hash[item] = !0;
      return hash;
    }
    exports.toHash = toHash;
    function alwaysValidSchema(it, schema) {
      return typeof schema == "boolean" ? schema : Object.keys(schema).length === 0 ? !0 : (checkUnknownRules(it, schema), !schemaHasRules(schema, it.self.RULES.all));
    }
    exports.alwaysValidSchema = alwaysValidSchema;
    function checkUnknownRules(it, schema = it.schema) {
      let { opts, self } = it;
      if (!opts.strictSchema || typeof schema == "boolean")
        return;
      let rules = self.RULES.keywords;
      for (let key in schema)
        rules[key] || checkStrictMode(it, `unknown keyword: "${key}"`);
    }
    exports.checkUnknownRules = checkUnknownRules;
    function schemaHasRules(schema, rules) {
      if (typeof schema == "boolean")
        return !schema;
      for (let key in schema)
        if (rules[key])
          return !0;
      return !1;
    }
    exports.schemaHasRules = schemaHasRules;
    function schemaHasRulesButRef(schema, RULES) {
      if (typeof schema == "boolean")
        return !schema;
      for (let key in schema)
        if (key !== "$ref" && RULES.all[key])
          return !0;
      return !1;
    }
    exports.schemaHasRulesButRef = schemaHasRulesButRef;
    function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
      if (!$data) {
        if (typeof schema == "number" || typeof schema == "boolean")
          return schema;
        if (typeof schema == "string")
          return (0, codegen_1._)`${schema}`;
      }
      return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
    }
    exports.schemaRefOrVal = schemaRefOrVal;
    function unescapeFragment(str) {
      return unescapeJsonPointer(decodeURIComponent(str));
    }
    exports.unescapeFragment = unescapeFragment;
    function escapeFragment(str) {
      return encodeURIComponent(escapeJsonPointer(str));
    }
    exports.escapeFragment = escapeFragment;
    function escapeJsonPointer(str) {
      return typeof str == "number" ? `${str}` : str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    exports.escapeJsonPointer = escapeJsonPointer;
    function unescapeJsonPointer(str) {
      return str.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    exports.unescapeJsonPointer = unescapeJsonPointer;
    function eachItem(xs, f) {
      if (Array.isArray(xs))
        for (let x of xs)
          f(x);
      else
        f(xs);
    }
    exports.eachItem = eachItem;
    function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues: mergeValues3, resultToName }) {
      return (gen, from, to, toName) => {
        let res = to === void 0 ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues3(from, to);
        return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
      };
    }
    exports.mergeEvaluated = {
      props: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
          gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, !0), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
        }),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
          from === !0 ? gen.assign(to, !0) : (gen.assign(to, (0, codegen_1._)`${to} || {}`), setEvaluated(gen, to, from));
        }),
        mergeValues: (from, to) => from === !0 ? !0 : { ...from, ...to },
        resultToName: evaluatedPropsToName
      }),
      items: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === !0 ? !0 : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
        mergeValues: (from, to) => from === !0 ? !0 : Math.max(from, to),
        resultToName: (gen, items) => gen.var("items", items)
      })
    };
    function evaluatedPropsToName(gen, ps) {
      if (ps === !0)
        return gen.var("props", !0);
      let props = gen.var("props", (0, codegen_1._)`{}`);
      return ps !== void 0 && setEvaluated(gen, props, ps), props;
    }
    exports.evaluatedPropsToName = evaluatedPropsToName;
    function setEvaluated(gen, props, ps) {
      Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, !0));
    }
    exports.setEvaluated = setEvaluated;
    var snippets = {};
    function useFunc(gen, f) {
      return gen.scopeValue("func", {
        ref: f,
        code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
      });
    }
    exports.useFunc = useFunc;
    var Type;
    (function(Type2) {
      Type2[Type2.Num = 0] = "Num", Type2[Type2.Str = 1] = "Str";
    })(Type || (exports.Type = Type = {}));
    function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
      if (dataProp instanceof codegen_1.Name) {
        let isNumber = dataPropType === Type.Num;
        return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
      }
      return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
    }
    exports.getErrorPath = getErrorPath;
    function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
      if (mode) {
        if (msg = `strict mode: ${msg}`, mode === !0)
          throw new Error(msg);
        it.self.logger.warn(msg);
      }
    }
    exports.checkStrictMode = checkStrictMode;
  }
});

// node_modules/ajv/dist/compile/names.js
var require_names = __commonJS({
  "node_modules/ajv/dist/compile/names.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), names = {
      // validation function arguments
      data: new codegen_1.Name("data"),
      // data passed to validation function
      // args passed from referencing schema
      valCxt: new codegen_1.Name("valCxt"),
      // validation/data context - should not be used directly, it is destructured to the names below
      instancePath: new codegen_1.Name("instancePath"),
      parentData: new codegen_1.Name("parentData"),
      parentDataProperty: new codegen_1.Name("parentDataProperty"),
      rootData: new codegen_1.Name("rootData"),
      // root data - same as the data passed to the first/top validation function
      dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
      // used to support recursiveRef and dynamicRef
      // function scoped variables
      vErrors: new codegen_1.Name("vErrors"),
      // null or array of validation errors
      errors: new codegen_1.Name("errors"),
      // counter of validation errors
      this: new codegen_1.Name("this"),
      // "globals"
      self: new codegen_1.Name("self"),
      scope: new codegen_1.Name("scope"),
      // JTD serialize/parse name for JSON string and position
      json: new codegen_1.Name("json"),
      jsonPos: new codegen_1.Name("jsonPos"),
      jsonLen: new codegen_1.Name("jsonLen"),
      jsonPart: new codegen_1.Name("jsonPart")
    };
    exports.default = names;
  }
});

// node_modules/ajv/dist/compile/errors.js
var require_errors = __commonJS({
  "node_modules/ajv/dist/compile/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
    var codegen_1 = require_codegen(), util_1 = require_util(), names_1 = require_names();
    exports.keywordError = {
      message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
    };
    exports.keyword$DataError = {
      message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
    };
    function reportError(cxt, error2 = exports.keywordError, errorPaths, overrideAllErrors) {
      let { it } = cxt, { gen, compositeRule, allErrors } = it, errObj = errorObjectCode(cxt, error2, errorPaths);
      overrideAllErrors ?? (compositeRule || allErrors) ? addError(gen, errObj) : returnErrors(it, (0, codegen_1._)`[${errObj}]`);
    }
    exports.reportError = reportError;
    function reportExtraError(cxt, error2 = exports.keywordError, errorPaths) {
      let { it } = cxt, { gen, compositeRule, allErrors } = it, errObj = errorObjectCode(cxt, error2, errorPaths);
      addError(gen, errObj), compositeRule || allErrors || returnErrors(it, names_1.default.vErrors);
    }
    exports.reportExtraError = reportExtraError;
    function resetErrorsCount(gen, errsCount) {
      gen.assign(names_1.default.errors, errsCount), gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
    }
    exports.resetErrorsCount = resetErrorsCount;
    function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
      if (errsCount === void 0)
        throw new Error("ajv implementation error");
      let err = gen.name("err");
      gen.forRange("i", errsCount, names_1.default.errors, (i) => {
        gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`), gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath))), gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`), it.opts.verbose && (gen.assign((0, codegen_1._)`${err}.schema`, schemaValue), gen.assign((0, codegen_1._)`${err}.data`, data));
      });
    }
    exports.extendErrors = extendErrors;
    function addError(gen, errObj) {
      let err = gen.const("err", errObj);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`), gen.code((0, codegen_1._)`${names_1.default.errors}++`);
    }
    function returnErrors(it, errs) {
      let { gen, validateName, schemaEnv } = it;
      schemaEnv.$async ? gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`) : (gen.assign((0, codegen_1._)`${validateName}.errors`, errs), gen.return(!1));
    }
    var E = {
      keyword: new codegen_1.Name("keyword"),
      schemaPath: new codegen_1.Name("schemaPath"),
      // also used in JTD errors
      params: new codegen_1.Name("params"),
      propertyName: new codegen_1.Name("propertyName"),
      message: new codegen_1.Name("message"),
      schema: new codegen_1.Name("schema"),
      parentSchema: new codegen_1.Name("parentSchema")
    };
    function errorObjectCode(cxt, error2, errorPaths) {
      let { createErrors } = cxt.it;
      return createErrors === !1 ? (0, codegen_1._)`{}` : errorObject(cxt, error2, errorPaths);
    }
    function errorObject(cxt, error2, errorPaths = {}) {
      let { gen, it } = cxt, keyValues = [
        errorInstancePath(it, errorPaths),
        errorSchemaPath(cxt, errorPaths)
      ];
      return extraErrorProps(cxt, error2, keyValues), gen.object(...keyValues);
    }
    function errorInstancePath({ errorPath }, { instancePath }) {
      let instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
      return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
    }
    function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
      let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
      return schemaPath && (schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`), [E.schemaPath, schPath];
    }
    function extraErrorProps(cxt, { params, message }, keyValues) {
      let { keyword, data, schemaValue, it } = cxt, { opts, propertyName, topSchemaRef, schemaPath } = it;
      keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]), opts.messages && keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]), opts.verbose && keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]), propertyName && keyValues.push([E.propertyName, propertyName]);
    }
  }
});

// node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS({
  "node_modules/ajv/dist/compile/validate/boolSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
    var errors_1 = require_errors(), codegen_1 = require_codegen(), names_1 = require_names(), boolError = {
      message: "boolean schema is false"
    };
    function topBoolOrEmptySchema(it) {
      let { gen, schema, validateName } = it;
      schema === !1 ? falseSchemaError(it, !1) : typeof schema == "object" && schema.$async === !0 ? gen.return(names_1.default.data) : (gen.assign((0, codegen_1._)`${validateName}.errors`, null), gen.return(!0));
    }
    exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
    function boolOrEmptySchema(it, valid) {
      let { gen, schema } = it;
      schema === !1 ? (gen.var(valid, !1), falseSchemaError(it)) : gen.var(valid, !0);
    }
    exports.boolOrEmptySchema = boolOrEmptySchema;
    function falseSchemaError(it, overrideAllErrors) {
      let { gen, data } = it, cxt = {
        gen,
        keyword: "false schema",
        data,
        schema: !1,
        schemaCode: !1,
        schemaValue: !1,
        params: {},
        it
      };
      (0, errors_1.reportError)(cxt, boolError, void 0, overrideAllErrors);
    }
  }
});

// node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS({
  "node_modules/ajv/dist/compile/rules.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.getRules = exports.isJSONType = void 0;
    var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"], jsonTypes = new Set(_jsonTypes);
    function isJSONType(x) {
      return typeof x == "string" && jsonTypes.has(x);
    }
    exports.isJSONType = isJSONType;
    function getRules() {
      let groups = {
        number: { type: "number", rules: [] },
        string: { type: "string", rules: [] },
        array: { type: "array", rules: [] },
        object: { type: "object", rules: [] }
      };
      return {
        types: { ...groups, integer: !0, boolean: !0, null: !0 },
        rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
        post: { rules: [] },
        all: {},
        keywords: {}
      };
    }
    exports.getRules = getRules;
  }
});

// node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS({
  "node_modules/ajv/dist/compile/validate/applicability.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
    function schemaHasRulesForType({ schema, self }, type) {
      let group = self.RULES.types[type];
      return group && group !== !0 && shouldUseGroup(schema, group);
    }
    exports.schemaHasRulesForType = schemaHasRulesForType;
    function shouldUseGroup(schema, group) {
      return group.rules.some((rule) => shouldUseRule(schema, rule));
    }
    exports.shouldUseGroup = shouldUseGroup;
    function shouldUseRule(schema, rule) {
      var _a;
      return schema[rule.keyword] !== void 0 || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== void 0));
    }
    exports.shouldUseRule = shouldUseRule;
  }
});

// node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS({
  "node_modules/ajv/dist/compile/validate/dataType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
    var rules_1 = require_rules(), applicability_1 = require_applicability(), errors_1 = require_errors(), codegen_1 = require_codegen(), util_1 = require_util(), DataType;
    (function(DataType2) {
      DataType2[DataType2.Correct = 0] = "Correct", DataType2[DataType2.Wrong = 1] = "Wrong";
    })(DataType || (exports.DataType = DataType = {}));
    function getSchemaTypes(schema) {
      let types = getJSONTypes(schema.type);
      if (types.includes("null")) {
        if (schema.nullable === !1)
          throw new Error("type: null contradicts nullable: false");
      } else {
        if (!types.length && schema.nullable !== void 0)
          throw new Error('"nullable" cannot be used without "type"');
        schema.nullable === !0 && types.push("null");
      }
      return types;
    }
    exports.getSchemaTypes = getSchemaTypes;
    function getJSONTypes(ts) {
      let types = Array.isArray(ts) ? ts : ts ? [ts] : [];
      if (types.every(rules_1.isJSONType))
        return types;
      throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
    }
    exports.getJSONTypes = getJSONTypes;
    function coerceAndCheckDataType(it, types) {
      let { gen, data, opts } = it, coerceTo = coerceToTypes(types, opts.coerceTypes), checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
      if (checkTypes) {
        let wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
        gen.if(wrongType, () => {
          coerceTo.length ? coerceData(it, types, coerceTo) : reportTypeError(it);
        });
      }
      return checkTypes;
    }
    exports.coerceAndCheckDataType = coerceAndCheckDataType;
    var COERCIBLE = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
    function coerceToTypes(types, coerceTypes) {
      return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
    }
    function coerceData(it, types, coerceTo) {
      let { gen, data, opts } = it, dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`), coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
      opts.coerceTypes === "array" && gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data))), gen.if((0, codegen_1._)`${coerced} !== undefined`);
      for (let t of coerceTo)
        (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") && coerceSpecificType(t);
      gen.else(), reportTypeError(it), gen.endIf(), gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
        gen.assign(data, coerced), assignParentData(it, coerced);
      });
      function coerceSpecificType(t) {
        switch (t) {
          case "string":
            gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
            return;
          case "number":
            gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "integer":
            gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "boolean":
            gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, !1).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, !0);
            return;
          case "null":
            gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`), gen.assign(coerced, null);
            return;
          case "array":
            gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
        }
      }
    }
    function assignParentData({ gen, parentData, parentDataProperty }, expr) {
      gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
    }
    function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
      let EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ, cond;
      switch (dataType) {
        case "null":
          return (0, codegen_1._)`${data} ${EQ} null`;
        case "array":
          cond = (0, codegen_1._)`Array.isArray(${data})`;
          break;
        case "object":
          cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
          break;
        case "integer":
          cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
          break;
        case "number":
          cond = numCond();
          break;
        default:
          return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
      }
      return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
      function numCond(_cond = codegen_1.nil) {
        return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
      }
    }
    exports.checkDataType = checkDataType;
    function checkDataTypes(dataTypes, data, strictNums, correct) {
      if (dataTypes.length === 1)
        return checkDataType(dataTypes[0], data, strictNums, correct);
      let cond, types = (0, util_1.toHash)(dataTypes);
      if (types.array && types.object) {
        let notObj = (0, codegen_1._)`typeof ${data} != "object"`;
        cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`, delete types.null, delete types.array, delete types.object;
      } else
        cond = codegen_1.nil;
      types.number && delete types.integer;
      for (let t in types)
        cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
      return cond;
    }
    exports.checkDataTypes = checkDataTypes;
    var typeError = {
      message: ({ schema }) => `must be ${schema}`,
      params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
    };
    function reportTypeError(it) {
      let cxt = getTypeErrorContext(it);
      (0, errors_1.reportError)(cxt, typeError);
    }
    exports.reportTypeError = reportTypeError;
    function getTypeErrorContext(it) {
      let { gen, data, schema } = it, schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
      return {
        gen,
        keyword: "type",
        data,
        schema: schema.type,
        schemaCode,
        schemaValue: schemaCode,
        parentSchema: schema,
        params: {},
        it
      };
    }
  }
});

// node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS({
  "node_modules/ajv/dist/compile/validate/defaults.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.assignDefaults = void 0;
    var codegen_1 = require_codegen(), util_1 = require_util();
    function assignDefaults(it, ty) {
      let { properties, items } = it.schema;
      if (ty === "object" && properties)
        for (let key in properties)
          assignDefault(it, key, properties[key].default);
      else ty === "array" && Array.isArray(items) && items.forEach((sch, i) => assignDefault(it, i, sch.default));
    }
    exports.assignDefaults = assignDefaults;
    function assignDefault(it, prop, defaultValue) {
      let { gen, compositeRule, data, opts } = it;
      if (defaultValue === void 0)
        return;
      let childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
      if (compositeRule) {
        (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
        return;
      }
      let condition = (0, codegen_1._)`${childData} === undefined`;
      opts.useDefaults === "empty" && (condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`), gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
    }
  }
});

// node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
    var codegen_1 = require_codegen(), util_1 = require_util(), names_1 = require_names(), util_2 = require_util();
    function checkReportMissingProp(cxt, prop) {
      let { gen, data, it } = cxt;
      gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
        cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, !0), cxt.error();
      });
    }
    exports.checkReportMissingProp = checkReportMissingProp;
    function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
      return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
    }
    exports.checkMissingProp = checkMissingProp;
    function reportMissingProp(cxt, missing) {
      cxt.setParams({ missingProperty: missing }, !0), cxt.error();
    }
    exports.reportMissingProp = reportMissingProp;
    function hasPropFunc(gen) {
      return gen.scopeValue("func", {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ref: Object.prototype.hasOwnProperty,
        code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
      });
    }
    exports.hasPropFunc = hasPropFunc;
    function isOwnProperty(gen, data, property) {
      return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
    }
    exports.isOwnProperty = isOwnProperty;
    function propertyInData(gen, data, property, ownProperties) {
      let cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
      return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
    }
    exports.propertyInData = propertyInData;
    function noPropertyInData(gen, data, property, ownProperties) {
      let cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
      return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
    }
    exports.noPropertyInData = noPropertyInData;
    function allSchemaProperties(schemaMap) {
      return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
    }
    exports.allSchemaProperties = allSchemaProperties;
    function schemaProperties(it, schemaMap) {
      return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
    }
    exports.schemaProperties = schemaProperties;
    function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
      let dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data, valCxt = [
        [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
        [names_1.default.parentData, it.parentData],
        [names_1.default.parentDataProperty, it.parentDataProperty],
        [names_1.default.rootData, names_1.default.rootData]
      ];
      it.opts.dynamicRef && valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
      let args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
      return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
    }
    exports.callValidateCode = callValidateCode;
    var newRegExp = (0, codegen_1._)`new RegExp`;
    function usePattern({ gen, it: { opts } }, pattern) {
      let u = opts.unicodeRegExp ? "u" : "", { regExp } = opts.code, rx = regExp(pattern, u);
      return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
      });
    }
    exports.usePattern = usePattern;
    function validateArray(cxt) {
      let { gen, data, keyword, it } = cxt, valid = gen.name("valid");
      if (it.allErrors) {
        let validArr = gen.let("valid", !0);
        return validateItems(() => gen.assign(validArr, !1)), validArr;
      }
      return gen.var(valid, !0), validateItems(() => gen.break()), valid;
      function validateItems(notValid) {
        let len = gen.const("len", (0, codegen_1._)`${data}.length`);
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword,
            dataProp: i,
            dataPropType: util_1.Type.Num
          }, valid), gen.if((0, codegen_1.not)(valid), notValid);
        });
      }
    }
    exports.validateArray = validateArray;
    function validateUnion(cxt) {
      let { gen, schema, keyword, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      if (schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch)) && !it.opts.unevaluated)
        return;
      let valid = gen.let("valid", !1), schValid = gen.name("_valid");
      gen.block(() => schema.forEach((_sch, i) => {
        let schCxt = cxt.subschema({
          keyword,
          schemaProp: i,
          compositeRule: !0
        }, schValid);
        gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`), cxt.mergeValidEvaluated(schCxt, schValid) || gen.if((0, codegen_1.not)(valid));
      })), cxt.result(valid, () => cxt.reset(), () => cxt.error(!0));
    }
    exports.validateUnion = validateUnion;
  }
});

// node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS({
  "node_modules/ajv/dist/compile/validate/keyword.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
    var codegen_1 = require_codegen(), names_1 = require_names(), code_1 = require_code2(), errors_1 = require_errors();
    function macroKeywordCode(cxt, def) {
      let { gen, keyword, schema, parentSchema, it } = cxt, macroSchema = def.macro.call(it.self, schema, parentSchema, it), schemaRef = useKeyword(gen, keyword, macroSchema);
      it.opts.validateSchema !== !1 && it.self.validateSchema(macroSchema, !0);
      let valid = gen.name("valid");
      cxt.subschema({
        schema: macroSchema,
        schemaPath: codegen_1.nil,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        topSchemaRef: schemaRef,
        compositeRule: !0
      }, valid), cxt.pass(valid, () => cxt.error(!0));
    }
    exports.macroKeywordCode = macroKeywordCode;
    function funcKeywordCode(cxt, def) {
      var _a;
      let { gen, keyword, schema, parentSchema, $data, it } = cxt;
      checkAsyncKeyword(it, def);
      let validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate, validateRef = useKeyword(gen, keyword, validate), valid = gen.let("valid");
      cxt.block$data(valid, validateKeyword), cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
      function validateKeyword() {
        if (def.errors === !1)
          assignValid(), def.modifying && modifyData(cxt), reportErrs(() => cxt.error());
        else {
          let ruleErrs = def.async ? validateAsync() : validateSync();
          def.modifying && modifyData(cxt), reportErrs(() => addErrs(cxt, ruleErrs));
        }
      }
      function validateAsync() {
        let ruleErrs = gen.let("ruleErrs", null);
        return gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, !1).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e))), ruleErrs;
      }
      function validateSync() {
        let validateErrs = (0, codegen_1._)`${validateRef}.errors`;
        return gen.assign(validateErrs, null), assignValid(codegen_1.nil), validateErrs;
      }
      function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
        let passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self, passSchema = !("compile" in def && !$data || def.schema === !1);
        gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
      }
      function reportErrs(errors) {
        var _a2;
        gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== void 0 ? _a2 : valid), errors);
      }
    }
    exports.funcKeywordCode = funcKeywordCode;
    function modifyData(cxt) {
      let { gen, data, it } = cxt;
      gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
    }
    function addErrs(cxt, errs) {
      let { gen } = cxt;
      gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`), (0, errors_1.extendErrors)(cxt);
      }, () => cxt.error());
    }
    function checkAsyncKeyword({ schemaEnv }, def) {
      if (def.async && !schemaEnv.$async)
        throw new Error("async keyword in sync schema");
    }
    function useKeyword(gen, keyword, result) {
      if (result === void 0)
        throw new Error(`keyword "${keyword}" failed to compile`);
      return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
    }
    function validSchemaType(schema, schemaType, allowUndefined = !1) {
      return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema > "u");
    }
    exports.validSchemaType = validSchemaType;
    function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
      if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword)
        throw new Error("ajv implementation error");
      let deps = def.dependencies;
      if (deps?.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd)))
        throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
      if (def.validateSchema && !def.validateSchema(schema[keyword])) {
        let msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
        if (opts.validateSchema === "log")
          self.logger.error(msg);
        else
          throw new Error(msg);
      }
    }
    exports.validateKeywordUsage = validateKeywordUsage;
  }
});

// node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS({
  "node_modules/ajv/dist/compile/validate/subschema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
    var codegen_1 = require_codegen(), util_1 = require_util();
    function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
      if (keyword !== void 0 && schema !== void 0)
        throw new Error('both "keyword" and "schema" passed, only one allowed');
      if (keyword !== void 0) {
        let sch = it.schema[keyword];
        return schemaProp === void 0 ? {
          schema: sch,
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}`
        } : {
          schema: sch[schemaProp],
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
        };
      }
      if (schema !== void 0) {
        if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0)
          throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
        return {
          schema,
          schemaPath,
          topSchemaRef,
          errSchemaPath
        };
      }
      throw new Error('either "keyword" or "schema" must be passed');
    }
    exports.getSubschema = getSubschema;
    function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
      if (data !== void 0 && dataProp !== void 0)
        throw new Error('both "data" and "dataProp" passed, only one allowed');
      let { gen } = it;
      if (dataProp !== void 0) {
        let { errorPath, dataPathArr, opts } = it, nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, !0);
        dataContextProps(nextData), subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`, subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`, subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
      }
      if (data !== void 0) {
        let nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, !0);
        dataContextProps(nextData), propertyName !== void 0 && (subschema.propertyName = propertyName);
      }
      dataTypes && (subschema.dataTypes = dataTypes);
      function dataContextProps(_nextData) {
        subschema.data = _nextData, subschema.dataLevel = it.dataLevel + 1, subschema.dataTypes = [], it.definedProperties = /* @__PURE__ */ new Set(), subschema.parentData = it.data, subschema.dataNames = [...it.dataNames, _nextData];
      }
    }
    exports.extendSubschemaData = extendSubschemaData;
    function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
      compositeRule !== void 0 && (subschema.compositeRule = compositeRule), createErrors !== void 0 && (subschema.createErrors = createErrors), allErrors !== void 0 && (subschema.allErrors = allErrors), subschema.jtdDiscriminator = jtdDiscriminator, subschema.jtdMetadata = jtdMetadata;
    }
    exports.extendSubschemaMode = extendSubschemaMode;
  }
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "node_modules/fast-deep-equal/index.js"(exports, module) {
    "use strict";
    module.exports = function equal(a, b) {
      if (a === b) return !0;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return !1;
        var length, i, keys;
        if (Array.isArray(a)) {
          if (length = a.length, length != b.length) return !1;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return !1;
          return !0;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        if (keys = Object.keys(a), length = keys.length, length !== Object.keys(b).length) return !1;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return !1;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!equal(a[key], b[key])) return !1;
        }
        return !0;
      }
      return a !== a && b !== b;
    };
  }
});

// node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS({
  "node_modules/json-schema-traverse/index.js"(exports, module) {
    "use strict";
    var traverse = module.exports = function(schema, opts, cb) {
      typeof opts == "function" && (cb = opts, opts = {}), cb = opts.cb || cb;
      var pre = typeof cb == "function" ? cb : cb.pre || function() {
      }, post = cb.post || function() {
      };
      _traverse(opts, pre, post, schema, "", schema);
    };
    traverse.keywords = {
      additionalItems: !0,
      items: !0,
      contains: !0,
      additionalProperties: !0,
      propertyNames: !0,
      not: !0,
      if: !0,
      then: !0,
      else: !0
    };
    traverse.arrayKeywords = {
      items: !0,
      allOf: !0,
      anyOf: !0,
      oneOf: !0
    };
    traverse.propsKeywords = {
      $defs: !0,
      definitions: !0,
      properties: !0,
      patternProperties: !0,
      dependencies: !0
    };
    traverse.skipKeywords = {
      default: !0,
      enum: !0,
      const: !0,
      required: !0,
      maximum: !0,
      minimum: !0,
      exclusiveMaximum: !0,
      exclusiveMinimum: !0,
      multipleOf: !0,
      maxLength: !0,
      minLength: !0,
      pattern: !0,
      format: !0,
      maxItems: !0,
      minItems: !0,
      uniqueItems: !0,
      maxProperties: !0,
      minProperties: !0
    };
    function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
      if (schema && typeof schema == "object" && !Array.isArray(schema)) {
        pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
        for (var key in schema) {
          var sch = schema[key];
          if (Array.isArray(sch)) {
            if (key in traverse.arrayKeywords)
              for (var i = 0; i < sch.length; i++)
                _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
          } else if (key in traverse.propsKeywords) {
            if (sch && typeof sch == "object")
              for (var prop in sch)
                _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
          } else (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) && _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
        }
        post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      }
    }
    function escapeJsonPtr(str) {
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
  }
});

// node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS({
  "node_modules/ajv/dist/compile/resolve.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
    var util_1 = require_util(), equal = require_fast_deep_equal(), traverse = require_json_schema_traverse(), SIMPLE_INLINED = /* @__PURE__ */ new Set([
      "type",
      "format",
      "pattern",
      "maxLength",
      "minLength",
      "maxProperties",
      "minProperties",
      "maxItems",
      "minItems",
      "maximum",
      "minimum",
      "uniqueItems",
      "multipleOf",
      "required",
      "enum",
      "const"
    ]);
    function inlineRef(schema, limit = !0) {
      return typeof schema == "boolean" ? !0 : limit === !0 ? !hasRef(schema) : limit ? countKeys(schema) <= limit : !1;
    }
    exports.inlineRef = inlineRef;
    var REF_KEYWORDS = /* @__PURE__ */ new Set([
      "$ref",
      "$recursiveRef",
      "$recursiveAnchor",
      "$dynamicRef",
      "$dynamicAnchor"
    ]);
    function hasRef(schema) {
      for (let key in schema) {
        if (REF_KEYWORDS.has(key))
          return !0;
        let sch = schema[key];
        if (Array.isArray(sch) && sch.some(hasRef) || typeof sch == "object" && hasRef(sch))
          return !0;
      }
      return !1;
    }
    function countKeys(schema) {
      let count = 0;
      for (let key in schema) {
        if (key === "$ref")
          return 1 / 0;
        if (count++, !SIMPLE_INLINED.has(key) && (typeof schema[key] == "object" && (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch)), count === 1 / 0))
          return 1 / 0;
      }
      return count;
    }
    function getFullPath(resolver, id = "", normalize) {
      normalize !== !1 && (id = normalizeId(id));
      let p = resolver.parse(id);
      return _getFullPath(resolver, p);
    }
    exports.getFullPath = getFullPath;
    function _getFullPath(resolver, p) {
      return resolver.serialize(p).split("#")[0] + "#";
    }
    exports._getFullPath = _getFullPath;
    var TRAILING_SLASH_HASH = /#\/?$/;
    function normalizeId(id) {
      return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
    }
    exports.normalizeId = normalizeId;
    function resolveUrl(resolver, baseId, id) {
      return id = normalizeId(id), resolver.resolve(baseId, id);
    }
    exports.resolveUrl = resolveUrl;
    var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
    function getSchemaRefs(schema, baseId) {
      if (typeof schema == "boolean")
        return {};
      let { schemaId, uriResolver } = this.opts, schId = normalizeId(schema[schemaId] || baseId), baseIds = { "": schId }, pathPrefix = getFullPath(uriResolver, schId, !1), localRefs = {}, schemaRefs = /* @__PURE__ */ new Set();
      return traverse(schema, { allKeys: !0 }, (sch, jsonPtr, _, parentJsonPtr) => {
        if (parentJsonPtr === void 0)
          return;
        let fullPath = pathPrefix + jsonPtr, innerBaseId = baseIds[parentJsonPtr];
        typeof sch[schemaId] == "string" && (innerBaseId = addRef.call(this, sch[schemaId])), addAnchor.call(this, sch.$anchor), addAnchor.call(this, sch.$dynamicAnchor), baseIds[jsonPtr] = innerBaseId;
        function addRef(ref) {
          let _resolve = this.opts.uriResolver.resolve;
          if (ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref), schemaRefs.has(ref))
            throw ambiguos(ref);
          schemaRefs.add(ref);
          let schOrRef = this.refs[ref];
          return typeof schOrRef == "string" && (schOrRef = this.refs[schOrRef]), typeof schOrRef == "object" ? checkAmbiguosRef(sch, schOrRef.schema, ref) : ref !== normalizeId(fullPath) && (ref[0] === "#" ? (checkAmbiguosRef(sch, localRefs[ref], ref), localRefs[ref] = sch) : this.refs[ref] = fullPath), ref;
        }
        function addAnchor(anchor) {
          if (typeof anchor == "string") {
            if (!ANCHOR.test(anchor))
              throw new Error(`invalid anchor "${anchor}"`);
            addRef.call(this, `#${anchor}`);
          }
        }
      }), localRefs;
      function checkAmbiguosRef(sch1, sch2, ref) {
        if (sch2 !== void 0 && !equal(sch1, sch2))
          throw ambiguos(ref);
      }
      function ambiguos(ref) {
        return new Error(`reference "${ref}" resolves to more than one schema`);
      }
    }
    exports.getSchemaRefs = getSchemaRefs;
  }
});

// node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS({
  "node_modules/ajv/dist/compile/validate/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
    var boolSchema_1 = require_boolSchema(), dataType_1 = require_dataType(), applicability_1 = require_applicability(), dataType_2 = require_dataType(), defaults_1 = require_defaults(), keyword_1 = require_keyword(), subschema_1 = require_subschema(), codegen_1 = require_codegen(), names_1 = require_names(), resolve_1 = require_resolve(), util_1 = require_util(), errors_1 = require_errors();
    function validateFunctionCode(it) {
      if (isSchemaObj(it) && (checkKeywords(it), schemaCxtHasRules(it))) {
        topSchemaObjCode(it);
        return;
      }
      validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
    }
    exports.validateFunctionCode = validateFunctionCode;
    function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
      opts.code.es5 ? gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
        gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`), destructureValCxtES5(gen, opts), gen.code(body);
      }) : gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
    }
    function destructureValCxt(opts) {
      return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
    }
    function destructureValCxtES5(gen, opts) {
      gen.if(names_1.default.valCxt, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`), gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`), gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`), gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`), opts.dynamicRef && gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
      }, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`""`), gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`), gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`), gen.var(names_1.default.rootData, names_1.default.data), opts.dynamicRef && gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
      });
    }
    function topSchemaObjCode(it) {
      let { schema, opts, gen } = it;
      validateFunction(it, () => {
        opts.$comment && schema.$comment && commentKeyword(it), checkNoDefault(it), gen.let(names_1.default.vErrors, null), gen.let(names_1.default.errors, 0), opts.unevaluated && resetEvaluated(it), typeAndKeywords(it), returnResults(it);
      });
    }
    function resetEvaluated(it) {
      let { gen, validateName } = it;
      it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`), gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`)), gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
    }
    function funcSourceUrl(schema, opts) {
      let schId = typeof schema == "object" && schema[opts.schemaId];
      return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
    }
    function subschemaCode(it, valid) {
      if (isSchemaObj(it) && (checkKeywords(it), schemaCxtHasRules(it))) {
        subSchemaObjCode(it, valid);
        return;
      }
      (0, boolSchema_1.boolOrEmptySchema)(it, valid);
    }
    function schemaCxtHasRules({ schema, self }) {
      if (typeof schema == "boolean")
        return !schema;
      for (let key in schema)
        if (self.RULES.all[key])
          return !0;
      return !1;
    }
    function isSchemaObj(it) {
      return typeof it.schema != "boolean";
    }
    function subSchemaObjCode(it, valid) {
      let { schema, gen, opts } = it;
      opts.$comment && schema.$comment && commentKeyword(it), updateContext(it), checkAsyncSchema(it);
      let errsCount = gen.const("_errs", names_1.default.errors);
      typeAndKeywords(it, errsCount), gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
    }
    function checkKeywords(it) {
      (0, util_1.checkUnknownRules)(it), checkRefsAndKeywords(it);
    }
    function typeAndKeywords(it, errsCount) {
      if (it.opts.jtd)
        return schemaKeywords(it, [], !1, errsCount);
      let types = (0, dataType_1.getSchemaTypes)(it.schema), checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
      schemaKeywords(it, types, !checkedTypes, errsCount);
    }
    function checkRefsAndKeywords(it) {
      let { schema, errSchemaPath, opts, self } = it;
      schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES) && self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
    }
    function checkNoDefault(it) {
      let { schema, opts } = it;
      schema.default !== void 0 && opts.useDefaults && opts.strictSchema && (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
    }
    function updateContext(it) {
      let schId = it.schema[it.opts.schemaId];
      schId && (it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId));
    }
    function checkAsyncSchema(it) {
      if (it.schema.$async && !it.schemaEnv.$async)
        throw new Error("async schema in sync schema");
    }
    function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
      let msg = schema.$comment;
      if (opts.$comment === !0)
        gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
      else if (typeof opts.$comment == "function") {
        let schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`, rootName = gen.scopeValue("root", { ref: schemaEnv.root });
        gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
      }
    }
    function returnResults(it) {
      let { gen, schemaEnv, validateName, ValidationError, opts } = it;
      schemaEnv.$async ? gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`)) : (gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors), opts.unevaluated && assignEvaluated(it), gen.return((0, codegen_1._)`${names_1.default.errors} === 0`));
    }
    function assignEvaluated({ gen, evaluated, props, items }) {
      props instanceof codegen_1.Name && gen.assign((0, codegen_1._)`${evaluated}.props`, props), items instanceof codegen_1.Name && gen.assign((0, codegen_1._)`${evaluated}.items`, items);
    }
    function schemaKeywords(it, types, typeErrors, errsCount) {
      let { gen, schema, data, allErrors, opts, self } = it, { RULES } = self;
      if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
        gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
        return;
      }
      opts.jtd || checkStrictTypes(it, types), gen.block(() => {
        for (let group of RULES.rules)
          groupKeywords(group);
        groupKeywords(RULES.post);
      });
      function groupKeywords(group) {
        (0, applicability_1.shouldUseGroup)(schema, group) && (group.type ? (gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers)), iterateKeywords(it, group), types.length === 1 && types[0] === group.type && typeErrors && (gen.else(), (0, dataType_2.reportTypeError)(it)), gen.endIf()) : iterateKeywords(it, group), allErrors || gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`));
      }
    }
    function iterateKeywords(it, group) {
      let { gen, schema, opts: { useDefaults } } = it;
      useDefaults && (0, defaults_1.assignDefaults)(it, group.type), gen.block(() => {
        for (let rule of group.rules)
          (0, applicability_1.shouldUseRule)(schema, rule) && keywordCode(it, rule.keyword, rule.definition, group.type);
      });
    }
    function checkStrictTypes(it, types) {
      it.schemaEnv.meta || !it.opts.strictTypes || (checkContextTypes(it, types), it.opts.allowUnionTypes || checkMultipleTypes(it, types), checkKeywordTypes(it, it.dataTypes));
    }
    function checkContextTypes(it, types) {
      if (types.length) {
        if (!it.dataTypes.length) {
          it.dataTypes = types;
          return;
        }
        types.forEach((t) => {
          includesType(it.dataTypes, t) || strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
        }), narrowSchemaTypes(it, types);
      }
    }
    function checkMultipleTypes(it, ts) {
      ts.length > 1 && !(ts.length === 2 && ts.includes("null")) && strictTypesError(it, "use allowUnionTypes to allow union type keyword");
    }
    function checkKeywordTypes(it, ts) {
      let rules = it.self.RULES.all;
      for (let keyword in rules) {
        let rule = rules[keyword];
        if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
          let { type } = rule.definition;
          type.length && !type.some((t) => hasApplicableType(ts, t)) && strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
        }
      }
    }
    function hasApplicableType(schTs, kwdT) {
      return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
    }
    function includesType(ts, t) {
      return ts.includes(t) || t === "integer" && ts.includes("number");
    }
    function narrowSchemaTypes(it, withTypes) {
      let ts = [];
      for (let t of it.dataTypes)
        includesType(withTypes, t) ? ts.push(t) : withTypes.includes("integer") && t === "number" && ts.push("integer");
      it.dataTypes = ts;
    }
    function strictTypesError(it, msg) {
      let schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
      msg += ` at "${schemaPath}" (strictTypes)`, (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
    }
    var KeywordCxt = class {
      constructor(it, def, keyword) {
        if ((0, keyword_1.validateKeywordUsage)(it, def, keyword), this.gen = it.gen, this.allErrors = it.allErrors, this.keyword = keyword, this.data = it.data, this.schema = it.schema[keyword], this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data), this.schemaType = def.schemaType, this.parentSchema = it.schema, this.params = {}, this.it = it, this.def = def, this.$data)
          this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
        else if (this.schemaCode = this.schemaValue, !(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined))
          throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
        ("code" in def ? def.trackErrors : def.errors !== !1) && (this.errsCount = it.gen.const("_errs", names_1.default.errors));
      }
      result(condition, successAction, failAction) {
        this.failResult((0, codegen_1.not)(condition), successAction, failAction);
      }
      failResult(condition, successAction, failAction) {
        this.gen.if(condition), failAction ? failAction() : this.error(), successAction ? (this.gen.else(), successAction(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
      }
      pass(condition, failAction) {
        this.failResult((0, codegen_1.not)(condition), void 0, failAction);
      }
      fail(condition) {
        if (condition === void 0) {
          this.error(), this.allErrors || this.gen.if(!1);
          return;
        }
        this.gen.if(condition), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
      }
      fail$data(condition) {
        if (!this.$data)
          return this.fail(condition);
        let { schemaCode } = this;
        this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
      }
      error(append, errorParams, errorPaths) {
        if (errorParams) {
          this.setParams(errorParams), this._error(append, errorPaths), this.setParams({});
          return;
        }
        this._error(append, errorPaths);
      }
      _error(append, errorPaths) {
        (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
      }
      $dataError() {
        (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
      }
      reset() {
        if (this.errsCount === void 0)
          throw new Error('add "trackErrors" to keyword definition');
        (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
      }
      ok(cond) {
        this.allErrors || this.gen.if(cond);
      }
      setParams(obj, assign) {
        assign ? Object.assign(this.params, obj) : this.params = obj;
      }
      block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
        this.gen.block(() => {
          this.check$data(valid, $dataValid), codeBlock();
        });
      }
      check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
        if (!this.$data)
          return;
        let { gen, schemaCode, schemaType, def } = this;
        gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid)), valid !== codegen_1.nil && gen.assign(valid, !0), (schemaType.length || def.validateSchema) && (gen.elseIf(this.invalid$data()), this.$dataError(), valid !== codegen_1.nil && gen.assign(valid, !1)), gen.else();
      }
      invalid$data() {
        let { gen, schemaCode, schemaType, def, it } = this;
        return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
        function wrong$DataType() {
          if (schemaType.length) {
            if (!(schemaCode instanceof codegen_1.Name))
              throw new Error("ajv implementation error");
            let st = Array.isArray(schemaType) ? schemaType : [schemaType];
            return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
          }
          return codegen_1.nil;
        }
        function invalid$DataSchema() {
          if (def.validateSchema) {
            let validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
            return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
          }
          return codegen_1.nil;
        }
      }
      subschema(appl, valid) {
        let subschema = (0, subschema_1.getSubschema)(this.it, appl);
        (0, subschema_1.extendSubschemaData)(subschema, this.it, appl), (0, subschema_1.extendSubschemaMode)(subschema, appl);
        let nextContext = { ...this.it, ...subschema, items: void 0, props: void 0 };
        return subschemaCode(nextContext, valid), nextContext;
      }
      mergeEvaluated(schemaCxt, toName) {
        let { it, gen } = this;
        it.opts.unevaluated && (it.props !== !0 && schemaCxt.props !== void 0 && (it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName)), it.items !== !0 && schemaCxt.items !== void 0 && (it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName)));
      }
      mergeValidEvaluated(schemaCxt, valid) {
        let { it, gen } = this;
        if (it.opts.unevaluated && (it.props !== !0 || it.items !== !0))
          return gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name)), !0;
      }
    };
    exports.KeywordCxt = KeywordCxt;
    function keywordCode(it, keyword, def, ruleType) {
      let cxt = new KeywordCxt(it, def, keyword);
      "code" in def ? def.code(cxt, ruleType) : cxt.$data && def.validate ? (0, keyword_1.funcKeywordCode)(cxt, def) : "macro" in def ? (0, keyword_1.macroKeywordCode)(cxt, def) : (def.compile || def.validate) && (0, keyword_1.funcKeywordCode)(cxt, def);
    }
    var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/, RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
    function getData($data, { dataLevel, dataNames, dataPathArr }) {
      let jsonPointer, data;
      if ($data === "")
        return names_1.default.rootData;
      if ($data[0] === "/") {
        if (!JSON_POINTER.test($data))
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        jsonPointer = $data, data = names_1.default.rootData;
      } else {
        let matches = RELATIVE_JSON_POINTER.exec($data);
        if (!matches)
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        let up = +matches[1];
        if (jsonPointer = matches[2], jsonPointer === "#") {
          if (up >= dataLevel)
            throw new Error(errorMsg("property/index", up));
          return dataPathArr[dataLevel - up];
        }
        if (up > dataLevel)
          throw new Error(errorMsg("data", up));
        if (data = dataNames[dataLevel - up], !jsonPointer)
          return data;
      }
      let expr = data, segments = jsonPointer.split("/");
      for (let segment of segments)
        segment && (data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`, expr = (0, codegen_1._)`${expr} && ${data}`);
      return expr;
      function errorMsg(pointerType, up) {
        return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
      }
    }
    exports.getData = getData;
  }
});

// node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS({
  "node_modules/ajv/dist/runtime/validation_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var ValidationError = class extends Error {
      constructor(errors) {
        super("validation failed"), this.errors = errors, this.ajv = this.validation = !0;
      }
    };
    exports.default = ValidationError;
  }
});

// node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS({
  "node_modules/ajv/dist/compile/ref_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var resolve_1 = require_resolve(), MissingRefError = class extends Error {
      constructor(resolver, baseId, ref, msg) {
        super(msg || `can't resolve reference ${ref} from id ${baseId}`), this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref), this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
      }
    };
    exports.default = MissingRefError;
  }
});

// node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS({
  "node_modules/ajv/dist/compile/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
    var codegen_1 = require_codegen(), validation_error_1 = require_validation_error(), names_1 = require_names(), resolve_1 = require_resolve(), util_1 = require_util(), validate_1 = require_validate(), SchemaEnv = class {
      constructor(env) {
        var _a;
        this.refs = {}, this.dynamicAnchors = {};
        let schema;
        typeof env.schema == "object" && (schema = env.schema), this.schema = env.schema, this.schemaId = env.schemaId, this.root = env.root || this, this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema?.[env.schemaId || "$id"]), this.schemaPath = env.schemaPath, this.localRefs = env.localRefs, this.meta = env.meta, this.$async = schema?.$async, this.refs = {};
      }
    };
    exports.SchemaEnv = SchemaEnv;
    function compileSchema(sch) {
      let _sch = getCompilingSchema.call(this, sch);
      if (_sch)
        return _sch;
      let rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId), { es5, lines } = this.opts.code, { ownProperties } = this.opts, gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties }), _ValidationError;
      sch.$async && (_ValidationError = gen.scopeValue("Error", {
        ref: validation_error_1.default,
        code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
      }));
      let validateName = gen.scopeName("validate");
      sch.validateName = validateName;
      let schemaCxt = {
        gen,
        allErrors: this.opts.allErrors,
        data: names_1.default.data,
        parentData: names_1.default.parentData,
        parentDataProperty: names_1.default.parentDataProperty,
        dataNames: [names_1.default.data],
        dataPathArr: [codegen_1.nil],
        // TODO can its length be used as dataLevel if nil is removed?
        dataLevel: 0,
        dataTypes: [],
        definedProperties: /* @__PURE__ */ new Set(),
        topSchemaRef: gen.scopeValue("schema", this.opts.code.source === !0 ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
        validateName,
        ValidationError: _ValidationError,
        schema: sch.schema,
        schemaEnv: sch,
        rootId,
        baseId: sch.baseId || rootId,
        schemaPath: codegen_1.nil,
        errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
        errorPath: (0, codegen_1._)`""`,
        opts: this.opts,
        self: this
      }, sourceCode;
      try {
        this._compilations.add(sch), (0, validate_1.validateFunctionCode)(schemaCxt), gen.optimize(this.opts.code.optimize);
        let validateCode = gen.toString();
        sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`, this.opts.code.process && (sourceCode = this.opts.code.process(sourceCode, sch));
        let validate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode)(this, this.scope.get());
        if (this.scope.value(validateName, { ref: validate }), validate.errors = null, validate.schema = sch.schema, validate.schemaEnv = sch, sch.$async && (validate.$async = !0), this.opts.code.source === !0 && (validate.source = { validateName, validateCode, scopeValues: gen._values }), this.opts.unevaluated) {
          let { props, items } = schemaCxt;
          validate.evaluated = {
            props: props instanceof codegen_1.Name ? void 0 : props,
            items: items instanceof codegen_1.Name ? void 0 : items,
            dynamicProps: props instanceof codegen_1.Name,
            dynamicItems: items instanceof codegen_1.Name
          }, validate.source && (validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated));
        }
        return sch.validate = validate, sch;
      } catch (e) {
        throw delete sch.validate, delete sch.validateName, sourceCode && this.logger.error("Error compiling schema, function code:", sourceCode), e;
      } finally {
        this._compilations.delete(sch);
      }
    }
    exports.compileSchema = compileSchema;
    function resolveRef(root, baseId, ref) {
      var _a;
      ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
      let schOrFunc = root.refs[ref];
      if (schOrFunc)
        return schOrFunc;
      let _sch = resolve.call(this, root, ref);
      if (_sch === void 0) {
        let schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref], { schemaId } = this.opts;
        schema && (_sch = new SchemaEnv({ schema, schemaId, root, baseId }));
      }
      if (_sch !== void 0)
        return root.refs[ref] = inlineOrCompile.call(this, _sch);
    }
    exports.resolveRef = resolveRef;
    function inlineOrCompile(sch) {
      return (0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs) ? sch.schema : sch.validate ? sch : compileSchema.call(this, sch);
    }
    function getCompilingSchema(schEnv) {
      for (let sch of this._compilations)
        if (sameSchemaEnv(sch, schEnv))
          return sch;
    }
    exports.getCompilingSchema = getCompilingSchema;
    function sameSchemaEnv(s1, s2) {
      return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
    }
    function resolve(root, ref) {
      let sch;
      for (; typeof (sch = this.refs[ref]) == "string"; )
        ref = sch;
      return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
    }
    function resolveSchema(root, ref) {
      let p = this.opts.uriResolver.parse(ref), refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p), baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
      if (Object.keys(root.schema).length > 0 && refPath === baseId)
        return getJsonPointer.call(this, p, root);
      let id = (0, resolve_1.normalizeId)(refPath), schOrRef = this.refs[id] || this.schemas[id];
      if (typeof schOrRef == "string") {
        let sch = resolveSchema.call(this, root, schOrRef);
        return typeof sch?.schema != "object" ? void 0 : getJsonPointer.call(this, p, sch);
      }
      if (typeof schOrRef?.schema == "object") {
        if (schOrRef.validate || compileSchema.call(this, schOrRef), id === (0, resolve_1.normalizeId)(ref)) {
          let { schema } = schOrRef, { schemaId } = this.opts, schId = schema[schemaId];
          return schId && (baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId)), new SchemaEnv({ schema, schemaId, root, baseId });
        }
        return getJsonPointer.call(this, p, schOrRef);
      }
    }
    exports.resolveSchema = resolveSchema;
    var PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
      "properties",
      "patternProperties",
      "enum",
      "dependencies",
      "definitions"
    ]);
    function getJsonPointer(parsedRef, { baseId, schema, root }) {
      var _a;
      if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
        return;
      for (let part of parsedRef.fragment.slice(1).split("/")) {
        if (typeof schema == "boolean")
          return;
        let partSchema = schema[(0, util_1.unescapeFragment)(part)];
        if (partSchema === void 0)
          return;
        schema = partSchema;
        let schId = typeof schema == "object" && schema[this.opts.schemaId];
        !PREVENT_SCOPE_CHANGE.has(part) && schId && (baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId));
      }
      let env;
      if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
        let $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
        env = resolveSchema.call(this, root, $ref);
      }
      let { schemaId } = this.opts;
      if (env = env || new SchemaEnv({ schema, schemaId, root, baseId }), env.schema !== env.root.schema)
        return env;
    }
  }
});

// node_modules/ajv/dist/refs/data.json
var require_data = __commonJS({
  "node_modules/ajv/dist/refs/data.json"(exports, module) {
    module.exports = {
      $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
      description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
      type: "object",
      required: ["$data"],
      properties: {
        $data: {
          type: "string",
          anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
        }
      },
      additionalProperties: !1
    };
  }
});

// node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS({
  "node_modules/fast-uri/lib/utils.js"(exports, module) {
    "use strict";
    var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u), isPort = RegExp.prototype.test.bind(/^\d*$/u), isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu), isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu), isPathCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/]$/u), isQueryFragmentCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/?]$/u), isUserinfoCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:]$/u), BYTE_HEX = new Array(256);
    {
      let HEX_DIGITS = "0123456789ABCDEF";
      for (let i = 0; i < 256; i++)
        BYTE_HEX[i] = "%" + HEX_DIGITS[i >> 4] + HEX_DIGITS[i & 15];
    }
    function percentEncodeNonAscii(cp) {
      return cp < 2048 ? BYTE_HEX[192 | cp >> 6] + BYTE_HEX[128 | cp & 63] : cp < 65536 ? BYTE_HEX[224 | cp >> 12] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63] : BYTE_HEX[240 | cp >> 18] + BYTE_HEX[128 | cp >> 12 & 63] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
    }
    function stringArrayToHexStripped(input) {
      let acc = "", code = 0, i = 0;
      for (i = 0; i < input.length; i++)
        if (code = input[i].charCodeAt(0), code !== 48) {
          if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102))
            return "";
          acc += input[i];
          break;
        }
      for (i += 1; i < input.length; i++) {
        if (code = input[i].charCodeAt(0), !(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102))
          return "";
        acc += input[i];
      }
      return acc;
    }
    var isHextet = RegExp.prototype.test.bind(/^[\dA-Fa-f]{1,4}$/), isIPvFuture = RegExp.prototype.test.bind(/^[vV][\dA-Fa-f]+\.[A-Za-z\d\-._~!$&'()*+,;=:]+$/), isZoneCharacter = RegExp.prototype.test.bind(/^[A-Za-z\d\-._~]$/), nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
    function isZoneIdentifier(zone) {
      if (zone.length === 0) return !1;
      for (let i = 0; i < zone.length; i++)
        if (!isZoneCharacter(zone[i])) {
          if (zone[i] === "%" && i + 2 < zone.length && isHexPair(zone.slice(i + 1, i + 3))) {
            i += 2;
            continue;
          }
          return !1;
        }
      return !0;
    }
    function compressIPv6ZeroRun(hextets) {
      let bestStart = -1, bestLength = 0, runStart = -1, runLength = 0;
      for (let i = 0; i < hextets.length; i++)
        hextets[i] === "0" ? (runStart === -1 && (runStart = i), runLength++, runLength > bestLength && (bestLength = runLength, bestStart = runStart)) : (runStart = -1, runLength = 0);
      if (bestLength < 2) return hextets.join(":");
      let head = hextets.slice(0, bestStart).join(":"), tail = hextets.slice(bestStart + bestLength).join(":");
      return head + "::" + tail;
    }
    function normalizeIPv6Address(input) {
      let compression = input.indexOf("::");
      if (compression !== -1 && input.indexOf("::", compression + 1) !== -1) return;
      let left = compression === -1 ? input.split(":") : input.slice(0, compression).split(":"), right = compression === -1 ? [] : input.slice(compression + 2).split(":");
      compression !== -1 && (left.length === 1 && left[0] === "" && (left.length = 0), right.length === 1 && right[0] === "" && (right.length = 0));
      let parts = left.concat(right), hextetCount = 0;
      for (let i = 0; i < parts.length; i++) {
        let part = parts[i];
        if (part === "") return;
        if (part.indexOf(".") !== -1) {
          if (i !== parts.length - 1 || compression !== -1 && right.length === 0 || !isIPv4(part)) return;
          hextetCount += 2;
          continue;
        }
        if (!isHextet(part)) return;
        parts[i] = parseInt(part, 16).toString(16), hextetCount++;
      }
      if (compression === -1)
        return hextetCount !== 8 ? void 0 : compressIPv6ZeroRun(parts);
      if (hextetCount >= 8) return;
      let expanded = parts.slice(0, left.length);
      for (let i = hextetCount; i < 8; i++) expanded.push("0");
      for (let i = left.length; i < parts.length; i++) expanded.push(parts[i]);
      return compressIPv6ZeroRun(expanded);
    }
    function normalizeIPv6(host) {
      let bracketed = host[0] === "[" && host[host.length - 1] === "]";
      if ((host[0] === "[" || host[host.length - 1] === "]") && !bracketed) return { host, isIPV6: !1, error: !0 };
      let input = bracketed ? host.slice(1, -1) : host;
      if (bracketed && isIPvFuture(input))
        return input = input.toLowerCase(), { host: `[${input}]`, escapedHost: input, isIPV6: !1, isIPVFuture: !0 };
      if (findToken(input, ":") < 2)
        return { host, isIPV6: !1, error: bracketed };
      let zoneIdentifier = "", zoneSeparator = input.indexOf("%");
      if (zoneSeparator !== -1) {
        let separatorLength = input.slice(zoneSeparator, zoneSeparator + 3).toLowerCase() === "%25" ? 3 : 1;
        if (zoneIdentifier = input.slice(zoneSeparator + separatorLength), !isZoneIdentifier(zoneIdentifier)) return { host, isIPV6: !1, error: !0 };
        input = input.slice(0, zoneSeparator);
      }
      let address = normalizeIPv6Address(input);
      return address === void 0 ? { host, isIPV6: !1, error: !0 } : {
        host: address + (zoneIdentifier ? "%" + zoneIdentifier : ""),
        escapedHost: address + (zoneIdentifier ? "%25" + zoneIdentifier : ""),
        isIPV6: !0
      };
    }
    function findToken(str, token) {
      let ind = 0;
      for (let i = 0; i < str.length; i++)
        str[i] === token && ind++;
      return ind;
    }
    function removeDotSegments(path8) {
      let input = path8, output = [], nextSlash = -1, len = 0;
      for (; len = input.length; ) {
        if (len === 1) {
          if (input === ".")
            break;
          if (input === "/") {
            output.push("/");
            break;
          } else {
            output.push(input);
            break;
          }
        } else if (len === 2) {
          if (input[0] === ".") {
            if (input[1] === ".")
              break;
            if (input[1] === "/") {
              input = input.slice(2);
              continue;
            }
          } else if (input[0] === "/" && (input[1] === "." || input[1] === "/")) {
            output.push("/");
            break;
          }
        } else if (len === 3 && input === "/..") {
          output.length !== 0 && output.pop(), output.push("/");
          break;
        }
        if (input[0] === ".") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(3);
              continue;
            }
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/" && input[1] === ".") {
          if (input[2] === "/") {
            input = input.slice(2);
            continue;
          } else if (input[2] === "." && input[3] === "/") {
            input = input.slice(3), output.length !== 0 && output.pop();
            continue;
          }
        }
        if ((nextSlash = input.indexOf("/", 1)) === -1) {
          output.push(input);
          break;
        } else
          output.push(input.slice(0, nextSlash)), input = input.slice(nextSlash);
      }
      return output.join("");
    }
    function removeDotSegmentsRelative(path8) {
      if (path8 === "" || path8[0] === "/")
        return removeDotSegments(path8);
      let segments = path8.split("/"), last = segments.length - 1, output = [], trailingDirectory = !1;
      for (let i = 0; i <= last; i++) {
        let segment = segments[i];
        segment === "." || segment === ".." ? (segment === ".." && (output.length !== 0 && output[output.length - 1] !== ".." ? output.pop() : output.push("..")), trailingDirectory = i === last) : output.push(segment);
      }
      return trailingDirectory && output[output.length - 1] !== ".." && output.push(""), (output.length === 0 || output[0] === "" || output[0].includes(":")) && output.unshift("."), output.join("/");
    }
    var HOST_DELIMS = { "@": "%40", "/": "%2F", "?": "%3F", "#": "%23", ":": "%3A" }, HOST_DELIM_RE = /[@/?#:]/g, HOST_DELIM_NO_COLON_RE = /[@/?#]/g;
    function reescapeHostDelimiters(host, isIP) {
      let re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE;
      return re.lastIndex = 0, host.replace(re, (ch) => HOST_DELIMS[ch]);
    }
    function normalizePercentEncoding(input, decodeUnreserved = !1) {
      if (input.indexOf("%") === -1)
        return input;
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          let hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            let normalizedHex = hex.toUpperCase(), decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            decodeUnreserved && isUnreserved(decoded) ? output += decoded : output += "%" + normalizedHex, i += 2;
            continue;
          }
        }
        output += input[i];
      }
      return output;
    }
    function normalizePathEncoding(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        let ch = input[i];
        if (ch === "%" && i + 2 < input.length) {
          let hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            let normalizedHex = hex.toUpperCase(), decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            decoded !== "." && isUnreserved(decoded) ? output += decoded : output += "%" + normalizedHex, i += 2;
            continue;
          }
        }
        if (isPathCharacter(ch))
          output += ch;
        else {
          let code = input.charCodeAt(i);
          if (code < 128)
            output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
          else if (code < 55296 || code > 57343)
            output += percentEncodeNonAscii(code);
          else if (code <= 56319 && i + 1 < input.length) {
            let low = input.charCodeAt(i + 1);
            low >= 56320 && low <= 57343 ? (output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320)), i++) : output += percentEncodeNonAscii(65533);
          } else
            output += percentEncodeNonAscii(65533);
        }
      }
      return output;
    }
    function serializePathEncoding(input, pathNoScheme = !1) {
      let output = "", firstSegment = pathNoScheme && input[0] !== "/";
      for (let i = 0; i < input.length; i++) {
        let ch = input[i];
        if (ch === "%" && i + 2 < input.length) {
          let hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            output += "%" + hex.toUpperCase(), i += 2;
            continue;
          }
        }
        if (ch === "/" && (firstSegment = !1), isPathCharacter(ch) && (ch !== ":" || !firstSegment))
          output += ch;
        else {
          let code = input.charCodeAt(i);
          if (code < 128)
            output += BYTE_HEX[code];
          else if (code < 55296 || code > 57343)
            output += percentEncodeNonAscii(code);
          else if (code <= 56319 && i + 1 < input.length) {
            let low = input.charCodeAt(i + 1);
            low >= 56320 && low <= 57343 ? (output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320)), i++) : output += percentEncodeNonAscii(65533);
          } else
            output += percentEncodeNonAscii(65533);
        }
      }
      return output;
    }
    function encodeComponent(input, isAllowed) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        let ch = input[i];
        if (ch === "%" && i + 2 < input.length) {
          let hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            output += "%" + hex.toUpperCase(), i += 2;
            continue;
          }
        }
        if (isAllowed(ch))
          output += ch;
        else {
          let code = input.charCodeAt(i);
          if (code < 128)
            output += BYTE_HEX[code];
          else if (code < 55296 || code > 57343)
            output += percentEncodeNonAscii(code);
          else if (code <= 56319 && i + 1 < input.length) {
            let low = input.charCodeAt(i + 1);
            low >= 56320 && low <= 57343 ? (output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320)), i++) : output += percentEncodeNonAscii(65533);
          } else
            output += percentEncodeNonAscii(65533);
        }
      }
      return output;
    }
    function encodeUserinfo(input) {
      return encodeComponent(input, isUserinfoCharacter);
    }
    function encodeQuery(input) {
      return encodeComponent(input, isQueryFragmentCharacter);
    }
    function encodeFragment(input) {
      return encodeComponent(input, isQueryFragmentCharacter);
    }
    function isEscapeSafe(cp) {
      return cp >= 48 && cp <= 57 || cp >= 65 && cp <= 90 || cp >= 97 && cp <= 122 || cp === 42 || cp === 43 || cp === 45 || cp === 46 || cp === 47 || cp === 64 || cp === 95;
    }
    function normalizeQueryFragmentEncoding(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        let ch = input[i];
        if (ch === "%" && i + 2 < input.length) {
          let hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            let normalizedHex = hex.toUpperCase(), decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            isUnreserved(decoded) ? output += decoded : output += "%" + normalizedHex, i += 2;
            continue;
          }
        }
        if (isQueryFragmentCharacter(ch))
          output += ch;
        else {
          let code = input.charCodeAt(i);
          if (code < 128)
            output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
          else if (code < 55296 || code > 57343)
            output += percentEncodeNonAscii(code);
          else if (code <= 56319 && i + 1 < input.length) {
            let low = input.charCodeAt(i + 1);
            low >= 56320 && low <= 57343 ? (output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320)), i++) : output += percentEncodeNonAscii(65533);
          } else
            output += percentEncodeNonAscii(65533);
        }
      }
      return output;
    }
    function escapePreservingEscapes(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          let hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            output += "%" + hex.toUpperCase(), i += 2;
            continue;
          }
        }
        output += escape(input[i]);
      }
      return output;
    }
    function recomposeAuthority(component) {
      let uriTokens = [];
      if (component.userinfo !== void 0 && (uriTokens.push(encodeUserinfo(component.userinfo)), uriTokens.push("@")), component.host !== void 0) {
        let host = component.host;
        if (!isIPv4(host)) {
          let ipV6res = normalizeIPv6(host);
          ipV6res.isIPV6 !== !0 && ipV6res.isIPVFuture !== !0 && (host = normalizePercentEncoding(host, !0), ipV6res = normalizeIPv6(host)), ipV6res.isIPV6 === !0 || ipV6res.isIPVFuture === !0 ? host = `[${ipV6res.escapedHost}]` : host = reescapeHostDelimiters(host, !1);
        }
        uriTokens.push(host);
      }
      if (typeof component.port == "number" || typeof component.port == "string") {
        let port = String(component.port);
        if (!isPort(port))
          throw new TypeError("URI port is malformed.");
        uriTokens.push(":"), uriTokens.push(port);
      }
      return uriTokens.length ? uriTokens.join("") : void 0;
    }
    module.exports = {
      nonSimpleDomain,
      recomposeAuthority,
      reescapeHostDelimiters,
      normalizePercentEncoding,
      normalizePathEncoding,
      serializePathEncoding,
      normalizeQueryFragmentEncoding,
      encodeUserinfo,
      encodeQuery,
      encodeFragment,
      escapePreservingEscapes,
      removeDotSegments,
      removeDotSegmentsRelative,
      isIPv4,
      isUUID,
      normalizeIPv6,
      stringArrayToHexStripped
    };
  }
});

// node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS({
  "node_modules/fast-uri/lib/schemes.js"(exports, module) {
    "use strict";
    var { isUUID } = require_utils(), URN_REG = /^([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-./:;=@]|%[\da-f]{2})+)$/iu, supportedSchemeNames = (
      /** @type {const} */
      [
        "http",
        "https",
        "ws",
        "wss",
        "urn",
        "urn:uuid"
      ]
    );
    function isValidSchemeName(name) {
      return supportedSchemeNames.indexOf(
        /** @type {*} */
        name
      ) !== -1;
    }
    function wsIsSecure(wsComponent) {
      return wsComponent.secure === !0 ? !0 : wsComponent.secure === !1 ? !1 : wsComponent.scheme ? wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S") : !1;
    }
    function httpParse(component) {
      return component.host || (component.error = component.error || "HTTP URIs must have a host."), component;
    }
    function httpSerialize(component) {
      let secure = String(component.scheme).toLowerCase() === "https";
      return (component.port === (secure ? 443 : 80) || component.port === "") && (component.port = void 0), component.path || (component.path = "/"), component;
    }
    function wsParse(wsComponent) {
      return wsComponent.secure = wsIsSecure(wsComponent), wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : ""), wsComponent.path = void 0, wsComponent.query = void 0, wsComponent;
    }
    function wsSerialize(wsComponent) {
      if ((wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") && (wsComponent.port = void 0), typeof wsComponent.secure == "boolean" && (wsComponent.scheme = wsComponent.secure ? "wss" : "ws", wsComponent.secure = void 0), wsComponent.resourceName) {
        let queryIndex = wsComponent.resourceName.indexOf("?"), path8 = queryIndex === -1 ? wsComponent.resourceName : wsComponent.resourceName.slice(0, queryIndex);
        wsComponent.path = path8 && path8 !== "/" ? path8 : void 0, wsComponent.query = queryIndex === -1 ? void 0 : wsComponent.resourceName.slice(queryIndex + 1), wsComponent.resourceName = void 0;
      }
      return wsComponent.fragment = void 0, wsComponent;
    }
    function urnParse(urnComponent, options) {
      if (!urnComponent.path)
        return urnComponent.error = "URN can not be parsed", urnComponent;
      let matches = urnComponent.path.match(URN_REG);
      if (matches && matches[0] === urnComponent.path) {
        let scheme = options.scheme || urnComponent.scheme || "urn";
        urnComponent.nid = matches[1].toLowerCase(), urnComponent.nss = matches[2];
        let urnScheme = `${scheme}:${options.nid || urnComponent.nid}`, schemeHandler = getSchemeHandler(urnScheme);
        urnComponent.path = void 0, schemeHandler && (urnComponent = schemeHandler.parse(urnComponent, options));
      } else
        urnComponent.error = urnComponent.error || "URN can not be parsed.";
      return urnComponent;
    }
    function urnSerialize(urnComponent, options) {
      if (urnComponent.nid === void 0)
        throw new Error("URN without nid cannot be serialized");
      let scheme = options.scheme || urnComponent.scheme || "urn", nid = urnComponent.nid.toLowerCase(), urnScheme = `${scheme}:${options.nid || nid}`, schemeHandler = getSchemeHandler(urnScheme);
      schemeHandler && (urnComponent = schemeHandler.serialize(urnComponent, options));
      let uriComponent = urnComponent, nss = urnComponent.nss;
      return uriComponent.path = `${nid || options.nid}:${nss}`, options.skipEscape = !0, uriComponent;
    }
    function urnuuidParse(urnComponent, options) {
      let uuidComponent = urnComponent;
      return uuidComponent.uuid = uuidComponent.nss, uuidComponent.nss = void 0, !options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid)) && (uuidComponent.error = uuidComponent.error || "UUID is not valid."), uuidComponent;
    }
    function urnuuidSerialize(uuidComponent) {
      let urnComponent = uuidComponent;
      return urnComponent.nss = (uuidComponent.uuid || "").toLowerCase(), urnComponent;
    }
    var http = (
      /** @type {SchemeHandler} */
      {
        scheme: "http",
        domainHost: !0,
        parse: httpParse,
        serialize: httpSerialize
      }
    ), https = (
      /** @type {SchemeHandler} */
      {
        scheme: "https",
        domainHost: http.domainHost,
        parse: httpParse,
        serialize: httpSerialize
      }
    ), ws = (
      /** @type {SchemeHandler} */
      {
        scheme: "ws",
        domainHost: !0,
        parse: wsParse,
        serialize: wsSerialize
      }
    ), wss = (
      /** @type {SchemeHandler} */
      {
        scheme: "wss",
        domainHost: ws.domainHost,
        parse: ws.parse,
        serialize: ws.serialize
      }
    ), urn = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn",
        parse: urnParse,
        serialize: urnSerialize,
        skipNormalize: !0
      }
    ), urnuuid = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn:uuid",
        parse: urnuuidParse,
        serialize: urnuuidSerialize,
        skipNormalize: !0
      }
    ), SCHEMES = (
      /** @type {Record<SchemeName, SchemeHandler>} */
      {
        http,
        https,
        ws,
        wss,
        urn,
        "urn:uuid": urnuuid
      }
    );
    Object.setPrototypeOf(SCHEMES, null);
    function getSchemeHandler(scheme) {
      return scheme && (SCHEMES[
        /** @type {SchemeName} */
        scheme
      ] || SCHEMES[
        /** @type {SchemeName} */
        scheme.toLowerCase()
      ]) || void 0;
    }
    module.exports = {
      wsIsSecure,
      SCHEMES,
      isValidSchemeName,
      getSchemeHandler
    };
  }
});

// node_modules/fast-uri/index.js
var require_fast_uri = __commonJS({
  "node_modules/fast-uri/index.js"(exports, module) {
    "use strict";
    var { normalizeIPv6, removeDotSegments, removeDotSegmentsRelative, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, serializePathEncoding, normalizeQueryFragmentEncoding, encodeQuery, encodeFragment, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = require_utils(), { SCHEMES, getSchemeHandler } = require_schemes(), VALID_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/u, MALFORMED_SCHEME_ERROR = "URI scheme is malformed.", MALFORMED_HOST_ERROR = "URI host is malformed.", FORBIDDEN_DOMAIN_HOST_CHARACTER = /[\0-\x20"#/:<>?@[\\\]^`{|}\x7F]/u;
    function validateScheme(scheme) {
      let stringScheme = String(scheme);
      if (!VALID_SCHEME.test(stringScheme))
        throw new TypeError(MALFORMED_SCHEME_ERROR);
      return stringScheme;
    }
    function normalize(uri, options) {
      return typeof uri == "string" ? uri = /** @type {T} */
      normalizeString(uri, options) : typeof uri == "object" && (uri = /** @type {T} */
      parse3(serialize(uri, options), options)), uri;
    }
    function resolve(baseURI, relativeURI, options) {
      let schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" }, {
        parsed: baseParsed,
        malformedAuthorityOrPort: baseMalformed,
        malformedPercentEncoding: baseMalformedPercentEncoding,
        malformedSchemeSpecific: baseMalformedSchemeSpecific,
        malformedHost: baseMalformedHost,
        malformedScheme: baseMalformedScheme
      } = parseWithStatus(baseURI, schemelessOptions), {
        parsed: relativeParsed,
        malformedAuthorityOrPort: relativeMalformed,
        malformedPercentEncoding: relativeMalformedPercentEncoding,
        malformedSchemeSpecific: relativeMalformedSchemeSpecific,
        malformedHost: relativeMalformedHost,
        malformedScheme: relativeMalformedScheme
      } = parseWithStatus(relativeURI, schemelessOptions);
      if (baseMalformed || relativeMalformed || baseMalformedPercentEncoding || relativeMalformedPercentEncoding || baseMalformedSchemeSpecific || relativeMalformedSchemeSpecific || baseMalformedHost || relativeMalformedHost || baseMalformedScheme || relativeMalformedScheme)
        throw new Error(baseParsed.error || relativeParsed.error || "URI is malformed.");
      let resolved = resolveComponent(baseParsed, relativeParsed, schemelessOptions, !0), resolvedSchemeHandler = getSchemeHandler(options && options.scheme || resolved.scheme), resolvedHost = resolved.host, resolvedHostIsIP = resolvedHost !== void 0 && resolvedHost !== "" && (isIPv4(resolvedHost) || normalizeIPv6(resolvedHost).isIPV6);
      if (hasForbiddenDomainHost(resolved, options || {}, resolvedSchemeHandler, resolvedHostIsIP))
        throw new Error(MALFORMED_HOST_ERROR);
      canonicalizeHost(resolved, options || {}, resolvedSchemeHandler, resolvedHostIsIP);
      let encodedASCIIHost = resolvedHost && resolvedHost.indexOf("%") !== -1 && !new RegExp("\\P{ASCII}", "u").test(resolvedHost);
      if (resolved.error && !encodedASCIIHost)
        throw new Error(resolved.error);
      return schemelessOptions.skipEscape = !0, serialize(resolved, schemelessOptions);
    }
    function resolveComponent(base, relative, options, skipNormalization) {
      let target = {};
      if (skipNormalization || (base = parse3(serialize(base, options), options), relative = parse3(serialize(relative, options), options)), options = options || {}, !options.tolerant && relative.scheme)
        target.scheme = relative.scheme, target.userinfo = relative.userinfo, target.host = relative.host, target.port = relative.port, target.path = removeDotSegments(relative.path || ""), target.query = relative.query;
      else {
        if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0)
          target.userinfo = relative.userinfo, target.host = relative.host, target.port = relative.port, target.path = removeDotSegments(relative.path || ""), target.query = relative.query;
        else {
          if (!relative.path)
            target.path = base.path, relative.query !== void 0 ? target.query = relative.query : target.query = base.query;
          else {
            if (relative.path[0] === "/")
              target.path = removeDotSegments(relative.path);
            else {
              let baseHasAuthority = base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0;
              baseHasAuthority && !base.path ? target.path = "/" + relative.path : base.path ? target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path : target.path = relative.path, target.path = base.scheme === void 0 && !baseHasAuthority && target.path[0] !== "/" ? removeDotSegmentsRelative(target.path) : removeDotSegments(target.path);
            }
            target.query = relative.query;
          }
          target.userinfo = base.userinfo, target.host = base.host, target.port = base.port;
        }
        target.scheme = base.scheme;
      }
      return target.fragment = relative.fragment, target;
    }
    function equal(uriA, uriB, options) {
      let normalizedA = normalizeComparableURI(uriA, options), normalizedB = normalizeComparableURI(uriB, options);
      return normalizedA !== void 0 && normalizedB !== void 0 && normalizedA === normalizedB;
    }
    function serialize(cmpts, opts) {
      let component = {
        host: cmpts.host,
        scheme: cmpts.scheme,
        userinfo: cmpts.userinfo,
        port: cmpts.port,
        path: cmpts.path,
        query: cmpts.query,
        nid: cmpts.nid,
        nss: cmpts.nss,
        uuid: cmpts.uuid,
        fragment: cmpts.fragment,
        reference: cmpts.reference,
        resourceName: cmpts.resourceName,
        secure: cmpts.secure,
        error: ""
      }, options = Object.assign({}, opts), uriTokens = [];
      component.scheme && (component.scheme = validateScheme(component.scheme));
      let schemeHandler = getSchemeHandler(options.scheme || component.scheme);
      schemeHandler && schemeHandler.serialize && schemeHandler.serialize(component, options);
      let hasAuthority = component.userinfo !== void 0 || component.host !== void 0 || component.port !== void 0, schemelessReference = (component.scheme === void 0 || options.reference === "suffix") && !hasAuthority, pathNoScheme = !options.skipEscape && schemelessReference;
      component.path !== void 0 && (options.skipEscape ? component.path = normalizePercentEncoding(component.path) : component.path = serializePathEncoding(component.path, pathNoScheme)), options.reference !== "suffix" && component.scheme && (component.scheme = validateScheme(component.scheme), uriTokens.push(component.scheme, ":"));
      let authority = recomposeAuthority(component);
      if (authority !== void 0 && (options.reference !== "suffix" && uriTokens.push("//"), uriTokens.push(authority), component.path && component.path[0] !== "/" && uriTokens.push("/")), component.path !== void 0) {
        let s = component.path;
        !options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath) && (s = schemelessReference && s[0] !== "/" ? removeDotSegmentsRelative(s) : removeDotSegments(s)), schemelessReference && (s = serializePathEncoding(s, !0)), authority === void 0 && s[0] === "/" && s[1] === "/" && (s = "/%2F" + s.slice(2)), uriTokens.push(s);
      }
      return component.query !== void 0 && uriTokens.push("?", encodeQuery(component.query)), component.fragment !== void 0 && uriTokens.push("#", encodeFragment(component.fragment)), uriTokens.join("");
    }
    var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u, AUTHORITY_PREFIX = /^(?:[^#/:?]+:)?\/\/([^/?#]*)/, AUTHORITY_INTRODUCER_REGION = /^(?:[^#/:?]+:)?([/\\\t\n\r]*)/;
    function getParseError(parsed, matches) {
      if (matches[2] !== void 0 && parsed.path && parsed.path[0] !== "/")
        return 'URI path must start with "/" when authority is present.';
      if (typeof parsed.port == "number" && (parsed.port < 0 || parsed.port > 65535))
        return "URI port is malformed.";
    }
    function hasMalformedPercentEncoding(component) {
      if (component === void 0) return !1;
      let percent = component.indexOf("%");
      for (; percent !== -1; ) {
        if (percent + 2 >= component.length || !/^[\da-f]{2}$/iu.test(component.slice(percent + 1, percent + 3)))
          return !0;
        percent = component.indexOf("%", percent + 3);
      }
      return !1;
    }
    function isIPLiteral(host) {
      return host[0] === "[" && host[host.length - 1] === "]";
    }
    function hasMalformedComponentPercentEncoding(matches) {
      let host = matches[4];
      return hasMalformedPercentEncoding(matches[3]) || host !== void 0 && !isIPLiteral(host) && hasMalformedPercentEncoding(host) || hasMalformedPercentEncoding(matches[6]) || hasMalformedPercentEncoding(matches[7]) || hasMalformedPercentEncoding(matches[8]);
    }
    function canonicalizeHost(parsed, options, schemeHandler, isIP) {
      if (hasForbiddenDomainHost(parsed, options, schemeHandler, isIP))
        return parsed.error = parsed.error || MALFORMED_HOST_ERROR, !0;
      if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport) && parsed.host && !isIPLiteral(parsed.host) && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === !1 && nonSimpleDomain(parsed.host)) {
        let url;
        try {
          url = new URL("http://" + parsed.host);
        } catch (e) {
          return parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e, !0;
        }
        if (!isHostOnlyURL(url))
          return parsed.error = parsed.error || MALFORMED_HOST_ERROR, !0;
        parsed.host = url.hostname;
      }
      return !1;
    }
    function hasForbiddenDomainHost(parsed, options, schemeHandler, isIP) {
      return !!(parsed.host && isIP === !1 && !isIPLiteral(parsed.host) && (options.domainHost || schemeHandler && schemeHandler.domainHost) && FORBIDDEN_DOMAIN_HOST_CHARACTER.test(parsed.host));
    }
    function isHostOnlyURL(url) {
      return url.username === "" && url.password === "" && url.port === "" && url.pathname === "/" && url.search === "" && url.hash === "" && url.hostname !== "";
    }
    function parseWithStatus(uri, opts) {
      let options = Object.assign({}, opts), parsed = {
        scheme: void 0,
        userinfo: void 0,
        host: "",
        port: void 0,
        path: "",
        query: void 0,
        fragment: void 0
      }, malformedAuthorityOrPort = !1, malformedPercentEncoding = !1, malformedSchemeSpecific = !1, malformedHost = !1, malformedIPLiteral = !1, malformedScheme = !1, isIP = !1;
      options.reference === "suffix" && (options.scheme ? uri = options.scheme + ":" + uri : uri = "//" + uri);
      let authorityMatch = uri.match(AUTHORITY_PREFIX);
      authorityMatch !== null && authorityMatch[1].indexOf("\\") !== -1 && (parsed.error = "URI authority must not contain a literal backslash.", malformedAuthorityOrPort = !0);
      let introducerMatch = uri.match(AUTHORITY_INTRODUCER_REGION);
      if (introducerMatch !== null) {
        let region = introducerMatch[1], normalizedRegion = region.replace(/[\t\n\r]/g, "");
        normalizedRegion.length >= 2 && (normalizedRegion.slice(0, 2) !== "//" ? (parsed.error = parsed.error || "URI authority must not contain a literal backslash.", malformedAuthorityOrPort = !0) : region.length !== normalizedRegion.length && (parsed.error = parsed.error || "URI authority introducer must not contain whitespace.", malformedAuthorityOrPort = !0));
      }
      let matches = uri.match(URI_PARSE);
      if (matches) {
        parsed.scheme = matches[1], parsed.userinfo = matches[3], parsed.host = matches[4], parsed.port = parseInt(matches[5], 10), parsed.path = matches[6] || "", parsed.query = matches[7], parsed.fragment = matches[8], parsed.scheme !== void 0 && (VALID_SCHEME.test(parsed.scheme) ? parsed.scheme = parsed.scheme.toLowerCase() : (parsed.error = parsed.error || MALFORMED_SCHEME_ERROR, malformedScheme = !0)), malformedPercentEncoding = hasMalformedComponentPercentEncoding(matches), malformedPercentEncoding && (parsed.error = parsed.error || "URI contains malformed percent-encoding."), isNaN(parsed.port) && (parsed.port = matches[5]);
        let parseError = getParseError(parsed, matches);
        if (parseError !== void 0 && (parsed.error = parsed.error || parseError, malformedAuthorityOrPort = !0), parsed.host)
          if (isIPv4(parsed.host) === !1) {
            let bracketedIPLiteral = isIPLiteral(parsed.host), hasIPLiteralBracket = parsed.host.indexOf("[") !== -1 || parsed.host.indexOf("]") !== -1, ipv6result = normalizeIPv6(parsed.host);
            isIP = ipv6result.isIPV6 || ipv6result.isIPVFuture === !0, malformedIPLiteral = hasIPLiteralBracket && (!bracketedIPLiteral || ipv6result.error === !0), parsed.host = isIP ? ipv6result.host : ipv6result.host.toLowerCase(), malformedIPLiteral && (parsed.error = parsed.error || MALFORMED_HOST_ERROR, malformedAuthorityOrPort = !0);
          } else
            isIP = !0;
        parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path ? parsed.reference = "same-document" : parsed.scheme === void 0 ? parsed.reference = "relative" : parsed.fragment === void 0 ? parsed.reference = "absolute" : parsed.reference = "uri", options.reference && options.reference !== "suffix" && options.reference !== parsed.reference && (parsed.error = parsed.error || "URI is not a " + options.reference + " reference.");
        let schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
        if (malformedIPLiteral || (malformedHost = canonicalizeHost(parsed, options, schemeHandler, isIP)), uri.indexOf("%") !== -1 && parsed.host !== void 0 && !malformedIPLiteral) {
          let host = isIP ? parsed.host : normalizePercentEncoding(parsed.host, !0);
          isIP || (host = normalizePercentEncoding(host.toLowerCase())), parsed.host = isIP || options.scheme !== "null" ? reescapeHostDelimiters(host, isIP) : host;
        }
        (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) && (parsed.path && (parsed.path = normalizePathEncoding(parsed.path)), parsed.query && (parsed.query = normalizeQueryFragmentEncoding(parsed.query)), parsed.fragment && (parsed.fragment = normalizeQueryFragmentEncoding(parsed.fragment))), schemeHandler && schemeHandler.parse && (schemeHandler.parse(parsed, options), schemeHandler === SCHEMES.urn && parsed.nid === void 0 && (malformedSchemeSpecific = !0));
      } else
        parsed.error = parsed.error || "URI can not be parsed.";
      return { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme };
    }
    function parse3(uri, opts) {
      return parseWithStatus(uri, opts).parsed;
    }
    function normalizeString(uri, opts) {
      return normalizeStringWithStatus(uri, opts).normalized;
    }
    function normalizeStringWithStatus(uri, opts) {
      let { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = parseWithStatus(uri, opts);
      return {
        normalized: malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? uri : serialize(parsed, opts),
        malformedAuthorityOrPort,
        malformedPercentEncoding,
        malformedSchemeSpecific,
        malformedHost,
        malformedScheme
      };
    }
    function normalizeComparableURI(uri, opts) {
      if (typeof uri != "string" && typeof uri != "object")
        return;
      let value;
      try {
        value = typeof uri == "string" ? uri : serialize(uri, opts);
      } catch {
        return;
      }
      let { normalized, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = normalizeStringWithStatus(value, opts);
      return malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? void 0 : normalized;
    }
    var fastUri = {
      SCHEMES,
      normalize,
      resolve,
      resolveComponent,
      equal,
      serialize,
      parse: parse3
    };
    module.exports = fastUri;
    module.exports.default = fastUri;
    module.exports.fastUri = fastUri;
  }
});

// node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS({
  "node_modules/ajv/dist/runtime/uri.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var uri = require_fast_uri();
    uri.code = 'require("ajv/dist/runtime/uri").default';
    exports.default = uri;
  }
});

// node_modules/ajv/dist/core.js
var require_core = __commonJS({
  "node_modules/ajv/dist/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: !0, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: !0, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: !0, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: !0, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: !0, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: !0, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: !0, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error(), ref_error_1 = require_ref_error(), rules_1 = require_rules(), compile_1 = require_compile(), codegen_2 = require_codegen(), resolve_1 = require_resolve(), dataType_1 = require_dataType(), util_1 = require_util(), $dataRefSchema = require_data(), uri_1 = require_uri(), defaultRegExp = (str, flags) => new RegExp(str, flags);
    defaultRegExp.code = "new RegExp";
    var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"], EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]), removedOptions = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    }, deprecatedOptions = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    }, MAX_EXPRESSION = 200;
    function requiredOptions(o) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
      let s = o.strict, _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize, optimize = _optz === !0 || _optz === void 0 ? 1 : _optz || 0, regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp, uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
      return {
        strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : !0,
        strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : !0,
        strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
        strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
        strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : !1,
        code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
        loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
        loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
        meta: (_s = o.meta) !== null && _s !== void 0 ? _s : !0,
        messages: (_t = o.messages) !== null && _t !== void 0 ? _t : !0,
        inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : !0,
        schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
        addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : !0,
        validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : !0,
        validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : !0,
        unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : !0,
        int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : !0,
        uriResolver
      };
    }
    var Ajv2 = class {
      constructor(opts = {}) {
        this.schemas = {}, this.refs = {}, this.formats = /* @__PURE__ */ Object.create(null), this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), opts = this.opts = { ...opts, ...requiredOptions(opts) };
        let { es5, lines } = this.opts.code;
        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines }), this.logger = getLogger(opts.logger);
        let formatOpt = opts.validateFormats;
        opts.validateFormats = !1, this.RULES = (0, rules_1.getRules)(), checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED"), checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn"), this._metaOpts = getMetaSchemaOptions.call(this), opts.formats && addInitialFormats.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), opts.keywords && addInitialKeywords.call(this, opts.keywords), typeof opts.meta == "object" && this.addMetaSchema(opts.meta), addInitialSchemas.call(this), opts.validateFormats = formatOpt;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        let { $data, meta, schemaId } = this.opts, _dataRefSchema = $dataRefSchema;
        schemaId === "id" && (_dataRefSchema = { ...$dataRefSchema }, _dataRefSchema.id = _dataRefSchema.$id, delete _dataRefSchema.$id), meta && $data && this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], !1);
      }
      defaultMeta() {
        let { meta, schemaId } = this.opts;
        return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : void 0;
      }
      validate(schemaKeyRef, data) {
        let v;
        if (typeof schemaKeyRef == "string") {
          if (v = this.getSchema(schemaKeyRef), !v)
            throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
        } else
          v = this.compile(schemaKeyRef);
        let valid = v(data);
        return "$async" in v || (this.errors = v.errors), valid;
      }
      compile(schema, _meta) {
        let sch = this._addSchema(schema, _meta);
        return sch.validate || this._compileSchemaEnv(sch);
      }
      compileAsync(schema, meta) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        let { loadSchema } = this.opts;
        return runCompileAsync.call(this, schema, meta);
        async function runCompileAsync(_schema, _meta) {
          await loadMetaSchema.call(this, _schema.$schema);
          let sch = this._addSchema(_schema, _meta);
          return sch.validate || _compileAsync.call(this, sch);
        }
        async function loadMetaSchema($ref) {
          $ref && !this.getSchema($ref) && await runCompileAsync.call(this, { $ref }, !0);
        }
        async function _compileAsync(sch) {
          try {
            return this._compileSchemaEnv(sch);
          } catch (e) {
            if (!(e instanceof ref_error_1.default))
              throw e;
            return checkLoaded.call(this, e), await loadMissingSchema.call(this, e.missingSchema), _compileAsync.call(this, sch);
          }
        }
        function checkLoaded({ missingSchema: ref, missingRef }) {
          if (this.refs[ref])
            throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
        }
        async function loadMissingSchema(ref) {
          let _schema = await _loadSchema.call(this, ref);
          this.refs[ref] || await loadMetaSchema.call(this, _schema.$schema), this.refs[ref] || this.addSchema(_schema, ref, meta);
        }
        async function _loadSchema(ref) {
          let p = this._loading[ref];
          if (p)
            return p;
          try {
            return await (this._loading[ref] = loadSchema(ref));
          } finally {
            delete this._loading[ref];
          }
        }
      }
      // Adds schema to the instance
      addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
        if (Array.isArray(schema)) {
          for (let sch of schema)
            this.addSchema(sch, void 0, _meta, _validateSchema);
          return this;
        }
        let id;
        if (typeof schema == "object") {
          let { schemaId } = this.opts;
          if (id = schema[schemaId], id !== void 0 && typeof id != "string")
            throw new Error(`schema ${schemaId} must be string`);
        }
        return key = (0, resolve_1.normalizeId)(key || id), this._checkUnique(key), this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
        return this.addSchema(schema, key, !0, _validateSchema), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(schema, throwOrLogError) {
        if (typeof schema == "boolean")
          return !0;
        let $schema;
        if ($schema = schema.$schema, $schema !== void 0 && typeof $schema != "string")
          throw new Error("$schema must be a string");
        if ($schema = $schema || this.opts.defaultMeta || this.defaultMeta(), !$schema)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        let valid = this.validate($schema, schema);
        if (!valid && throwOrLogError) {
          let message = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(message);
          else
            throw new Error(message);
        }
        return valid;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(keyRef) {
        let sch;
        for (; typeof (sch = getSchEnv.call(this, keyRef)) == "string"; )
          keyRef = sch;
        if (sch === void 0) {
          let { schemaId } = this.opts, root = new compile_1.SchemaEnv({ schema: {}, schemaId });
          if (sch = compile_1.resolveSchema.call(this, root, keyRef), !sch)
            return;
          this.refs[keyRef] = sch;
        }
        return sch.validate || this._compileSchemaEnv(sch);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(schemaKeyRef) {
        if (schemaKeyRef instanceof RegExp)
          return this._removeAllSchemas(this.schemas, schemaKeyRef), this._removeAllSchemas(this.refs, schemaKeyRef), this;
        switch (typeof schemaKeyRef) {
          case "undefined":
            return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
          case "string": {
            let sch = getSchEnv.call(this, schemaKeyRef);
            return typeof sch == "object" && this._cache.delete(sch.schema), delete this.schemas[schemaKeyRef], delete this.refs[schemaKeyRef], this;
          }
          case "object": {
            let cacheKey = schemaKeyRef;
            this._cache.delete(cacheKey);
            let id = schemaKeyRef[this.opts.schemaId];
            return id && (id = (0, resolve_1.normalizeId)(id), delete this.schemas[id], delete this.refs[id]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(definitions) {
        for (let def of definitions)
          this.addKeyword(def);
        return this;
      }
      addKeyword(kwdOrDef, def) {
        let keyword;
        if (typeof kwdOrDef == "string")
          keyword = kwdOrDef, typeof def == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), def.keyword = keyword);
        else if (typeof kwdOrDef == "object" && def === void 0) {
          if (def = kwdOrDef, keyword = def.keyword, Array.isArray(keyword) && !keyword.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (checkKeyword.call(this, keyword, def), !def)
          return (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd)), this;
        keywordMetaschema.call(this, def);
        let definition = {
          ...def,
          type: (0, dataType_1.getJSONTypes)(def.type),
          schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
        };
        return (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t))), this;
      }
      getKeyword(keyword) {
        let rule = this.RULES.all[keyword];
        return typeof rule == "object" ? rule.definition : !!rule;
      }
      // Remove keyword
      removeKeyword(keyword) {
        let { RULES } = this;
        delete RULES.keywords[keyword], delete RULES.all[keyword];
        for (let group of RULES.rules) {
          let i = group.rules.findIndex((rule) => rule.keyword === keyword);
          i >= 0 && group.rules.splice(i, 1);
        }
        return this;
      }
      // Add format
      addFormat(name, format) {
        return typeof format == "string" && (format = new RegExp(format)), this.formats[name] = format, this;
      }
      errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
        return !errors || errors.length === 0 ? "No errors" : errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
      }
      $dataMetaSchema(metaSchema, keywordsJsonPointers) {
        let rules = this.RULES.all;
        metaSchema = JSON.parse(JSON.stringify(metaSchema));
        for (let jsonPointer of keywordsJsonPointers) {
          let segments = jsonPointer.split("/").slice(1), keywords = metaSchema;
          for (let seg of segments)
            keywords = keywords[seg];
          for (let key in rules) {
            let rule = rules[key];
            if (typeof rule != "object")
              continue;
            let { $data } = rule.definition, schema = keywords[key];
            $data && schema && (keywords[key] = schemaOrData(schema));
          }
        }
        return metaSchema;
      }
      _removeAllSchemas(schemas, regex) {
        for (let keyRef in schemas) {
          let sch = schemas[keyRef];
          (!regex || regex.test(keyRef)) && (typeof sch == "string" ? delete schemas[keyRef] : sch && !sch.meta && (this._cache.delete(sch.schema), delete schemas[keyRef]));
        }
      }
      _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
        let id, { schemaId } = this.opts;
        if (typeof schema == "object")
          id = schema[schemaId];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof schema != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let sch = this._cache.get(schema);
        if (sch !== void 0)
          return sch;
        baseId = (0, resolve_1.normalizeId)(id || baseId);
        let localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
        return sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs }), this._cache.set(sch.schema, sch), addSchema && !baseId.startsWith("#") && (baseId && this._checkUnique(baseId), this.refs[baseId] = sch), validateSchema && this.validateSchema(schema, !0), sch;
      }
      _checkUnique(id) {
        if (this.schemas[id] || this.refs[id])
          throw new Error(`schema with key or id "${id}" already exists`);
      }
      _compileSchemaEnv(sch) {
        if (sch.meta ? this._compileMetaSchema(sch) : compile_1.compileSchema.call(this, sch), !sch.validate)
          throw new Error("ajv implementation error");
        return sch.validate;
      }
      _compileMetaSchema(sch) {
        let currentOpts = this.opts;
        this.opts = this._metaOpts;
        try {
          compile_1.compileSchema.call(this, sch);
        } finally {
          this.opts = currentOpts;
        }
      }
    };
    Ajv2.ValidationError = validation_error_1.default;
    Ajv2.MissingRefError = ref_error_1.default;
    exports.default = Ajv2;
    function checkOptions(checkOpts, options, msg, log = "error") {
      for (let key in checkOpts) {
        let opt = key;
        opt in options && this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
      }
    }
    function getSchEnv(keyRef) {
      return keyRef = (0, resolve_1.normalizeId)(keyRef), this.schemas[keyRef] || this.refs[keyRef];
    }
    function addInitialSchemas() {
      let optsSchemas = this.opts.schemas;
      if (optsSchemas)
        if (Array.isArray(optsSchemas))
          this.addSchema(optsSchemas);
        else
          for (let key in optsSchemas)
            this.addSchema(optsSchemas[key], key);
    }
    function addInitialFormats() {
      for (let name in this.opts.formats) {
        let format = this.opts.formats[name];
        format && this.addFormat(name, format);
      }
    }
    function addInitialKeywords(defs) {
      if (Array.isArray(defs)) {
        this.addVocabulary(defs);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (let keyword in defs) {
        let def = defs[keyword];
        def.keyword || (def.keyword = keyword), this.addKeyword(def);
      }
    }
    function getMetaSchemaOptions() {
      let metaOpts = { ...this.opts };
      for (let opt of META_IGNORE_OPTIONS)
        delete metaOpts[opt];
      return metaOpts;
    }
    var noLogs = { log() {
    }, warn() {
    }, error() {
    } };
    function getLogger(logger) {
      if (logger === !1)
        return noLogs;
      if (logger === void 0)
        return console;
      if (logger.log && logger.warn && logger.error)
        return logger;
      throw new Error("logger must implement log, warn and error methods");
    }
    var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
    function checkKeyword(keyword, def) {
      let { RULES } = this;
      if ((0, util_1.eachItem)(keyword, (kwd) => {
        if (RULES.keywords[kwd])
          throw new Error(`Keyword ${kwd} is already defined`);
        if (!KEYWORD_NAME.test(kwd))
          throw new Error(`Keyword ${kwd} has invalid name`);
      }), !!def && def.$data && !("code" in def || "validate" in def))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function addRule(keyword, definition, dataType) {
      var _a;
      let post = definition?.post;
      if (dataType && post)
        throw new Error('keyword with "post" flag cannot have "type"');
      let { RULES } = this, ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
      if (ruleGroup || (ruleGroup = { type: dataType, rules: [] }, RULES.rules.push(ruleGroup)), RULES.keywords[keyword] = !0, !definition)
        return;
      let rule = {
        keyword,
        definition: {
          ...definition,
          type: (0, dataType_1.getJSONTypes)(definition.type),
          schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
        }
      };
      definition.before ? addBeforeRule.call(this, ruleGroup, rule, definition.before) : ruleGroup.rules.push(rule), RULES.all[keyword] = rule, (_a = definition.implements) === null || _a === void 0 || _a.forEach((kwd) => this.addKeyword(kwd));
    }
    function addBeforeRule(ruleGroup, rule, before) {
      let i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
      i >= 0 ? ruleGroup.rules.splice(i, 0, rule) : (ruleGroup.rules.push(rule), this.logger.warn(`rule ${before} is not defined`));
    }
    function keywordMetaschema(def) {
      let { metaSchema } = def;
      metaSchema !== void 0 && (def.$data && this.opts.$data && (metaSchema = schemaOrData(metaSchema)), def.validateSchema = this.compile(metaSchema, !0));
    }
    var $dataRef = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function schemaOrData(schema) {
      return { anyOf: [schema, $dataRef] };
    }
  }
});

// node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/id.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var def = {
      keyword: "id",
      code() {
        throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/ref.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.callRef = exports.getValidate = void 0;
    var ref_error_1 = require_ref_error(), code_1 = require_code2(), codegen_1 = require_codegen(), names_1 = require_names(), compile_1 = require_compile(), util_1 = require_util(), def = {
      keyword: "$ref",
      schemaType: "string",
      code(cxt) {
        let { gen, schema: $ref, it } = cxt, { baseId, schemaEnv: env, validateName, opts, self } = it, { root } = env;
        if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
          return callRootRef();
        let schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
        if (schOrEnv === void 0)
          throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
        if (schOrEnv instanceof compile_1.SchemaEnv)
          return callValidate(schOrEnv);
        return inlineRefSchema(schOrEnv);
        function callRootRef() {
          if (env === root)
            return callRef(cxt, validateName, env, env.$async);
          let rootName = gen.scopeValue("root", { ref: root });
          return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
        }
        function callValidate(sch) {
          let v = getValidate(cxt, sch);
          callRef(cxt, v, sch, sch.$async);
        }
        function inlineRefSchema(sch) {
          let schName = gen.scopeValue("schema", opts.code.source === !0 ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch }), valid = gen.name("valid"), schCxt = cxt.subschema({
            schema: sch,
            dataTypes: [],
            schemaPath: codegen_1.nil,
            topSchemaRef: schName,
            errSchemaPath: $ref
          }, valid);
          cxt.mergeEvaluated(schCxt), cxt.ok(valid);
        }
      }
    };
    function getValidate(cxt, sch) {
      let { gen } = cxt;
      return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
    }
    exports.getValidate = getValidate;
    function callRef(cxt, v, sch, $async) {
      let { gen, it } = cxt, { allErrors, schemaEnv: env, opts } = it, passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
      $async ? callAsyncRef() : callSyncRef();
      function callAsyncRef() {
        if (!env.$async)
          throw new Error("async schema referenced by sync schema");
        let valid = gen.let("valid");
        gen.try(() => {
          gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`), addEvaluatedFrom(v), allErrors || gen.assign(valid, !0);
        }, (e) => {
          gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e)), addErrorsFrom(e), allErrors || gen.assign(valid, !1);
        }), cxt.ok(valid);
      }
      function callSyncRef() {
        cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
      }
      function addErrorsFrom(source) {
        let errs = (0, codegen_1._)`${source}.errors`;
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`), gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      }
      function addEvaluatedFrom(source) {
        var _a;
        if (!it.opts.unevaluated)
          return;
        let schEvaluated = (_a = sch?.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
        if (it.props !== !0)
          if (schEvaluated && !schEvaluated.dynamicProps)
            schEvaluated.props !== void 0 && (it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props));
          else {
            let props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
            it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
          }
        if (it.items !== !0)
          if (schEvaluated && !schEvaluated.dynamicItems)
            schEvaluated.items !== void 0 && (it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items));
          else {
            let items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
            it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
          }
      }
    }
    exports.callRef = callRef;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var id_1 = require_id(), ref_1 = require_ref(), core = [
      "$schema",
      "$id",
      "$defs",
      "$vocabulary",
      { keyword: "$comment" },
      "definitions",
      id_1.default,
      ref_1.default
    ];
    exports.default = core;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitNumber.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), ops = codegen_1.operators, KWDs = {
      maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    }, error2 = {
      message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
      params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
    }, def = {
      keyword: Object.keys(KWDs),
      type: "number",
      schemaType: "number",
      $data: !0,
      error: error2,
      code(cxt) {
        let { keyword, data, schemaCode } = cxt;
        cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/multipleOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), error2 = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
      params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
    }, def = {
      keyword: "multipleOf",
      type: "number",
      schemaType: "number",
      $data: !0,
      error: error2,
      code(cxt) {
        let { gen, data, schemaCode, it } = cxt, prec = it.opts.multipleOfPrecision, res = gen.let("res"), invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
        cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    function ucs2length(str) {
      let len = str.length, length = 0, pos = 0, value;
      for (; pos < len; )
        length++, value = str.charCodeAt(pos++), value >= 55296 && value <= 56319 && pos < len && (value = str.charCodeAt(pos), (value & 64512) === 56320 && pos++);
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitLength.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), util_1 = require_util(), ucs2length_1 = require_ucs2length(), error2 = {
      message({ keyword, schemaCode }) {
        let comp = keyword === "maxLength" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    }, def = {
      keyword: ["maxLength", "minLength"],
      type: "string",
      schemaType: "number",
      $data: !0,
      error: error2,
      code(cxt) {
        let { keyword, data, schemaCode, it } = cxt, op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT, len = it.opts.unicode === !1 ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
        cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var code_1 = require_code2(), util_1 = require_util(), codegen_1 = require_codegen(), error2 = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
    }, def = {
      keyword: "pattern",
      type: "string",
      schemaType: "string",
      $data: !0,
      error: error2,
      code(cxt) {
        let { gen, data, $data, schema, schemaCode, it } = cxt, u = it.opts.unicodeRegExp ? "u" : "";
        if ($data) {
          let { regExp } = it.opts.code, regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._)`new RegExp` : (0, util_1.useFunc)(gen, regExp), valid = gen.let("valid");
          gen.try(() => gen.assign(valid, (0, codegen_1._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, !1)), cxt.fail$data((0, codegen_1._)`!${valid}`);
        } else {
          let regExp = (0, code_1.usePattern)(cxt, schema);
          cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), error2 = {
      message({ keyword, schemaCode }) {
        let comp = keyword === "maxProperties" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    }, def = {
      keyword: ["maxProperties", "minProperties"],
      type: "object",
      schemaType: "number",
      $data: !0,
      error: error2,
      code(cxt) {
        let { keyword, data, schemaCode } = cxt, op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/required.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var code_1 = require_code2(), codegen_1 = require_codegen(), util_1 = require_util(), error2 = {
      message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
      params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
    }, def = {
      keyword: "required",
      type: "object",
      schemaType: "array",
      $data: !0,
      error: error2,
      code(cxt) {
        let { gen, schema, schemaCode, data, $data, it } = cxt, { opts } = it;
        if (!$data && schema.length === 0)
          return;
        let useLoop = schema.length >= opts.loopRequired;
        if (it.allErrors ? allErrorsMode() : exitOnErrorMode(), opts.strictRequired) {
          let props = cxt.parentSchema.properties, { definedProperties } = cxt.it;
          for (let requiredKey of schema)
            if (props?.[requiredKey] === void 0 && !definedProperties.has(requiredKey)) {
              let schemaPath = it.schemaEnv.baseId + it.errSchemaPath, msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
              (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
            }
        }
        function allErrorsMode() {
          if (useLoop || $data)
            cxt.block$data(codegen_1.nil, loopAllRequired);
          else
            for (let prop of schema)
              (0, code_1.checkReportMissingProp)(cxt, prop);
        }
        function exitOnErrorMode() {
          let missing = gen.let("missing");
          if (useLoop || $data) {
            let valid = gen.let("valid", !0);
            cxt.block$data(valid, () => loopUntilMissing(missing, valid)), cxt.ok(valid);
          } else
            gen.if((0, code_1.checkMissingProp)(cxt, schema, missing)), (0, code_1.reportMissingProp)(cxt, missing), gen.else();
        }
        function loopAllRequired() {
          gen.forOf("prop", schemaCode, (prop) => {
            cxt.setParams({ missingProperty: prop }), gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
          });
        }
        function loopUntilMissing(missing, valid) {
          cxt.setParams({ missingProperty: missing }), gen.forOf(missing, schemaCode, () => {
            gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties)), gen.if((0, codegen_1.not)(valid), () => {
              cxt.error(), gen.break();
            });
          }, codegen_1.nil);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), error2 = {
      message({ keyword, schemaCode }) {
        let comp = keyword === "maxItems" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    }, def = {
      keyword: ["maxItems", "minItems"],
      type: "array",
      schemaType: "number",
      $data: !0,
      error: error2,
      code(cxt) {
        let { keyword, data, schemaCode } = cxt, op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS({
  "node_modules/ajv/dist/runtime/equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var equal = require_fast_deep_equal();
    equal.code = 'require("ajv/dist/runtime/equal").default';
    exports.default = equal;
  }
});

// node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/uniqueItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var dataType_1 = require_dataType(), codegen_1 = require_codegen(), util_1 = require_util(), equal_1 = require_equal(), error2 = {
      message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
      params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
    }, def = {
      keyword: "uniqueItems",
      type: "array",
      schemaType: "boolean",
      $data: !0,
      error: error2,
      code(cxt) {
        let { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
        if (!$data && !schema)
          return;
        let valid = gen.let("valid"), itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
        cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`), cxt.ok(valid);
        function validateUniqueItems() {
          let i = gen.let("i", (0, codegen_1._)`${data}.length`), j = gen.let("j");
          cxt.setParams({ i, j }), gen.assign(valid, !0), gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
        }
        function canOptimize() {
          return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
        }
        function loopN(i, j) {
          let item = gen.name("item"), wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong), indices = gen.const("indices", (0, codegen_1._)`{}`);
          gen.for((0, codegen_1._)`;${i}--;`, () => {
            gen.let(item, (0, codegen_1._)`${data}[${i}]`), gen.if(wrongType, (0, codegen_1._)`continue`), itemTypes.length > 1 && gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`), gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
              gen.assign(j, (0, codegen_1._)`${indices}[${item}]`), cxt.error(), gen.assign(valid, !1).break();
            }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
          });
        }
        function loopN2(i, j) {
          let eql = (0, util_1.useFunc)(gen, equal_1.default), outer = gen.name("outer");
          gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
            cxt.error(), gen.assign(valid, !1).break(outer);
          })));
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/const.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), util_1 = require_util(), equal_1 = require_equal(), error2 = {
      message: "must be equal to constant",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
    }, def = {
      keyword: "const",
      $data: !0,
      error: error2,
      code(cxt) {
        let { gen, data, $data, schemaCode, schema } = cxt;
        $data || schema && typeof schema == "object" ? cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`) : cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/enum.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), util_1 = require_util(), equal_1 = require_equal(), error2 = {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
    }, def = {
      keyword: "enum",
      schemaType: "array",
      $data: !0,
      error: error2,
      code(cxt) {
        let { gen, data, $data, schema, schemaCode, it } = cxt;
        if (!$data && schema.length === 0)
          throw new Error("enum must have non-empty array");
        let useLoop = schema.length >= it.opts.loopEnum, eql, getEql = () => eql ?? (eql = (0, util_1.useFunc)(gen, equal_1.default)), valid;
        if (useLoop || $data)
          valid = gen.let("valid"), cxt.block$data(valid, loopEnum);
        else {
          if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
          let vSchema = gen.const("vSchema", schemaCode);
          valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
        }
        cxt.pass(valid);
        function loopEnum() {
          gen.assign(valid, !1), gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, !0).break()));
        }
        function equalCode(vSchema, i) {
          let sch = schema[i];
          return typeof sch == "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var limitNumber_1 = require_limitNumber(), multipleOf_1 = require_multipleOf(), limitLength_1 = require_limitLength(), pattern_1 = require_pattern(), limitProperties_1 = require_limitProperties(), required_1 = require_required(), limitItems_1 = require_limitItems(), uniqueItems_1 = require_uniqueItems(), const_1 = require_const(), enum_1 = require_enum(), validation = [
      // number
      limitNumber_1.default,
      multipleOf_1.default,
      // string
      limitLength_1.default,
      pattern_1.default,
      // object
      limitProperties_1.default,
      required_1.default,
      // array
      limitItems_1.default,
      uniqueItems_1.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      const_1.default,
      enum_1.default
    ];
    exports.default = validation;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/additionalItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.validateAdditionalItems = void 0;
    var codegen_1 = require_codegen(), util_1 = require_util(), error2 = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    }, def = {
      keyword: "additionalItems",
      type: "array",
      schemaType: ["boolean", "object"],
      before: "uniqueItems",
      error: error2,
      code(cxt) {
        let { parentSchema, it } = cxt, { items } = parentSchema;
        if (!Array.isArray(items)) {
          (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
          return;
        }
        validateAdditionalItems(cxt, items);
      }
    };
    function validateAdditionalItems(cxt, items) {
      let { gen, schema, data, keyword, it } = cxt;
      it.items = !0;
      let len = gen.const("len", (0, codegen_1._)`${data}.length`);
      if (schema === !1)
        cxt.setParams({ len: items.length }), cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
      else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
        let valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
        gen.if((0, codegen_1.not)(valid), () => validateItems(valid)), cxt.ok(valid);
      }
      function validateItems(valid) {
        gen.forRange("i", items.length, len, (i) => {
          cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid), it.allErrors || gen.if((0, codegen_1.not)(valid), () => gen.break());
        });
      }
    }
    exports.validateAdditionalItems = validateAdditionalItems;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/items.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.validateTuple = void 0;
    var codegen_1 = require_codegen(), util_1 = require_util(), code_1 = require_code2(), def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "array", "boolean"],
      before: "uniqueItems",
      code(cxt) {
        let { schema, it } = cxt;
        if (Array.isArray(schema))
          return validateTuple(cxt, "additionalItems", schema);
        it.items = !0, !(0, util_1.alwaysValidSchema)(it, schema) && cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    function validateTuple(cxt, extraItems, schArr = cxt.schema) {
      let { gen, parentSchema, data, keyword, it } = cxt;
      checkStrictTuple(parentSchema), it.opts.unevaluated && schArr.length && it.items !== !0 && (it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items));
      let valid = gen.name("valid"), len = gen.const("len", (0, codegen_1._)`${data}.length`);
      schArr.forEach((sch, i) => {
        (0, util_1.alwaysValidSchema)(it, sch) || (gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
          keyword,
          schemaProp: i,
          dataProp: i
        }, valid)), cxt.ok(valid));
      });
      function checkStrictTuple(sch) {
        let { opts, errSchemaPath } = it, l = schArr.length, fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === !1);
        if (opts.strictTuples && !fullTuple) {
          let msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
          (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
        }
      }
    }
    exports.validateTuple = validateTuple;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/prefixItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var items_1 = require_items(), def = {
      keyword: "prefixItems",
      type: "array",
      schemaType: ["array"],
      before: "uniqueItems",
      code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/items2020.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), util_1 = require_util(), code_1 = require_code2(), additionalItems_1 = require_additionalItems(), error2 = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    }, def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      error: error2,
      code(cxt) {
        let { schema, parentSchema, it } = cxt, { prefixItems } = parentSchema;
        it.items = !0, !(0, util_1.alwaysValidSchema)(it, schema) && (prefixItems ? (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems) : cxt.ok((0, code_1.validateArray)(cxt)));
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/contains.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), util_1 = require_util(), error2 = {
      message: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
      params: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
    }, def = {
      keyword: "contains",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      trackErrors: !0,
      error: error2,
      code(cxt) {
        let { gen, schema, parentSchema, data, it } = cxt, min, max, { minContains, maxContains } = parentSchema;
        it.opts.next ? (min = minContains === void 0 ? 1 : minContains, max = maxContains) : min = 1;
        let len = gen.const("len", (0, codegen_1._)`${data}.length`);
        if (cxt.setParams({ min, max }), max === void 0 && min === 0) {
          (0, util_1.checkStrictMode)(it, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
          return;
        }
        if (max !== void 0 && min > max) {
          (0, util_1.checkStrictMode)(it, '"minContains" > "maxContains" is always invalid'), cxt.fail();
          return;
        }
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          let cond = (0, codegen_1._)`${len} >= ${min}`;
          max !== void 0 && (cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`), cxt.pass(cond);
          return;
        }
        it.items = !0;
        let valid = gen.name("valid");
        max === void 0 && min === 1 ? validateItems(valid, () => gen.if(valid, () => gen.break())) : min === 0 ? (gen.let(valid, !0), max !== void 0 && gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount)) : (gen.let(valid, !1), validateItemsWithCount()), cxt.result(valid, () => cxt.reset());
        function validateItemsWithCount() {
          let schValid = gen.name("_valid"), count = gen.let("count", 0);
          validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
        }
        function validateItems(_valid, block) {
          gen.forRange("i", 0, len, (i) => {
            cxt.subschema({
              keyword: "contains",
              dataProp: i,
              dataPropType: util_1.Type.Num,
              compositeRule: !0
            }, _valid), block();
          });
        }
        function checkLimits(count) {
          gen.code((0, codegen_1._)`${count}++`), max === void 0 ? gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, !0).break()) : (gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, !1).break()), min === 1 ? gen.assign(valid, !0) : gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, !0)));
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/dependencies.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
    var codegen_1 = require_codegen(), util_1 = require_util(), code_1 = require_code2();
    exports.error = {
      message: ({ params: { property, depsCount, deps } }) => {
        let property_ies = depsCount === 1 ? "property" : "properties";
        return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
      },
      params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
      // TODO change to reference
    };
    var def = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: exports.error,
      code(cxt) {
        let [propDeps, schDeps] = splitDependencies(cxt);
        validatePropertyDeps(cxt, propDeps), validateSchemaDeps(cxt, schDeps);
      }
    };
    function splitDependencies({ schema }) {
      let propertyDeps = {}, schemaDeps = {};
      for (let key in schema) {
        if (key === "__proto__")
          continue;
        let deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
        deps[key] = schema[key];
      }
      return [propertyDeps, schemaDeps];
    }
    function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
      let { gen, data, it } = cxt;
      if (Object.keys(propertyDeps).length === 0)
        return;
      let missing = gen.let("missing");
      for (let prop in propertyDeps) {
        let deps = propertyDeps[prop];
        if (deps.length === 0)
          continue;
        let hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
        cxt.setParams({
          property: prop,
          depsCount: deps.length,
          deps: deps.join(", ")
        }), it.allErrors ? gen.if(hasProperty, () => {
          for (let depProp of deps)
            (0, code_1.checkReportMissingProp)(cxt, depProp);
        }) : (gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`), (0, code_1.reportMissingProp)(cxt, missing), gen.else());
      }
    }
    exports.validatePropertyDeps = validatePropertyDeps;
    function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
      let { gen, data, keyword, it } = cxt, valid = gen.name("valid");
      for (let prop in schemaDeps)
        (0, util_1.alwaysValidSchema)(it, schemaDeps[prop]) || (gen.if(
          (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties),
          () => {
            let schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
            cxt.mergeValidEvaluated(schCxt, valid);
          },
          () => gen.var(valid, !0)
          // TODO var
        ), cxt.ok(valid));
    }
    exports.validateSchemaDeps = validateSchemaDeps;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/propertyNames.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), util_1 = require_util(), error2 = {
      message: "property name must be valid",
      params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
    }, def = {
      keyword: "propertyNames",
      type: "object",
      schemaType: ["object", "boolean"],
      error: error2,
      code(cxt) {
        let { gen, schema, data, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        let valid = gen.name("valid");
        gen.forIn("key", data, (key) => {
          cxt.setParams({ propertyName: key }), cxt.subschema({
            keyword: "propertyNames",
            data: key,
            dataTypes: ["string"],
            propertyName: key,
            compositeRule: !0
          }, valid), gen.if((0, codegen_1.not)(valid), () => {
            cxt.error(!0), it.allErrors || gen.break();
          });
        }), cxt.ok(valid);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var code_1 = require_code2(), codegen_1 = require_codegen(), names_1 = require_names(), util_1 = require_util(), error2 = {
      message: "must NOT have additional properties",
      params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
    }, def = {
      keyword: "additionalProperties",
      type: ["object"],
      schemaType: ["boolean", "object"],
      allowUndefined: !0,
      trackErrors: !0,
      error: error2,
      code(cxt) {
        let { gen, schema, parentSchema, data, errsCount, it } = cxt;
        if (!errsCount)
          throw new Error("ajv implementation error");
        let { allErrors, opts } = it;
        if (it.props = !0, opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
          return;
        let props = (0, code_1.allSchemaProperties)(parentSchema.properties), patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
        checkAdditionalProperties(), cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
        function checkAdditionalProperties() {
          gen.forIn("key", data, (key) => {
            !props.length && !patProps.length ? additionalPropertyCode(key) : gen.if(isAdditional(key), () => additionalPropertyCode(key));
          });
        }
        function isAdditional(key) {
          let definedProp;
          if (props.length > 8) {
            let propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
            definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
          } else props.length ? definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`)) : definedProp = codegen_1.nil;
          return patProps.length && (definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`))), (0, codegen_1.not)(definedProp);
        }
        function deleteAdditional(key) {
          gen.code((0, codegen_1._)`delete ${data}[${key}]`);
        }
        function additionalPropertyCode(key) {
          if (opts.removeAdditional === "all" || opts.removeAdditional && schema === !1) {
            deleteAdditional(key);
            return;
          }
          if (schema === !1) {
            cxt.setParams({ additionalProperty: key }), cxt.error(), allErrors || gen.break();
            return;
          }
          if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
            let valid = gen.name("valid");
            opts.removeAdditional === "failing" ? (applyAdditionalSchema(key, valid, !1), gen.if((0, codegen_1.not)(valid), () => {
              cxt.reset(), deleteAdditional(key);
            })) : (applyAdditionalSchema(key, valid), allErrors || gen.if((0, codegen_1.not)(valid), () => gen.break()));
          }
        }
        function applyAdditionalSchema(key, valid, errors) {
          let subschema = {
            keyword: "additionalProperties",
            dataProp: key,
            dataPropType: util_1.Type.Str
          };
          errors === !1 && Object.assign(subschema, {
            compositeRule: !0,
            createErrors: !1,
            allErrors: !1
          }), cxt.subschema(subschema, valid);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/properties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var validate_1 = require_validate(), code_1 = require_code2(), util_1 = require_util(), additionalProperties_1 = require_additionalProperties(), def = {
      keyword: "properties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        let { gen, schema, parentSchema, data, it } = cxt;
        it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0 && additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
        let allProps = (0, code_1.allSchemaProperties)(schema);
        for (let prop of allProps)
          it.definedProperties.add(prop);
        it.opts.unevaluated && allProps.length && it.props !== !0 && (it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props));
        let properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
        if (properties.length === 0)
          return;
        let valid = gen.name("valid");
        for (let prop of properties)
          hasDefault(prop) ? applyPropertySchema(prop) : (gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties)), applyPropertySchema(prop), it.allErrors || gen.else().var(valid, !0), gen.endIf()), cxt.it.definedProperties.add(prop), cxt.ok(valid);
        function hasDefault(prop) {
          return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== void 0;
        }
        function applyPropertySchema(prop) {
          cxt.subschema({
            keyword: "properties",
            schemaProp: prop,
            dataProp: prop
          }, valid);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/patternProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var code_1 = require_code2(), codegen_1 = require_codegen(), util_1 = require_util(), util_2 = require_util(), def = {
      keyword: "patternProperties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        let { gen, schema, data, parentSchema, it } = cxt, { opts } = it, patterns = (0, code_1.allSchemaProperties)(schema), alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
        if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === !0))
          return;
        let checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties, valid = gen.name("valid");
        it.props !== !0 && !(it.props instanceof codegen_1.Name) && (it.props = (0, util_2.evaluatedPropsToName)(gen, it.props));
        let { props } = it;
        validatePatternProperties();
        function validatePatternProperties() {
          for (let pat of patterns)
            checkProperties && checkMatchingProperties(pat), it.allErrors ? validateProperties(pat) : (gen.var(valid, !0), validateProperties(pat), gen.if(valid));
        }
        function checkMatchingProperties(pat) {
          for (let prop in checkProperties)
            new RegExp(pat).test(prop) && (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
        }
        function validateProperties(pat) {
          gen.forIn("key", data, (key) => {
            gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
              let alwaysValid = alwaysValidPatterns.includes(pat);
              alwaysValid || cxt.subschema({
                keyword: "patternProperties",
                schemaProp: pat,
                dataProp: key,
                dataPropType: util_2.Type.Str
              }, valid), it.opts.unevaluated && props !== !0 ? gen.assign((0, codegen_1._)`${props}[${key}]`, !0) : !alwaysValid && !it.allErrors && gen.if((0, codegen_1.not)(valid), () => gen.break());
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/not.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var util_1 = require_util(), def = {
      keyword: "not",
      schemaType: ["object", "boolean"],
      trackErrors: !0,
      code(cxt) {
        let { gen, schema, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          cxt.fail();
          return;
        }
        let valid = gen.name("valid");
        cxt.subschema({
          keyword: "not",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, valid), cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
      },
      error: { message: "must NOT be valid" }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/anyOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var code_1 = require_code2(), def = {
      keyword: "anyOf",
      schemaType: "array",
      trackErrors: !0,
      code: code_1.validateUnion,
      error: { message: "must match a schema in anyOf" }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/oneOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), util_1 = require_util(), error2 = {
      message: "must match exactly one schema in oneOf",
      params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
    }, def = {
      keyword: "oneOf",
      schemaType: "array",
      trackErrors: !0,
      error: error2,
      code(cxt) {
        let { gen, schema, parentSchema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        if (it.opts.discriminator && parentSchema.discriminator)
          return;
        let schArr = schema, valid = gen.let("valid", !1), passing = gen.let("passing", null), schValid = gen.name("_valid");
        cxt.setParams({ passing }), gen.block(validateOneOf), cxt.result(valid, () => cxt.reset(), () => cxt.error(!0));
        function validateOneOf() {
          schArr.forEach((sch, i) => {
            let schCxt;
            (0, util_1.alwaysValidSchema)(it, sch) ? gen.var(schValid, !0) : schCxt = cxt.subschema({
              keyword: "oneOf",
              schemaProp: i,
              compositeRule: !0
            }, schValid), i > 0 && gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, !1).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else(), gen.if(schValid, () => {
              gen.assign(valid, !0), gen.assign(passing, i), schCxt && cxt.mergeEvaluated(schCxt, codegen_1.Name);
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/allOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var util_1 = require_util(), def = {
      keyword: "allOf",
      schemaType: "array",
      code(cxt) {
        let { gen, schema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        let valid = gen.name("valid");
        schema.forEach((sch, i) => {
          if ((0, util_1.alwaysValidSchema)(it, sch))
            return;
          let schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
          cxt.ok(valid), cxt.mergeEvaluated(schCxt);
        });
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/if.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), util_1 = require_util(), error2 = {
      message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
      params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
    }, def = {
      keyword: "if",
      schemaType: ["object", "boolean"],
      trackErrors: !0,
      error: error2,
      code(cxt) {
        let { gen, parentSchema, it } = cxt;
        parentSchema.then === void 0 && parentSchema.else === void 0 && (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
        let hasThen = hasSchema(it, "then"), hasElse = hasSchema(it, "else");
        if (!hasThen && !hasElse)
          return;
        let valid = gen.let("valid", !0), schValid = gen.name("_valid");
        if (validateIf(), cxt.reset(), hasThen && hasElse) {
          let ifClause = gen.let("ifClause");
          cxt.setParams({ ifClause }), gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
        } else hasThen ? gen.if(schValid, validateClause("then")) : gen.if((0, codegen_1.not)(schValid), validateClause("else"));
        cxt.pass(valid, () => cxt.error(!0));
        function validateIf() {
          let schCxt = cxt.subschema({
            keyword: "if",
            compositeRule: !0,
            createErrors: !1,
            allErrors: !1
          }, schValid);
          cxt.mergeEvaluated(schCxt);
        }
        function validateClause(keyword, ifClause) {
          return () => {
            let schCxt = cxt.subschema({ keyword }, schValid);
            gen.assign(valid, schValid), cxt.mergeValidEvaluated(schCxt, valid), ifClause ? gen.assign(ifClause, (0, codegen_1._)`${keyword}`) : cxt.setParams({ ifClause: keyword });
          };
        }
      }
    };
    function hasSchema(it, keyword) {
      let schema = it.schema[keyword];
      return schema !== void 0 && !(0, util_1.alwaysValidSchema)(it, schema);
    }
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/thenElse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var util_1 = require_util(), def = {
      keyword: ["then", "else"],
      schemaType: ["object", "boolean"],
      code({ keyword, parentSchema, it }) {
        parentSchema.if === void 0 && (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var additionalItems_1 = require_additionalItems(), prefixItems_1 = require_prefixItems(), items_1 = require_items(), items2020_1 = require_items2020(), contains_1 = require_contains(), dependencies_1 = require_dependencies(), propertyNames_1 = require_propertyNames(), additionalProperties_1 = require_additionalProperties(), properties_1 = require_properties(), patternProperties_1 = require_patternProperties(), not_1 = require_not(), anyOf_1 = require_anyOf(), oneOf_1 = require_oneOf(), allOf_1 = require_allOf(), if_1 = require_if(), thenElse_1 = require_thenElse();
    function getApplicator(draft2020 = !1) {
      let applicator = [
        // any
        not_1.default,
        anyOf_1.default,
        oneOf_1.default,
        allOf_1.default,
        if_1.default,
        thenElse_1.default,
        // object
        propertyNames_1.default,
        additionalProperties_1.default,
        dependencies_1.default,
        properties_1.default,
        patternProperties_1.default
      ];
      return draft2020 ? applicator.push(prefixItems_1.default, items2020_1.default) : applicator.push(additionalItems_1.default, items_1.default), applicator.push(contains_1.default), applicator;
    }
    exports.default = getApplicator;
  }
});

// node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS({
  "node_modules/ajv/dist/vocabularies/format/format.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), error2 = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
    }, def = {
      keyword: "format",
      type: ["number", "string"],
      schemaType: "string",
      $data: !0,
      error: error2,
      code(cxt, ruleType) {
        let { gen, data, $data, schema, schemaCode, it } = cxt, { opts, errSchemaPath, schemaEnv, self } = it;
        if (!opts.validateFormats)
          return;
        $data ? validate$DataFormat() : validateFormat();
        function validate$DataFormat() {
          let fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          }), fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`), fType = gen.let("fType"), format = gen.let("format");
          gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef)), cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
          function unknownFmt() {
            return opts.strictSchema === !1 ? codegen_1.nil : (0, codegen_1._)`${schemaCode} && !${format}`;
          }
          function invalidFmt() {
            let callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`, validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
            return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
          }
        }
        function validateFormat() {
          let formatDef = self.formats[schema];
          if (!formatDef) {
            unknownFormat();
            return;
          }
          if (formatDef === !0)
            return;
          let [fmtType, format, fmtRef] = getFormat(formatDef);
          fmtType === ruleType && cxt.pass(validCondition());
          function unknownFormat() {
            if (opts.strictSchema === !1) {
              self.logger.warn(unknownMsg());
              return;
            }
            throw new Error(unknownMsg());
            function unknownMsg() {
              return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
            }
          }
          function getFormat(fmtDef) {
            let code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : void 0, fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
            return typeof fmtDef == "object" && !(fmtDef instanceof RegExp) ? [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`] : ["string", fmtDef, fmt];
          }
          function validCondition() {
            if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
              if (!schemaEnv.$async)
                throw new Error("async format in sync schema");
              return (0, codegen_1._)`await ${fmtRef}(${data})`;
            }
            return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
          }
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/format/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var format_1 = require_format(), format = [format_1.default];
    exports.default = format;
  }
});

// node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS({
  "node_modules/ajv/dist/vocabularies/metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.contentVocabulary = exports.metadataVocabulary = void 0;
    exports.metadataVocabulary = [
      "title",
      "description",
      "default",
      "deprecated",
      "readOnly",
      "writeOnly",
      "examples"
    ];
    exports.contentVocabulary = [
      "contentMediaType",
      "contentEncoding",
      "contentSchema"
    ];
  }
});

// node_modules/ajv/dist/vocabularies/draft7.js
var require_draft7 = __commonJS({
  "node_modules/ajv/dist/vocabularies/draft7.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var core_1 = require_core2(), validation_1 = require_validation(), applicator_1 = require_applicator(), format_1 = require_format2(), metadata_1 = require_metadata(), draft7Vocabularies = [
      core_1.default,
      validation_1.default,
      (0, applicator_1.default)(),
      format_1.default,
      metadata_1.metadataVocabulary,
      metadata_1.contentVocabulary
    ];
    exports.default = draft7Vocabularies;
  }
});

// node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS({
  "node_modules/ajv/dist/vocabularies/discriminator/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.DiscrError = void 0;
    var DiscrError;
    (function(DiscrError2) {
      DiscrError2.Tag = "tag", DiscrError2.Mapping = "mapping";
    })(DiscrError || (exports.DiscrError = DiscrError = {}));
  }
});

// node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS({
  "node_modules/ajv/dist/vocabularies/discriminator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var codegen_1 = require_codegen(), types_1 = require_types(), compile_1 = require_compile(), ref_error_1 = require_ref_error(), util_1 = require_util(), error2 = {
      message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
      params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
    }, def = {
      keyword: "discriminator",
      type: "object",
      schemaType: "object",
      error: error2,
      code(cxt) {
        let { gen, data, schema, parentSchema, it } = cxt, { oneOf } = parentSchema;
        if (!it.opts.discriminator)
          throw new Error("discriminator: requires discriminator option");
        let tagName = schema.propertyName;
        if (typeof tagName != "string")
          throw new Error("discriminator: requires propertyName");
        if (schema.mapping)
          throw new Error("discriminator: mapping is not supported");
        if (!oneOf)
          throw new Error("discriminator: requires oneOf keyword");
        let valid = gen.let("valid", !1), tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
        gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(!1, { discrError: types_1.DiscrError.Tag, tag, tagName })), cxt.ok(valid);
        function validateMapping() {
          let mapping = getMapping();
          gen.if(!1);
          for (let tagValue in mapping)
            gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`), gen.assign(valid, applyTagSchema(mapping[tagValue]));
          gen.else(), cxt.error(!1, { discrError: types_1.DiscrError.Mapping, tag, tagName }), gen.endIf();
        }
        function applyTagSchema(schemaProp) {
          let _valid = gen.name("valid"), schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
          return cxt.mergeEvaluated(schCxt, codegen_1.Name), _valid;
        }
        function getMapping() {
          var _a;
          let oneOfMapping = {}, topRequired = hasRequired(parentSchema), tagRequired = !0;
          for (let i = 0; i < oneOf.length; i++) {
            let sch = oneOf[i];
            if (sch?.$ref && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
              let ref = sch.$ref;
              if (sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref), sch instanceof compile_1.SchemaEnv && (sch = sch.schema), sch === void 0)
                throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
            }
            let propSch = (_a = sch?.properties) === null || _a === void 0 ? void 0 : _a[tagName];
            if (typeof propSch != "object")
              throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
            tagRequired = tagRequired && (topRequired || hasRequired(sch)), addMappings(propSch, i);
          }
          if (!tagRequired)
            throw new Error(`discriminator: "${tagName}" must be required`);
          return oneOfMapping;
          function hasRequired({ required: required2 }) {
            return Array.isArray(required2) && required2.includes(tagName);
          }
          function addMappings(sch, i) {
            if (sch.const)
              addMapping(sch.const, i);
            else if (sch.enum)
              for (let tagValue of sch.enum)
                addMapping(tagValue, i);
            else
              throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
          }
          function addMapping(tagValue, i) {
            if (typeof tagValue != "string" || tagValue in oneOfMapping)
              throw new Error(`discriminator: "${tagName}" values must be unique strings`);
            oneOfMapping[tagValue] = i;
          }
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/refs/json-schema-draft-07.json
var require_json_schema_draft_07 = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-draft-07.json"(exports, module) {
    module.exports = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://json-schema.org/draft-07/schema#",
      title: "Core schema meta-schema",
      definitions: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: { $ref: "#" }
        },
        nonNegativeInteger: {
          type: "integer",
          minimum: 0
        },
        nonNegativeIntegerDefault0: {
          allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }]
        },
        simpleTypes: {
          enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
        },
        stringArray: {
          type: "array",
          items: { type: "string" },
          uniqueItems: !0,
          default: []
        }
      },
      type: ["object", "boolean"],
      properties: {
        $id: {
          type: "string",
          format: "uri-reference"
        },
        $schema: {
          type: "string",
          format: "uri"
        },
        $ref: {
          type: "string",
          format: "uri-reference"
        },
        $comment: {
          type: "string"
        },
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: !0,
        readOnly: {
          type: "boolean",
          default: !1
        },
        examples: {
          type: "array",
          items: !0
        },
        multipleOf: {
          type: "number",
          exclusiveMinimum: 0
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "number"
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "number"
        },
        maxLength: { $ref: "#/definitions/nonNegativeInteger" },
        minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        pattern: {
          type: "string",
          format: "regex"
        },
        additionalItems: { $ref: "#" },
        items: {
          anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
          default: !0
        },
        maxItems: { $ref: "#/definitions/nonNegativeInteger" },
        minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        uniqueItems: {
          type: "boolean",
          default: !1
        },
        contains: { $ref: "#" },
        maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
        minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        required: { $ref: "#/definitions/stringArray" },
        additionalProperties: { $ref: "#" },
        definitions: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        properties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          propertyNames: { format: "regex" },
          default: {}
        },
        dependencies: {
          type: "object",
          additionalProperties: {
            anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
          }
        },
        propertyNames: { $ref: "#" },
        const: !0,
        enum: {
          type: "array",
          items: !0,
          minItems: 1,
          uniqueItems: !0
        },
        type: {
          anyOf: [
            { $ref: "#/definitions/simpleTypes" },
            {
              type: "array",
              items: { $ref: "#/definitions/simpleTypes" },
              minItems: 1,
              uniqueItems: !0
            }
          ]
        },
        format: { type: "string" },
        contentMediaType: { type: "string" },
        contentEncoding: { type: "string" },
        if: { $ref: "#" },
        then: { $ref: "#" },
        else: { $ref: "#" },
        allOf: { $ref: "#/definitions/schemaArray" },
        anyOf: { $ref: "#/definitions/schemaArray" },
        oneOf: { $ref: "#/definitions/schemaArray" },
        not: { $ref: "#" }
      },
      default: !0
    };
  }
});

// node_modules/ajv/dist/ajv.js
var require_ajv = __commonJS({
  "node_modules/ajv/dist/ajv.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = void 0;
    var core_1 = require_core(), draft7_1 = require_draft7(), discriminator_1 = require_discriminator(), draft7MetaSchema = require_json_schema_draft_07(), META_SUPPORT_DATA = ["/properties"], META_SCHEMA_ID = "http://json-schema.org/draft-07/schema", Ajv2 = class extends core_1.default {
      _addVocabularies() {
        super._addVocabularies(), draft7_1.default.forEach((v) => this.addVocabulary(v)), this.opts.discriminator && this.addKeyword(discriminator_1.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        let metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
        this.addMetaSchema(metaSchema, META_SCHEMA_ID, !1), this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
      }
    };
    exports.Ajv = Ajv2;
    module.exports = exports = Ajv2;
    module.exports.Ajv = Ajv2;
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.default = Ajv2;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: !0, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: !0, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: !0, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: !0, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: !0, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: !0, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: !0, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error();
    Object.defineProperty(exports, "ValidationError", { enumerable: !0, get: function() {
      return validation_error_1.default;
    } });
    var ref_error_1 = require_ref_error();
    Object.defineProperty(exports, "MissingRefError", { enumerable: !0, get: function() {
      return ref_error_1.default;
    } });
  }
});

// node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS({
  "node_modules/ajv-formats/dist/formats.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.formatNames = exports.fastFormats = exports.fullFormats = void 0;
    function fmtDef(validate, compare) {
      return { validate, compare };
    }
    exports.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: fmtDef(date3, compareDate),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: fmtDef(getTime(!0), compareTime),
      "date-time": fmtDef(getDateTime(!0), compareDateTime),
      "iso-time": fmtDef(getTime(), compareIsoTime),
      "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri,
      "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte,
      // signed 32 bit integer
      int32: { type: "number", validate: validateInt32 },
      // signed 64 bit integer
      int64: { type: "number", validate: validateInt64 },
      // C-type float
      float: { type: "number", validate: validateNumber },
      // C-type double
      double: { type: "number", validate: validateNumber },
      // hint to the UI to hide input strings
      password: !0,
      // unchecked string payload
      binary: !0
    };
    exports.fastFormats = {
      ...exports.fullFormats,
      date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
      time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
      "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
      "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
      "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
    };
    exports.formatNames = Object.keys(exports.fullFormats);
    function isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function date3(str) {
      let matches = DATE.exec(str);
      if (!matches)
        return !1;
      let year = +matches[1], month = +matches[2], day = +matches[3];
      return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
    }
    function compareDate(d1, d2) {
      if (d1 && d2)
        return d1 > d2 ? 1 : d1 < d2 ? -1 : 0;
    }
    var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function getTime(strictTimeZone) {
      return function(str) {
        let matches = TIME.exec(str);
        if (!matches)
          return !1;
        let hr = +matches[1], min = +matches[2], sec = +matches[3], tz = matches[4], tzSign = matches[5] === "-" ? -1 : 1, tzH = +(matches[6] || 0), tzM = +(matches[7] || 0);
        if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
          return !1;
        if (hr <= 23 && min <= 59 && sec < 60)
          return !0;
        let utcMin = min - tzM * tzSign, utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
        return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
      };
    }
    function compareTime(s1, s2) {
      if (!(s1 && s2))
        return;
      let t1 = (/* @__PURE__ */ new Date("2020-01-01T" + s1)).valueOf(), t2 = (/* @__PURE__ */ new Date("2020-01-01T" + s2)).valueOf();
      if (t1 && t2)
        return t1 - t2;
    }
    function compareIsoTime(t1, t2) {
      if (!(t1 && t2))
        return;
      let a1 = TIME.exec(t1), a2 = TIME.exec(t2);
      if (a1 && a2)
        return t1 = a1[1] + a1[2] + a1[3], t2 = a2[1] + a2[2] + a2[3], t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
    }
    var DATE_TIME_SEPARATOR = /t|\s/i;
    function getDateTime(strictTimeZone) {
      let time3 = getTime(strictTimeZone);
      return function(str) {
        let dateTime = str.split(DATE_TIME_SEPARATOR);
        return dateTime.length === 2 && date3(dateTime[0]) && time3(dateTime[1]);
      };
    }
    function compareDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return;
      let d1 = new Date(dt1).valueOf(), d2 = new Date(dt2).valueOf();
      if (d1 && d2)
        return d1 - d2;
    }
    function compareIsoDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return;
      let [d1, t1] = dt1.split(DATE_TIME_SEPARATOR), [d2, t2] = dt2.split(DATE_TIME_SEPARATOR), res = compareDate(d1, d2);
      if (res !== void 0)
        return res || compareTime(t1, t2);
    }
    var NOT_URI_FRAGMENT = /\/|:/, URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function uri(str) {
      return NOT_URI_FRAGMENT.test(str) && URI.test(str);
    }
    var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function byte(str) {
      return BYTE.lastIndex = 0, BYTE.test(str);
    }
    var MIN_INT32 = -(2 ** 31), MAX_INT32 = 2 ** 31 - 1;
    function validateInt32(value) {
      return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
    }
    function validateInt64(value) {
      return Number.isInteger(value);
    }
    function validateNumber() {
      return !0;
    }
    var Z_ANCHOR = /[^\\]\\Z/;
    function regex(str) {
      if (Z_ANCHOR.test(str))
        return !1;
      try {
        return new RegExp(str), !0;
      } catch {
        return !1;
      }
    }
  }
});

// node_modules/ajv-formats/dist/limit.js
var require_limit = __commonJS({
  "node_modules/ajv-formats/dist/limit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.formatLimitDefinition = void 0;
    var ajv_1 = require_ajv(), codegen_1 = require_codegen(), ops = codegen_1.operators, KWDs = {
      formatMaximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      formatMinimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      formatExclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      formatExclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    }, error2 = {
      message: ({ keyword, schemaCode }) => (0, codegen_1.str)`should be ${KWDs[keyword].okStr} ${schemaCode}`,
      params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
    };
    exports.formatLimitDefinition = {
      keyword: Object.keys(KWDs),
      type: "string",
      schemaType: "string",
      $data: !0,
      error: error2,
      code(cxt) {
        let { gen, data, schemaCode, keyword, it } = cxt, { opts, self } = it;
        if (!opts.validateFormats)
          return;
        let fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
        fCxt.$data ? validate$DataFormat() : validateFormat();
        function validate$DataFormat() {
          let fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          }), fmt = gen.const("fmt", (0, codegen_1._)`${fmts}[${fCxt.schemaCode}]`);
          cxt.fail$data((0, codegen_1.or)((0, codegen_1._)`typeof ${fmt} != "object"`, (0, codegen_1._)`${fmt} instanceof RegExp`, (0, codegen_1._)`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
        }
        function validateFormat() {
          let format = fCxt.schema, fmtDef = self.formats[format];
          if (!fmtDef || fmtDef === !0)
            return;
          if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function")
            throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
          let fmt = gen.scopeValue("formats", {
            key: format,
            ref: fmtDef,
            code: opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(format)}` : void 0
          });
          cxt.fail$data(compareCode(fmt));
        }
        function compareCode(fmt) {
          return (0, codegen_1._)`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
        }
      },
      dependencies: ["format"]
    };
    var formatLimitPlugin = (ajv) => (ajv.addKeyword(exports.formatLimitDefinition), ajv);
    exports.default = formatLimitPlugin;
  }
});

// node_modules/ajv-formats/dist/index.js
var require_dist = __commonJS({
  "node_modules/ajv-formats/dist/index.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var formats_1 = require_formats(), limit_1 = require_limit(), codegen_1 = require_codegen(), fullName = new codegen_1.Name("fullFormats"), fastName = new codegen_1.Name("fastFormats"), formatsPlugin = (ajv, opts = { keywords: !0 }) => {
      if (Array.isArray(opts))
        return addFormats(ajv, opts, formats_1.fullFormats, fullName), ajv;
      let [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName], list = opts.formats || formats_1.formatNames;
      return addFormats(ajv, list, formats, exportName), opts.keywords && (0, limit_1.default)(ajv), ajv;
    };
    formatsPlugin.get = (name, mode = "full") => {
      let f = (mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats)[name];
      if (!f)
        throw new Error(`Unknown format "${name}"`);
      return f;
    };
    function addFormats(ajv, list, fs10, exportName) {
      var _a, _b;
      (_a = (_b = ajv.opts.code).formats) !== null && _a !== void 0 || (_b.formats = (0, codegen_1._)`require("ajv-formats/dist/formats").${exportName}`);
      for (let f of list)
        ajv.addFormat(f, fs10[f]);
    }
    module.exports = exports = formatsPlugin;
    Object.defineProperty(exports, "__esModule", { value: !0 });
    exports.default = formatsPlugin;
  }
});

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
import process2 from "node:process";

// node_modules/zod/v4/core/core.js
var NEVER = Object.freeze({
  status: "aborted"
});
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, params) {
  function init(inst, def) {
    var _a;
    Object.defineProperty(inst, "_zod", {
      value: inst._zod ?? {},
      enumerable: !1
    }), (_a = inst._zod).traits ?? (_a.traits = /* @__PURE__ */ new Set()), inst._zod.traits.add(name), initializer3(inst, def);
    for (let k in _.prototype)
      k in inst || Object.defineProperty(inst, k, { value: _.prototype[k].bind(inst) });
    inst._zod.constr = _, inst._zod.def = def;
  }
  let Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a;
    let inst = params?.Parent ? new Definition() : this;
    init(inst, def), (_a = inst._zod).deferred ?? (_a.deferred = []);
    for (let fn of inst._zod.deferred)
      fn();
    return inst;
  }
  return Object.defineProperty(_, "init", { value: init }), Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => params?.Parent && inst instanceof params.Parent ? !0 : inst?._zod?.traits?.has(name)
  }), Object.defineProperty(_, "name", { value: name }), _;
}
var $brand = Symbol("zod_brand"), $ZodAsyncError = class extends Error {
  constructor() {
    super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
  }
}, globalConfig = {};
function config(newConfig) {
  return newConfig && Object.assign(globalConfig, newConfig), globalConfig;
}

// node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  merge: () => merge,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  required: () => required,
  stringifyPrimitive: () => stringifyPrimitive,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error();
}
function assert(_) {
}
function getEnumValues(entries) {
  let numericValues = Object.values(entries).filter((v) => typeof v == "number");
  return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  return typeof value == "bigint" ? value.toString() : value;
}
function cached(getter) {
  return {
    get value() {
      {
        let value = getter();
        return Object.defineProperty(this, "value", { value }), value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input == null;
}
function cleanRegex(source) {
  let start = source.startsWith("^") ? 1 : 0, end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  let valDecCount = (val.toString().split(".")[1] || "").length, stepDecCount = (step.toString().split(".")[1] || "").length, decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount, valInt = Number.parseInt(val.toFixed(decCount).replace(".", "")), stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function defineLazy(object3, key, getter) {
  Object.defineProperty(object3, key, {
    get() {
      {
        let value = getter();
        return object3[key] = value, value;
      }
      throw new Error("cached value already set");
    },
    set(v) {
      Object.defineProperty(object3, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: !0
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: !0,
    enumerable: !0,
    configurable: !0
  });
}
function getElementAtPath(obj, path8) {
  return path8 ? path8.reduce((acc, key) => acc?.[key], obj) : obj;
}
function promiseAllObject(promisesObj) {
  let keys = Object.keys(promisesObj), promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    let resolvedObj = {};
    for (let i = 0; i < keys.length; i++)
      resolvedObj[keys[i]] = results[i];
    return resolvedObj;
  });
}
function randomString(length = 10) {
  let chars = "abcdefghijklmnopqrstuvwxyz", str = "";
  for (let i = 0; i < length; i++)
    str += chars[Math.floor(Math.random() * chars.length)];
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
var captureStackTrace = Error.captureStackTrace ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data == "object" && data !== null && !Array.isArray(data);
}
var allowsEval = cached(() => {
  if (typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare"))
    return !1;
  try {
    let F = Function;
    return new F(""), !0;
  } catch {
    return !1;
  }
});
function isPlainObject(o) {
  if (isObject(o) === !1)
    return !1;
  let ctor = o.constructor;
  if (ctor === void 0)
    return !0;
  let prot = ctor.prototype;
  return !(isObject(prot) === !1 || Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === !1);
}
function numKeys(data) {
  let keyCount = 0;
  for (let key in data)
    Object.prototype.hasOwnProperty.call(data, key) && keyCount++;
  return keyCount;
}
var getParsedType = (data) => {
  let t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      return Array.isArray(data) ? "array" : data === null ? "null" : data.then && typeof data.then == "function" && data.catch && typeof data.catch == "function" ? "promise" : typeof Map < "u" && data instanceof Map ? "map" : typeof Set < "u" && data instanceof Set ? "set" : typeof Date < "u" && data instanceof Date ? "date" : typeof File < "u" && data instanceof File ? "file" : "object";
    default:
      throw new Error(`Unknown data type: ${t}`);
  }
}, propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]), primitiveTypes = /* @__PURE__ */ new Set(["string", "number", "bigint", "boolean", "symbol", "undefined"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  let cl = new inst._zod.constr(def ?? inst._zod.def);
  return (!def || params?.parent) && (cl._zod.parent = inst), cl;
}
function normalizeParams(_params) {
  let params = _params;
  if (!params)
    return {};
  if (typeof params == "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  return delete params.message, typeof params.error == "string" ? { ...params, error: () => params.error } : params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      return target ?? (target = getter()), Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      return target ?? (target = getter()), Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      return target ?? (target = getter()), Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      return target ?? (target = getter()), Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      return target ?? (target = getter()), Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      return target ?? (target = getter()), Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      return target ?? (target = getter()), Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  return typeof value == "bigint" ? value.toString() + "n" : typeof value == "string" ? `"${value}"` : `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional");
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}, BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  let newShape = {}, currDef = schema._zod.def;
  for (let key in mask) {
    if (!(key in currDef.shape))
      throw new Error(`Unrecognized key: "${key}"`);
    mask[key] && (newShape[key] = currDef.shape[key]);
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function omit(schema, mask) {
  let newShape = { ...schema._zod.def.shape }, currDef = schema._zod.def;
  for (let key in mask) {
    if (!(key in currDef.shape))
      throw new Error(`Unrecognized key: "${key}"`);
    mask[key] && delete newShape[key];
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function extend(schema, shape) {
  if (!isPlainObject(shape))
    throw new Error("Invalid input to extend: expected a plain object");
  let def = {
    ...schema._zod.def,
    get shape() {
      let _shape = { ...schema._zod.def.shape, ...shape };
      return assignProp(this, "shape", _shape), _shape;
    },
    checks: []
    // delete existing checks
  };
  return clone(schema, def);
}
function merge(a, b) {
  return clone(a, {
    ...a._zod.def,
    get shape() {
      let _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      return assignProp(this, "shape", _shape), _shape;
    },
    catchall: b._zod.def.catchall,
    checks: []
    // delete existing checks
  });
}
function partial(Class2, schema, mask) {
  let oldShape = schema._zod.def.shape, shape = { ...oldShape };
  if (mask)
    for (let key in mask) {
      if (!(key in oldShape))
        throw new Error(`Unrecognized key: "${key}"`);
      mask[key] && (shape[key] = Class2 ? new Class2({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key]);
    }
  else
    for (let key in oldShape)
      shape[key] = Class2 ? new Class2({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key];
  return clone(schema, {
    ...schema._zod.def,
    shape,
    checks: []
  });
}
function required(Class2, schema, mask) {
  let oldShape = schema._zod.def.shape, shape = { ...oldShape };
  if (mask)
    for (let key in mask) {
      if (!(key in shape))
        throw new Error(`Unrecognized key: "${key}"`);
      mask[key] && (shape[key] = new Class2({
        type: "nonoptional",
        innerType: oldShape[key]
      }));
    }
  else
    for (let key in oldShape)
      shape[key] = new Class2({
        type: "nonoptional",
        innerType: oldShape[key]
      });
  return clone(schema, {
    ...schema._zod.def,
    shape,
    // optional: [],
    checks: []
  });
}
function aborted(x, startIndex = 0) {
  for (let i = startIndex; i < x.issues.length; i++)
    if (x.issues[i]?.continue !== !0)
      return !0;
  return !1;
}
function prefixIssues(path8, issues) {
  return issues.map((iss) => {
    var _a;
    return (_a = iss).path ?? (_a.path = []), iss.path.unshift(path8), iss;
  });
}
function unwrapMessage(message) {
  return typeof message == "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  let full = { ...iss, path: iss.path ?? [] };
  if (!iss.message) {
    let message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
    full.message = message;
  }
  return delete full.inst, delete full.continue, ctx?.reportInput || delete full.input, full;
}
function getSizableOrigin(input) {
  return input instanceof Set ? "set" : input instanceof Map ? "map" : input instanceof File ? "file" : "unknown";
}
function getLengthableOrigin(input) {
  return Array.isArray(input) ? "array" : typeof input == "string" ? "string" : "unknown";
}
function issue(...args) {
  let [iss, input, inst] = args;
  return typeof iss == "string" ? {
    message: iss,
    code: "custom",
    input,
    inst
  } : { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => Number.isNaN(Number.parseInt(k, 10))).map((el) => el[1]);
}
var Class = class {
  constructor(..._args) {
  }
};

// node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "$ZodError", Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: !1
  }), Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: !1
  }), Object.defineProperty(inst, "message", {
    get() {
      return JSON.stringify(def, jsonStringifyReplacer, 2);
    },
    enumerable: !0
    // configurable: false,
  }), Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: !1
  });
}, $ZodError = $constructor("$ZodError", initializer), $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error2, mapper = (issue2) => issue2.message) {
  let fieldErrors = {}, formErrors = [];
  for (let sub of error2.issues)
    sub.path.length > 0 ? (fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [], fieldErrors[sub.path[0]].push(mapper(sub))) : formErrors.push(mapper(sub));
  return { formErrors, fieldErrors };
}
function formatError(error2, _mapper) {
  let mapper = _mapper || function(issue2) {
    return issue2.message;
  }, fieldErrors = { _errors: [] }, processError = (error3) => {
    for (let issue2 of error3.issues)
      if (issue2.code === "invalid_union" && issue2.errors.length)
        issue2.errors.map((issues) => processError({ issues }));
      else if (issue2.code === "invalid_key")
        processError({ issues: issue2.issues });
      else if (issue2.code === "invalid_element")
        processError({ issues: issue2.issues });
      else if (issue2.path.length === 0)
        fieldErrors._errors.push(mapper(issue2));
      else {
        let curr = fieldErrors, i = 0;
        for (; i < issue2.path.length; ) {
          let el = issue2.path[i];
          i === issue2.path.length - 1 ? (curr[el] = curr[el] || { _errors: [] }, curr[el]._errors.push(mapper(issue2))) : curr[el] = curr[el] || { _errors: [] }, curr = curr[el], i++;
        }
      }
  };
  return processError(error2), fieldErrors;
}

// node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
  let ctx = _ctx ? Object.assign(_ctx, { async: !1 }) : { async: !1 }, result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    throw new $ZodAsyncError();
  if (result.issues.length) {
    let e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    throw captureStackTrace(e, _params?.callee), e;
  }
  return result.value;
}, parse = /* @__PURE__ */ _parse($ZodRealError), _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  let ctx = _ctx ? Object.assign(_ctx, { async: !0 }) : { async: !0 }, result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise && (result = await result), result.issues.length) {
    let e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    throw captureStackTrace(e, params?.callee), e;
  }
  return result.value;
}, parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError), _safeParse = (_Err) => (schema, value, _ctx) => {
  let ctx = _ctx ? { ..._ctx, async: !1 } : { async: !1 }, result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    throw new $ZodAsyncError();
  return result.issues.length ? {
    success: !1,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: !0, data: result.value };
}, safeParse = /* @__PURE__ */ _safeParse($ZodRealError), _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  let ctx = _ctx ? Object.assign(_ctx, { async: !0 }) : { async: !0 }, result = schema._zod.run({ value, issues: [] }, ctx);
  return result instanceof Promise && (result = await result), result.issues.length ? {
    success: !1,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: !0, data: result.value };
}, safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);

// node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][^\s-]{8,}$/, cuid2 = /^[0-9a-z]+$/, ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/, xid = /^[0-9a-vA-V]{20}$/, ksuid = /^[A-Za-z0-9]{27}$/, nanoid = /^[a-zA-Z0-9_-]{21}$/, duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/, uuid = (version2) => version2 ? new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/;
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})$/, cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/, cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, base64url = /^[A-Za-z0-9_-]*$/, hostname = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
var e164 = /^\+(?:[0-9]){6,14}[0-9]$/, dateSource = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))", date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  let hhmm = "(?:[01]\\d|2[0-3]):[0-5]\\d";
  return typeof args.precision == "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  let time3 = timeSource({ precision: args.precision }), opts = ["Z"];
  args.local && opts.push(""), args.offset && opts.push("([+-]\\d{2}:\\d{2})");
  let timeRegex2 = `${time3}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex2})$`);
}
var string = (params) => {
  let regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : "[\\s\\S]*";
  return new RegExp(`^${regex}$`);
};
var integer = /^\d+$/, number = /^-?\d+(?:\.\d+)?/i, boolean = /true|false/i, _null = /null/i;
var lowercase = /^[^A-Z]*$/, uppercase = /^[^a-z]*$/;

// node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {}), inst._zod.def = def, (_a = inst._zod).onattach ?? (_a.onattach = []);
}), numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
}, $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  let origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag, curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    def.value < curr && (def.inclusive ? bag.maximum = def.value : bag.exclusiveMaximum = def.value);
  }), inst._zod.check = (payload) => {
    (def.inclusive ? payload.value <= def.value : payload.value < def.value) || payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
}), $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  let origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag, curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    def.value > curr && (def.inclusive ? bag.minimum = def.value : bag.exclusiveMinimum = def.value);
  }), inst._zod.check = (payload) => {
    (def.inclusive ? payload.value >= def.value : payload.value > def.value) || payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
}), $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def), inst._zod.onattach.push((inst2) => {
    var _a;
    (_a = inst2._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
  }), inst._zod.check = (payload) => {
    if (typeof payload.value != typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    (typeof payload.value == "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) || payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
}), $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def), def.format = def.format || "float64";
  let isInt = def.format?.includes("int"), origin = isInt ? "int" : "number", [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag;
    bag.format = def.format, bag.minimum = minimum, bag.maximum = maximum, isInt && (bag.pattern = integer);
  }), inst._zod.check = (payload) => {
    let input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        input > 0 ? payload.issues.push({
          input,
          code: "too_big",
          maximum: Number.MAX_SAFE_INTEGER,
          note: "Integers must be within the safe integer range.",
          inst,
          origin,
          continue: !def.abort
        }) : payload.issues.push({
          input,
          code: "too_small",
          minimum: Number.MIN_SAFE_INTEGER,
          note: "Integers must be within the safe integer range.",
          inst,
          origin,
          continue: !def.abort
        });
        return;
      }
    }
    input < minimum && payload.issues.push({
      origin: "number",
      input,
      code: "too_small",
      minimum,
      inclusive: !0,
      inst,
      continue: !def.abort
    }), input > maximum && payload.issues.push({
      origin: "number",
      input,
      code: "too_big",
      maximum,
      inst
    });
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def), (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    let val = payload.value;
    return !nullish(val) && val.length !== void 0;
  }), inst._zod.onattach.push((inst2) => {
    let curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    def.maximum < curr && (inst2._zod.bag.maximum = def.maximum);
  }), inst._zod.check = (payload) => {
    let input = payload.value;
    if (input.length <= def.maximum)
      return;
    let origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: !0,
      input,
      inst,
      continue: !def.abort
    });
  };
}), $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def), (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    let val = payload.value;
    return !nullish(val) && val.length !== void 0;
  }), inst._zod.onattach.push((inst2) => {
    let curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    def.minimum > curr && (inst2._zod.bag.minimum = def.minimum);
  }), inst._zod.check = (payload) => {
    let input = payload.value;
    if (input.length >= def.minimum)
      return;
    let origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: !0,
      input,
      inst,
      continue: !def.abort
    });
  };
}), $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def), (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    let val = payload.value;
    return !nullish(val) && val.length !== void 0;
  }), inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag;
    bag.minimum = def.length, bag.maximum = def.length, bag.length = def.length;
  }), inst._zod.check = (payload) => {
    let input = payload.value, length = input.length;
    if (length === def.length)
      return;
    let origin = getLengthableOrigin(input), tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: !0,
      exact: !0,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
}), $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  $ZodCheck.init(inst, def), inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag;
    bag.format = def.format, def.pattern && (bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set()), bag.patterns.add(def.pattern));
  }), def.pattern ? (_a = inst._zod).check ?? (_a.check = (payload) => {
    def.pattern.lastIndex = 0, !def.pattern.test(payload.value) && payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: def.format,
      input: payload.value,
      ...def.pattern ? { pattern: def.pattern.toString() } : {},
      inst,
      continue: !def.abort
    });
  }) : (_b = inst._zod).check ?? (_b.check = () => {
  });
}), $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def), inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0, !def.pattern.test(payload.value) && payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
}), $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase), $ZodCheckStringFormat.init(inst, def);
}), $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase), $ZodCheckStringFormat.init(inst, def);
}), $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  let escapedRegex = escapeRegex(def.includes), pattern = new RegExp(typeof def.position == "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern, inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set()), bag.patterns.add(pattern);
  }), inst._zod.check = (payload) => {
    payload.value.includes(def.includes, def.position) || payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
}), $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  let pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern), inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set()), bag.patterns.add(pattern);
  }), inst._zod.check = (payload) => {
    payload.value.startsWith(def.prefix) || payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
}), $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  let pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern), inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set()), bag.patterns.add(pattern);
  }), inst._zod.check = (payload) => {
    payload.value.endsWith(def.suffix) || payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def), inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// node_modules/zod/v4/core/doc.js
var Doc = class {
  constructor(args = []) {
    this.content = [], this.indent = 0, this && (this.args = args);
  }
  indented(fn) {
    this.indent += 1, fn(this), this.indent -= 1;
  }
  write(arg) {
    if (typeof arg == "function") {
      arg(this, { execution: "sync" }), arg(this, { execution: "async" });
      return;
    }
    let lines = arg.split(`
`).filter((x) => x), minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length)), dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (let line of dedented)
      this.content.push(line);
  }
  compile() {
    let F = Function, args = this?.args, lines = [...(this?.content ?? [""]).map((x) => `  ${x}`)];
    return new F(...args, lines.join(`
`));
  }
};

// node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 0,
  patch: 0
};

// node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {}), inst._zod.def = def, inst._zod.bag = inst._zod.bag || {}, inst._zod.version = version;
  let checks = [...inst._zod.def.checks ?? []];
  inst._zod.traits.has("$ZodCheck") && checks.unshift(inst);
  for (let ch of checks)
    for (let fn of ch._zod.onattach)
      fn(inst);
  if (checks.length === 0)
    (_a = inst._zod).deferred ?? (_a.deferred = []), inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  else {
    let runChecks = (payload, checks2, ctx) => {
      let isAborted2 = aborted(payload), asyncResult;
      for (let ch of checks2) {
        if (ch._zod.def.when) {
          if (!ch._zod.def.when(payload))
            continue;
        } else if (isAborted2)
          continue;
        let currLen = payload.issues.length, _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === !1)
          throw new $ZodAsyncError();
        if (asyncResult || _ instanceof Promise)
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _, payload.issues.length !== currLen && (isAborted2 || (isAborted2 = aborted(payload, currLen)));
          });
        else {
          if (payload.issues.length === currLen)
            continue;
          isAborted2 || (isAborted2 = aborted(payload, currLen));
        }
      }
      return asyncResult ? asyncResult.then(() => payload) : payload;
    };
    inst._zod.run = (payload, ctx) => {
      let result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === !1)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  inst["~standard"] = {
    validate: (value) => {
      try {
        let r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch {
        return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  };
}), $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string(inst._zod.bag), inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch {
      }
    return typeof payload.value == "string" || payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    }), payload;
  };
}), $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def), $ZodString.init(inst, def);
}), $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid), $ZodStringFormat.init(inst, def);
}), $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    let v = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    }[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
}), $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email), $ZodStringFormat.init(inst, def);
}), $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def), inst._zod.check = (payload) => {
    try {
      let orig = payload.value, url = new URL(orig), href = url.href;
      def.hostname && (def.hostname.lastIndex = 0, def.hostname.test(url.hostname) || payload.issues.push({
        code: "invalid_format",
        format: "url",
        note: "Invalid hostname",
        pattern: hostname.source,
        input: payload.value,
        inst,
        continue: !def.abort
      })), def.protocol && (def.protocol.lastIndex = 0, def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol) || payload.issues.push({
        code: "invalid_format",
        format: "url",
        note: "Invalid protocol",
        pattern: def.protocol.source,
        input: payload.value,
        inst,
        continue: !def.abort
      })), !orig.endsWith("/") && href.endsWith("/") ? payload.value = href.slice(0, -1) : payload.value = href;
      return;
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
}), $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji()), $ZodStringFormat.init(inst, def);
}), $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid), $ZodStringFormat.init(inst, def);
}), $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid), $ZodStringFormat.init(inst, def);
}), $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2), $ZodStringFormat.init(inst, def);
}), $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid), $ZodStringFormat.init(inst, def);
}), $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid), $ZodStringFormat.init(inst, def);
}), $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid), $ZodStringFormat.init(inst, def);
}), $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def)), $ZodStringFormat.init(inst, def);
}), $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date), $ZodStringFormat.init(inst, def);
}), $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def)), $ZodStringFormat.init(inst, def);
}), $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration), $ZodStringFormat.init(inst, def);
}), $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4), $ZodStringFormat.init(inst, def), inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag;
    bag.format = "ipv4";
  });
}), $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6), $ZodStringFormat.init(inst, def), inst._zod.onattach.push((inst2) => {
    let bag = inst2._zod.bag;
    bag.format = "ipv6";
  }), inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
}), $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4), $ZodStringFormat.init(inst, def);
}), $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6), $ZodStringFormat.init(inst, def), inst._zod.check = (payload) => {
    let [address, prefix] = payload.value.split("/");
    try {
      if (!prefix)
        throw new Error();
      let prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error();
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error();
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return !0;
  if (data.length % 4 !== 0)
    return !1;
  try {
    return atob(data), !0;
  } catch {
    return !1;
  }
}
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64), $ZodStringFormat.init(inst, def), inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64";
  }), inst._zod.check = (payload) => {
    isValidBase64(payload.value) || payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return !1;
  let base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/"), padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url), $ZodStringFormat.init(inst, def), inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64url";
  }), inst._zod.check = (payload) => {
    isValidBase64URL(payload.value) || payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
}), $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164), $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    let tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return !1;
    let [header] = tokensParts;
    if (!header)
      return !1;
    let parsedHeader = JSON.parse(atob(header));
    return !("typ" in parsedHeader && parsedHeader?.typ !== "JWT" || !parsedHeader.alg || algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm));
  } catch {
    return !1;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def), inst._zod.check = (payload) => {
    isValidJWT(payload.value, def.alg) || payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.pattern = inst._zod.bag.pattern ?? number, inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch {
      }
    let input = payload.value;
    if (typeof input == "number" && !Number.isNaN(input) && Number.isFinite(input))
      return payload;
    let received = typeof input == "number" ? Number.isNaN(input) ? "NaN" : Number.isFinite(input) ? void 0 : "Infinity" : void 0;
    return payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    }), payload;
  };
}), $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def), $ZodNumber.init(inst, def);
}), $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.pattern = boolean, inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = !!payload.value;
      } catch {
      }
    let input = payload.value;
    return typeof input == "boolean" || payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    }), payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.pattern = _null, inst._zod.values = /* @__PURE__ */ new Set([null]), inst._zod.parse = (payload, _ctx) => {
    let input = payload.value;
    return input === null || payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    }), payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.parse = (payload) => payload;
}), $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.parse = (payload, _ctx) => (payload.issues.push({
    expected: "never",
    code: "invalid_type",
    input: payload.value,
    inst
  }), payload);
});
function handleArrayResult(result, final, index) {
  result.issues.length && final.issues.push(...prefixIssues(index, result.issues)), final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.parse = (payload, ctx) => {
    let input = payload.value;
    if (!Array.isArray(input))
      return payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      }), payload;
    payload.value = Array(input.length);
    let proms = [];
    for (let i = 0; i < input.length; i++) {
      let item = input[i], result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      result instanceof Promise ? proms.push(result.then((result2) => handleArrayResult(result2, payload, i))) : handleArrayResult(result, payload, i);
    }
    return proms.length ? Promise.all(proms).then(() => payload) : payload;
  };
});
function handleObjectResult(result, final, key) {
  result.issues.length && final.issues.push(...prefixIssues(key, result.issues)), final.value[key] = result.value;
}
function handleOptionalObjectResult(result, final, key, input) {
  result.issues.length ? input[key] === void 0 ? key in input ? final.value[key] = void 0 : final.value[key] = result.value : final.issues.push(...prefixIssues(key, result.issues)) : result.value === void 0 ? key in input && (final.value[key] = void 0) : final.value[key] = result.value;
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  let _normalized = cached(() => {
    let keys = Object.keys(def.shape);
    for (let k of keys)
      if (!(def.shape[k] instanceof $ZodType))
        throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    let okeys = optionalKeys(def.shape);
    return {
      shape: def.shape,
      keys,
      keySet: new Set(keys),
      numKeys: keys.length,
      optionalKeys: new Set(okeys)
    };
  });
  defineLazy(inst._zod, "propValues", () => {
    let shape = def.shape, propValues = {};
    for (let key in shape) {
      let field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
        for (let v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  let generateFastpass = (shape) => {
    let doc = new Doc(["shape", "payload", "ctx"]), normalized = _normalized.value, parseStr = (key) => {
      let k = esc(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write("const input = payload.value;");
    let ids = /* @__PURE__ */ Object.create(null), counter = 0;
    for (let key of normalized.keys)
      ids[key] = `key_${counter++}`;
    doc.write("const newResult = {}");
    for (let key of normalized.keys)
      if (normalized.optionalKeys.has(key)) {
        let id = ids[key];
        doc.write(`const ${id} = ${parseStr(key)};`);
        let k = esc(key);
        doc.write(`
        if (${id}.issues.length) {
          if (input[${k}] === undefined) {
            if (${k} in input) {
              newResult[${k}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              ${id}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [${k}, ...iss.path] : [${k}],
              }))
            );
          }
        } else if (${id}.value === undefined) {
          if (${k} in input) newResult[${k}] = undefined;
        } else {
          newResult[${k}] = ${id}.value;
        }
        `);
      } else {
        let id = ids[key];
        doc.write(`const ${id} = ${parseStr(key)};`), doc.write(`
          if (${id}.issues.length) payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${esc(key)}, ...iss.path] : [${esc(key)}]
          })));`), doc.write(`newResult[${esc(key)}] = ${id}.value`);
      }
    doc.write("payload.value = newResult;"), doc.write("return payload;");
    let fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  }, fastpass, isObject2 = isObject, jit = !globalConfig.jitless, fastEnabled = jit && allowsEval.value, catchall = def.catchall, value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    let input = payload.value;
    if (!isObject2(input))
      return payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      }), payload;
    let proms = [];
    if (jit && fastEnabled && ctx?.async === !1 && ctx.jitless !== !0)
      fastpass || (fastpass = generateFastpass(def.shape)), payload = fastpass(payload, ctx);
    else {
      payload.value = {};
      let shape = value.shape;
      for (let key of value.keys) {
        let el = shape[key], r = el._zod.run({ value: input[key], issues: [] }, ctx), isOptional = el._zod.optin === "optional" && el._zod.optout === "optional";
        r instanceof Promise ? proms.push(r.then((r2) => isOptional ? handleOptionalObjectResult(r2, payload, key, input) : handleObjectResult(r2, payload, key))) : isOptional ? handleOptionalObjectResult(r, payload, key, input) : handleObjectResult(r, payload, key);
      }
    }
    if (!catchall)
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    let unrecognized = [], keySet = value.keySet, _catchall = catchall._zod, t = _catchall.def.type;
    for (let key of Object.keys(input)) {
      if (keySet.has(key))
        continue;
      if (t === "never") {
        unrecognized.push(key);
        continue;
      }
      let r = _catchall.run({ value: input[key], issues: [] }, ctx);
      r instanceof Promise ? proms.push(r.then((r2) => handleObjectResult(r2, payload, key))) : handleObjectResult(r, payload, key);
    }
    return unrecognized.length && payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    }), proms.length ? Promise.all(proms).then(() => payload) : payload;
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (let result of results)
    if (result.issues.length === 0)
      return final.value = result.value, final;
  return final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  }), final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def), defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0), defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0), defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values))
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
  }), defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      let patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
  }), inst._zod.parse = (payload, ctx) => {
    let async = !1, results = [];
    for (let option of def.options) {
      let result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise)
        results.push(result), async = !0;
      else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    return async ? Promise.all(results).then((results2) => handleUnionResults(results2, payload, inst, ctx)) : handleUnionResults(results, payload, inst, ctx);
  };
}), $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  let _super = inst._zod.parse;
  defineLazy(inst._zod, "propValues", () => {
    let propValues = {};
    for (let option of def.options) {
      let pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
      for (let [k, v] of Object.entries(pv)) {
        propValues[k] || (propValues[k] = /* @__PURE__ */ new Set());
        for (let val of v)
          propValues[k].add(val);
      }
    }
    return propValues;
  });
  let disc = cached(() => {
    let opts = def.options, map = /* @__PURE__ */ new Map();
    for (let o of opts) {
      let values = o._zod.propValues[def.discriminator];
      if (!values || values.size === 0)
        throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
      for (let v of values) {
        if (map.has(v))
          throw new Error(`Duplicate discriminator value "${String(v)}"`);
        map.set(v, o);
      }
    }
    return map;
  });
  inst._zod.parse = (payload, ctx) => {
    let input = payload.value;
    if (!isObject(input))
      return payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      }), payload;
    let opt = disc.value.get(input?.[def.discriminator]);
    return opt ? opt._zod.run(payload, ctx) : def.unionFallback ? _super(payload, ctx) : (payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      input,
      path: [def.discriminator],
      inst
    }), payload);
  };
}), $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.parse = (payload, ctx) => {
    let input = payload.value, left = def.left._zod.run({ value: input, issues: [] }, ctx), right = def.right._zod.run({ value: input, issues: [] }, ctx);
    return left instanceof Promise || right instanceof Promise ? Promise.all([left, right]).then(([left2, right2]) => handleIntersectionResults(payload, left2, right2)) : handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b)
    return { valid: !0, data: a };
  if (a instanceof Date && b instanceof Date && +a == +b)
    return { valid: !0, data: a };
  if (isPlainObject(a) && isPlainObject(b)) {
    let bKeys = Object.keys(b), sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1), newObj = { ...a, ...b };
    for (let key of sharedKeys) {
      let sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid)
        return {
          valid: !1,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      newObj[key] = sharedValue.data;
    }
    return { valid: !0, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length)
      return { valid: !1, mergeErrorPath: [] };
    let newArray = [];
    for (let index = 0; index < a.length; index++) {
      let itemA = a[index], itemB = b[index], sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid)
        return {
          valid: !1,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      newArray.push(sharedValue.data);
    }
    return { valid: !0, data: newArray };
  }
  return { valid: !1, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  if (left.issues.length && result.issues.push(...left.issues), right.issues.length && result.issues.push(...right.issues), aborted(result))
    return result;
  let merged = mergeValues(left.value, right.value);
  if (!merged.valid)
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  return result.value = merged.data, result;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.parse = (payload, ctx) => {
    let input = payload.value;
    if (!isPlainObject(input))
      return payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      }), payload;
    let proms = [];
    if (def.keyType._zod.values) {
      let values = def.keyType._zod.values;
      payload.value = {};
      for (let key of values)
        if (typeof key == "string" || typeof key == "number" || typeof key == "symbol") {
          let result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          result instanceof Promise ? proms.push(result.then((result2) => {
            result2.issues.length && payload.issues.push(...prefixIssues(key, result2.issues)), payload.value[key] = result2.value;
          })) : (result.issues.length && payload.issues.push(...prefixIssues(key, result.issues)), payload.value[key] = result.value);
        }
      let unrecognized;
      for (let key in input)
        values.has(key) || (unrecognized = unrecognized ?? [], unrecognized.push(key));
      unrecognized && unrecognized.length > 0 && payload.issues.push({
        code: "unrecognized_keys",
        input,
        inst,
        keys: unrecognized
      });
    } else {
      payload.value = {};
      for (let key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise)
          throw new Error("Async schemas not supported in object keys currently");
        if (keyResult.issues.length) {
          payload.issues.push({
            origin: "record",
            code: "invalid_key",
            issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
            input: key,
            path: [key],
            inst
          }), payload.value[keyResult.value] = keyResult.value;
          continue;
        }
        let result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        result instanceof Promise ? proms.push(result.then((result2) => {
          result2.issues.length && payload.issues.push(...prefixIssues(key, result2.issues)), payload.value[keyResult.value] = result2.value;
        })) : (result.issues.length && payload.issues.push(...prefixIssues(key, result.issues)), payload.value[keyResult.value] = result.value);
      }
    }
    return proms.length ? Promise.all(proms).then(() => payload) : payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  let values = getEnumValues(def.entries);
  inst._zod.values = new Set(values), inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o == "string" ? escapeRegex(o) : o.toString()).join("|")})$`), inst._zod.parse = (payload, _ctx) => {
    let input = payload.value;
    return inst._zod.values.has(input) || payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    }), payload;
  };
}), $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.values = new Set(def.values), inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o == "string" ? escapeRegex(o) : o ? o.toString() : String(o)).join("|")})$`), inst._zod.parse = (payload, _ctx) => {
    let input = payload.value;
    return inst._zod.values.has(input) || payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    }), payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.parse = (payload, _ctx) => {
    let _out = def.transform(payload.value, payload);
    if (_ctx.async)
      return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output2) => (payload.value = output2, payload));
    if (_out instanceof Promise)
      throw new $ZodAsyncError();
    return payload.value = _out, payload;
  };
}), $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.optin = "optional", inst._zod.optout = "optional", defineLazy(inst._zod, "values", () => def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0), defineLazy(inst._zod, "pattern", () => {
    let pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  }), inst._zod.parse = (payload, ctx) => def.innerType._zod.optin === "optional" ? def.innerType._zod.run(payload, ctx) : payload.value === void 0 ? payload : def.innerType._zod.run(payload, ctx);
}), $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def), defineLazy(inst._zod, "optin", () => def.innerType._zod.optin), defineLazy(inst._zod, "optout", () => def.innerType._zod.optout), defineLazy(inst._zod, "pattern", () => {
    let pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  }), defineLazy(inst._zod, "values", () => def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0), inst._zod.parse = (payload, ctx) => payload.value === null ? payload : def.innerType._zod.run(payload, ctx);
}), $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.optin = "optional", defineLazy(inst._zod, "values", () => def.innerType._zod.values), inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0)
      return payload.value = def.defaultValue, payload;
    let result = def.innerType._zod.run(payload, ctx);
    return result instanceof Promise ? result.then((result2) => handleDefaultResult(result2, def)) : handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  return payload.value === void 0 && (payload.value = def.defaultValue), payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.optin = "optional", defineLazy(inst._zod, "values", () => def.innerType._zod.values), inst._zod.parse = (payload, ctx) => (payload.value === void 0 && (payload.value = def.defaultValue), def.innerType._zod.run(payload, ctx));
}), $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def), defineLazy(inst._zod, "values", () => {
    let v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  }), inst._zod.parse = (payload, ctx) => {
    let result = def.innerType._zod.run(payload, ctx);
    return result instanceof Promise ? result.then((result2) => handleNonOptionalResult(result2, inst)) : handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  return !payload.issues.length && payload.value === void 0 && payload.issues.push({
    code: "invalid_type",
    expected: "nonoptional",
    input: payload.value,
    inst
  }), payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def), inst._zod.optin = "optional", defineLazy(inst._zod, "optout", () => def.innerType._zod.optout), defineLazy(inst._zod, "values", () => def.innerType._zod.values), inst._zod.parse = (payload, ctx) => {
    let result = def.innerType._zod.run(payload, ctx);
    return result instanceof Promise ? result.then((result2) => (payload.value = result2.value, result2.issues.length && (payload.value = def.catchValue({
      ...payload,
      error: {
        issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      },
      input: payload.value
    }), payload.issues = []), payload)) : (payload.value = result.value, result.issues.length && (payload.value = def.catchValue({
      ...payload,
      error: {
        issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      },
      input: payload.value
    }), payload.issues = []), payload);
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def), defineLazy(inst._zod, "values", () => def.in._zod.values), defineLazy(inst._zod, "optin", () => def.in._zod.optin), defineLazy(inst._zod, "optout", () => def.out._zod.optout), inst._zod.parse = (payload, ctx) => {
    let left = def.in._zod.run(payload, ctx);
    return left instanceof Promise ? left.then((left2) => handlePipeResult(left2, def, ctx)) : handlePipeResult(left, def, ctx);
  };
});
function handlePipeResult(left, def, ctx) {
  return aborted(left) ? left : def.out._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def), defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues), defineLazy(inst._zod, "values", () => def.innerType._zod.values), defineLazy(inst._zod, "optin", () => def.innerType._zod.optin), defineLazy(inst._zod, "optout", () => def.innerType._zod.optout), inst._zod.parse = (payload, ctx) => {
    let result = def.innerType._zod.run(payload, ctx);
    return result instanceof Promise ? result.then(handleReadonlyResult) : handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  return payload.value = Object.freeze(payload.value), payload;
}
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def), $ZodType.init(inst, def), inst._zod.parse = (payload, _) => payload, inst._zod.check = (payload) => {
    let input = payload.value, r = def.fn(input);
    if (r instanceof Promise)
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    handleRefineResult(r, payload, input, inst);
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    let _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    inst._zod.def.params && (_iss.params = inst._zod.def.params), payload.issues.push(issue(_iss));
  }
}

// node_modules/zod/v4/locales/en.js
var parsedType = (data) => {
  let t = typeof data;
  switch (t) {
    case "number":
      return Number.isNaN(data) ? "NaN" : "number";
    case "object": {
      if (Array.isArray(data))
        return "array";
      if (data === null)
        return "null";
      if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor)
        return data.constructor.name;
    }
  }
  return t;
}, error = () => {
  let Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  let Nouns = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return `Invalid input: expected ${issue2.expected}, received ${parsedType(issue2.input)}`;
      case "invalid_value":
        return issue2.values.length === 1 ? `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}` : `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        let adj = issue2.inclusive ? "<=" : "<", sizing = getSizing(issue2.origin);
        return sizing ? `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}` : `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        let adj = issue2.inclusive ? ">=" : ">", sizing = getSizing(issue2.origin);
        return sizing ? `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}` : `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        let _issue = issue2;
        return _issue.format === "starts_with" ? `Invalid string: must start with "${_issue.prefix}"` : _issue.format === "ends_with" ? `Invalid string: must end with "${_issue.suffix}"` : _issue.format === "includes" ? `Invalid string: must include "${_issue.includes}"` : _issue.format === "regex" ? `Invalid string: must match pattern ${_issue.pattern}` : `Invalid ${Nouns[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue2.origin}`;
      case "invalid_union":
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue2.origin}`;
      default:
        return "Invalid input";
    }
  };
};
function en_default() {
  return {
    localeError: error()
  };
}

// node_modules/zod/v4/core/registries.js
var $output = Symbol("ZodOutput"), $input = Symbol("ZodInput"), $ZodRegistry = class {
  constructor() {
    this._map = /* @__PURE__ */ new Map(), this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    let meta = _meta[0];
    if (this._map.set(schema, meta), meta && typeof meta == "object" && "id" in meta) {
      if (this._idmap.has(meta.id))
        throw new Error(`ID ${meta.id} already exists in the registry`);
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    return this._map = /* @__PURE__ */ new Map(), this._idmap = /* @__PURE__ */ new Map(), this;
  }
  remove(schema) {
    let meta = this._map.get(schema);
    return meta && typeof meta == "object" && "id" in meta && this._idmap.delete(meta.id), this._map.delete(schema), this;
  }
  get(schema) {
    let p = schema._zod.parent;
    if (p) {
      let pm = { ...this.get(p) ?? {} };
      return delete pm.id, { ...pm, ...this._map.get(schema) };
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
var globalRegistry = /* @__PURE__ */ registry();

// node_modules/zod/v4/core/api.js
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params)
  });
}
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: !1,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: !1,
    local: !1,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class2, params) {
  return new Class2({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: !1,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: !1
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: !0
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: !1
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: !0
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  return new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
function _custom(Class2, fn, _params) {
  let norm = normalizeParams(_params);
  return norm.abort ?? (norm.abort = !0), new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
}
function _refine(Class2, fn, _params) {
  return new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
}

// node_modules/zod/v4/core/to-json-schema.js
var JSONSchemaGenerator = class {
  constructor(params) {
    this.counter = 0, this.metadataRegistry = params?.metadata ?? globalRegistry, this.target = params?.target ?? "draft-2020-12", this.unrepresentable = params?.unrepresentable ?? "throw", this.override = params?.override ?? (() => {
    }), this.io = params?.io ?? "output", this.seen = /* @__PURE__ */ new Map();
  }
  process(schema, _params = { path: [], schemaPath: [] }) {
    var _a;
    let def = schema._zod.def, formatMap = {
      guid: "uuid",
      url: "uri",
      datetime: "date-time",
      json_string: "json-string",
      regex: ""
      // do not set
    }, seen = this.seen.get(schema);
    if (seen)
      return seen.count++, _params.schemaPath.includes(schema) && (seen.cycle = _params.path), seen.schema;
    let result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
    this.seen.set(schema, result);
    let overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema)
      result.schema = overrideSchema;
    else {
      let params = {
        ..._params,
        schemaPath: [..._params.schemaPath, schema],
        path: _params.path
      }, parent = schema._zod.parent;
      if (parent)
        result.ref = parent, this.process(parent, params), this.seen.get(parent).isParent = !0;
      else {
        let _json = result.schema;
        switch (def.type) {
          case "string": {
            let json = _json;
            json.type = "string";
            let { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
            if (typeof minimum == "number" && (json.minLength = minimum), typeof maximum == "number" && (json.maxLength = maximum), format && (json.format = formatMap[format] ?? format, json.format === "" && delete json.format), contentEncoding && (json.contentEncoding = contentEncoding), patterns && patterns.size > 0) {
              let regexes = [...patterns];
              regexes.length === 1 ? json.pattern = regexes[0].source : regexes.length > 1 && (result.schema.allOf = [
                ...regexes.map((regex) => ({
                  ...this.target === "draft-7" ? { type: "string" } : {},
                  pattern: regex.source
                }))
              ]);
            }
            break;
          }
          case "number": {
            let json = _json, { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
            typeof format == "string" && format.includes("int") ? json.type = "integer" : json.type = "number", typeof exclusiveMinimum == "number" && (json.exclusiveMinimum = exclusiveMinimum), typeof minimum == "number" && (json.minimum = minimum, typeof exclusiveMinimum == "number" && (exclusiveMinimum >= minimum ? delete json.minimum : delete json.exclusiveMinimum)), typeof exclusiveMaximum == "number" && (json.exclusiveMaximum = exclusiveMaximum), typeof maximum == "number" && (json.maximum = maximum, typeof exclusiveMaximum == "number" && (exclusiveMaximum <= maximum ? delete json.maximum : delete json.exclusiveMaximum)), typeof multipleOf == "number" && (json.multipleOf = multipleOf);
            break;
          }
          case "boolean": {
            let json = _json;
            json.type = "boolean";
            break;
          }
          case "bigint": {
            if (this.unrepresentable === "throw")
              throw new Error("BigInt cannot be represented in JSON Schema");
            break;
          }
          case "symbol": {
            if (this.unrepresentable === "throw")
              throw new Error("Symbols cannot be represented in JSON Schema");
            break;
          }
          case "null": {
            _json.type = "null";
            break;
          }
          case "any":
            break;
          case "unknown":
            break;
          case "undefined": {
            if (this.unrepresentable === "throw")
              throw new Error("Undefined cannot be represented in JSON Schema");
            break;
          }
          case "void": {
            if (this.unrepresentable === "throw")
              throw new Error("Void cannot be represented in JSON Schema");
            break;
          }
          case "never": {
            _json.not = {};
            break;
          }
          case "date": {
            if (this.unrepresentable === "throw")
              throw new Error("Date cannot be represented in JSON Schema");
            break;
          }
          case "array": {
            let json = _json, { minimum, maximum } = schema._zod.bag;
            typeof minimum == "number" && (json.minItems = minimum), typeof maximum == "number" && (json.maxItems = maximum), json.type = "array", json.items = this.process(def.element, { ...params, path: [...params.path, "items"] });
            break;
          }
          case "object": {
            let json = _json;
            json.type = "object", json.properties = {};
            let shape = def.shape;
            for (let key in shape)
              json.properties[key] = this.process(shape[key], {
                ...params,
                path: [...params.path, "properties", key]
              });
            let allKeys = new Set(Object.keys(shape)), requiredKeys = new Set([...allKeys].filter((key) => {
              let v = def.shape[key]._zod;
              return this.io === "input" ? v.optin === void 0 : v.optout === void 0;
            }));
            requiredKeys.size > 0 && (json.required = Array.from(requiredKeys)), def.catchall?._zod.def.type === "never" ? json.additionalProperties = !1 : def.catchall ? def.catchall && (json.additionalProperties = this.process(def.catchall, {
              ...params,
              path: [...params.path, "additionalProperties"]
            })) : this.io === "output" && (json.additionalProperties = !1);
            break;
          }
          case "union": {
            let json = _json;
            json.anyOf = def.options.map((x, i) => this.process(x, {
              ...params,
              path: [...params.path, "anyOf", i]
            }));
            break;
          }
          case "intersection": {
            let json = _json, a = this.process(def.left, {
              ...params,
              path: [...params.path, "allOf", 0]
            }), b = this.process(def.right, {
              ...params,
              path: [...params.path, "allOf", 1]
            }), isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1, allOf = [
              ...isSimpleIntersection(a) ? a.allOf : [a],
              ...isSimpleIntersection(b) ? b.allOf : [b]
            ];
            json.allOf = allOf;
            break;
          }
          case "tuple": {
            let json = _json;
            json.type = "array";
            let prefixItems = def.items.map((x, i) => this.process(x, { ...params, path: [...params.path, "prefixItems", i] }));
            if (this.target === "draft-2020-12" ? json.prefixItems = prefixItems : json.items = prefixItems, def.rest) {
              let rest = this.process(def.rest, {
                ...params,
                path: [...params.path, "items"]
              });
              this.target === "draft-2020-12" ? json.items = rest : json.additionalItems = rest;
            }
            def.rest && (json.items = this.process(def.rest, {
              ...params,
              path: [...params.path, "items"]
            }));
            let { minimum, maximum } = schema._zod.bag;
            typeof minimum == "number" && (json.minItems = minimum), typeof maximum == "number" && (json.maxItems = maximum);
            break;
          }
          case "record": {
            let json = _json;
            json.type = "object", json.propertyNames = this.process(def.keyType, { ...params, path: [...params.path, "propertyNames"] }), json.additionalProperties = this.process(def.valueType, {
              ...params,
              path: [...params.path, "additionalProperties"]
            });
            break;
          }
          case "map": {
            if (this.unrepresentable === "throw")
              throw new Error("Map cannot be represented in JSON Schema");
            break;
          }
          case "set": {
            if (this.unrepresentable === "throw")
              throw new Error("Set cannot be represented in JSON Schema");
            break;
          }
          case "enum": {
            let json = _json, values = getEnumValues(def.entries);
            values.every((v) => typeof v == "number") && (json.type = "number"), values.every((v) => typeof v == "string") && (json.type = "string"), json.enum = values;
            break;
          }
          case "literal": {
            let json = _json, vals = [];
            for (let val of def.values)
              if (val === void 0) {
                if (this.unrepresentable === "throw")
                  throw new Error("Literal `undefined` cannot be represented in JSON Schema");
              } else if (typeof val == "bigint") {
                if (this.unrepresentable === "throw")
                  throw new Error("BigInt literals cannot be represented in JSON Schema");
                vals.push(Number(val));
              } else
                vals.push(val);
            if (vals.length !== 0)
              if (vals.length === 1) {
                let val = vals[0];
                json.type = val === null ? "null" : typeof val, json.const = val;
              } else
                vals.every((v) => typeof v == "number") && (json.type = "number"), vals.every((v) => typeof v == "string") && (json.type = "string"), vals.every((v) => typeof v == "boolean") && (json.type = "string"), vals.every((v) => v === null) && (json.type = "null"), json.enum = vals;
            break;
          }
          case "file": {
            let json = _json, file = {
              type: "string",
              format: "binary",
              contentEncoding: "binary"
            }, { minimum, maximum, mime } = schema._zod.bag;
            minimum !== void 0 && (file.minLength = minimum), maximum !== void 0 && (file.maxLength = maximum), mime ? mime.length === 1 ? (file.contentMediaType = mime[0], Object.assign(json, file)) : json.anyOf = mime.map((m) => ({ ...file, contentMediaType: m })) : Object.assign(json, file);
            break;
          }
          case "transform": {
            if (this.unrepresentable === "throw")
              throw new Error("Transforms cannot be represented in JSON Schema");
            break;
          }
          case "nullable": {
            let inner = this.process(def.innerType, params);
            _json.anyOf = [inner, { type: "null" }];
            break;
          }
          case "nonoptional": {
            this.process(def.innerType, params), result.ref = def.innerType;
            break;
          }
          case "success": {
            let json = _json;
            json.type = "boolean";
            break;
          }
          case "default": {
            this.process(def.innerType, params), result.ref = def.innerType, _json.default = JSON.parse(JSON.stringify(def.defaultValue));
            break;
          }
          case "prefault": {
            this.process(def.innerType, params), result.ref = def.innerType, this.io === "input" && (_json._prefault = JSON.parse(JSON.stringify(def.defaultValue)));
            break;
          }
          case "catch": {
            this.process(def.innerType, params), result.ref = def.innerType;
            let catchValue;
            try {
              catchValue = def.catchValue(void 0);
            } catch {
              throw new Error("Dynamic catch values are not supported in JSON Schema");
            }
            _json.default = catchValue;
            break;
          }
          case "nan": {
            if (this.unrepresentable === "throw")
              throw new Error("NaN cannot be represented in JSON Schema");
            break;
          }
          case "template_literal": {
            let json = _json, pattern = schema._zod.pattern;
            if (!pattern)
              throw new Error("Pattern not found in template literal");
            json.type = "string", json.pattern = pattern.source;
            break;
          }
          case "pipe": {
            let innerType = this.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
            this.process(innerType, params), result.ref = innerType;
            break;
          }
          case "readonly": {
            this.process(def.innerType, params), result.ref = def.innerType, _json.readOnly = !0;
            break;
          }
          // passthrough types
          case "promise": {
            this.process(def.innerType, params), result.ref = def.innerType;
            break;
          }
          case "optional": {
            this.process(def.innerType, params), result.ref = def.innerType;
            break;
          }
          case "lazy": {
            let innerType = schema._zod.innerType;
            this.process(innerType, params), result.ref = innerType;
            break;
          }
          case "custom": {
            if (this.unrepresentable === "throw")
              throw new Error("Custom types cannot be represented in JSON Schema");
            break;
          }
          default:
        }
      }
    }
    let meta = this.metadataRegistry.get(schema);
    return meta && Object.assign(result.schema, meta), this.io === "input" && isTransforming(schema) && (delete result.schema.examples, delete result.schema.default), this.io === "input" && result.schema._prefault && ((_a = result.schema).default ?? (_a.default = result.schema._prefault)), delete result.schema._prefault, this.seen.get(schema).schema;
  }
  emit(schema, _params) {
    let params = {
      cycles: _params?.cycles ?? "ref",
      reused: _params?.reused ?? "inline",
      // unrepresentable: _params?.unrepresentable ?? "throw",
      // uri: _params?.uri ?? ((id) => `${id}`),
      external: _params?.external ?? void 0
    }, root = this.seen.get(schema);
    if (!root)
      throw new Error("Unprocessed schema. This is a bug in Zod.");
    let makeURI = (entry) => {
      let defsSegment = this.target === "draft-2020-12" ? "$defs" : "definitions";
      if (params.external) {
        let externalId = params.external.registry.get(entry[0])?.id, uriGenerator = params.external.uri ?? ((id2) => id2);
        if (externalId)
          return { ref: uriGenerator(externalId) };
        let id = entry[1].defId ?? entry[1].schema.id ?? `schema${this.counter++}`;
        return entry[1].defId = id, { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
      }
      if (entry[1] === root)
        return { ref: "#" };
      let defUriPrefix = `#/${defsSegment}/`, defId = entry[1].schema.id ?? `__schema${this.counter++}`;
      return { defId, ref: defUriPrefix + defId };
    }, extractToDef = (entry) => {
      if (entry[1].schema.$ref)
        return;
      let seen = entry[1], { ref, defId } = makeURI(entry);
      seen.def = { ...seen.schema }, defId && (seen.defId = defId);
      let schema2 = seen.schema;
      for (let key in schema2)
        delete schema2[key];
      schema2.$ref = ref;
    };
    if (params.cycles === "throw")
      for (let entry of this.seen.entries()) {
        let seen = entry[1];
        if (seen.cycle)
          throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    for (let entry of this.seen.entries()) {
      let seen = entry[1];
      if (schema === entry[0]) {
        extractToDef(entry);
        continue;
      }
      if (params.external) {
        let ext = params.external.registry.get(entry[0])?.id;
        if (schema !== entry[0] && ext) {
          extractToDef(entry);
          continue;
        }
      }
      if (this.metadataRegistry.get(entry[0])?.id) {
        extractToDef(entry);
        continue;
      }
      if (seen.cycle) {
        extractToDef(entry);
        continue;
      }
      if (seen.count > 1 && params.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
    let flattenRef = (zodSchema, params2) => {
      let seen = this.seen.get(zodSchema), schema2 = seen.def ?? seen.schema, _cached = { ...schema2 };
      if (seen.ref === null)
        return;
      let ref = seen.ref;
      if (seen.ref = null, ref) {
        flattenRef(ref, params2);
        let refSchema = this.seen.get(ref).schema;
        refSchema.$ref && params2.target === "draft-7" ? (schema2.allOf = schema2.allOf ?? [], schema2.allOf.push(refSchema)) : (Object.assign(schema2, refSchema), Object.assign(schema2, _cached));
      }
      seen.isParent || this.override({
        zodSchema,
        jsonSchema: schema2,
        path: seen.path ?? []
      });
    };
    for (let entry of [...this.seen.entries()].reverse())
      flattenRef(entry[0], { target: this.target });
    let result = {};
    if (this.target === "draft-2020-12" ? result.$schema = "https://json-schema.org/draft/2020-12/schema" : this.target === "draft-7" ? result.$schema = "http://json-schema.org/draft-07/schema#" : console.warn(`Invalid target: ${this.target}`), params.external?.uri) {
      let id = params.external.registry.get(schema)?.id;
      if (!id)
        throw new Error("Schema is missing an `id` property");
      result.$id = params.external.uri(id);
    }
    Object.assign(result, root.def);
    let defs = params.external?.defs ?? {};
    for (let entry of this.seen.entries()) {
      let seen = entry[1];
      seen.def && seen.defId && (defs[seen.defId] = seen.def);
    }
    params.external || Object.keys(defs).length > 0 && (this.target === "draft-2020-12" ? result.$defs = defs : result.definitions = defs);
    try {
      return JSON.parse(JSON.stringify(result));
    } catch {
      throw new Error("Error converting schema to JSON.");
    }
  }
};
function toJSONSchema(input, _params) {
  if (input instanceof $ZodRegistry) {
    let gen2 = new JSONSchemaGenerator(_params), defs = {};
    for (let entry of input._idmap.entries()) {
      let [_, schema] = entry;
      gen2.process(schema);
    }
    let schemas = {}, external = {
      registry: input,
      uri: _params?.uri,
      defs
    };
    for (let entry of input._idmap.entries()) {
      let [key, schema] = entry;
      schemas[key] = gen2.emit(schema, {
        ..._params,
        external
      });
    }
    if (Object.keys(defs).length > 0) {
      let defsSegment = gen2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  let gen = new JSONSchemaGenerator(_params);
  return gen.process(input), gen.emit(input, _params);
}
function isTransforming(_schema, _ctx) {
  let ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return !1;
  ctx.seen.add(_schema);
  let def = _schema._zod.def;
  switch (def.type) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "date":
    case "symbol":
    case "undefined":
    case "null":
    case "any":
    case "unknown":
    case "never":
    case "void":
    case "literal":
    case "enum":
    case "nan":
    case "file":
    case "template_literal":
      return !1;
    case "array":
      return isTransforming(def.element, ctx);
    case "object": {
      for (let key in def.shape)
        if (isTransforming(def.shape[key], ctx))
          return !0;
      return !1;
    }
    case "union": {
      for (let option of def.options)
        if (isTransforming(option, ctx))
          return !0;
      return !1;
    }
    case "intersection":
      return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    case "tuple": {
      for (let item of def.items)
        if (isTransforming(item, ctx))
          return !0;
      return !!(def.rest && isTransforming(def.rest, ctx));
    }
    case "record":
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    case "map":
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    case "set":
      return isTransforming(def.valueType, ctx);
    // inner types
    case "promise":
    case "optional":
    case "nonoptional":
    case "nullable":
    case "readonly":
      return isTransforming(def.innerType, ctx);
    case "lazy":
      return isTransforming(def.getter(), ctx);
    case "default":
      return isTransforming(def.innerType, ctx);
    case "prefault":
      return isTransforming(def.innerType, ctx);
    case "custom":
      return !1;
    case "transform":
      return !0;
    case "pipe":
      return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    case "success":
      return !1;
    case "catch":
      return !1;
    default:
  }
  throw new Error(`Unknown schema type: ${def.type}`);
}

// node_modules/zod/v4/classic/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def), ZodStringFormat.init(inst, def);
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def), ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def), ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def), ZodStringFormat.init(inst, def);
});
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// node_modules/zod/v4/classic/errors.js
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues), inst.name = "ZodError", Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
      // enumerable: false,
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
      // enumerable: false,
    },
    addIssue: {
      value: (issue2) => inst.issues.push(issue2)
      // enumerable: false,
    },
    addIssues: {
      value: (issues2) => inst.issues.push(...issues2)
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
      // enumerable: false,
    }
  });
}, ZodError = $constructor("ZodError", initializer2), ZodRealError = $constructor("ZodError", initializer2, {
  Parent: Error
});

// node_modules/zod/v4/classic/parse.js
var parse2 = /* @__PURE__ */ _parse(ZodRealError), parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError), safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError), safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);

// node_modules/zod/v4/classic/schemas.js
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => ($ZodType.init(inst, def), inst.def = def, Object.defineProperty(inst, "_def", { value: def }), inst.check = (...checks) => inst.clone(
  {
    ...def,
    checks: [
      ...def.checks ?? [],
      ...checks.map((ch) => typeof ch == "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
    ]
  }
  // { parent: true }
), inst.clone = (def2, params) => clone(inst, def2, params), inst.brand = () => inst, inst.register = ((reg, meta) => (reg.add(inst, meta), inst)), inst.parse = (data, params) => parse2(inst, data, params, { callee: inst.parse }), inst.safeParse = (data, params) => safeParse2(inst, data, params), inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync }), inst.safeParseAsync = async (data, params) => safeParseAsync2(inst, data, params), inst.spa = inst.safeParseAsync, inst.refine = (check2, params) => inst.check(refine(check2, params)), inst.superRefine = (refinement) => inst.check(superRefine(refinement)), inst.overwrite = (fn) => inst.check(_overwrite(fn)), inst.optional = () => optional(inst), inst.nullable = () => nullable(inst), inst.nullish = () => optional(nullable(inst)), inst.nonoptional = (params) => nonoptional(inst, params), inst.array = () => array(inst), inst.or = (arg) => union([inst, arg]), inst.and = (arg) => intersection(inst, arg), inst.transform = (tx) => pipe(inst, transform(tx)), inst.default = (def2) => _default(inst, def2), inst.prefault = (def2) => prefault(inst, def2), inst.catch = (params) => _catch(inst, params), inst.pipe = (target) => pipe(inst, target), inst.readonly = () => readonly(inst), inst.describe = (description) => {
  let cl = inst.clone();
  return globalRegistry.add(cl, { description }), cl;
}, Object.defineProperty(inst, "description", {
  get() {
    return globalRegistry.get(inst)?.description;
  },
  configurable: !0
}), inst.meta = (...args) => {
  if (args.length === 0)
    return globalRegistry.get(inst);
  let cl = inst.clone();
  return globalRegistry.add(cl, args[0]), cl;
}, inst.isOptional = () => inst.safeParse(void 0).success, inst.isNullable = () => inst.safeParse(null).success, inst)), _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def), ZodType.init(inst, def);
  let bag = inst._zod.bag;
  inst.format = bag.format ?? null, inst.minLength = bag.minimum ?? null, inst.maxLength = bag.maximum ?? null, inst.regex = (...args) => inst.check(_regex(...args)), inst.includes = (...args) => inst.check(_includes(...args)), inst.startsWith = (...args) => inst.check(_startsWith(...args)), inst.endsWith = (...args) => inst.check(_endsWith(...args)), inst.min = (...args) => inst.check(_minLength(...args)), inst.max = (...args) => inst.check(_maxLength(...args)), inst.length = (...args) => inst.check(_length(...args)), inst.nonempty = (...args) => inst.check(_minLength(1, ...args)), inst.lowercase = (params) => inst.check(_lowercase(params)), inst.uppercase = (params) => inst.check(_uppercase(params)), inst.trim = () => inst.check(_trim()), inst.normalize = (...args) => inst.check(_normalize(...args)), inst.toLowerCase = () => inst.check(_toLowerCase()), inst.toUpperCase = () => inst.check(_toUpperCase());
}), ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def), _ZodString.init(inst, def), inst.email = (params) => inst.check(_email(ZodEmail, params)), inst.url = (params) => inst.check(_url(ZodURL, params)), inst.jwt = (params) => inst.check(_jwt(ZodJWT, params)), inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params)), inst.guid = (params) => inst.check(_guid(ZodGUID, params)), inst.uuid = (params) => inst.check(_uuid(ZodUUID, params)), inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params)), inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params)), inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params)), inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params)), inst.guid = (params) => inst.check(_guid(ZodGUID, params)), inst.cuid = (params) => inst.check(_cuid(ZodCUID, params)), inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params)), inst.ulid = (params) => inst.check(_ulid(ZodULID, params)), inst.base64 = (params) => inst.check(_base64(ZodBase64, params)), inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params)), inst.xid = (params) => inst.check(_xid(ZodXID, params)), inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params)), inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params)), inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params)), inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params)), inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params)), inst.e164 = (params) => inst.check(_e164(ZodE164, params)), inst.datetime = (params) => inst.check(datetime2(params)), inst.date = (params) => inst.check(date2(params)), inst.time = (params) => inst.check(time2(params)), inst.duration = (params) => inst.check(duration2(params));
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def), _ZodString.init(inst, def);
}), ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def), ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def), ZodType.init(inst, def), inst.gt = (value, params) => inst.check(_gt(value, params)), inst.gte = (value, params) => inst.check(_gte(value, params)), inst.min = (value, params) => inst.check(_gte(value, params)), inst.lt = (value, params) => inst.check(_lt(value, params)), inst.lte = (value, params) => inst.check(_lte(value, params)), inst.max = (value, params) => inst.check(_lte(value, params)), inst.int = (params) => inst.check(int(params)), inst.safe = (params) => inst.check(int(params)), inst.positive = (params) => inst.check(_gt(0, params)), inst.nonnegative = (params) => inst.check(_gte(0, params)), inst.negative = (params) => inst.check(_lt(0, params)), inst.nonpositive = (params) => inst.check(_lte(0, params)), inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params)), inst.step = (value, params) => inst.check(_multipleOf(value, params)), inst.finite = () => inst;
  let bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null, inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null, inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5), inst.isFinite = !0, inst.format = bag.format ?? null;
});
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def), ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def), ZodType.init(inst, def);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def), ZodType.init(inst, def);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def), ZodType.init(inst, def);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def), ZodType.init(inst, def);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def), ZodType.init(inst, def), inst.element = def.element, inst.min = (minLength, params) => inst.check(_minLength(minLength, params)), inst.nonempty = (params) => inst.check(_minLength(1, params)), inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params)), inst.length = (len, params) => inst.check(_length(len, params)), inst.unwrap = () => inst.element;
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObject.init(inst, def), ZodType.init(inst, def), util_exports.defineLazy(inst, "shape", () => def.shape), inst.keyof = () => _enum(Object.keys(inst._zod.def.shape)), inst.catchall = (catchall) => inst.clone({ ...inst._zod.def, catchall }), inst.passthrough = () => inst.clone({ ...inst._zod.def, catchall: unknown() }), inst.loose = () => inst.clone({ ...inst._zod.def, catchall: unknown() }), inst.strict = () => inst.clone({ ...inst._zod.def, catchall: never() }), inst.strip = () => inst.clone({ ...inst._zod.def, catchall: void 0 }), inst.extend = (incoming) => util_exports.extend(inst, incoming), inst.merge = (other) => util_exports.merge(inst, other), inst.pick = (mask) => util_exports.pick(inst, mask), inst.omit = (mask) => util_exports.omit(inst, mask), inst.partial = (...args) => util_exports.partial(ZodOptional, inst, args[0]), inst.required = (...args) => util_exports.required(ZodNonOptional, inst, args[0]);
});
function object(shape, params) {
  let def = {
    type: "object",
    get shape() {
      return util_exports.assignProp(this, "shape", { ...shape }), this.shape;
    },
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
function looseObject(shape, params) {
  return new ZodObject({
    type: "object",
    get shape() {
      return util_exports.assignProp(this, "shape", { ...shape }), this.shape;
    },
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def), ZodType.init(inst, def), inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def), $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def), ZodType.init(inst, def);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def), ZodType.init(inst, def), inst.keyType = def.keyType, inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def), ZodType.init(inst, def), inst.enum = def.entries, inst.options = Object.values(def.entries);
  let keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    let newEntries = {};
    for (let value of values)
      if (keys.has(value))
        newEntries[value] = def.entries[value];
      else
        throw new Error(`Key ${value} not found in enum`);
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  }, inst.exclude = (values, params) => {
    let newEntries = { ...def.entries };
    for (let value of values)
      if (keys.has(value))
        delete newEntries[value];
      else
        throw new Error(`Key ${value} not found in enum`);
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  let entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def), ZodType.init(inst, def), inst.values = new Set(def.values), Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1)
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def), ZodType.init(inst, def), inst._zod.parse = (payload, _ctx) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 == "string")
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      else {
        let _issue = issue2;
        _issue.fatal && (_issue.continue = !1), _issue.code ?? (_issue.code = "custom"), _issue.input ?? (_issue.input = payload.value), _issue.inst ?? (_issue.inst = inst), _issue.continue ?? (_issue.continue = !0), payload.issues.push(util_exports.issue(_issue));
      }
    };
    let output = def.transform(payload.value, payload);
    return output instanceof Promise ? output.then((output2) => (payload.value = output2, payload)) : (payload.value = output, payload);
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def), ZodType.init(inst, def), inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def), ZodType.init(inst, def), inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def), ZodType.init(inst, def), inst.unwrap = () => inst._zod.def.innerType, inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue == "function" ? defaultValue() : defaultValue;
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def), ZodType.init(inst, def), inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue == "function" ? defaultValue() : defaultValue;
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def), ZodType.init(inst, def), inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def), ZodType.init(inst, def), inst.unwrap = () => inst._zod.def.innerType, inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue == "function" ? catchValue : () => catchValue
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def), ZodType.init(inst, def), inst.in = def.in, inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def), ZodType.init(inst, def);
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def), ZodType.init(inst, def);
});
function check(fn) {
  let ch = new $ZodCheck({
    check: "custom"
    // ...util.normalizeParams(params),
  });
  return ch._zod.check = fn, ch;
}
function custom(fn, _params) {
  return _custom(ZodCustom, fn ?? (() => !0), _params);
}
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
  let ch = check((payload) => (payload.addIssue = (issue2) => {
    if (typeof issue2 == "string")
      payload.issues.push(util_exports.issue(issue2, payload.value, ch._zod.def));
    else {
      let _issue = issue2;
      _issue.fatal && (_issue.continue = !1), _issue.code ?? (_issue.code = "custom"), _issue.input ?? (_issue.input = payload.value), _issue.inst ?? (_issue.inst = ch), _issue.continue ?? (_issue.continue = !ch._zod.def.abort), payload.issues.push(util_exports.issue(_issue));
    }
  }, fn(payload.value, payload)));
  return ch;
}
function preprocess(fn, schema) {
  return pipe(transform(fn), schema);
}

// node_modules/zod/v4/classic/external.js
config(en_default());

// node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
var LATEST_PROTOCOL_VERSION = "2025-11-25";
var SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"], RELATED_TASK_META_KEY = "io.modelcontextprotocol/related-task", JSONRPC_VERSION = "2.0", AssertObjectSchema = custom((v) => v !== null && (typeof v == "object" || typeof v == "function")), ProgressTokenSchema = union([string2(), number2().int()]), CursorSchema = string2(), TaskCreationParamsSchema = looseObject({
  /**
   * Requested duration in milliseconds to retain task from creation.
   */
  ttl: number2().optional(),
  /**
   * Time in milliseconds to wait between task status requests.
   */
  pollInterval: number2().optional()
}), TaskMetadataSchema = object({
  ttl: number2().optional()
}), RelatedTaskMetadataSchema = object({
  taskId: string2()
}), RequestMetaSchema = looseObject({
  /**
   * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
   */
  progressToken: ProgressTokenSchema.optional(),
  /**
   * If specified, this request is related to the provided task.
   */
  [RELATED_TASK_META_KEY]: RelatedTaskMetadataSchema.optional()
}), BaseRequestParamsSchema = object({
  /**
   * See [General fields: `_meta`](/specification/draft/basic/index#meta) for notes on `_meta` usage.
   */
  _meta: RequestMetaSchema.optional()
}), TaskAugmentedRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * If specified, the caller is requesting task-augmented execution for this request.
   * The request will return a CreateTaskResult immediately, and the actual result can be
   * retrieved later via tasks/result.
   *
   * Task augmentation is subject to capability negotiation - receivers MUST declare support
   * for task augmentation of specific request types in their capabilities.
   */
  task: TaskMetadataSchema.optional()
}), isTaskAugmentedRequestParams = (value) => TaskAugmentedRequestParamsSchema.safeParse(value).success, RequestSchema = object({
  method: string2(),
  params: BaseRequestParamsSchema.loose().optional()
}), NotificationsParamsSchema = object({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: RequestMetaSchema.optional()
}), NotificationSchema = object({
  method: string2(),
  params: NotificationsParamsSchema.loose().optional()
}), ResultSchema = looseObject({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: RequestMetaSchema.optional()
}), RequestIdSchema = union([string2(), number2().int()]), JSONRPCRequestSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  ...RequestSchema.shape
}).strict(), isJSONRPCRequest = (value) => JSONRPCRequestSchema.safeParse(value).success, JSONRPCNotificationSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  ...NotificationSchema.shape
}).strict(), isJSONRPCNotification = (value) => JSONRPCNotificationSchema.safeParse(value).success, JSONRPCResultResponseSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
}).strict(), isJSONRPCResultResponse = (value) => JSONRPCResultResponseSchema.safeParse(value).success;
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2[ErrorCode2.ConnectionClosed = -32e3] = "ConnectionClosed", ErrorCode2[ErrorCode2.RequestTimeout = -32001] = "RequestTimeout", ErrorCode2[ErrorCode2.ParseError = -32700] = "ParseError", ErrorCode2[ErrorCode2.InvalidRequest = -32600] = "InvalidRequest", ErrorCode2[ErrorCode2.MethodNotFound = -32601] = "MethodNotFound", ErrorCode2[ErrorCode2.InvalidParams = -32602] = "InvalidParams", ErrorCode2[ErrorCode2.InternalError = -32603] = "InternalError", ErrorCode2[ErrorCode2.UrlElicitationRequired = -32042] = "UrlElicitationRequired";
})(ErrorCode || (ErrorCode = {}));
var JSONRPCErrorResponseSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema.optional(),
  error: object({
    /**
     * The error type that occurred.
     */
    code: number2().int(),
    /**
     * A short description of the error. The message SHOULD be limited to a concise single sentence.
     */
    message: string2(),
    /**
     * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
     */
    data: unknown().optional()
  })
}).strict();
var isJSONRPCErrorResponse = (value) => JSONRPCErrorResponseSchema.safeParse(value).success;
var JSONRPCMessageSchema = union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResultResponseSchema,
  JSONRPCErrorResponseSchema
]), JSONRPCResponseSchema = union([JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]), EmptyResultSchema = ResultSchema.strict(), CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The ID of the request to cancel.
   *
   * This MUST correspond to the ID of a request previously issued in the same direction.
   */
  requestId: RequestIdSchema.optional(),
  /**
   * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
   */
  reason: string2().optional()
}), CancelledNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/cancelled"),
  params: CancelledNotificationParamsSchema
}), IconSchema = object({
  /**
   * URL or data URI for the icon.
   */
  src: string2(),
  /**
   * Optional MIME type for the icon.
   */
  mimeType: string2().optional(),
  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
   *
   * If not provided, the client should assume that the icon can be used at any size.
   */
  sizes: array(string2()).optional(),
  /**
   * Optional specifier for the theme this icon is designed for. `light` indicates
   * the icon is designed to be used with a light background, and `dark` indicates
   * the icon is designed to be used with a dark background.
   *
   * If not provided, the client should assume the icon can be used with any theme.
   */
  theme: _enum(["light", "dark"]).optional()
}), IconsSchema = object({
  /**
   * Optional set of sized icons that the client can display in a user interface.
   *
   * Clients that support rendering icons MUST support at least the following MIME types:
   * - `image/png` - PNG images (safe, universal compatibility)
   * - `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)
   *
   * Clients that support rendering icons SHOULD also support:
   * - `image/svg+xml` - SVG images (scalable but requires security precautions)
   * - `image/webp` - WebP images (modern, efficient format)
   */
  icons: array(IconSchema).optional()
}), BaseMetadataSchema = object({
  /** Intended for programmatic or logical use, but used as a display name in past specs or fallback */
  name: string2(),
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   *
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title: string2().optional()
}), ImplementationSchema = BaseMetadataSchema.extend({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  version: string2(),
  /**
   * An optional URL of the website for this implementation.
   */
  websiteUrl: string2().optional(),
  /**
   * An optional human-readable description of what this implementation does.
   *
   * This can be used by clients or servers to provide context about their purpose
   * and capabilities. For example, a server might describe the types of resources
   * or tools it provides, while a client might describe its intended use case.
   */
  description: string2().optional()
}), FormElicitationCapabilitySchema = intersection(object({
  applyDefaults: boolean2().optional()
}), record(string2(), unknown())), ElicitationCapabilitySchema = preprocess((value) => value && typeof value == "object" && !Array.isArray(value) && Object.keys(value).length === 0 ? { form: {} } : value, intersection(object({
  form: FormElicitationCapabilitySchema.optional(),
  url: AssertObjectSchema.optional()
}), record(string2(), unknown()).optional())), ClientTasksCapabilitySchema = looseObject({
  /**
   * Present if the client supports listing tasks.
   */
  list: AssertObjectSchema.optional(),
  /**
   * Present if the client supports cancelling tasks.
   */
  cancel: AssertObjectSchema.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: looseObject({
    /**
     * Task support for sampling requests.
     */
    sampling: looseObject({
      createMessage: AssertObjectSchema.optional()
    }).optional(),
    /**
     * Task support for elicitation requests.
     */
    elicitation: looseObject({
      create: AssertObjectSchema.optional()
    }).optional()
  }).optional()
}), ServerTasksCapabilitySchema = looseObject({
  /**
   * Present if the server supports listing tasks.
   */
  list: AssertObjectSchema.optional(),
  /**
   * Present if the server supports cancelling tasks.
   */
  cancel: AssertObjectSchema.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: looseObject({
    /**
     * Task support for tool requests.
     */
    tools: looseObject({
      call: AssertObjectSchema.optional()
    }).optional()
  }).optional()
}), ClientCapabilitiesSchema = object({
  /**
   * Experimental, non-standard capabilities that the client supports.
   */
  experimental: record(string2(), AssertObjectSchema).optional(),
  /**
   * Present if the client supports sampling from an LLM.
   */
  sampling: object({
    /**
     * Present if the client supports context inclusion via includeContext parameter.
     * If not declared, servers SHOULD only use `includeContext: "none"` (or omit it).
     */
    context: AssertObjectSchema.optional(),
    /**
     * Present if the client supports tool use via tools and toolChoice parameters.
     */
    tools: AssertObjectSchema.optional()
  }).optional(),
  /**
   * Present if the client supports eliciting user input.
   */
  elicitation: ElicitationCapabilitySchema.optional(),
  /**
   * Present if the client supports listing roots.
   */
  roots: object({
    /**
     * Whether the client supports issuing notifications for changes to the roots list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the client supports task creation.
   */
  tasks: ClientTasksCapabilitySchema.optional(),
  /**
   * Extensions that the client supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: record(string2(), AssertObjectSchema).optional()
}), InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
   */
  protocolVersion: string2(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
}), InitializeRequestSchema = RequestSchema.extend({
  method: literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = object({
  /**
   * Experimental, non-standard capabilities that the server supports.
   */
  experimental: record(string2(), AssertObjectSchema).optional(),
  /**
   * Present if the server supports sending log messages to the client.
   */
  logging: AssertObjectSchema.optional(),
  /**
   * Present if the server supports sending completions to the client.
   */
  completions: AssertObjectSchema.optional(),
  /**
   * Present if the server offers any prompt templates.
   */
  prompts: object({
    /**
     * Whether this server supports issuing notifications for changes to the prompt list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the server offers any resources to read.
   */
  resources: object({
    /**
     * Whether this server supports clients subscribing to resource updates.
     */
    subscribe: boolean2().optional(),
    /**
     * Whether this server supports issuing notifications for changes to the resource list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the server offers any tools to call.
   */
  tools: object({
    /**
     * Whether this server supports issuing notifications for changes to the tool list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the server supports task creation.
   */
  tasks: ServerTasksCapabilitySchema.optional(),
  /**
   * Extensions that the server supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: record(string2(), AssertObjectSchema).optional()
}), InitializeResultSchema = ResultSchema.extend({
  /**
   * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
   */
  protocolVersion: string2(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  /**
   * Instructions describing how to use the server and its features.
   *
   * This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.
   */
  instructions: string2().optional()
}), InitializedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/initialized"),
  params: NotificationsParamsSchema.optional()
});
var PingRequestSchema = RequestSchema.extend({
  method: literal("ping"),
  params: BaseRequestParamsSchema.optional()
}), ProgressSchema = object({
  /**
   * The progress thus far. This should increase every time progress is made, even if the total is unknown.
   */
  progress: number2(),
  /**
   * Total number of items to process (or total progress required), if known.
   */
  total: optional(number2()),
  /**
   * An optional message describing the current progress.
   */
  message: optional(string2())
}), ProgressNotificationParamsSchema = object({
  ...NotificationsParamsSchema.shape,
  ...ProgressSchema.shape,
  /**
   * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
   */
  progressToken: ProgressTokenSchema
}), ProgressNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/progress"),
  params: ProgressNotificationParamsSchema
}), PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * An opaque token representing the current pagination position.
   * If provided, the server should return results starting after this cursor.
   */
  cursor: CursorSchema.optional()
}), PaginatedRequestSchema = RequestSchema.extend({
  params: PaginatedRequestParamsSchema.optional()
}), PaginatedResultSchema = ResultSchema.extend({
  /**
   * An opaque token representing the pagination position after the last returned result.
   * If present, there may be more results available.
   */
  nextCursor: CursorSchema.optional()
}), TaskStatusSchema = _enum(["working", "input_required", "completed", "failed", "cancelled"]), TaskSchema = object({
  taskId: string2(),
  status: TaskStatusSchema,
  /**
   * Time in milliseconds to keep task results available after completion.
   * If null, the task has unlimited lifetime until manually cleaned up.
   */
  ttl: union([number2(), _null3()]),
  /**
   * ISO 8601 timestamp when the task was created.
   */
  createdAt: string2(),
  /**
   * ISO 8601 timestamp when the task was last updated.
   */
  lastUpdatedAt: string2(),
  pollInterval: optional(number2()),
  /**
   * Optional diagnostic message for failed tasks or other status information.
   */
  statusMessage: optional(string2())
}), CreateTaskResultSchema = ResultSchema.extend({
  task: TaskSchema
}), TaskStatusNotificationParamsSchema = NotificationsParamsSchema.merge(TaskSchema), TaskStatusNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tasks/status"),
  params: TaskStatusNotificationParamsSchema
}), GetTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/get"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
}), GetTaskResultSchema = ResultSchema.merge(TaskSchema), GetTaskPayloadRequestSchema = RequestSchema.extend({
  method: literal("tasks/result"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
}), GetTaskPayloadResultSchema = ResultSchema.loose(), ListTasksRequestSchema = PaginatedRequestSchema.extend({
  method: literal("tasks/list")
}), ListTasksResultSchema = PaginatedResultSchema.extend({
  tasks: array(TaskSchema)
}), CancelTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/cancel"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
}), CancelTaskResultSchema = ResultSchema.merge(TaskSchema), ResourceContentsSchema = object({
  /**
   * The URI of this resource.
   */
  uri: string2(),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: optional(string2()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), TextResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
   */
  text: string2()
}), Base64Schema = string2().refine((val) => {
  try {
    return atob(val), !0;
  } catch {
    return !1;
  }
}, { message: "Invalid Base64 string" }), BlobResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * A base64-encoded string representing the binary data of the item.
   */
  blob: Base64Schema
}), RoleSchema = _enum(["user", "assistant"]), AnnotationsSchema = object({
  /**
   * Intended audience(s) for the resource.
   */
  audience: array(RoleSchema).optional(),
  /**
   * Importance hint for the resource, from 0 (least) to 1 (most).
   */
  priority: number2().min(0).max(1).optional(),
  /**
   * ISO 8601 timestamp for the most recent modification.
   */
  lastModified: iso_exports.datetime({ offset: !0 }).optional()
}), ResourceSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * The URI of this resource.
   */
  uri: string2(),
  /**
   * A description of what this resource represents.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: optional(string2()),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: optional(string2()),
  /**
   * The size of the raw resource content, in bytes (i.e., before base64 encoding or any tokenization), if known.
   *
   * This can be used by Hosts to display file sizes and estimate context window usage.
   */
  size: optional(number2()),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
}), ResourceTemplateSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * A URI template (according to RFC 6570) that can be used to construct resource URIs.
   */
  uriTemplate: string2(),
  /**
   * A description of what this template is for.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: optional(string2()),
  /**
   * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
   */
  mimeType: optional(string2()),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
}), ListResourcesRequestSchema = PaginatedRequestSchema.extend({
  method: literal("resources/list")
}), ListResourcesResultSchema = PaginatedResultSchema.extend({
  resources: array(ResourceSchema)
}), ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
  method: literal("resources/templates/list")
}), ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
  resourceTemplates: array(ResourceTemplateSchema)
}), ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
   *
   * @format uri
   */
  uri: string2()
}), ReadResourceRequestParamsSchema = ResourceRequestParamsSchema, ReadResourceRequestSchema = RequestSchema.extend({
  method: literal("resources/read"),
  params: ReadResourceRequestParamsSchema
}), ReadResourceResultSchema = ResultSchema.extend({
  contents: array(union([TextResourceContentsSchema, BlobResourceContentsSchema]))
}), ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/list_changed"),
  params: NotificationsParamsSchema.optional()
}), SubscribeRequestParamsSchema = ResourceRequestParamsSchema, SubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/subscribe"),
  params: SubscribeRequestParamsSchema
}), UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema, UnsubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/unsubscribe"),
  params: UnsubscribeRequestParamsSchema
}), ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
   */
  uri: string2()
}), ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/updated"),
  params: ResourceUpdatedNotificationParamsSchema
}), PromptArgumentSchema = object({
  /**
   * The name of the argument.
   */
  name: string2(),
  /**
   * A human-readable description of the argument.
   */
  description: optional(string2()),
  /**
   * Whether this argument must be provided.
   */
  required: optional(boolean2())
}), PromptSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * An optional description of what this prompt provides
   */
  description: optional(string2()),
  /**
   * A list of arguments to use for templating the prompt.
   */
  arguments: optional(array(PromptArgumentSchema)),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
}), ListPromptsRequestSchema = PaginatedRequestSchema.extend({
  method: literal("prompts/list")
}), ListPromptsResultSchema = PaginatedResultSchema.extend({
  prompts: array(PromptSchema)
}), GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The name of the prompt or prompt template.
   */
  name: string2(),
  /**
   * Arguments to use for templating the prompt.
   */
  arguments: record(string2(), string2()).optional()
}), GetPromptRequestSchema = RequestSchema.extend({
  method: literal("prompts/get"),
  params: GetPromptRequestParamsSchema
}), TextContentSchema = object({
  type: literal("text"),
  /**
   * The text content of the message.
   */
  text: string2(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), ImageContentSchema = object({
  type: literal("image"),
  /**
   * The base64-encoded image data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the image. Different providers may support different image types.
   */
  mimeType: string2(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), AudioContentSchema = object({
  type: literal("audio"),
  /**
   * The base64-encoded audio data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the audio. Different providers may support different audio types.
   */
  mimeType: string2(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), ToolUseContentSchema = object({
  type: literal("tool_use"),
  /**
   * The name of the tool to invoke.
   * Must match a tool name from the request's tools array.
   */
  name: string2(),
  /**
   * Unique identifier for this tool call.
   * Used to correlate with ToolResultContent in subsequent messages.
   */
  id: string2(),
  /**
   * Arguments to pass to the tool.
   * Must conform to the tool's inputSchema.
   */
  input: record(string2(), unknown()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), EmbeddedResourceSchema = object({
  type: literal("resource"),
  resource: union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), ResourceLinkSchema = ResourceSchema.extend({
  type: literal("resource_link")
}), ContentBlockSchema = union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]), PromptMessageSchema = object({
  role: RoleSchema,
  content: ContentBlockSchema
}), GetPromptResultSchema = ResultSchema.extend({
  /**
   * An optional description for the prompt.
   */
  description: string2().optional(),
  messages: array(PromptMessageSchema)
}), PromptListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/prompts/list_changed"),
  params: NotificationsParamsSchema.optional()
}), ToolAnnotationsSchema = object({
  /**
   * A human-readable title for the tool.
   */
  title: string2().optional(),
  /**
   * If true, the tool does not modify its environment.
   *
   * Default: false
   */
  readOnlyHint: boolean2().optional(),
  /**
   * If true, the tool may perform destructive updates to its environment.
   * If false, the tool performs only additive updates.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: true
   */
  destructiveHint: boolean2().optional(),
  /**
   * If true, calling the tool repeatedly with the same arguments
   * will have no additional effect on the its environment.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: false
   */
  idempotentHint: boolean2().optional(),
  /**
   * If true, this tool may interact with an "open world" of external
   * entities. If false, the tool's domain of interaction is closed.
   * For example, the world of a web search tool is open, whereas that
   * of a memory tool is not.
   *
   * Default: true
   */
  openWorldHint: boolean2().optional()
}), ToolExecutionSchema = object({
  /**
   * Indicates the tool's preference for task-augmented execution.
   * - "required": Clients MUST invoke the tool as a task
   * - "optional": Clients MAY invoke the tool as a task or normal request
   * - "forbidden": Clients MUST NOT attempt to invoke the tool as a task
   *
   * If not present, defaults to "forbidden".
   */
  taskSupport: _enum(["required", "optional", "forbidden"]).optional()
}), ToolSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * A human-readable description of the tool.
   */
  description: string2().optional(),
  /**
   * A JSON Schema 2020-12 object defining the expected parameters for the tool.
   * Must have type: 'object' at the root level per MCP spec.
   */
  inputSchema: object({
    type: literal("object"),
    properties: record(string2(), AssertObjectSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()),
  /**
   * An optional JSON Schema 2020-12 object defining the structure of the tool's output
   * returned in the structuredContent field of a CallToolResult.
   * Must have type: 'object' at the root level per MCP spec.
   */
  outputSchema: object({
    type: literal("object"),
    properties: record(string2(), AssertObjectSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()).optional(),
  /**
   * Optional additional tool information.
   */
  annotations: ToolAnnotationsSchema.optional(),
  /**
   * Execution-related properties for this tool.
   */
  execution: ToolExecutionSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), ListToolsRequestSchema = PaginatedRequestSchema.extend({
  method: literal("tools/list")
}), ListToolsResultSchema = PaginatedResultSchema.extend({
  tools: array(ToolSchema)
}), CallToolResultSchema = ResultSchema.extend({
  /**
   * A list of content objects that represent the result of the tool call.
   *
   * If the Tool does not define an outputSchema, this field MUST be present in the result.
   * For backwards compatibility, this field is always present, but it may be empty.
   */
  content: array(ContentBlockSchema).default([]),
  /**
   * An object containing structured tool output.
   *
   * If the Tool defines an outputSchema, this field MUST be present in the result, and contain a JSON object that matches the schema.
   */
  structuredContent: record(string2(), unknown()).optional(),
  /**
   * Whether the tool call ended in an error.
   *
   * If not set, this is assumed to be false (the call was successful).
   *
   * Any errors that originate from the tool SHOULD be reported inside the result
   * object, with `isError` set to true, _not_ as an MCP protocol-level error
   * response. Otherwise, the LLM would not be able to see that an error occurred
   * and self-correct.
   *
   * However, any errors in _finding_ the tool, an error indicating that the
   * server does not support tool calls, or any other exceptional conditions,
   * should be reported as an MCP error response.
   */
  isError: boolean2().optional()
}), CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({
  toolResult: unknown()
})), CallToolRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The name of the tool to call.
   */
  name: string2(),
  /**
   * Arguments to pass to the tool.
   */
  arguments: record(string2(), unknown()).optional()
}), CallToolRequestSchema = RequestSchema.extend({
  method: literal("tools/call"),
  params: CallToolRequestParamsSchema
}), ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tools/list_changed"),
  params: NotificationsParamsSchema.optional()
}), ListChangedOptionsBaseSchema = object({
  /**
   * If true, the list will be refreshed automatically when a list changed notification is received.
   * The callback will be called with the updated list.
   *
   * If false, the callback will be called with null items, allowing manual refresh.
   *
   * @default true
   */
  autoRefresh: boolean2().default(!0),
  /**
   * Debounce time in milliseconds for list changed notification processing.
   *
   * Multiple notifications received within this timeframe will only trigger one refresh.
   * Set to 0 to disable debouncing.
   *
   * @default 300
   */
  debounceMs: number2().int().nonnegative().default(300)
}), LoggingLevelSchema = _enum(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]), SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
   */
  level: LoggingLevelSchema
}), SetLevelRequestSchema = RequestSchema.extend({
  method: literal("logging/setLevel"),
  params: SetLevelRequestParamsSchema
}), LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The severity of this log message.
   */
  level: LoggingLevelSchema,
  /**
   * An optional name of the logger issuing this message.
   */
  logger: string2().optional(),
  /**
   * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
   */
  data: unknown()
}), LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/message"),
  params: LoggingMessageNotificationParamsSchema
}), ModelHintSchema = object({
  /**
   * A hint for a model name.
   */
  name: string2().optional()
}), ModelPreferencesSchema = object({
  /**
   * Optional hints to use for model selection.
   */
  hints: array(ModelHintSchema).optional(),
  /**
   * How much to prioritize cost when selecting a model.
   */
  costPriority: number2().min(0).max(1).optional(),
  /**
   * How much to prioritize sampling speed (latency) when selecting a model.
   */
  speedPriority: number2().min(0).max(1).optional(),
  /**
   * How much to prioritize intelligence and capabilities when selecting a model.
   */
  intelligencePriority: number2().min(0).max(1).optional()
}), ToolChoiceSchema = object({
  /**
   * Controls when tools are used:
   * - "auto": Model decides whether to use tools (default)
   * - "required": Model MUST use at least one tool before completing
   * - "none": Model MUST NOT use any tools
   */
  mode: _enum(["auto", "required", "none"]).optional()
}), ToolResultContentSchema = object({
  type: literal("tool_result"),
  toolUseId: string2().describe("The unique identifier for the corresponding tool call."),
  content: array(ContentBlockSchema).default([]),
  structuredContent: object({}).loose().optional(),
  isError: boolean2().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), SamplingContentSchema = discriminatedUnion("type", [TextContentSchema, ImageContentSchema, AudioContentSchema]), SamplingMessageContentBlockSchema = discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ToolUseContentSchema,
  ToolResultContentSchema
]), SamplingMessageSchema = object({
  role: RoleSchema,
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)]),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), CreateMessageRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  messages: array(SamplingMessageSchema),
  /**
   * The server's preferences for which model to select. The client MAY modify or omit this request.
   */
  modelPreferences: ModelPreferencesSchema.optional(),
  /**
   * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
   */
  systemPrompt: string2().optional(),
  /**
   * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt.
   * The client MAY ignore this request.
   *
   * Default is "none". Values "thisServer" and "allServers" are soft-deprecated. Servers SHOULD only use these values if the client
   * declares ClientCapabilities.sampling.context. These values may be removed in future spec releases.
   */
  includeContext: _enum(["none", "thisServer", "allServers"]).optional(),
  temperature: number2().optional(),
  /**
   * The requested maximum number of tokens to sample (to prevent runaway completions).
   *
   * The client MAY choose to sample fewer tokens than the requested maximum.
   */
  maxTokens: number2().int(),
  stopSequences: array(string2()).optional(),
  /**
   * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
   */
  metadata: AssertObjectSchema.optional(),
  /**
   * Tools that the model may use during generation.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   */
  tools: array(ToolSchema).optional(),
  /**
   * Controls how the model uses tools.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   * Default is `{ mode: "auto" }`.
   */
  toolChoice: ToolChoiceSchema.optional()
}), CreateMessageRequestSchema = RequestSchema.extend({
  method: literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
}), CreateMessageResultSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: string2(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: optional(_enum(["endTurn", "stopSequence", "maxTokens"]).or(string2())),
  role: RoleSchema,
  /**
   * Response content. Single content block (text, image, or audio).
   */
  content: SamplingContentSchema
}), CreateMessageResultWithToolsSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: string2(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   * - "toolUse": The model wants to use one or more tools
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: optional(_enum(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(string2())),
  role: RoleSchema,
  /**
   * Response content. May be a single block or array. May include ToolUseContent if stopReason is "toolUse".
   */
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)])
}), BooleanSchemaSchema = object({
  type: literal("boolean"),
  title: string2().optional(),
  description: string2().optional(),
  default: boolean2().optional()
}), StringSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  minLength: number2().optional(),
  maxLength: number2().optional(),
  format: _enum(["email", "uri", "date", "date-time"]).optional(),
  default: string2().optional()
}), NumberSchemaSchema = object({
  type: _enum(["number", "integer"]),
  title: string2().optional(),
  description: string2().optional(),
  minimum: number2().optional(),
  maximum: number2().optional(),
  default: number2().optional()
}), UntitledSingleSelectEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  default: string2().optional()
}), TitledSingleSelectEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  oneOf: array(object({
    const: string2(),
    title: string2()
  })),
  default: string2().optional()
}), LegacyTitledEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  enumNames: array(string2()).optional(),
  default: string2().optional()
}), SingleSelectEnumSchemaSchema = union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]), UntitledMultiSelectEnumSchemaSchema = object({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object({
    type: literal("string"),
    enum: array(string2())
  }),
  default: array(string2()).optional()
}), TitledMultiSelectEnumSchemaSchema = object({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object({
    anyOf: array(object({
      const: string2(),
      title: string2()
    }))
  }),
  default: array(string2()).optional()
}), MultiSelectEnumSchemaSchema = union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]), EnumSchemaSchema = union([LegacyTitledEnumSchemaSchema, SingleSelectEnumSchemaSchema, MultiSelectEnumSchemaSchema]), PrimitiveSchemaDefinitionSchema = union([EnumSchemaSchema, BooleanSchemaSchema, StringSchemaSchema, NumberSchemaSchema]), ElicitRequestFormParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   *
   * Optional for backward compatibility. Clients MUST treat missing mode as "form".
   */
  mode: literal("form").optional(),
  /**
   * The message to present to the user describing what information is being requested.
   */
  message: string2(),
  /**
   * A restricted subset of JSON Schema.
   * Only top-level properties are allowed, without nesting.
   */
  requestedSchema: object({
    type: literal("object"),
    properties: record(string2(), PrimitiveSchemaDefinitionSchema),
    required: array(string2()).optional()
  })
}), ElicitRequestURLParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   */
  mode: literal("url"),
  /**
   * The message to present to the user explaining why the interaction is needed.
   */
  message: string2(),
  /**
   * The ID of the elicitation, which must be unique within the context of the server.
   * The client MUST treat this ID as an opaque value.
   */
  elicitationId: string2(),
  /**
   * The URL that the user should navigate to.
   */
  url: string2().url()
}), ElicitRequestParamsSchema = union([ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema]), ElicitRequestSchema = RequestSchema.extend({
  method: literal("elicitation/create"),
  params: ElicitRequestParamsSchema
}), ElicitationCompleteNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The ID of the elicitation that completed.
   */
  elicitationId: string2()
}), ElicitationCompleteNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/elicitation/complete"),
  params: ElicitationCompleteNotificationParamsSchema
}), ElicitResultSchema = ResultSchema.extend({
  /**
   * The user action in response to the elicitation.
   * - "accept": User submitted the form/confirmed the action
   * - "decline": User explicitly decline the action
   * - "cancel": User dismissed without making an explicit choice
   */
  action: _enum(["accept", "decline", "cancel"]),
  /**
   * The submitted form data, only present when action is "accept".
   * Contains values matching the requested schema.
   * Per MCP spec, content is "typically omitted" for decline/cancel actions.
   * We normalize null to undefined for leniency while maintaining type compatibility.
   */
  content: preprocess((val) => val === null ? void 0 : val, record(string2(), union([string2(), number2(), boolean2(), array(string2())])).optional())
}), ResourceTemplateReferenceSchema = object({
  type: literal("ref/resource"),
  /**
   * The URI or URI template of the resource.
   */
  uri: string2()
});
var PromptReferenceSchema = object({
  type: literal("ref/prompt"),
  /**
   * The name of the prompt or prompt template
   */
  name: string2()
}), CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
  ref: union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
  /**
   * The argument's information
   */
  argument: object({
    /**
     * The name of the argument
     */
    name: string2(),
    /**
     * The value of the argument to use for completion matching.
     */
    value: string2()
  }),
  context: object({
    /**
     * Previously-resolved variables in a URI template or prompt.
     */
    arguments: record(string2(), string2()).optional()
  }).optional()
}), CompleteRequestSchema = RequestSchema.extend({
  method: literal("completion/complete"),
  params: CompleteRequestParamsSchema
});
function assertCompleteRequestPrompt(request) {
  if (request.params.ref.type !== "ref/prompt")
    throw new TypeError(`Expected CompleteRequestPrompt, but got ${request.params.ref.type}`);
}
function assertCompleteRequestResourceTemplate(request) {
  if (request.params.ref.type !== "ref/resource")
    throw new TypeError(`Expected CompleteRequestResourceTemplate, but got ${request.params.ref.type}`);
}
var CompleteResultSchema = ResultSchema.extend({
  completion: looseObject({
    /**
     * An array of completion values. Must not exceed 100 items.
     */
    values: array(string2()).max(100),
    /**
     * The total number of completion options available. This can exceed the number of values actually sent in the response.
     */
    total: optional(number2().int()),
    /**
     * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
     */
    hasMore: optional(boolean2())
  })
}), RootSchema = object({
  /**
   * The URI identifying the root. This *must* start with file:// for now.
   */
  uri: string2().startsWith("file://"),
  /**
   * An optional name for the root.
   */
  name: string2().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
}), ListRootsRequestSchema = RequestSchema.extend({
  method: literal("roots/list"),
  params: BaseRequestParamsSchema.optional()
}), ListRootsResultSchema = ResultSchema.extend({
  roots: array(RootSchema)
}), RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/roots/list_changed"),
  params: NotificationsParamsSchema.optional()
}), ClientRequestSchema = union([
  PingRequestSchema,
  InitializeRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]), ClientNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
  TaskStatusNotificationSchema
]), ClientResultSchema = union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema,
  ElicitResultSchema,
  ListRootsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]), ServerRequestSchema = union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  ListRootsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]), ServerNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  TaskStatusNotificationSchema,
  ElicitationCompleteNotificationSchema
]), ServerResultSchema = union([
  EmptyResultSchema,
  InitializeResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]), McpError = class _McpError extends Error {
  constructor(code, message, data) {
    super(`MCP error ${code}: ${message}`), this.code = code, this.data = data, this.name = "McpError";
  }
  /**
   * Factory method to create the appropriate error type based on the error code and data
   */
  static fromError(code, message, data) {
    if (code === ErrorCode.UrlElicitationRequired && data) {
      let errorData = data;
      if (errorData.elicitations)
        return new UrlElicitationRequiredError(errorData.elicitations, message);
    }
    return new _McpError(code, message, data);
  }
}, UrlElicitationRequiredError = class extends McpError {
  constructor(elicitations, message = `URL elicitation${elicitations.length > 1 ? "s" : ""} required`) {
    super(ErrorCode.UrlElicitationRequired, message, {
      elicitations
    });
  }
  get elicitations() {
    return this.data?.elicitations ?? [];
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/stdio.js
var STDIO_DEFAULT_MAX_BUFFER_SIZE = 10 * 1024 * 1024, ReadBuffer = class {
  constructor(options) {
    this._maxBufferSize = options?.maxBufferSize ?? STDIO_DEFAULT_MAX_BUFFER_SIZE;
  }
  append(chunk) {
    if ((this._buffer?.length ?? 0) + chunk.length > this._maxBufferSize)
      throw this.clear(), new Error(`ReadBuffer exceeded maximum size of ${this._maxBufferSize} bytes`);
    this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
  }
  readMessage() {
    if (!this._buffer)
      return null;
    let index = this._buffer.indexOf(`
`);
    if (index === -1)
      return null;
    let line = this._buffer.toString("utf8", 0, index).replace(/\r$/, "");
    return this._buffer = this._buffer.subarray(index + 1), deserializeMessage(line);
  }
  clear() {
    this._buffer = void 0;
  }
};
function deserializeMessage(line) {
  return JSONRPCMessageSchema.parse(JSON.parse(line));
}
function serializeMessage(message) {
  return JSON.stringify(message) + `
`;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
var StdioServerTransport = class {
  constructor(_stdin = process2.stdin, _stdout = process2.stdout, options) {
    this._stdin = _stdin, this._stdout = _stdout, this._started = !1, this._ondata = (chunk) => {
      try {
        this._readBuffer.append(chunk), this.processReadBuffer();
      } catch (error2) {
        this.onerror?.(error2), this.close().catch(() => {
        });
      }
    }, this._onerror = (error2) => {
      this.onerror?.(error2);
    }, this._readBuffer = new ReadBuffer({ maxBufferSize: options?.maxBufferSize });
  }
  /**
   * Starts listening for messages on stdin.
   */
  async start() {
    if (this._started)
      throw new Error("StdioServerTransport already started! If using Server class, note that connect() calls start() automatically.");
    this._started = !0, this._stdin.on("data", this._ondata), this._stdin.on("error", this._onerror);
  }
  processReadBuffer() {
    for (; ; )
      try {
        let message = this._readBuffer.readMessage();
        if (message === null)
          break;
        this.onmessage?.(message);
      } catch (error2) {
        this.onerror?.(error2);
      }
  }
  async close() {
    this._stdin.off("data", this._ondata), this._stdin.off("error", this._onerror), this._stdin.listenerCount("data") === 0 && this._stdin.pause(), this._readBuffer.clear(), this.onclose?.();
  }
  send(message) {
    return new Promise((resolve) => {
      let json = serializeMessage(message);
      this._stdout.write(json) ? resolve() : this._stdout.once("drain", resolve);
    });
  }
};

// src/server/index.ts
import path7 from "node:path";

// src/server/dataDir.ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
var UNEXPANDED_TEMPLATE_RE = /\$\{[A-Za-z0-9_.:-]+\}/;
function isValidExpandedPath(raw) {
  if (typeof raw != "string") return !1;
  let trimmed = raw.trim();
  return !(!trimmed || UNEXPANDED_TEMPLATE_RE.test(trimmed));
}
function parseCliDataDir(argv) {
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    if (arg.startsWith("--data-dir=")) {
      let val = arg.slice(11).trim();
      if (isValidExpandedPath(val)) return val;
    } else if (arg === "--data-dir" && argv[i + 1]) {
      let val = argv[i + 1].trim();
      if (isValidExpandedPath(val)) return val;
    }
  }
  return null;
}
function deriveAppDataRootFromSidecarDir(sidecarDataDir) {
  let idx = sidecarDataDir.replace(/\\/g, "/").lastIndexOf("/sidecar_data/");
  return idx <= 0 ? null : sidecarDataDir.slice(0, idx);
}
function newestTelemetryMtimeMs(dirPath) {
  let newest = 0;
  for (let filename of ["tracker.sqlite", "events.jsonl"]) {
    let filePath = path.join(dirPath, filename);
    try {
      if (!fs.existsSync(filePath)) continue;
      let st = fs.statSync(filePath);
      st.isFile() && st.mtimeMs > newest && (newest = st.mtimeMs);
    } catch {
    }
  }
  return newest;
}
function directoryExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return !1;
  }
}
function discoverSharedPluginDataDir(opts) {
  let pluginDirNames = /* @__PURE__ */ new Set(["flight-recorder"]);
  if (opts.pluginRoot) {
    let base = path.basename(opts.pluginRoot).trim();
    base && pluginDirNames.add(base);
  }
  let pluginDataCandidates = [], sidecarExecDir = opts.env.ANTIGRAVITY_EXECUTABLE_DATA_DIR;
  if (isValidExpandedPath(sidecarExecDir)) {
    let appDataRoot = deriveAppDataRootFromSidecarDir(sidecarExecDir);
    if (appDataRoot)
      for (let name of pluginDirNames)
        pluginDataCandidates.push(path.join(appDataRoot, "plugin_data", name));
  }
  for (let name of pluginDirNames)
    pluginDataCandidates.push(
      path.join(opts.homeDir, ".gemini", "antigravity", "plugin_data", name)
    );
  let fallbackSharedDir = path.join(opts.homeDir, ".gemini", "flight-recorder-data"), allCandidates = Array.from(
    /* @__PURE__ */ new Set([...pluginDataCandidates, fallbackSharedDir])
  ), bestDir = null, bestMtime = 0;
  for (let candidate of allCandidates) {
    let mtime = newestTelemetryMtimeMs(candidate);
    mtime > bestMtime && (bestMtime = mtime, bestDir = candidate);
  }
  if (bestDir) return bestDir;
  for (let candidate of Array.from(new Set(pluginDataCandidates)))
    if (directoryExists(candidate))
      return candidate;
  return null;
}
function resolveDataDir(options = {}) {
  let argv = options.argv ?? [], env = options.env ?? process.env, homeDir = options.homeDir ?? os.homedir(), cliDir = parseCliDataDir(argv);
  if (cliDir) return cliDir;
  if (isValidExpandedPath(env.FLIGHT_RECORDER_DATA_DIR))
    return env.FLIGHT_RECORDER_DATA_DIR.trim();
  if (isValidExpandedPath(env.PLUGIN_DATA))
    return env.PLUGIN_DATA.trim();
  if (options.preferSharedPluginData) {
    let shared = discoverSharedPluginDataDir({
      env,
      pluginRoot: options.pluginRoot,
      homeDir
    });
    if (shared) return shared;
    if (isValidExpandedPath(env.ANTIGRAVITY_EXECUTABLE_DATA_DIR))
      return env.ANTIGRAVITY_EXECUTABLE_DATA_DIR.trim();
  }
  return path.join(homeDir, ".gemini", "flight-recorder-data");
}

// src/server/db.ts
import fs3 from "node:fs";
import { createRequire } from "node:module";
import path2 from "node:path";

// src/shared/pricing.ts
function isUnpriceablePlaceholderModel(model) {
  let normalized = (model || "").trim().toLowerCase();
  return !normalized || normalized === "auto" || normalized === "unknown";
}
var DEFAULT_PRICING_RULES = [
  {
    id: "gemini-2.5-pro",
    pattern: "gemini-2.5-pro*",
    label: "Gemini 2.5 Pro",
    inputPer1M: 1.25,
    cacheReadPer1M: 0.3125,
    outputPer1M: 10,
    enabled: !0,
    retired: !0
  },
  {
    id: "gemini-2.5-flash",
    pattern: "gemini-2.5-flash*",
    label: "Gemini 2.5 Flash",
    inputPer1M: 0.15,
    cacheReadPer1M: 0.0375,
    outputPer1M: 0.6,
    enabled: !0,
    retired: !0
  },
  {
    id: "gemini-2.0-flash",
    pattern: "gemini-2.0-flash*",
    label: "Gemini 2.0 Flash",
    inputPer1M: 0.1,
    cacheReadPer1M: 0.025,
    outputPer1M: 0.4,
    enabled: !0,
    retired: !0
  },
  {
    id: "claude-sonnet-4",
    pattern: "claude-sonnet-4*",
    label: "Claude Sonnet 4",
    inputPer1M: 3,
    cacheReadPer1M: 0.3,
    outputPer1M: 15,
    enabled: !0,
    retired: !0
  },
  {
    id: "claude-opus-4",
    pattern: "claude-opus-4*",
    label: "Claude Opus 4",
    inputPer1M: 15,
    cacheReadPer1M: 1.5,
    outputPer1M: 75,
    enabled: !0,
    retired: !0
  }
];
function wildcardMatch(text, rawPattern) {
  let pat = rawPattern.trim().toLowerCase().slice(0, 128).replace(/\*+/g, "*"), str = text.slice(0, 256), tIdx = 0, pIdx = 0, starIdx = -1, matchIdx = 0;
  for (; tIdx < str.length; )
    if (pIdx < pat.length && (pat[pIdx] === "?" || pat[pIdx] === str[tIdx]))
      pIdx += 1, tIdx += 1;
    else if (pIdx < pat.length && pat[pIdx] === "*")
      starIdx = pIdx, matchIdx = tIdx, pIdx += 1;
    else if (starIdx !== -1)
      pIdx = starIdx + 1, matchIdx += 1, tIdx = matchIdx;
    else
      return !1;
  for (; pIdx < pat.length && pat[pIdx] === "*"; )
    pIdx += 1;
  return pIdx === pat.length;
}
function findBestRuleMatch(normalizedModel, candidates) {
  let nonEmpty = candidates.filter((r) => r.pattern.trim().length > 0), exact = nonEmpty.find(
    (r) => r.pattern.trim().toLowerCase() === normalizedModel
  );
  if (exact)
    return exact;
  let sorted = [...nonEmpty].sort(
    (a, b) => b.pattern.replace(/\*/g, "").length - a.pattern.replace(/\*/g, "").length
  );
  for (let rule of sorted)
    if (wildcardMatch(normalizedModel, rule.pattern))
      return rule;
  return null;
}
function matchPricingRule(model, rules) {
  if (isUnpriceablePlaceholderModel(model))
    return null;
  let normalized = model.trim().toLowerCase(), enabled = rules.filter((r) => r.enabled && r.pattern.trim().length > 0);
  return findBestRuleMatch(normalized, enabled);
}
function estimateStepCost(tokens, model, rules) {
  let rule = matchPricingRule(model, rules);
  if (!rule)
    return {
      unpriced: !0,
      inputUsd: null,
      cacheReadUsd: null,
      outputUsd: null,
      totalUsd: null,
      cacheSavingsUsd: null,
      matchedRule: null
    };
  let inputUsd = tokens.inputTokens / 1e6 * rule.inputPer1M, cacheReadUsd = tokens.cacheReadTokens / 1e6 * rule.cacheReadPer1M, outputUsd = tokens.outputTokens / 1e6 * rule.outputPer1M, totalUsd = inputUsd + cacheReadUsd + outputUsd, cacheSavingsUsd = tokens.cacheReadTokens / 1e6 * Math.max(0, rule.inputPer1M - rule.cacheReadPer1M);
  return {
    unpriced: !1,
    inputUsd,
    cacheReadUsd,
    outputUsd,
    totalUsd,
    cacheSavingsUsd,
    matchedRule: rule
  };
}
function aggregateCosts(steps, rules) {
  let totalUsd = 0, totalSavings = 0, anyPriced = !1, unpricedSet = /* @__PURE__ */ new Set();
  for (let step of steps) {
    let est = estimateStepCost(step, step.model, rules);
    est.unpriced || est.totalUsd === null ? isUnpriceablePlaceholderModel(step.model) || unpricedSet.add(step.model.trim()) : (anyPriced = !0, totalUsd += est.totalUsd, totalSavings += est.cacheSavingsUsd ?? 0);
  }
  return {
    estimatedCostUsd: anyPriced ? totalUsd : null,
    cacheSavingsUsd: anyPriced ? totalSavings : null,
    unpricedModels: Array.from(unpricedSet).sort()
  };
}

// src/server/transcriptParser.ts
import fs2 from "node:fs";
import readline from "node:readline";

// src/shared/paths.ts
function safeDecodePercent(raw) {
  return raw.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
    try {
      return decodeURIComponent(run);
    } catch {
      return run.replace(/%[0-7][0-9A-Fa-f]/g, (asciiSeq) => {
        try {
          return decodeURIComponent(asciiSeq);
        } catch {
          return asciiSeq;
        }
      });
    }
  });
}
function unwrapFileUri(raw) {
  let trimmed = (raw || "").trim();
  if (!/^file:\/\//i.test(trimmed)) return trimmed;
  let rest = trimmed.slice(7);
  return /^localhost\//i.test(rest) && (rest = rest.slice(9)), rest = rest.replace(/^(\/?[a-zA-Z])%3[aA](?=[\\/]|$)/, "$1:"), /^\/[a-zA-Z]:[\\/]/.test(rest) || /^\/[a-zA-Z]:$/.test(rest) ? safeDecodePercent(rest.slice(1)) : /^[a-zA-Z]:[\\/]/.test(rest) || /^[a-zA-Z]:$/.test(rest) ? safeDecodePercent(rest) : !rest.startsWith("/") && rest.includes("/") ? "\\\\" + safeDecodePercent(rest).replace(/\//g, "\\") : safeDecodePercent(rest);
}
function isWindowsPath(p) {
  let s = (p || "").trim();
  return /^[a-zA-Z]:[\\/]/.test(s) || /^[a-zA-Z]:$/.test(s) || /^\\\\[^\\/]+[\\/][^\\/]+/.test(s);
}
function isAbsoluteLocalPath(p) {
  let s = (p || "").trim();
  return s.startsWith("/") || isWindowsPath(s);
}
function stripTrailingSeparators(p) {
  if (!p) return "";
  if (p === "/") return "/";
  if (/^[a-zA-Z]:[\\/]$/.test(p)) return p;
  let uncRoot = p.match(/^(\\\\[^\\/]+\\[^\\/]+)[\\/]*$/);
  return uncRoot ? uncRoot[1] : p.replace(/[\\/]+$/, "");
}
function sameLocalPath(a, b) {
  let ua = stripTrailingSeparators(unwrapFileUri(a)), ub = stripTrailingSeparators(unwrapFileUri(b));
  return !ua || !ub ? ua === ub : isWindowsPath(ua) || isWindowsPath(ub) ? ua.replace(/\\/g, "/").toLowerCase() === ub.replace(/\\/g, "/").toLowerCase() : ua === ub;
}
function pathBaseName(p) {
  let clean = stripTrailingSeparators((p || "").trim());
  if (!clean || clean === "/" || /^[a-zA-Z]:[\\/]?$/.test(clean)) return clean;
  let idx = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
  return idx >= 0 ? clean.slice(idx + 1) : clean;
}
function pathDirName(p) {
  let clean = stripTrailingSeparators((p || "").trim());
  if (!clean) return "";
  if (clean === "/") return "/";
  if (/^[a-zA-Z]:[\\/]?$/.test(clean)) {
    let sep = clean.includes("\\") ? "\\" : "/";
    return `${clean.slice(0, 2)}${sep}`;
  }
  if (/^\\\\[^\\/]+\\[^\\/]+$/.test(clean))
    return clean;
  let idx = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
  if (idx < 0) return ".";
  if (idx === 0) return "/";
  let prefix = clean.slice(0, idx);
  if (/^[a-zA-Z]:$/.test(prefix)) {
    let sep = clean[idx];
    return `${prefix}${sep}`;
  }
  return prefix;
}
function pathExtName(p) {
  let base = pathBaseName(p), dotIdx = base.lastIndexOf(".");
  return dotIdx <= 0 ? "" : base.slice(dotIdx);
}
function pathJoin(dir, child) {
  let sep = isWindowsPath(dir) && dir.includes("\\") ? "\\" : "/", base = dir.replace(/[\\/]+$/, ""), next = child.replace(/^[\\/]+/, "");
  return base ? `${base}${sep}${next}` : `${sep}${next}`;
}
function pathTailSegments(p, count = 2) {
  let clean = stripTrailingSeparators((p || "").trim());
  return clean ? clean.split(/[\\/]+/).filter(Boolean).slice(-count).join("/") : "";
}

// src/shared/redact.ts
function stripControlAndAnsi(input) {
  return input ? input.replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g, "").replace(/\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, "") : "";
}
function redactSecrets(input) {
  return input ? input.replace(/(https?:\/\/)([^/\s:@]+:[^/\s@]+)@/gi, "$1[REDACTED]@").replace(/\b((?:Bearer|Basic)\s+)[A-Za-z0-9._~+/=-]{12,}/gi, "$1[REDACTED]").replace(
    /\b(?:AIza[0-9A-Za-z_-]{20,}|ya29\.[0-9A-Za-z_-]{20,}|sk-(?:proj-|ant-|live-|test-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
    "[REDACTED]"
  ).replace(
    /\b([A-Za-z0-9_]{0,64}?(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE[_-]?KEY|ACCESS[_-]?KEY|AUTH[_-]?TOKEN|CLIENT[_-]?SECRET|SESSION[_-]?ID|COOKIE)[A-Za-z0-9_]{0,64})((?:["'])?\s*[=:]\s*)(?!(?:[0-9]+(?:\.[0-9]+)?|true|false|null)\b)("[^"\r\n]{0,512}"|'[^'\r\n]{0,512}'|[^\s"',;}\]]{1,512})/gi,
    (_m, k, sep, val) => val.startsWith('"') && val.endsWith('"') ? `${k}${sep}"[REDACTED]"` : `${k}${sep}[REDACTED]`
  ) : "";
}
function sanitizePreviewText(input, maxChars) {
  if (!input) return "";
  let bounded = maxChars !== void 0 && input.length > Math.max(4096, maxChars * 8) ? input.slice(0, Math.max(4096, maxChars * 8)) : input, cleaned = redactSecrets(stripControlAndAnsi(bounded)).replace(/\s+/g, " ").trim();
  return maxChars !== void 0 && maxChars > 3 && cleaned.length > maxChars ? cleaned.slice(0, maxChars - 3) + "..." : cleaned;
}

// src/server/transcriptParser.ts
function isIdleWaitTool(toolName) {
  return toolName === "swarm_wait";
}
function isSwarmBoardTool(toolName) {
  return toolName === "read_board" || toolName === "post_board" || toolName === "swarm_post" || toolName === "swarm_wait";
}
function extractUnavailableModelError(errorText) {
  if (!errorText || typeof errorText != "string") return null;
  let bounded = errorText.slice(0, 600), patterns = [
    /(?:no capacity available|not found|not available|no longer available|deprecated|retired|unsupported|unavailable)\s+(?:for\s+)?model\s+[`"']?([a-z0-9][a-z0-9._-]{2,80})[`"']?/i,
    /models\/([a-z0-9][a-z0-9._-]{2,80})\s+(?:is\s+)?(?:not found|deprecated|retired|no longer available|not supported|unavailable)/i,
    /model\s+[`"']?([a-z0-9][a-z0-9._-]{2,80})[`"']?\s+(?:is\s+)?(?:not found|does not exist|has been deprecated|is deprecated|retired|no longer available|is unavailable|not supported)/i
  ];
  for (let re of patterns) {
    let match = bounded.match(re);
    if (match && match[1]) {
      let model = match[1].trim().toLowerCase();
      if (!model || model === "unknown" || model === "auto") continue;
      return {
        model,
        reason: sanitizePreviewText(bounded, 120)
      };
    }
  }
  return null;
}
function parseTimestampMs(raw) {
  if (!raw || typeof raw != "string") return null;
  let trimmed = raw.trim();
  if (!trimmed) return null;
  let ms = Date.parse(trimmed);
  return Number.isFinite(ms) ? ms : null;
}
function unwrapStringValue(val) {
  if (typeof val != "string") return val;
  let trimmed = val.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]"))
    try {
      return JSON.parse(trimmed);
    } catch {
      return val;
    }
  return val;
}
function normalizeArgs(rawArgs) {
  let unwrapped = unwrapStringValue(rawArgs);
  if (!unwrapped || typeof unwrapped != "object" || Array.isArray(unwrapped))
    return unwrapped != null ? { value: unwrapped } : {};
  let out = {};
  for (let [k, v] of Object.entries(unwrapped))
    out[k] = unwrapStringValue(v);
  return out;
}
function normalizeModelSelectionLabel(rawLabel) {
  let cleaned = rawLabel.trim().replace(/[.,;:]+$/, "").trim();
  if (!cleaned || /^(?:none|auto|default|unknown)$/i.test(cleaned))
    return null;
  let lower = cleaned.toLowerCase();
  return lower.startsWith("gemini") ? lower.replace(/[^a-z0-9.]+/g, "-").replace(/(?<!\d)\.|\.(?!\d)/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || null : lower.replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || null;
}
function extractModelSelectionFromUserInput(content) {
  if (!content) return { found: !1, model: null };
  let blockRe = /<USER_SETTINGS_CHANGE>([\s\S]*?)<\/USER_SETTINGS_CHANGE>/gi, settingRe = /changed setting `Model Selection` from [^\r\n`]+? to ([^\r\n<]+?)(?=\.(?:\s|$|<)|\r?\n|<|$)/gi, found = !1, model = null, blockMatch;
  for (; (blockMatch = blockRe.exec(content)) !== null; ) {
    let block = blockMatch[1];
    settingRe.lastIndex = 0;
    let match;
    for (; (match = settingRe.exec(block)) !== null; )
      found = !0, model = normalizeModelSelectionLabel(match[1]);
  }
  return { found, model };
}
function extractUserRequest(content) {
  let text = content, reqMatch = content.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/);
  reqMatch ? text = reqMatch[1].trim() : text = content.trim();
  let slashCommand = null, slashMatch = text.match(/^(\/[a-zA-Z][a-zA-Z0-9_-]*)(?:\s|$)/);
  if (slashMatch)
    slashCommand = slashMatch[1];
  else {
    let metaSlash = content.match(/(\/[a-zA-Z][a-zA-Z0-9_-]*)\s+is a \[Slash Command\]/);
    metaSlash && (slashCommand = metaSlash[1]);
  }
  return { promptText: text, slashCommand };
}
function makePreview(text, maxLen) {
  return sanitizePreviewText(text, maxLen);
}
function extractGenericHeaders(content) {
  let lines = content.split(/\r?\n/), createdAtMs = null, completedAtMs = null, bodyStartLine = 0, limit = Math.min(lines.length, 8);
  for (let i = 0; i < limit; i++) {
    let line = lines[i].trim();
    if (line.startsWith("Created At:")) {
      let parsed = parseTimestampMs(line.slice(11));
      parsed !== null && createdAtMs === null && (createdAtMs = parsed), bodyStartLine = i + 1;
      continue;
    }
    if (line.startsWith("Completed At:")) {
      let parsed = parseTimestampMs(line.slice(13));
      parsed !== null && completedAtMs === null && (completedAtMs = parsed), bodyStartLine = i + 1;
      continue;
    }
    if (line === "") {
      bodyStartLine === i && (bodyStartLine = i + 1);
      continue;
    }
    break;
  }
  let body = lines.slice(bodyStartLine).join(`
`);
  return { createdAtMs, completedAtMs, body };
}
function detectToolError(status, body) {
  return status === "ERROR" ? {
    isError: !0,
    errorPreview: makePreview(body || "Step status ERROR", 180)
  } : body.match(/Command exited with code ([1-9]\d*)/) ? {
    isError: !0,
    errorPreview: makePreview(body, 180)
  } : body.startsWith("Encountered error in tool execution") || /"isError"\s*:\s*true/.test(body) || /isError:\s*true/.test(body) ? {
    isError: !0,
    errorPreview: makePreview(body, 180)
  } : { isError: !1, errorPreview: null };
}
var skillFrontmatterCache = /* @__PURE__ */ new Map();
function extractYamlName(text) {
  let fmMatch = text.match(/^(?:\d+:\s*)?---\s*\r?\n([\s\S]*?)\r?\n(?:\d+:\s*)?---/), nameMatch = (fmMatch ? fmMatch[1] : text.slice(0, 600)).match(/(?:^|\n)\s*(?:\d+:\s*)?name:\s*["']?([a-zA-Z0-9_.-]+)["']?/);
  return nameMatch ? nameMatch[1].trim() : null;
}
function lookupCanonicalSkillName(skillRootDir) {
  if (skillFrontmatterCache.has(skillRootDir))
    return skillFrontmatterCache.get(skillRootDir) ?? null;
  let skillMdPath = `${skillRootDir}/SKILL.md`, resolved = null;
  try {
    if (fs2.existsSync(skillMdPath) && fs2.statSync(skillMdPath).isFile()) {
      let content = fs2.readFileSync(skillMdPath, "utf8");
      resolved = extractYamlName(content);
    }
  } catch {
    resolved = null;
  }
  return skillFrontmatterCache.set(skillRootDir, resolved), resolved;
}
function extractSkillMetadata(targetPath, body) {
  let norm = targetPath.replace(/\\/g, "/"), skillPlugin = null, pluginMatch = norm.match(/\/(?:builtin\/)?plugins\/([^/]+)\//);
  pluginMatch ? skillPlugin = pluginMatch[1] : norm.includes("/builtin/skills/") && (skillPlugin = "builtin");
  let skillDirMatch = norm.match(/^(.*\/skills\/([^/]+))\//), skillName = skillDirMatch ? skillDirMatch[2] : null;
  if (/\/SKILL\.md$/i.test(norm)) {
    let parsedName = extractYamlName(body);
    parsedName && (skillName = parsedName, skillDirMatch && skillFrontmatterCache.set(skillDirMatch[1], parsedName));
  } else if (skillDirMatch) {
    let canonical = lookupCanonicalSkillName(skillDirMatch[1]);
    canonical && (skillName = canonical);
  }
  return { skillName, skillPlugin };
}
function extractPathFromArgs(args) {
  let candidates = [
    args.Path,
    args.TargetFile,
    args.AbsolutePath,
    args.ScriptPath,
    args.path,
    args.file_path,
    args.uri,
    args.Cwd
  ];
  for (let c of candidates)
    if (typeof c == "string" && c.trim()) {
      let unwrapped = unwrapFileUri(c.trim());
      if (isAbsoluteLocalPath(unwrapped))
        return unwrapped;
    }
  return null;
}
function extractCommandPathHints(cmd) {
  let posixMatches = cmd.match(/\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+/g) ?? [], winMatches = cmd.match(/[a-zA-Z]:[\\/][a-zA-Z0-9_.\-\\/]+/g) ?? [], combined = [...posixMatches, ...winMatches];
  return combined.length > 0 ? Array.from(new Set(combined)) : [];
}
var EXPLICIT_CONV_UUID_RE = /(?:conversationId|conversation_id|conversation:\/\/)["'\s:=]+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi, BARE_UUID_RE = /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
function extractSwarmWorkerRoleFromLine(line, baseName, index, isMulti) {
  let ignored = /* @__PURE__ */ new Set(["added", "worker", "workers", "with", "id", "conv", "conversation"]), beforeConvMatch = line.match(
    /\b([a-z0-9][a-z0-9_-]{0,23})\s*(?:[:(\-]|->)?\s*(?:conversationId|conversation_id|conversation:\/\/)/i
  );
  if (beforeConvMatch && !ignored.has(beforeConvMatch[1].toLowerCase()))
    return beforeConvMatch[1];
  let workerNameMatch = line.match(/\bworker\s+([a-z0-9][a-z0-9_-]{0,23})\b/i);
  return workerNameMatch && !ignored.has(workerNameMatch[1].toLowerCase()) ? workerNameMatch[1] : baseName ? isMulti ? `${baseName}-${index + 1}` : baseName : null;
}
function extractChildConversationLinks(toolName, args, body) {
  if (!body) return [];
  if (toolName === "invoke_subagent") {
    let role = typeof args.Role == "string" && args.Role.trim() ? args.Role.trim() : null, typeName = typeof args.TypeName == "string" && args.TypeName.trim() ? args.TypeName.trim() : "subagent";
    EXPLICIT_CONV_UUID_RE.lastIndex = 0;
    let explicitMatch = EXPLICIT_CONV_UUID_RE.exec(body);
    if (explicitMatch?.[1])
      return [{ conversationId: explicitMatch[1], role, typeName }];
    let bareMatch = body.match(BARE_UUID_RE);
    return bareMatch?.[1] ? [{ conversationId: bareMatch[1], role, typeName }] : [];
  }
  if (toolName === "swarm") {
    let action = typeof args.action == "string" ? args.action.trim().toLowerCase() : "";
    if (action !== "" && action !== "add")
      return [];
    let baseName = typeof args.name == "string" && args.name.trim() ? args.name.trim() : "", nArg = typeof args.n == "number" ? args.n : 1, tasksArg = Array.isArray(args.tasks) ? args.tasks : [], seen = /* @__PURE__ */ new Set(), rawMatches = [];
    for (let line of body.split(/\r?\n/)) {
      EXPLICIT_CONV_UUID_RE.lastIndex = 0;
      let m;
      for (; (m = EXPLICIT_CONV_UUID_RE.exec(line)) !== null; ) {
        let uuid2 = m[1];
        !uuid2 || seen.has(uuid2) || (seen.add(uuid2), rawMatches.push({ uuid: uuid2, line }));
      }
    }
    let isMulti = rawMatches.length > 1 || nArg > 1 || tasksArg.length > 0;
    return rawMatches.map((entry, idx) => ({
      conversationId: entry.uuid,
      role: extractSwarmWorkerRoleFromLine(entry.line, baseName, idx, isMulti),
      typeName: "swarm"
    }));
  }
  if (toolName === "run_workflow") {
    let seen = /* @__PURE__ */ new Set(), links = [];
    EXPLICIT_CONV_UUID_RE.lastIndex = 0;
    let m;
    for (; (m = EXPLICIT_CONV_UUID_RE.exec(body)) !== null; ) {
      let uuid2 = m[1];
      !uuid2 || seen.has(uuid2) || (seen.add(uuid2), links.push({ conversationId: uuid2, role: null, typeName: "run_workflow" }));
    }
    return links;
  }
  return [];
}
function classifyTool(toolName, args, body) {
  let targetPath = extractPathFromArgs(args), category = "other", mcpServer = null, skillName = null, skillPlugin = null, childConversationId = null, childConversationIds = [], childLinks = [], commandPathHints = [], normTarget = targetPath ? targetPath.replace(/\\/g, "/") : null;
  if (targetPath && normTarget && (toolName === "read_file" || toolName === "view_file") && (/\/SKILL\.md$/i.test(normTarget) || /\/skills\/[^/]+\//i.test(normTarget))) {
    let skillMeta = extractSkillMetadata(targetPath, body);
    skillMeta.skillName && (category = "skill", skillName = skillMeta.skillName, skillPlugin = skillMeta.skillPlugin);
  }
  let swarmAction = toolName === "swarm" && typeof args.action == "string" ? args.action.trim().toLowerCase() : "", isSwarmSpawn = toolName === "swarm" && (swarmAction === "add" || swarmAction === "");
  if (category !== "skill")
    if (toolName === "call_mcp_tool")
      category = "mcp", mcpServer = typeof args.ServerName == "string" ? args.ServerName : "mcp";
    else if (toolName.startsWith("mcp_"))
      category = "mcp", mcpServer = toolName.slice(4).split("_")[0] || "mcp";
    else if (toolName === "invoke_subagent" || isSwarmSpawn || toolName === "run_workflow")
      category = "subagent", childLinks = extractChildConversationLinks(toolName, args, body), childConversationIds = childLinks.map((l) => l.conversationId), childConversationId = childConversationIds[0] ?? null;
    else if (toolName === "swarm")
      category = "other";
    else if (toolName === "run_command") {
      category = "command";
      let cmd = typeof args.CommandLine == "string" ? args.CommandLine : "";
      commandPathHints = extractCommandPathHints(cmd);
    } else toolName === "read_file" || toolName === "view_file" || toolName === "list_dir" || toolName === "read_resource" ? category = "file_read" : toolName === "edit_file" || toolName === "write_file" || toolName === "replace_file_content" || toolName === "multi_replace_file_content" ? category = "file_write" : toolName === "search_web" || toolName === "grep_search" || toolName === "find_by_name" ? category = "search" : toolName.startsWith("browser_") && (category = "browser");
  let argsPreview = "";
  if (toolName === "run_command" && typeof args.CommandLine == "string")
    argsPreview = makePreview(args.CommandLine, 160);
  else if (toolName === "invoke_subagent") {
    let typeName = typeof args.TypeName == "string" ? args.TypeName : "subagent", role = typeof args.Role == "string" ? args.Role : "";
    argsPreview = `Type: ${typeName}${role ? ` | Role: ${role}` : ""}`;
  } else if (toolName === "swarm") {
    let name = typeof args.name == "string" && args.name.trim() ? args.name.trim() : "";
    if (isSwarmSpawn) {
      let nCount = typeof args.n == "number" && args.n > 1 ? args.n : 0, tasksCount = Array.isArray(args.tasks) && args.tasks.length > 0 ? args.tasks.length : 0, multiCount = Math.max(nCount, tasksCount, childLinks.length);
      multiCount > 1 || tasksCount > 0 ? argsPreview = `Type: swarm | Role: ${name || "worker"} (${multiCount || 1} workers)` : argsPreview = `Type: swarm${name ? ` | Role: ${name}` : ""}`;
    } else {
      let parts = [`Action: ${swarmAction}`];
      name && parts.push(`Worker: ${name}`), typeof args.model == "string" && args.model.trim() && parts.push(`Model: ${args.model.trim()}`), typeof args.title == "string" && args.title.trim() && parts.push(`Title: ${makePreview(args.title.trim(), 60)}`), argsPreview = parts.join(" | ");
    }
  } else toolName === "call_mcp_tool" ? argsPreview = `${String(args.ServerName ?? "")}/${String(args.ToolName ?? "")}` : targetPath ? argsPreview = targetPath : typeof args.query == "string" ? argsPreview = makePreview(args.query, 140) : argsPreview = makePreview(JSON.stringify(args), 140);
  return {
    category,
    mcpServer,
    skillName,
    skillPlugin,
    targetPath,
    childConversationId,
    childConversationIds,
    childLinks,
    argsPreview,
    commandPathHints
  };
}
async function parseTranscriptFile(transcriptPath, conversationId) {
  let turns = [], plannerSteps = [], toolCalls = [], candidatePaths = [], modelsSet = /* @__PURE__ */ new Set(), slashSet = /* @__PURE__ */ new Set(), pendingQueue = [], currentTurnIndex = -1, minTs = Number.POSITIVE_INFINITY, maxTs = 0, hasTokenTelemetry = !1, firstSystemMessage = null, activeSelectedModel = null, hasCoordinatorSignal = !1, explicitSwarmWorkerTag = !1, hasBoardTools = !1, swarmTitle = null, unavailableByModel = /* @__PURE__ */ new Map(), recordSwarmToolSignals = (toolName, args, classified) => {
    toolName === "swarm" && (hasCoordinatorSignal = !0, (typeof args.action == "string" ? args.action.trim().toLowerCase() : "") === "title" && typeof args.title == "string" && args.title.trim() && (swarmTitle = makePreview(args.title.trim(), 80))), isSwarmBoardTool(toolName) && (hasBoardTools = !0), classified.skillName === "swarm_pane" ? hasCoordinatorSignal = !0 : classified.skillName === "swarm_monitor" && (explicitSwarmWorkerTag = !0), classified.targetPath && /\/\.system_generated\/swarm\/plan\.json$/i.test(
      classified.targetPath.replace(/\\/g, "/")
    ) && (hasCoordinatorSignal = !0);
  }, flushPendingTools = () => {
    for (; pendingQueue.length > 0; ) {
      let pending = pendingQueue.shift(), classified = classifyTool(pending.toolName, pending.args, "");
      recordSwarmToolSignals(pending.toolName, pending.args, classified), classified.targetPath && candidatePaths.push(classified.targetPath);
      for (let hint of classified.commandPathHints) candidatePaths.push(hint);
      toolCalls.push({
        stepIndex: pending.plannerStepIndex,
        plannerStepIndex: pending.plannerStepIndex,
        turnIndex: pending.turnIndex,
        toolCallId: pending.toolCallId,
        toolName: pending.toolName,
        category: classified.category,
        mcpServer: classified.mcpServer,
        skillName: classified.skillName,
        skillPlugin: classified.skillPlugin,
        targetPath: classified.targetPath,
        childConversationId: classified.childConversationId,
        childConversationIds: classified.childConversationIds,
        childLinks: classified.childLinks,
        startedAtMs: pending.plannerCreatedAtMs,
        completedAtMs: null,
        durationMs: 0,
        argsPreview: classified.argsPreview,
        commandPathHints: classified.commandPathHints,
        resultBytes: 0,
        estResultTokens: 0,
        isError: !1,
        errorPreview: null
      });
    }
  }, stream = fs2.createReadStream(transcriptPath, { encoding: "utf8" }), rl = readline.createInterface({ input: stream, crlfDelay: 1 / 0 });
  for await (let line of rl) {
    let trimmed = line.trim();
    if (!trimmed) continue;
    let raw;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      continue;
    }
    let stepIndex = typeof raw.step_index == "number" ? raw.step_index : 0, stepCreatedAtMs = parseTimestampMs(raw.created_at) ?? 0;
    if (stepCreatedAtMs > 0 && (stepCreatedAtMs < minTs && (minTs = stepCreatedAtMs), stepCreatedAtMs > maxTs && (maxTs = stepCreatedAtMs)), raw.type === "SYSTEM_MESSAGE") {
      typeof raw.content == "string" && (firstSystemMessage === null && raw.content.trim() && (firstSystemMessage = raw.content), (/<swarm_worker>/i.test(raw.content) || /\bswarm_monitor\b/i.test(raw.content)) && (explicitSwarmWorkerTag = !0));
      continue;
    }
    if (raw.type === "ERROR_MESSAGE") {
      let errText = typeof raw.error == "string" ? raw.error : typeof raw.content == "string" ? raw.content : "", extracted = extractUnavailableModelError(errText);
      if (extracted) {
        let existing = unavailableByModel.get(extracted.model);
        (!existing || stepCreatedAtMs >= existing.tsMs) && unavailableByModel.set(extracted.model, {
          model: extracted.model,
          tsMs: stepCreatedAtMs,
          reason: extracted.reason
        });
      }
      continue;
    }
    if (raw.type === "USER_INPUT") {
      flushPendingTools(), currentTurnIndex += 1;
      let content = typeof raw.content == "string" ? raw.content : "", sel = extractModelSelectionFromUserInput(content);
      sel.found && (activeSelectedModel = sel.model);
      let { promptText, slashCommand } = extractUserRequest(content);
      slashCommand && (slashSet.add(slashCommand), slashCommand.toLowerCase() === "/swarm" && (hasCoordinatorSignal = !0)), turns.push({
        turnIndex: currentTurnIndex,
        stepIndex,
        createdAtMs: stepCreatedAtMs,
        promptText,
        promptPreview: makePreview(promptText || "(empty prompt)", 140),
        promptBytes: Buffer.byteLength(promptText, "utf8"),
        slashCommand
      });
      continue;
    }
    if (raw.type === "PLANNER_RESPONSE") {
      flushPendingTools(), currentTurnIndex < 0 && (currentTurnIndex = 0, turns.push({
        turnIndex: 0,
        stepIndex: 0,
        createdAtMs: stepCreatedAtMs,
        promptText: "(implicit start)",
        promptPreview: "(implicit start)",
        promptBytes: 0,
        slashCommand: null
      }));
      let rawModel = typeof raw.model == "string" && raw.model.trim() ? raw.model.trim() : null, model = rawModel ?? activeSelectedModel ?? "unknown", modelSource = rawModel ? "transcript" : activeSelectedModel ? "settings_change" : "unknown";
      model !== "unknown" && modelsSet.add(model), (Object.prototype.hasOwnProperty.call(raw, "input_tokens") || Object.prototype.hasOwnProperty.call(raw, "cache_read_tokens") || Object.prototype.hasOwnProperty.call(raw, "output_tokens")) && (hasTokenTelemetry = !0);
      let inputTokens = Number(raw.input_tokens ?? 0), cacheReadTokens = Number(raw.cache_read_tokens ?? 0), outputTokens = Number(raw.output_tokens ?? 0), totalContextTokens = inputTokens + cacheReadTokens, calls = Array.isArray(raw.tool_calls) ? raw.tool_calls : [];
      plannerSteps.push({
        stepIndex,
        turnIndex: currentTurnIndex,
        model,
        modelSource,
        createdAtMs: stepCreatedAtMs,
        thinkingChars: typeof raw.thinking == "string" ? raw.thinking.length : 0,
        contentChars: typeof raw.content == "string" ? raw.content.length : 0,
        inputTokens,
        cacheReadTokens,
        outputTokens,
        totalContextTokens,
        toolCallCount: calls.length,
        status: typeof raw.status == "string" ? raw.status : "DONE"
      });
      for (let tc of calls) {
        let toolName = typeof tc?.name == "string" && tc.name.trim() ? tc.name.trim() : "unknown_tool";
        pendingQueue.push({
          plannerStepIndex: stepIndex,
          turnIndex: currentTurnIndex,
          plannerCreatedAtMs: stepCreatedAtMs,
          toolCallId: typeof tc?.id == "string" ? tc.id : null,
          toolName,
          args: normalizeArgs(tc?.args)
        });
      }
      continue;
    }
    if (raw.type === "GENERIC" && raw.source === "MODEL" && pendingQueue.length > 0) {
      let pending = pendingQueue.shift(), content = typeof raw.content == "string" ? raw.content : "", { createdAtMs, completedAtMs, body } = extractGenericHeaders(content), startedAtMs2 = createdAtMs ?? (stepCreatedAtMs || pending.plannerCreatedAtMs), endMs = completedAtMs ?? startedAtMs2, durationMs = completedAtMs !== null && startedAtMs2 !== null ? Math.max(0, completedAtMs - startedAtMs2) : 0;
      endMs > maxTs && (maxTs = endMs), startedAtMs2 > 0 && startedAtMs2 < minTs && (minTs = startedAtMs2);
      let resultBytes = Buffer.byteLength(body, "utf8"), estResultTokens = Math.ceil(resultBytes / 4), { isError, errorPreview } = detectToolError(raw.status, body), classified = classifyTool(pending.toolName, pending.args, body);
      recordSwarmToolSignals(pending.toolName, pending.args, classified), classified.targetPath && candidatePaths.push(classified.targetPath);
      for (let hint of classified.commandPathHints) candidatePaths.push(hint);
      toolCalls.push({
        stepIndex,
        plannerStepIndex: pending.plannerStepIndex,
        turnIndex: pending.turnIndex,
        toolCallId: pending.toolCallId,
        toolName: pending.toolName,
        category: classified.category,
        mcpServer: classified.mcpServer,
        skillName: classified.skillName,
        skillPlugin: classified.skillPlugin,
        targetPath: classified.targetPath,
        childConversationId: classified.childConversationId,
        childConversationIds: classified.childConversationIds,
        childLinks: classified.childLinks,
        startedAtMs: startedAtMs2,
        completedAtMs: endMs,
        durationMs,
        argsPreview: classified.argsPreview,
        commandPathHints: classified.commandPathHints,
        resultBytes,
        estResultTokens,
        isError,
        errorPreview
      });
    }
  }
  flushPendingTools();
  let firstPrompt = turns.find((t) => t.promptText && t.promptText !== "(implicit start)"), hasExplicitUserPrompt = !!firstPrompt, title = conversationId.slice(0, 8);
  if (firstPrompt) {
    let cleaned = firstPrompt.promptText.replace(/^\/[a-zA-Z0-9_-]+\s*/, "").trim();
    title = makePreview(cleaned || firstPrompt.promptText, 76);
  }
  let systemTaskPreview = null;
  if (!hasExplicitUserPrompt && firstSystemMessage) {
    let cleanedSys = firstSystemMessage.replace(/The following is a <SYSTEM_MESSAGE>[\s\S]*?pay attention to\./gi, " ").replace(/<\/?[A-Z_]+>/g, " ").replace(/\[Notice\][\s\S]*$/gi, " ").replace(/\s+/g, " ").trim();
    cleanedSys.length >= 4 && (systemTaskPreview = makePreview(cleanedSys, 60));
  }
  let startedAtMs = Number.isFinite(minTs) ? minTs : 0, endedAtMs = maxTs >= startedAtMs ? maxTs : startedAtMs, detectedSwarmRole = explicitSwarmWorkerTag ? "worker" : hasCoordinatorSignal ? "coordinator" : hasBoardTools ? "worker" : null;
  return {
    conversationId,
    transcriptPath,
    title,
    hasExplicitUserPrompt,
    systemTaskPreview,
    hasTokenTelemetry,
    startedAtMs,
    endedAtMs,
    models: Array.from(modelsSet),
    slashCommands: Array.from(slashSet),
    turns,
    plannerSteps,
    toolCalls,
    candidatePaths,
    modelUnavailableErrors: Array.from(unavailableByModel.values()),
    detectedSwarmRole,
    swarmTitle
  };
}

// src/server/db.ts
function loadDatabaseSync() {
  let req = createRequire(import.meta.url), origEmit = process.emitWarning;
  process.emitWarning = ((warning, ...args) => {
    let msg = typeof warning == "string" ? warning : warning?.message ?? "";
    if (!((typeof args[0] == "string" ? args[0] : args[0]?.type ?? warning?.name ?? "") === "ExperimentalWarning" && /sqlite/i.test(msg)))
      return origEmit.call(process, warning, ...args);
  });
  try {
    return req("node:sqlite").DatabaseSync;
  } finally {
    process.emitWarning = origEmit;
  }
}
var DatabaseSync = loadDatabaseSync(), TrackerDatabase = class {
  db;
  dbPath;
  constructor(dataDir) {
    if (fs3.mkdirSync(dataDir, { recursive: !0, mode: 448 }), this.dbPath = path2.join(dataDir, "tracker.sqlite"), this.db = new DatabaseSync(this.dbPath), this.db.exec("PRAGMA journal_mode = WAL;"), this.db.exec("PRAGMA foreign_keys = ON;"), this.db.exec("PRAGMA busy_timeout = 5000;"), process.platform !== "win32")
      for (let [target, mode] of [
        [dataDir, 448],
        [this.dbPath, 384],
        [`${this.dbPath}-wal`, 384],
        [`${this.dbPath}-shm`, 384]
      ])
        try {
          fs3.existsSync(target) && fs3.chmodSync(target, mode);
        } catch {
        }
    this.migrate(), this.seedDefaultPricing();
  }
  close() {
    this.db.close();
  }
  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS indexed_files (
        path TEXT PRIMARY KEY,
        file_size INTEGER NOT NULL,
        mtime_ms REAL NOT NULL,
        last_offset INTEGER NOT NULL DEFAULT 0,
        updated_at_ms INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        surface TEXT NOT NULL,
        transcript_path TEXT NOT NULL,
        project_path TEXT NOT NULL,
        project_source TEXT NOT NULL,
        parent_conversation_id TEXT,
        subagent_role TEXT,
        subagent_type TEXT,
        swarm_role TEXT,
        swarm_title TEXT,
        swarm_tasks_json TEXT NOT NULL DEFAULT '{}',
        started_at_ms INTEGER NOT NULL,
        ended_at_ms INTEGER NOT NULL,
        termination_reason TEXT,
        models_json TEXT NOT NULL,
        slash_commands_json TEXT NOT NULL,
        skills_used_json TEXT NOT NULL,
        has_live_hooks INTEGER NOT NULL DEFAULT 0,
        has_token_telemetry INTEGER NOT NULL DEFAULT 1,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        cache_read_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        peak_context_tokens INTEGER NOT NULL DEFAULT 0,
        active_ms INTEGER NOT NULL DEFAULT 0,
        model_ms INTEGER NOT NULL DEFAULT 0,
        tool_wall_ms INTEGER NOT NULL DEFAULT 0,
        tool_sum_ms INTEGER NOT NULL DEFAULT 0,
        user_idle_ms INTEGER NOT NULL DEFAULT 0,
        wall_clock_ms INTEGER NOT NULL DEFAULT 0,
        error_count INTEGER NOT NULL DEFAULT 0,
        diagnostics_json TEXT NOT NULL DEFAULT '[]',
        files_touched_json TEXT NOT NULL DEFAULT '[]',
        indexed_at_ms INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_path);
      CREATE INDEX IF NOT EXISTS idx_conversations_parent ON conversations(parent_conversation_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_ended ON conversations(ended_at_ms DESC);

      CREATE TABLE IF NOT EXISTS turns (
        conversation_id TEXT NOT NULL,
        turn_index INTEGER NOT NULL,
        prompt_preview TEXT NOT NULL,
        slash_command TEXT,
        started_at_ms INTEGER NOT NULL,
        ended_at_ms INTEGER NOT NULL,
        active_ms INTEGER NOT NULL,
        model_ms INTEGER NOT NULL,
        tool_wall_ms INTEGER NOT NULL,
        user_idle_before_ms INTEGER NOT NULL,
        input_tokens INTEGER NOT NULL,
        cache_read_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        PRIMARY KEY (conversation_id, turn_index),
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS planner_steps (
        conversation_id TEXT NOT NULL,
        seq_index INTEGER NOT NULL,
        step_index INTEGER NOT NULL,
        turn_index INTEGER NOT NULL,
        model TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL,
        completed_at_ms INTEGER,
        model_duration_ms INTEGER NOT NULL,
        input_tokens INTEGER NOT NULL,
        cache_read_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        total_context_tokens INTEGER NOT NULL,
        is_cache_miss INTEGER NOT NULL DEFAULT 0,
        cache_miss_cause TEXT,
        thinking_chars INTEGER NOT NULL DEFAULT 0,
        content_chars INTEGER NOT NULL DEFAULT 0,
        tool_call_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        attributed_summary TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (conversation_id, seq_index),
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tool_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        step_index INTEGER NOT NULL,
        planner_step_index INTEGER NOT NULL,
        turn_index INTEGER NOT NULL,
        tool_call_id TEXT,
        tool_name TEXT NOT NULL,
        category TEXT NOT NULL,
        mcp_server TEXT,
        skill_name TEXT,
        skill_plugin TEXT,
        target_path TEXT,
        child_conversation_id TEXT,
        child_conversation_ids_json TEXT NOT NULL DEFAULT '[]',
        started_at_ms INTEGER,
        completed_at_ms INTEGER,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        args_preview TEXT NOT NULL DEFAULT '',
        result_bytes INTEGER NOT NULL DEFAULT 0,
        est_result_tokens INTEGER NOT NULL DEFAULT 0,
        attributed_input_tokens INTEGER NOT NULL DEFAULT 0,
        compounded_cache_tokens INTEGER NOT NULL DEFAULT 0,
        is_error INTEGER NOT NULL DEFAULT 0,
        error_preview TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tool_calls_conv ON tool_calls(conversation_id, step_index);
      CREATE INDEX IF NOT EXISTS idx_tool_calls_child ON tool_calls(child_conversation_id);

      CREATE TABLE IF NOT EXISTS hook_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts_ms INTEGER NOT NULL,
        hook_event_name TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        workspace_paths_json TEXT NOT NULL DEFAULT '[]',
        transcript_path TEXT,
        model_name TEXT,
        cwd TEXT,
        step_idx INTEGER,
        invocation_num INTEGER,
        termination_reason TEXT,
        error TEXT,
        last_user_input TEXT,
        tool_call_id TEXT,
        tool_name TEXT,
        arg_bytes INTEGER,
        dedup_key TEXT UNIQUE
      );

      CREATE INDEX IF NOT EXISTS idx_hook_events_conv ON hook_events(conversation_id, ts_ms);

      CREATE TABLE IF NOT EXISTS project_overrides (
        conversation_id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        updated_at_ms INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS model_pricing (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        label TEXT NOT NULL,
        input_per_1m REAL NOT NULL,
        cache_read_per_1m REAL NOT NULL,
        output_per_1m REAL NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        retired INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS model_error_signals (
        conversation_id TEXT NOT NULL,
        model TEXT NOT NULL,
        error_ts_ms INTEGER NOT NULL,
        reason TEXT NOT NULL,
        PRIMARY KEY (conversation_id, model),
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      );
    `), this.db.prepare("PRAGMA table_info(planner_steps)").all().some((c) => c.name === "seq_index") || this.db.exec(`
        DROP TABLE IF EXISTS planner_steps;
        CREATE TABLE planner_steps (
          conversation_id TEXT NOT NULL,
          seq_index INTEGER NOT NULL,
          step_index INTEGER NOT NULL,
          turn_index INTEGER NOT NULL,
          model TEXT NOT NULL,
          created_at_ms INTEGER NOT NULL,
          completed_at_ms INTEGER,
          model_duration_ms INTEGER NOT NULL,
          input_tokens INTEGER NOT NULL,
          cache_read_tokens INTEGER NOT NULL,
          output_tokens INTEGER NOT NULL,
          total_context_tokens INTEGER NOT NULL,
          is_cache_miss INTEGER NOT NULL DEFAULT 0,
          cache_miss_cause TEXT,
          thinking_chars INTEGER NOT NULL DEFAULT 0,
          content_chars INTEGER NOT NULL DEFAULT 0,
          tool_call_count INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL,
          attributed_summary TEXT NOT NULL DEFAULT '',
          PRIMARY KEY (conversation_id, seq_index),
          FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
        );
        DELETE FROM indexed_files WHERE path LIKE '%transcript%';
      `);
    let convCols = this.db.prepare("PRAGMA table_info(conversations)").all();
    convCols.some((c) => c.name === "has_token_telemetry") || this.db.exec(
      "ALTER TABLE conversations ADD COLUMN has_token_telemetry INTEGER NOT NULL DEFAULT 1;"
    ), convCols.some((c) => c.name === "swarm_role") || this.db.exec("ALTER TABLE conversations ADD COLUMN swarm_role TEXT;"), convCols.some((c) => c.name === "swarm_title") || this.db.exec("ALTER TABLE conversations ADD COLUMN swarm_title TEXT;"), convCols.some((c) => c.name === "swarm_tasks_json") || this.db.exec(
      "ALTER TABLE conversations ADD COLUMN swarm_tasks_json TEXT NOT NULL DEFAULT '{}';"
    ), this.db.prepare("PRAGMA table_info(tool_calls)").all().some((c) => c.name === "child_conversation_ids_json") || this.db.exec(
      "ALTER TABLE tool_calls ADD COLUMN child_conversation_ids_json TEXT NOT NULL DEFAULT '[]';"
    ), this.db.prepare("PRAGMA table_info(model_pricing)").all().some((c) => c.name === "retired") || this.db.exec("ALTER TABLE model_pricing ADD COLUMN retired INTEGER;");
    let versionRow = this.db.prepare("PRAGMA user_version").get();
    Number(versionRow?.user_version ?? 0) < 9 && this.db.exec(`
        DELETE FROM indexed_files WHERE path LIKE '%transcript%';
        PRAGMA user_version = 9;
      `);
  }
  seedDefaultPricing() {
    let row = this.db.prepare("SELECT COUNT(*) AS cnt FROM model_pricing").get();
    if (row && Number(row.cnt) > 0)
      return;
    let insert = this.db.prepare(`
      INSERT INTO model_pricing (
        id, pattern, label, input_per_1m, cache_read_per_1m, output_per_1m, enabled, retired, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    DEFAULT_PRICING_RULES.forEach((rule, index) => {
      insert.run(
        rule.id,
        rule.pattern,
        rule.label,
        rule.inputPer1M,
        rule.cacheReadPer1M,
        rule.outputPer1M,
        rule.enabled ? 1 : 0,
        typeof rule.retired == "boolean" ? rule.retired ? 1 : 0 : null,
        index
      );
    });
  }
  getIndexedFile(filePath) {
    let row = this.db.prepare(
      "SELECT path, file_size, mtime_ms, last_offset, updated_at_ms FROM indexed_files WHERE path = ?"
    ).get(filePath);
    return row ? {
      path: String(row.path),
      fileSize: Number(row.file_size),
      mtimeMs: Number(row.mtime_ms),
      lastOffset: Number(row.last_offset),
      updatedAtMs: Number(row.updated_at_ms)
    } : null;
  }
  upsertIndexedFile(entry) {
    this.db.prepare(`
        INSERT INTO indexed_files (path, file_size, mtime_ms, last_offset, updated_at_ms)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
          file_size = excluded.file_size,
          mtime_ms = excluded.mtime_ms,
          last_offset = excluded.last_offset,
          updated_at_ms = excluded.updated_at_ms
      `).run(
      entry.path,
      entry.fileSize,
      entry.mtimeMs,
      entry.lastOffset,
      entry.updatedAtMs
    );
  }
  insertHookEvents(events) {
    if (events.length === 0) return;
    let stmt = this.db.prepare(`
      INSERT OR IGNORE INTO hook_events (
        ts_ms, hook_event_name, conversation_id, workspace_paths_json,
        transcript_path, model_name, cwd, step_idx, invocation_num,
        termination_reason, error, last_user_input, tool_call_id,
        tool_name, arg_bytes, dedup_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    this.db.exec("BEGIN");
    try {
      for (let ev of events)
        stmt.run(
          ev.tsMs,
          ev.hookEventName,
          ev.conversationId,
          JSON.stringify(ev.workspacePaths),
          ev.transcriptPath,
          ev.modelName,
          ev.cwd,
          ev.stepIdx,
          ev.invocationNum,
          ev.terminationReason,
          ev.error,
          ev.lastUserInput,
          ev.toolCallId,
          ev.toolName,
          ev.argBytes,
          ev.dedupKey
        );
      this.db.exec("COMMIT");
    } catch (err) {
      throw this.db.exec("ROLLBACK"), err;
    }
  }
  getHookEventsForConversation(conversationId) {
    return this.db.prepare(
      "SELECT * FROM hook_events WHERE conversation_id = ? ORDER BY ts_ms ASC, id ASC"
    ).all(conversationId).map((r) => ({
      id: Number(r.id),
      tsMs: Number(r.ts_ms),
      hookEventName: String(r.hook_event_name),
      conversationId: String(r.conversation_id),
      workspacePaths: safeJsonParse(r.workspace_paths_json, []),
      transcriptPath: r.transcript_path ? String(r.transcript_path) : null,
      modelName: r.model_name ? String(r.model_name) : null,
      cwd: r.cwd ? String(r.cwd) : null,
      stepIdx: r.step_idx !== null && r.step_idx !== void 0 ? Number(r.step_idx) : null,
      invocationNum: r.invocation_num !== null && r.invocation_num !== void 0 ? Number(r.invocation_num) : null,
      terminationReason: r.termination_reason ? String(r.termination_reason) : null,
      error: r.error ? String(r.error) : null,
      lastUserInput: r.last_user_input ? String(r.last_user_input) : null,
      toolCallId: r.tool_call_id ? String(r.tool_call_id) : null,
      toolName: r.tool_name ? String(r.tool_name) : null,
      argBytes: r.arg_bytes !== null && r.arg_bytes !== void 0 ? Number(r.arg_bytes) : null
    }));
  }
  getHookTranscriptPaths() {
    return this.db.prepare(`
        SELECT conversation_id, MAX(transcript_path) AS transcript_path
        FROM hook_events
        WHERE transcript_path IS NOT NULL AND transcript_path != ''
        GROUP BY conversation_id
      `).all().map((r) => ({
      conversationId: String(r.conversation_id),
      transcriptPath: String(r.transcript_path)
    }));
  }
  getLatestHookTsForConversation(conversationId) {
    let row = this.db.prepare("SELECT MAX(ts_ms) AS max_ts FROM hook_events WHERE conversation_id = ?").get(conversationId);
    return row?.max_ts ? Number(row.max_ts) : 0;
  }
  getProjectOverride(conversationId) {
    let row = this.db.prepare("SELECT project_path, updated_at_ms FROM project_overrides WHERE conversation_id = ?").get(conversationId);
    return row ? {
      projectPath: String(row.project_path),
      updatedAtMs: Number(row.updated_at_ms)
    } : null;
  }
  setProjectOverride(conversationId, projectPath) {
    let now = Date.now();
    this.db.exec("BEGIN");
    try {
      this.db.prepare(`
          INSERT INTO project_overrides (conversation_id, project_path, updated_at_ms)
          VALUES (?, ?, ?)
          ON CONFLICT(conversation_id) DO UPDATE SET
            project_path = excluded.project_path,
            updated_at_ms = excluded.updated_at_ms
        `).run(conversationId, projectPath, now), this.db.prepare(`
          UPDATE conversations
          SET project_path = ?, project_source = 'manual'
          WHERE conversation_id = ? OR parent_conversation_id = ?
        `).run(projectPath, conversationId, conversationId), this.db.exec("COMMIT");
    } catch (err) {
      throw this.db.exec("ROLLBACK"), err;
    }
  }
  getPricingRules() {
    return this.db.prepare(
      "SELECT id, pattern, label, input_per_1m, cache_read_per_1m, output_per_1m, enabled, retired FROM model_pricing ORDER BY sort_order ASC, id ASC"
    ).all().map((r) => ({
      id: String(r.id),
      pattern: String(r.pattern),
      label: String(r.label),
      inputPer1M: Number(r.input_per_1m),
      cacheReadPer1M: Number(r.cache_read_per_1m),
      outputPer1M: Number(r.output_per_1m),
      enabled: Number(r.enabled) === 1,
      ...r.retired !== null && r.retired !== void 0 ? { retired: Number(r.retired) === 1 } : {}
    }));
  }
  savePricingRules(rules) {
    this.db.exec("BEGIN");
    try {
      this.db.exec("DELETE FROM model_pricing");
      let insert = this.db.prepare(`
        INSERT INTO model_pricing (
          id, pattern, label, input_per_1m, cache_read_per_1m, output_per_1m, enabled, retired, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      rules.forEach((rule, idx) => {
        insert.run(
          rule.id,
          rule.pattern,
          rule.label,
          rule.inputPer1M,
          rule.cacheReadPer1M,
          rule.outputPer1M,
          rule.enabled ? 1 : 0,
          typeof rule.retired == "boolean" ? rule.retired ? 1 : 0 : null,
          idx
        );
      }), this.db.exec("COMMIT");
    } catch (err) {
      throw this.db.exec("ROLLBACK"), err;
    }
  }
  upsertConversation(input) {
    this.db.exec("BEGIN");
    try {
      if (this.db.prepare(`
          INSERT INTO conversations (
            conversation_id, title, surface, transcript_path, project_path, project_source,
            parent_conversation_id, subagent_role, subagent_type,
            swarm_role, swarm_title, swarm_tasks_json,
            started_at_ms, ended_at_ms, termination_reason,
            models_json, slash_commands_json, skills_used_json, has_live_hooks, has_token_telemetry,
            input_tokens, cache_read_tokens, output_tokens, peak_context_tokens,
            active_ms, model_ms, tool_wall_ms, tool_sum_ms, user_idle_ms, wall_clock_ms,
            error_count, diagnostics_json, files_touched_json, indexed_at_ms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(conversation_id) DO UPDATE SET
            title = excluded.title,
            surface = excluded.surface,
            transcript_path = excluded.transcript_path,
            project_path = excluded.project_path,
            project_source = excluded.project_source,
            parent_conversation_id = excluded.parent_conversation_id,
            subagent_role = excluded.subagent_role,
            subagent_type = excluded.subagent_type,
            swarm_role = excluded.swarm_role,
            swarm_title = excluded.swarm_title,
            swarm_tasks_json = excluded.swarm_tasks_json,
            started_at_ms = excluded.started_at_ms,
            ended_at_ms = excluded.ended_at_ms,
            termination_reason = excluded.termination_reason,
            models_json = excluded.models_json,
            slash_commands_json = excluded.slash_commands_json,
            skills_used_json = excluded.skills_used_json,
            has_live_hooks = excluded.has_live_hooks,
            has_token_telemetry = excluded.has_token_telemetry,
            input_tokens = excluded.input_tokens,
            cache_read_tokens = excluded.cache_read_tokens,
            output_tokens = excluded.output_tokens,
            peak_context_tokens = excluded.peak_context_tokens,
            active_ms = excluded.active_ms,
            model_ms = excluded.model_ms,
            tool_wall_ms = excluded.tool_wall_ms,
            tool_sum_ms = excluded.tool_sum_ms,
            user_idle_ms = excluded.user_idle_ms,
            wall_clock_ms = excluded.wall_clock_ms,
            error_count = excluded.error_count,
            diagnostics_json = excluded.diagnostics_json,
            files_touched_json = excluded.files_touched_json,
            indexed_at_ms = excluded.indexed_at_ms
        `).run(
        input.conversationId,
        input.title,
        input.surface,
        input.transcriptPath,
        input.projectPath,
        input.projectSource,
        input.parentConversationId,
        input.subagentRole,
        input.subagentType,
        input.swarmRole ?? null,
        input.swarmTitle ?? null,
        JSON.stringify(input.swarmTasks ?? {}),
        input.startedAtMs,
        input.endedAtMs,
        input.terminationReason,
        JSON.stringify(input.models),
        JSON.stringify(input.slashCommands),
        JSON.stringify(input.skillsUsed),
        input.hasLiveHooks ? 1 : 0,
        input.hasTokenTelemetry ? 1 : 0,
        input.inputTokens,
        input.cacheReadTokens,
        input.outputTokens,
        input.peakContextTokens,
        input.activeMs,
        input.modelMs,
        input.toolWallMs,
        input.toolSumMs,
        input.userIdleMs,
        input.wallClockMs,
        input.errorCount,
        JSON.stringify(input.diagnostics),
        JSON.stringify(input.filesTouched),
        input.indexedAtMs
      ), this.db.prepare("DELETE FROM turns WHERE conversation_id = ?").run(input.conversationId), this.db.prepare("DELETE FROM planner_steps WHERE conversation_id = ?").run(input.conversationId), this.db.prepare("DELETE FROM tool_calls WHERE conversation_id = ?").run(input.conversationId), this.db.prepare("DELETE FROM model_error_signals WHERE conversation_id = ?").run(input.conversationId), input.modelUnavailableErrors && input.modelUnavailableErrors.length > 0) {
        let insertErrSignal = this.db.prepare(`
          INSERT INTO model_error_signals (conversation_id, model, error_ts_ms, reason)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(conversation_id, model) DO UPDATE SET
            error_ts_ms = CASE
              WHEN excluded.error_ts_ms >= model_error_signals.error_ts_ms
              THEN excluded.error_ts_ms
              ELSE model_error_signals.error_ts_ms
            END,
            reason = CASE
              WHEN excluded.error_ts_ms >= model_error_signals.error_ts_ms
              THEN excluded.reason
              ELSE model_error_signals.reason
            END
        `);
        for (let errSig of input.modelUnavailableErrors)
          insertErrSignal.run(
            input.conversationId,
            errSig.model.trim().toLowerCase(),
            errSig.tsMs,
            errSig.reason
          );
      }
      let insertTurn = this.db.prepare(`
        INSERT INTO turns (
          conversation_id, turn_index, prompt_preview, slash_command,
          started_at_ms, ended_at_ms, active_ms, model_ms, tool_wall_ms,
          user_idle_before_ms, input_tokens, cache_read_tokens, output_tokens
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (let t of input.turns)
        insertTurn.run(
          input.conversationId,
          t.turnIndex,
          t.promptPreview,
          t.slashCommand,
          t.startedAtMs,
          t.endedAtMs,
          t.activeMs,
          t.modelMs,
          t.toolWallMs,
          t.userIdleBeforeMs,
          t.inputTokens,
          t.cacheReadTokens,
          t.outputTokens
        );
      let insertPlanner = this.db.prepare(`
        INSERT INTO planner_steps (
          conversation_id, seq_index, step_index, turn_index, model, created_at_ms, completed_at_ms,
          model_duration_ms, input_tokens, cache_read_tokens, output_tokens, total_context_tokens,
          is_cache_miss, cache_miss_cause, thinking_chars, content_chars, tool_call_count,
          status, attributed_summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      input.plannerSteps.forEach((s, seqIdx) => {
        insertPlanner.run(
          input.conversationId,
          seqIdx,
          s.stepIndex,
          s.turnIndex,
          s.model,
          s.createdAtMs,
          s.completedAtMs,
          s.modelDurationMs,
          s.inputTokens,
          s.cacheReadTokens,
          s.outputTokens,
          s.totalContextTokens,
          s.isCacheMiss ? 1 : 0,
          s.cacheMissCause,
          s.thinkingChars,
          s.contentChars,
          s.toolCallCount,
          s.status,
          s.attributedSummary
        );
      });
      let insertTool = this.db.prepare(`
        INSERT INTO tool_calls (
          conversation_id, step_index, planner_step_index, turn_index, tool_call_id,
          tool_name, category, mcp_server, skill_name, skill_plugin, target_path,
          child_conversation_id, child_conversation_ids_json, started_at_ms, completed_at_ms, duration_ms,
          args_preview, result_bytes, est_result_tokens, attributed_input_tokens,
          compounded_cache_tokens, is_error, error_preview
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (let tc of input.toolCalls) {
        let serializedLinks = tc.childLinks && tc.childLinks.length > 0 ? tc.childLinks : tc.childConversationId ? [{ conversationId: tc.childConversationId, role: null, typeName: null }] : [];
        insertTool.run(
          input.conversationId,
          tc.stepIndex,
          tc.plannerStepIndex,
          tc.turnIndex,
          tc.toolCallId,
          tc.toolName,
          tc.category,
          tc.mcpServer,
          tc.skillName,
          tc.skillPlugin,
          tc.targetPath,
          tc.childConversationId,
          JSON.stringify(serializedLinks),
          tc.startedAtMs,
          tc.completedAtMs,
          tc.durationMs,
          tc.argsPreview,
          tc.resultBytes,
          tc.estResultTokens,
          tc.attributedInputTokens,
          tc.compoundedCacheTokens,
          tc.isError ? 1 : 0,
          tc.errorPreview
        );
      }
      this.db.exec("COMMIT");
    } catch (err) {
      throw this.db.exec("ROLLBACK"), err;
    }
  }
  getConversationRecord(conversationId) {
    let row = this.db.prepare("SELECT * FROM conversations WHERE conversation_id = ?").get(conversationId);
    return row ? mapStoredConversationRow(row) : null;
  }
  getAllConversationRecords() {
    return this.db.prepare("SELECT * FROM conversations ORDER BY ended_at_ms DESC").all().map(mapStoredConversationRow);
  }
  getTurnsForConversation(conversationId) {
    return this.db.prepare("SELECT * FROM turns WHERE conversation_id = ? ORDER BY turn_index ASC").all(conversationId).map((r) => {
      let inputTokens = Number(r.input_tokens), cacheReadTokens = Number(r.cache_read_tokens), denom = inputTokens + cacheReadTokens;
      return {
        turnIndex: Number(r.turn_index),
        promptPreview: String(r.prompt_preview),
        slashCommand: r.slash_command ? String(r.slash_command) : null,
        startedAtMs: Number(r.started_at_ms),
        endedAtMs: Number(r.ended_at_ms),
        activeMs: Number(r.active_ms),
        modelMs: Number(r.model_ms),
        toolWallMs: Number(r.tool_wall_ms),
        userIdleBeforeMs: Number(r.user_idle_before_ms),
        inputTokens,
        cacheReadTokens,
        outputTokens: Number(r.output_tokens),
        cacheHitRatio: denom > 0 ? cacheReadTokens / denom : 0
      };
    });
  }
  getPlannerStepsForConversation(conversationId) {
    return this.db.prepare("SELECT * FROM planner_steps WHERE conversation_id = ? ORDER BY seq_index ASC").all(conversationId).map((r) => {
      let inputTokens = Number(r.input_tokens), cacheReadTokens = Number(r.cache_read_tokens), denom = inputTokens + cacheReadTokens;
      return {
        stepIndex: Number(r.step_index),
        turnIndex: Number(r.turn_index),
        model: String(r.model),
        createdAtMs: Number(r.created_at_ms),
        completedAtMs: r.completed_at_ms !== null && r.completed_at_ms !== void 0 ? Number(r.completed_at_ms) : null,
        modelDurationMs: Number(r.model_duration_ms),
        inputTokens,
        cacheReadTokens,
        outputTokens: Number(r.output_tokens),
        totalContextTokens: Number(r.total_context_tokens),
        cacheHitRatio: denom > 0 ? cacheReadTokens / denom : 0,
        isCacheMiss: Number(r.is_cache_miss) === 1,
        cacheMissCause: r.cache_miss_cause ? String(r.cache_miss_cause) : null,
        thinkingChars: Number(r.thinking_chars),
        contentChars: Number(r.content_chars),
        toolCallCount: Number(r.tool_call_count),
        status: String(r.status),
        attributedSummary: String(r.attributed_summary ?? "")
      };
    });
  }
  getToolCallsForConversation(conversationId) {
    return this.db.prepare("SELECT * FROM tool_calls WHERE conversation_id = ? ORDER BY step_index ASC, id ASC").all(conversationId).map((r) => {
      let childConversationId = r.child_conversation_id ? String(r.child_conversation_id) : null, parsedLinks = safeJsonParse(
        r.child_conversation_ids_json,
        []
      ).filter((l) => l && typeof l.conversationId == "string" && l.conversationId.length > 0), childLinks = parsedLinks.length > 0 ? parsedLinks : childConversationId ? [{ conversationId: childConversationId, role: null, typeName: null }] : [], childConversationIds = childLinks.map((l) => l.conversationId);
      return {
        id: Number(r.id),
        stepIndex: Number(r.step_index),
        plannerStepIndex: Number(r.planner_step_index),
        turnIndex: Number(r.turn_index),
        toolCallId: r.tool_call_id ? String(r.tool_call_id) : null,
        toolName: String(r.tool_name),
        category: String(r.category),
        mcpServer: r.mcp_server ? String(r.mcp_server) : null,
        skillName: r.skill_name ? String(r.skill_name) : null,
        skillPlugin: r.skill_plugin ? String(r.skill_plugin) : null,
        targetPath: r.target_path ? String(r.target_path) : null,
        childConversationId,
        ...childConversationIds.length > 0 ? { childConversationIds } : {},
        ...childLinks.length > 0 ? { childLinks } : {},
        startedAtMs: r.started_at_ms !== null && r.started_at_ms !== void 0 ? Number(r.started_at_ms) : null,
        completedAtMs: r.completed_at_ms !== null && r.completed_at_ms !== void 0 ? Number(r.completed_at_ms) : null,
        durationMs: Number(r.duration_ms),
        argsPreview: String(r.args_preview ?? ""),
        resultBytes: Number(r.result_bytes),
        estResultTokens: Number(r.est_result_tokens),
        attributedInputTokens: Number(r.attributed_input_tokens),
        compoundedCacheTokens: Number(r.compounded_cache_tokens),
        isError: Number(r.is_error) === 1,
        errorPreview: r.error_preview ? String(r.error_preview) : null
      };
    });
  }
  getSubagentLinkMap() {
    let rows = this.db.prepare(`
        SELECT conversation_id, child_conversation_id, child_conversation_ids_json, args_preview
        FROM tool_calls
        WHERE (child_conversation_id IS NOT NULL AND child_conversation_id != '')
           OR (child_conversation_ids_json IS NOT NULL AND child_conversation_ids_json != '' AND child_conversation_ids_json != '[]')
      `).all(), map = /* @__PURE__ */ new Map();
    for (let row of rows) {
      let parentId = String(row.conversation_id), preview = String(row.args_preview ?? ""), roleMatch = preview.match(/Role:\s*([^|]+)/i), typeMatch = preview.match(/Type:\s*([^|]+)/i), fallbackRole = roleMatch ? roleMatch[1].trim() : null, fallbackType = typeMatch ? typeMatch[1].trim() : null, parsedLinks = safeJsonParse(
        row.child_conversation_ids_json,
        []
      ), seenInRow = /* @__PURE__ */ new Set();
      for (let link of parsedLinks)
        !link || typeof link.conversationId != "string" || !link.conversationId || (seenInRow.add(link.conversationId), map.set(link.conversationId, {
          parentConversationId: parentId,
          role: link.role ?? fallbackRole,
          typeName: link.typeName ?? fallbackType
        }));
      let legacyChildId = row.child_conversation_id ? String(row.child_conversation_id) : "";
      legacyChildId && !seenInRow.has(legacyChildId) && map.set(legacyChildId, {
        parentConversationId: parentId,
        role: fallbackRole,
        typeName: fallbackType
      });
    }
    return map;
  }
  getModelAvailabilitySignals() {
    let signals = {}, latestGlobalActivityMs = 0, maxConvRow = this.db.prepare("SELECT MAX(ended_at_ms) AS max_ended FROM conversations").get();
    maxConvRow?.max_ended && Number.isFinite(Number(maxConvRow.max_ended)) && (latestGlobalActivityMs = Math.max(latestGlobalActivityMs, Number(maxConvRow.max_ended)));
    let seenRows = this.db.prepare(`
        SELECT LOWER(TRIM(model)) AS model, MAX(created_at_ms) AS last_seen_ms
        FROM planner_steps
        WHERE model IS NOT NULL AND TRIM(model) != ''
        GROUP BY LOWER(TRIM(model))
      `).all();
    for (let r of seenRows) {
      let model = String(r.model || "").trim().toLowerCase();
      if (!model || model === "unknown" || model === "auto") continue;
      let lastSeenAtMs = Number(r.last_seen_ms ?? 0);
      lastSeenAtMs > latestGlobalActivityMs && (latestGlobalActivityMs = lastSeenAtMs), signals[model] = {
        model,
        lastSeenAtMs,
        lastUnavailableErrorAtMs: null,
        lastUnavailableReason: null
      };
    }
    let mergeError = (modelRaw, errTsMs, reason) => {
      let model = modelRaw.trim().toLowerCase();
      if (!model || model === "unknown" || model === "auto") return;
      let existing = signals[model] ?? {
        model,
        lastSeenAtMs: 0,
        lastUnavailableErrorAtMs: null,
        lastUnavailableReason: null
      };
      (existing.lastUnavailableErrorAtMs === null || errTsMs >= existing.lastUnavailableErrorAtMs) && (existing.lastUnavailableErrorAtMs = errTsMs, existing.lastUnavailableReason = reason), signals[model] = existing;
    }, errRows = this.db.prepare(
      "SELECT LOWER(TRIM(model)) AS model, error_ts_ms, reason FROM model_error_signals ORDER BY error_ts_ms DESC"
    ).all();
    for (let r of errRows)
      mergeError(String(r.model || ""), Number(r.error_ts_ms ?? 0), String(r.reason ?? ""));
    let hookErrRows = this.db.prepare("SELECT ts_ms, error FROM hook_events WHERE error IS NOT NULL AND error != ''").all();
    for (let r of hookErrRows) {
      let extracted = extractUnavailableModelError(String(r.error || ""));
      extracted && mergeError(extracted.model, Number(r.ts_ms ?? 0), extracted.reason);
    }
    return { signals, latestGlobalActivityMs };
  }
};
function mapStoredConversationRow(r) {
  return {
    conversationId: String(r.conversation_id),
    title: String(r.title),
    surface: String(r.surface),
    transcriptPath: String(r.transcript_path),
    projectPath: String(r.project_path),
    projectSource: String(r.project_source),
    parentConversationId: r.parent_conversation_id ? String(r.parent_conversation_id) : null,
    subagentRole: r.subagent_role ? String(r.subagent_role) : null,
    subagentType: r.subagent_type ? String(r.subagent_type) : null,
    swarmRole: r.swarm_role === "coordinator" || r.swarm_role === "worker" ? r.swarm_role : null,
    swarmTitle: r.swarm_title ? String(r.swarm_title) : null,
    swarmTasks: safeJsonParse(r.swarm_tasks_json, {}),
    startedAtMs: Number(r.started_at_ms),
    endedAtMs: Number(r.ended_at_ms),
    terminationReason: r.termination_reason ? String(r.termination_reason) : null,
    models: safeJsonParse(r.models_json, []),
    slashCommands: safeJsonParse(r.slash_commands_json, []),
    skillsUsed: safeJsonParse(r.skills_used_json, []),
    hasLiveHooks: Number(r.has_live_hooks) === 1,
    hasTokenTelemetry: r.has_token_telemetry === void 0 || r.has_token_telemetry === null ? !0 : Number(r.has_token_telemetry) === 1,
    inputTokens: Number(r.input_tokens),
    cacheReadTokens: Number(r.cache_read_tokens),
    outputTokens: Number(r.output_tokens),
    peakContextTokens: Number(r.peak_context_tokens),
    activeMs: Number(r.active_ms),
    modelMs: Number(r.model_ms),
    toolWallMs: Number(r.tool_wall_ms),
    toolSumMs: Number(r.tool_sum_ms),
    userIdleMs: Number(r.user_idle_ms),
    wallClockMs: Number(r.wall_clock_ms),
    errorCount: Number(r.error_count),
    diagnostics: safeJsonParse(r.diagnostics_json, []),
    filesTouched: safeJsonParse(r.files_touched_json, []),
    indexedAtMs: Number(r.indexed_at_ms)
  };
}
function safeJsonParse(value, fallback) {
  if (typeof value != "string" || !value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// src/server/scanner.ts
import fs7 from "node:fs";
import os3 from "node:os";
import path5 from "node:path";

// src/server/analytics.ts
import fs5 from "node:fs";
import path4 from "node:path";

// src/shared/timeRange.ts
function computeLocalPresetSinceMs(preset, nowMs = Date.now()) {
  if (preset === "all") return null;
  let d = new Date(nowMs);
  if (preset === "today")
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  let daysBack = preset === "7d" ? 6 : 29;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysBack).getTime();
}
function resolveTimeRangeBounds(query, nowMs = Date.now()) {
  let preset = query?.preset ?? "all", untilMs = typeof query?.untilMs == "number" && Number.isFinite(query.untilMs) && query.untilMs > 0 ? query.untilMs : nowMs;
  if (preset === "all")
    return { preset: "all", sinceMs: null, untilMs };
  let explicitSince = query?.sinceMs, sinceMs = typeof explicitSince == "number" && Number.isFinite(explicitSince) && explicitSince > 0 ? explicitSince : computeLocalPresetSinceMs(preset, untilMs);
  return { preset, sinceMs, untilMs };
}
function computePriorTimeRangeBounds(bounds) {
  if (bounds.preset === "all" || bounds.sinceMs === null)
    return null;
  let days, label;
  bounds.preset === "today" ? (days = 1, label = "vs yesterday") : bounds.preset === "7d" ? (days = 7, label = "vs prior 7d") : (days = 30, label = "vs prior 30d");
  let d = new Date(bounds.sinceMs);
  return {
    priorSinceMs: new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() - days
    ).getTime(),
    priorUntilMs: bounds.sinceMs,
    label
  };
}

// src/server/skillEfficiency.ts
import fs4 from "node:fs";
import os2 from "node:os";
import path3 from "node:path";
var PLUGIN_REGISTRY_TTL_MS = 3e4, pluginRegistryCache = /* @__PURE__ */ new Map();
var GENERIC_CLI_NAMES = /* @__PURE__ */ new Set([
  "run",
  "test",
  "build",
  "start",
  "stop",
  "status",
  "check",
  "install",
  "bash",
  "sh",
  "zsh",
  "node",
  "python",
  "python3",
  "git",
  "ls",
  "cat",
  "env",
  "echo",
  "sed",
  "awk",
  "grep"
]);
function readTextSafe(filePath) {
  try {
    return !fs4.existsSync(filePath) || !fs4.statSync(filePath).isFile() ? null : fs4.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}
function extractYamlSkillName(text) {
  let fmMatch = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;
  let nameMatch = fmMatch[1].match(/(?:^|\n)\s*name:\s*["']?([a-zA-Z0-9_.-]+)["']?/);
  return nameMatch ? nameMatch[1].trim() : null;
}
function collectPluginCliBinaries(dirPath, idLower, entryLower, out) {
  try {
    if (!fs4.existsSync(dirPath)) return;
    let entries = fs4.readdirSync(dirPath, { withFileTypes: !0 });
    for (let ent of entries) {
      if (!ent.isFile() && !ent.isSymbolicLink()) continue;
      let stripped = ent.name.replace(/\.(?:exe|cmd|bat)$/i, "");
      if (stripped.includes(".")) continue;
      let lower = stripped.toLowerCase();
      GENERIC_CLI_NAMES.has(lower) || (lower === idLower || lower === entryLower || lower.startsWith(`${idLower}-`) || lower.startsWith(`${entryLower}-`)) && out.add(lower);
    }
  } catch {
  }
}
function escapeRegex2(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function textMentionsAnyToken(body, tokens) {
  if (!body || tokens.length === 0) return !1;
  let cleanBody = body.replace(/https?:\/\/[^\s)>\]"']+/gi, " ");
  for (let tok of tokens) {
    if (!tok) continue;
    let pattern = tok.endsWith("_") ? `(?:^|[^a-zA-Z0-9_-])${escapeRegex2(tok)}[a-zA-Z0-9_-]+` : `(?:^|[^a-zA-Z0-9_-])${escapeRegex2(tok)}(?:$|[^a-zA-Z0-9_-])`;
    if (new RegExp(pattern, "i").test(cleanBody)) return !0;
  }
  return !1;
}
function discoverInstalledPlugins(pluginsDirs) {
  let dirs = Array.isArray(pluginsDirs) ? pluginsDirs : typeof pluginsDirs == "string" ? [pluginsDirs] : [
    path3.join(os2.homedir(), ".gemini", "config", "plugins"),
    path3.join(os2.homedir(), ".gemini", "antigravity", "builtin", "plugins")
  ], cacheKey = dirs.join(path3.delimiter), now = Date.now(), cached2 = pluginRegistryCache.get(cacheKey);
  if (cached2 && cached2.expiresAt > now)
    return cached2.registry;
  let byId = /* @__PURE__ */ new Map(), cliToPlugin = /* @__PURE__ */ new Map(), mcpToPlugin = /* @__PURE__ */ new Map();
  for (let pluginsDir of dirs)
    try {
      if (fs4.existsSync(pluginsDir)) {
        let entries = fs4.readdirSync(pluginsDir, { withFileTypes: !0 });
        for (let entry of entries) {
          if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
          let pluginPath = path3.join(pluginsDir, entry.name), stat = null;
          try {
            stat = fs4.statSync(pluginPath);
          } catch {
            stat = null;
          }
          if (!stat || !stat.isDirectory()) continue;
          let id = entry.name, displayName = entry.name, manifestText = readTextSafe(path3.join(pluginPath, "plugin.json"));
          if (manifestText)
            try {
              let parsed = JSON.parse(manifestText);
              typeof parsed.name == "string" && parsed.name.trim() && (id = parsed.name.trim()), typeof parsed.displayName == "string" && parsed.displayName.trim() ? displayName = parsed.displayName.trim() : displayName = id;
            } catch {
            }
          if (byId.has(id)) continue;
          let mcpSet = /* @__PURE__ */ new Set(), mcpText = readTextSafe(path3.join(pluginPath, "mcp_config.json"));
          if (mcpText)
            try {
              let parsedMcp = JSON.parse(mcpText);
              if (parsedMcp?.mcpServers && typeof parsedMcp.mcpServers == "object")
                for (let serverKey of Object.keys(parsedMcp.mcpServers)) {
                  let clean = serverKey.trim();
                  clean && mcpSet.add(clean);
                }
            } catch {
            }
          let cliSet = /* @__PURE__ */ new Set(), idLower = id.toLowerCase(), entryLower = entry.name.toLowerCase();
          collectPluginCliBinaries(path3.join(pluginPath, "bin"), idLower, entryLower, cliSet);
          let skillsDir = path3.join(pluginPath, "skills"), rawSkills = [];
          try {
            if (fs4.existsSync(skillsDir))
              for (let skillEnt of fs4.readdirSync(skillsDir, { withFileTypes: !0 })) {
                if (!skillEnt.isDirectory() && !skillEnt.isSymbolicLink()) continue;
                let skillFolder = path3.join(skillsDir, skillEnt.name);
                collectPluginCliBinaries(
                  path3.join(skillFolder, "scripts"),
                  idLower,
                  entryLower,
                  cliSet
                );
                let skillMd = readTextSafe(path3.join(skillFolder, "SKILL.md")) ?? "", yamlName = skillMd ? extractYamlSkillName(skillMd) : null;
                rawSkills.push({
                  dirName: skillEnt.name,
                  name: yamlName || skillEnt.name,
                  body: skillMd
                });
              }
          } catch {
          }
          let cliNames = Array.from(cliSet).sort(), mcpServerNames = Array.from(mcpSet).sort(), mentionTokens = [
            ...cliNames,
            ...mcpServerNames.map((s) => `${id}_${s}`),
            ...mcpServerNames.map((s) => `${entry.name}_${s}`),
            ...mcpServerNames.length > 0 ? [
              `mcp_${id}_`,
              `mcp_${entry.name}_`,
              ...mcpServerNames.map((s) => `mcp_${s}_`),
              "call_mcp_tool"
            ] : []
          ], skills = /* @__PURE__ */ new Map();
          for (let sk of rawSkills) {
            let mentions = textMentionsAnyToken(sk.body, mentionTokens), meta = {
              name: sk.name,
              dirName: sk.dirName,
              mentionsMcpOrCli: mentions
            };
            skills.set(sk.name, meta), skills.set(sk.dirName, meta);
          }
          let info = {
            id,
            dirName: entry.name,
            displayName,
            cliNames,
            mcpServerNames,
            skills,
            hasExecutableSurface: cliNames.length > 0 || mcpServerNames.length > 0
          };
          byId.set(entry.name, info), byId.set(id, info);
          for (let cli of cliNames)
            cliToPlugin.set(cli, id);
          for (let srv of mcpServerNames)
            mcpToPlugin.has(srv) || mcpToPlugin.set(srv, id), mcpToPlugin.has(`${id}_${srv}`) || mcpToPlugin.set(`${id}_${srv}`, id), mcpToPlugin.has(`${entry.name}_${srv}`) || mcpToPlugin.set(`${entry.name}_${srv}`, id);
        }
      }
    } catch {
    }
  let registry2 = { byId, cliToPlugin, mcpToPlugin };
  return pluginRegistryCache.set(cacheKey, {
    registry: registry2,
    expiresAt: now + PLUGIN_REGISTRY_TTL_MS
  }), registry2;
}
function isSkillRequiresExecution(plugin, skillName) {
  if (!plugin || !plugin.hasExecutableSurface) return !1;
  let distinctSkillNames = /* @__PURE__ */ new Set();
  for (let meta of plugin.skills.values())
    distinctSkillNames.add(meta.name);
  let singleSkill = distinctSkillNames.size <= 1, mentions = !!(skillName ? plugin.skills.get(skillName) : void 0)?.mentionsMcpOrCli;
  return !!(plugin.cliNames.length > 0 && (singleSkill || mentions) || plugin.mcpServerNames.length > 0 && (singleSkill || mentions));
}
function resolveToolPluginAndChild(tc, registry2) {
  let makePluginHit = (rawPluginId, childKind, childName, footprint, skillNameForExecCheck) => {
    let info = registry2.byId.get(rawPluginId);
    return {
      parentId: `plugin:${info?.id ?? rawPluginId}`,
      parentName: info?.displayName ?? rawPluginId,
      parentKind: "Plugin",
      childKey: `${childKind}:${childName}`,
      childName,
      childKind,
      footprint,
      requiresExecution: footprint === "instruction" ? isSkillRequiresExecution(info, skillNameForExecCheck) : !1,
      targetPath: tc.targetPath
    };
  };
  if (tc.category === "skill") {
    if (tc.skillPlugin && tc.skillPlugin !== "builtin") {
      let childLabel = tc.skillName || (tc.targetPath ? pathBaseName(pathDirName(tc.targetPath)) : "skill");
      return makePluginHit(
        tc.skillPlugin,
        "SubSkill",
        childLabel,
        "instruction",
        tc.skillName
      );
    }
    if (tc.skillName) {
      if (registry2.byId.has(tc.skillName))
        return makePluginHit(
          tc.skillName,
          "SubSkill",
          tc.skillName,
          "instruction",
          tc.skillName
        );
      let refName = tc.targetPath ? pathBaseName(tc.targetPath) : "SKILL.md";
      return {
        parentId: `skill:${tc.skillName}`,
        parentName: tc.skillName,
        parentKind: "Skill",
        childKey: `Reference:${refName}`,
        childName: refName,
        childKind: "Reference",
        footprint: "instruction",
        requiresExecution: !1,
        targetPath: tc.targetPath
      };
    }
    return null;
  }
  if (tc.category === "mcp") {
    let rawServer = (tc.mcpServer || "").trim();
    if (!rawServer) return null;
    let childLabel = tc.toolName;
    if (tc.toolName === "call_mcp_tool" && tc.argsPreview.includes("/")) {
      let slashIdx = tc.argsPreview.indexOf("/"), extracted = tc.argsPreview.slice(slashIdx + 1).trim();
      extracted && (childLabel = extracted);
    } else tc.toolName.startsWith(`mcp_${rawServer}_`) ? childLabel = tc.toolName.slice(`mcp_${rawServer}_`.length) || tc.toolName : childLabel = tc.toolName.replace(/^mcp_[^_]+_/, "");
    let mappedPlugin = registry2.mcpToPlugin.get(rawServer);
    if (mappedPlugin)
      return makePluginHit(mappedPlugin, "MCP", childLabel, "execution", null);
    if (registry2.byId.has(rawServer))
      return makePluginHit(rawServer, "MCP", childLabel, "execution", null);
    let longestMatch = "";
    for (let knownId of registry2.byId.keys())
      rawServer.startsWith(`${knownId}_`) && knownId.length > longestMatch.length && (longestMatch = knownId);
    return longestMatch ? makePluginHit(longestMatch, "MCP", childLabel, "execution", null) : {
      parentId: `plugin:${rawServer}`,
      parentName: rawServer,
      parentKind: "Plugin",
      childKey: `MCP:${childLabel}`,
      childName: childLabel,
      childKind: "MCP",
      footprint: "execution",
      requiresExecution: !1,
      targetPath: tc.targetPath
    };
  }
  if (tc.category === "command") {
    let segments = (tc.argsPreview || "").split(/&&|\|\||;|\r?\n/);
    for (let rawSeg of segments) {
      let seg = rawSeg.trim();
      if (!seg) continue;
      for (; /^[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S+)\s+/.test(seg); )
        seg = seg.replace(/^[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S+)\s+/, "").trim();
      if (!seg) continue;
      let scriptMatch = seg.replace(/\\/g, "/").match(
        /^(?:(?:bash|sh|zsh|python3?|py|node|cmd(?:\.exe)?\s+\/c)\s+)?["']?([^\s"']*\.gemini\/(?:config|antigravity\/builtin)\/plugins\/([^/\s"']+)\/(?:skills|scripts|bin)\/([^\s"']+))/i
      );
      if (scriptMatch && scriptMatch[2]) {
        let scriptBase = pathBaseName(scriptMatch[3] || scriptMatch[2]);
        return makePluginHit(scriptMatch[2], "CLI", scriptBase, "execution", null);
      }
      let firstTokMatch = seg.match(/^(?:"([^"]+)"|'([^']+)'|(\S+))/);
      if (firstTokMatch) {
        let rawTok = firstTokMatch[1] ?? firstTokMatch[2] ?? firstTokMatch[3] ?? "", baseTok = pathBaseName(rawTok).replace(/\.(?:exe|cmd|bat)$/i, "").toLowerCase(), pluginId = registry2.cliToPlugin.get(baseTok);
        if (pluginId)
          return makePluginHit(pluginId, "CLI", baseTok, "execution", null);
      }
    }
    return null;
  }
  return null;
}
function resolveToolPluginOrSkill(tc, registry2) {
  let hit = resolveToolPluginAndChild(tc, registry2);
  return hit ? {
    id: hit.parentId,
    name: hit.parentName,
    kind: hit.parentKind
  } : null;
}
function formatErrorSampleTarget(tc) {
  if (tc.targetPath)
    return pathTailSegments(tc.targetPath, 2) || pathBaseName(tc.targetPath);
  let preview = (tc.argsPreview || "").trim().replace(/\s+/g, " ");
  return preview ? preview.slice(0, 90) : null;
}
function normalizeErrorSampleMessage(raw) {
  return (raw || "").trim().replace(/\s+/g, " ").slice(0, 180) || "Tool reported an execution error.";
}
function addErrorSample(map, sample, includeChildInKey = !0) {
  let key = includeChildInKey ? `${sample.childName ?? ""}|${sample.toolName}|${sample.message.toLowerCase()}` : `${sample.toolName}|${sample.message.toLowerCase()}`, existing = map.get(key);
  existing ? existing.count += sample.count : map.set(key, { ...sample });
}
function finalizeErrorSamples(map, max) {
  return map.size === 0 ? [] : Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, max);
}
function mergeIntervalsMs(intervals) {
  if (intervals.length === 0) return 0;
  let sorted = intervals.filter((iv) => iv.end >= iv.start && iv.start > 0).sort((a, b) => a.start - b.start);
  if (sorted.length === 0) return 0;
  let total = 0, curStart = sorted[0].start, curEnd = sorted[0].end;
  for (let i = 1; i < sorted.length; i++) {
    let iv = sorted[i];
    iv.start <= curEnd ? iv.end > curEnd && (curEnd = iv.end) : (total += curEnd - curStart, curStart = iv.start, curEnd = iv.end);
  }
  return total += curEnd - curStart, total;
}
function fmtShortTok(n) {
  return n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n));
}
function fmtShortDur(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  if (ms < 1e3) return `${Math.round(ms)}ms`;
  let totalSec = Math.round(ms / 1e3);
  if (totalSec < 60) return `${(ms / 1e3).toFixed(1)}s`;
  let min = Math.floor(totalSec / 60), remSec = totalSec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  let hr = Math.floor(min / 60), remMin = min % 60;
  return `${hr}h ${remMin}m`;
}
function sortConversationsParentsFirst(conversations) {
  let byId = /* @__PURE__ */ new Map();
  for (let c of conversations)
    byId.set(c.conversationId, c);
  let depthCache = /* @__PURE__ */ new Map(), computeDepth = (id, visited) => {
    if (depthCache.has(id)) return depthCache.get(id);
    if (visited.has(id) || visited.size >= 16) return 0;
    let conv = byId.get(id);
    if (!conv || !conv.parentConversationId || !byId.has(conv.parentConversationId))
      return depthCache.set(id, 0), 0;
    visited.add(id);
    let d = 1 + computeDepth(conv.parentConversationId, visited);
    return depthCache.set(id, d), d;
  };
  return [...conversations].sort((a, b) => {
    let da = computeDepth(a.conversationId, /* @__PURE__ */ new Set()), db = computeDepth(b.conversationId, /* @__PURE__ */ new Set());
    return da - db;
  });
}
function collectDescendantIds(rootId, childrenMap) {
  let out = /* @__PURE__ */ new Set([rootId]), queue = [rootId];
  for (; queue.length > 0 && out.size < 256; ) {
    let cur = queue.shift();
    for (let childId of childrenMap.get(cur) ?? [])
      out.has(childId) || (out.add(childId), queue.push(childId));
  }
  return out;
}
function buildPrescription(name, _kind, instructionTokens, totalTokens, unusedChildren, dupChildren) {
  let parts = [];
  if (unusedChildren.length > 0 && parts.push(
    `Loaded ${unusedChildren.join(", ")} without invoking its CLI/MCP tools \u2014 disable this plugin in Plugins Manager when you do not need it on this project.`
  ), dupChildren.length > 0) {
    let dupDesc = dupChildren.map((d) => `${d.name} (+${d.dup}\xD7 extra)`).join(", ");
    parts.push(
      `Re-loaded the same instructions multiple times in one chat (${dupDesc}) \u2014 starting a fresh chat avoids carrying them again.`
    );
  }
  let instrShare = totalTokens > 0 ? instructionTokens / totalTokens : 0;
  return instructionTokens >= 25e3 && instrShare >= 0.75 && parts.push(
    `${Math.round(instrShare * 100)}% (+${fmtShortTok(instructionTokens)} tok) of ${name}'s context footprint came from static instructions carried across steps \u2014 disable it when unused or keep chats shorter.`
  ), parts.length > 0 ? parts.join(" ") : null;
}
function comparePluginSkillMetricsByImpact(a, b) {
  let aCost = a.drivenCostUsd ?? -1, bCost = b.drivenCostUsd ?? -1;
  return aCost !== bCost && (aCost >= 0 || bCost >= 0) ? bCost - aCost : b.drivenActiveMs - a.drivenActiveMs || b.totalTokens - a.totalTokens || b.calls - a.calls || a.name.localeCompare(b.name);
}
function computeScopeSkillEfficiency(conversations, pricingRules, options = {}) {
  let registry2 = options.registry ?? discoverInstalledPlugins(), fallbackChatCount = options.fallbackChatCount ?? 1, orderedConvs = sortConversationsParentsFirst(conversations), scopeConvIds = new Set(orderedConvs.map((c) => c.conversationId)), childrenMap = /* @__PURE__ */ new Map(), parentById = /* @__PURE__ */ new Map();
  for (let c of orderedConvs)
    if (c.parentConversationId && scopeConvIds.has(c.parentConversationId)) {
      let list = childrenMap.get(c.parentConversationId) ?? [];
      list.push(c.conversationId), childrenMap.set(c.parentConversationId, list), parentById.set(c.conversationId, c.parentConversationId);
    }
  let rootConvById = /* @__PURE__ */ new Map();
  for (let c of orderedConvs) {
    let cur = c.conversationId, visited = /* @__PURE__ */ new Set([cur]);
    for (; parentById.has(cur) && visited.size < 16; ) {
      let next = parentById.get(cur);
      if (visited.has(next)) break;
      visited.add(next), cur = next;
    }
    rootConvById.set(c.conversationId, cur);
  }
  let toolHitByConv = /* @__PURE__ */ new Map(), execParentsByConv = /* @__PURE__ */ new Map();
  for (let c of orderedConvs) {
    let hitMap = /* @__PURE__ */ new Map(), execSet = /* @__PURE__ */ new Set();
    for (let tc of c.toolCalls) {
      let hit = resolveToolPluginAndChild(tc, registry2);
      hit && (hitMap.set(tc, hit), hit.footprint === "execution" && execSet.add(hit.parentId));
    }
    toolHitByConv.set(c.conversationId, hitMap), execParentsByConv.set(c.conversationId, execSet);
  }
  let unusedToolsByConv = /* @__PURE__ */ new Map();
  for (let c of orderedConvs) {
    let familyIds = collectDescendantIds(c.conversationId, childrenMap), familyExecParents = /* @__PURE__ */ new Set();
    for (let fid of familyIds)
      for (let pid of execParentsByConv.get(fid) ?? [])
        familyExecParents.add(pid);
    let unusedSet = /* @__PURE__ */ new Set(), hitMap = toolHitByConv.get(c.conversationId);
    for (let [tc, hit] of hitMap.entries())
      hit.footprint === "instruction" && hit.requiresExecution && (familyExecParents.has(hit.parentId) || unusedSet.add(tc));
    unusedToolsByConv.set(c.conversationId, unusedSet);
  }
  let parentsMap = /* @__PURE__ */ new Map(), getOrCreateParent = (hit) => {
    let p = parentsMap.get(hit.parentId);
    return p || (p = {
      id: hit.parentId,
      name: hit.parentName,
      kind: hit.parentKind,
      calls: 0,
      errors: 0,
      errorSamples: /* @__PURE__ */ new Map(),
      toolIntervals: [],
      unplacedToolMs: 0,
      drivenIntervals: [],
      unplacedDrivenMs: 0,
      drivenCostKnown: !1,
      drivenCostAcc: 0,
      contextCostKnown: !1,
      contextCostAcc: 0,
      instructionTokens: 0,
      executionTokens: 0,
      directTokens: 0,
      compoundedCacheTokens: 0,
      warnings: /* @__PURE__ */ new Set(),
      targetPaths: /* @__PURE__ */ new Set(),
      children: /* @__PURE__ */ new Map(),
      chatIds: /* @__PURE__ */ new Set()
    }, parentsMap.set(hit.parentId, p)), p;
  }, getOrCreateChild = (p, hit) => {
    let ch = p.children.get(hit.childKey);
    return ch || (ch = {
      key: hit.childKey,
      name: hit.childName,
      kind: hit.childKind,
      calls: 0,
      errors: 0,
      errorSamples: /* @__PURE__ */ new Map(),
      intervals: [],
      unplacedDrivenMs: 0,
      drivenCostKnown: !1,
      drivenCostAcc: 0,
      instructionTokens: 0,
      executionTokens: 0,
      duplicateReads: 0,
      isUnusedLoad: !1,
      targetPaths: /* @__PURE__ */ new Set()
    }, p.children.set(hit.childKey, ch)), ch;
  }, spawnInheritedGuide = /* @__PURE__ */ new Map(), topPluginsByConv = /* @__PURE__ */ new Map(), diagnosticsByConv = /* @__PURE__ */ new Map(), allScopeIntervals = [], unplacedScopeActiveMs = 0, scopeCostKnown = !1, scopeCostSum = 0, sumStepsContextTokens = 0, sumAllToolsContextTokens = 0;
  for (let c of orderedConvs) {
    let hitMap = toolHitByConv.get(c.conversationId), unusedSet = unusedToolsByConv.get(c.conversationId), convParentImpact = /* @__PURE__ */ new Map(), stepModelMap = /* @__PURE__ */ new Map();
    for (let ps of c.plannerSteps)
      stepModelMap.set(ps.stepIndex, ps.model), c.hasTokenTelemetry && (sumStepsContextTokens += ps.inputTokens + ps.cacheReadTokens);
    let toolsByStep = /* @__PURE__ */ new Map(), skillReadCounts = /* @__PURE__ */ new Map();
    for (let tc of c.toolCalls) {
      let list = toolsByStep.get(tc.plannerStepIndex) ?? [];
      list.push(tc), toolsByStep.set(tc.plannerStepIndex, list), c.hasTokenTelemetry && (sumAllToolsContextTokens += tc.attributedInputTokens + tc.compoundedCacheTokens);
      let hit = hitMap.get(tc);
      if (!hit) continue;
      let p = getOrCreateParent(hit), ch = getOrCreateChild(p, hit);
      if (p.calls += 1, ch.calls += 1, p.chatIds.add(rootConvById.get(c.conversationId) ?? c.conversationId), tc.isError) {
        p.errors += 1, ch.errors += 1;
        let sample = {
          message: normalizeErrorSampleMessage(tc.errorPreview),
          toolName: tc.toolName,
          target: formatErrorSampleTarget(tc),
          count: 1,
          ...c.conversationId ? { conversationId: c.conversationId } : {},
          ...c.title ? { conversationTitle: c.title } : {},
          stepIndex: tc.stepIndex,
          childName: hit.childName,
          childKind: hit.childKind
        };
        addErrorSample(ch.errorSamples, sample), addErrorSample(p.errorSamples, sample);
      }
      tc.targetPath && (p.targetPaths.add(tc.targetPath), ch.targetPaths.add(tc.targetPath)), tc.startedAtMs !== null && tc.startedAtMs > 0 ? p.toolIntervals.push({
        start: tc.startedAtMs,
        end: Math.max(tc.startedAtMs, tc.completedAtMs ?? tc.startedAtMs + tc.durationMs)
      }) : p.unplacedToolMs += tc.durationMs;
      let callTok = tc.attributedInputTokens + tc.compoundedCacheTokens;
      if (p.directTokens += tc.attributedInputTokens, p.compoundedCacheTokens += tc.compoundedCacheTokens, hit.footprint === "instruction" ? (p.instructionTokens += callTok, ch.instructionTokens += callTok) : (p.executionTokens += callTok, ch.executionTokens += callTok), unusedSet.has(tc) && (ch.isUnusedLoad = !0, p.warnings.add("Unused load")), tc.category === "skill" && (!tc.targetPath || /[\\/]SKILL\.md$/i.test(tc.targetPath))) {
        let readKey = tc.targetPath ? isWindowsPath(tc.targetPath) ? tc.targetPath.replace(/\\/g, "/").toLowerCase() : tc.targetPath : `${hit.parentId}:${hit.childKey}`, prev = skillReadCounts.get(readKey);
        prev ? (prev.count += 1, prev.wastedTok += callTok, ch.duplicateReads += 1, p.warnings.add("Duplicate read")) : skillReadCounts.set(readKey, {
          count: 1,
          hit,
          firstStep: tc.stepIndex,
          firstTurn: tc.turnIndex,
          wastedTok: 0
        });
      }
      let model = stepModelMap.get(tc.plannerStepIndex) ?? "", ctxEst = estimateStepCost(
        {
          inputTokens: tc.attributedInputTokens,
          cacheReadTokens: tc.compoundedCacheTokens,
          outputTokens: 0
        },
        model,
        pricingRules
      );
      !ctxEst.unpriced && ctxEst.totalUsd !== null && (p.contextCostKnown = !0, p.contextCostAcc += ctxEst.totalUsd);
      let prevConvImpact = convParentImpact.get(p.id) ?? { name: p.name, ms: 0, tok: 0 };
      prevConvImpact.tok += callTok, convParentImpact.set(p.id, prevConvImpact);
    }
    let guidingHit = (c.parentConversationId ? spawnInheritedGuide.get(c.conversationId) : null) ?? null, convHadPlacedIntervals = !1;
    for (let i = 0; i < c.plannerSteps.length; i++) {
      let step = c.plannerSteps[i], prevStep = i > 0 ? c.plannerSteps[i - 1] : null;
      step.isCacheMiss && step.cacheMissCause === "Context compaction or prefix reset" && (guidingHit = null);
      let stepTools = toolsByStep.get(step.stepIndex) ?? [], prevTools = prevStep ? toolsByStep.get(prevStep.stepIndex) ?? [] : [], stepIntervals = [], stepUnplacedMs = 0;
      if (step.createdAtMs > 0 && step.modelDurationMs > 0) {
        let mEnd = step.completedAtMs && step.completedAtMs >= step.createdAtMs ? step.completedAtMs : step.createdAtMs + step.modelDurationMs;
        stepIntervals.push({ start: step.createdAtMs, end: mEnd });
      } else step.modelDurationMs > 0 && (stepUnplacedMs += step.modelDurationMs);
      for (let tc of stepTools) {
        if (isIdleWaitTool(tc.toolName)) continue;
        let childIds = tc.childConversationIds && tc.childConversationIds.length > 0 ? tc.childConversationIds : tc.childConversationId ? [tc.childConversationId] : [];
        tc.category === "subagent" && childIds.length > 0 && childIds.some((cid) => scopeConvIds.has(cid)) || (tc.startedAtMs !== null && tc.startedAtMs > 0 ? stepIntervals.push({
          start: tc.startedAtMs,
          end: Math.max(tc.startedAtMs, tc.completedAtMs ?? tc.startedAtMs + tc.durationMs)
        }) : stepUnplacedMs += tc.durationMs);
      }
      stepIntervals.length > 0 ? (convHadPlacedIntervals = !0, allScopeIntervals.push(...stepIntervals)) : unplacedScopeActiveMs += stepUnplacedMs;
      let stepEst = step.inputTokens + step.cacheReadTokens + step.outputTokens > 0 ? estimateStepCost(step, step.model, pricingRules) : { unpriced: !0, totalUsd: null };
      !stepEst.unpriced && stepEst.totalUsd !== null && (scopeCostKnown = !0, scopeCostSum += stepEst.totalUsd);
      let ownHits = [];
      for (let tc of stepTools) {
        let h = hitMap.get(tc);
        h && (ownHits.push(h), tc.category === "skill" && !unusedSet.has(tc) && (guidingHit = h));
      }
      let activeStepHits = ownHits;
      if (activeStepHits.length === 0 && prevTools.length > 0) {
        let prevHits = [];
        for (let ptc of prevTools) {
          let ph = hitMap.get(ptc);
          ph && prevHits.push(ph);
        }
        prevHits.length > 0 && (activeStepHits = prevHits);
      }
      activeStepHits.length === 0 && guidingHit && (activeStepHits = [guidingHit]);
      let guideAtSpawn = guidingHit ?? (activeStepHits.length > 0 ? activeStepHits[0] : null);
      if (guideAtSpawn)
        for (let tc of stepTools) {
          let childIds = tc.childConversationIds && tc.childConversationIds.length > 0 ? tc.childConversationIds : tc.childConversationId ? [tc.childConversationId] : [];
          for (let cid of childIds)
            spawnInheritedGuide.has(cid) || spawnInheritedGuide.set(cid, guideAtSpawn);
        }
      if (activeStepHits.length > 0) {
        let uniqueParents = /* @__PURE__ */ new Map(), uniqueChildren = /* @__PURE__ */ new Map();
        for (let h of activeStepHits) {
          uniqueParents.has(h.parentId) || uniqueParents.set(h.parentId, h);
          let ck = `${h.parentId}#${h.childKey}`;
          uniqueChildren.has(ck) || uniqueChildren.set(ck, h);
        }
        let pCount = uniqueParents.size, stepMergedMs = mergeIntervalsMs(stepIntervals) + stepUnplacedMs;
        for (let ph of uniqueParents.values()) {
          let p = getOrCreateParent(ph);
          p.chatIds.add(rootConvById.get(c.conversationId) ?? c.conversationId), pCount === 1 && stepIntervals.length > 0 ? p.drivenIntervals.push(...stepIntervals) : stepMergedMs > 0 && (p.unplacedDrivenMs += stepMergedMs / pCount), !stepEst.unpriced && stepEst.totalUsd !== null && (p.drivenCostKnown = !0, p.drivenCostAcc += stepEst.totalUsd / pCount);
          let imp = convParentImpact.get(p.id) ?? { name: p.name, ms: 0, tok: 0 };
          imp.ms += stepMergedMs / pCount, convParentImpact.set(p.id, imp);
        }
        let cCount = uniqueChildren.size;
        for (let chHit of uniqueChildren.values()) {
          let p = getOrCreateParent(chHit), ch = getOrCreateChild(p, chHit);
          cCount === 1 && stepIntervals.length > 0 ? ch.intervals.push(...stepIntervals) : stepMergedMs > 0 && (ch.unplacedDrivenMs += stepMergedMs / cCount), !stepEst.unpriced && stepEst.totalUsd !== null && (ch.drivenCostKnown = !0, ch.drivenCostAcc += stepEst.totalUsd / cCount);
        }
      }
    }
    if (!convHadPlacedIntervals && c.plannerSteps.length === 0 && c.activeMs > 0)
      unplacedScopeActiveMs += c.activeMs;
    else if (!convHadPlacedIntervals && c.plannerSteps.length > 0) {
      let fallbackToolIvs = [];
      for (let tc of c.toolCalls)
        tc.startedAtMs !== null && tc.startedAtMs > 0 && fallbackToolIvs.push({
          start: tc.startedAtMs,
          end: Math.max(tc.startedAtMs, tc.completedAtMs ?? tc.startedAtMs + tc.durationMs)
        });
      fallbackToolIvs.length > 0 ? allScopeIntervals.push(...fallbackToolIvs) : c.activeMs > 0 && unplacedScopeActiveMs === 0 && (unplacedScopeActiveMs += c.activeMs);
    }
    let sortedConvParents = Array.from(convParentImpact.values()).sort((a, b) => b.ms - a.ms || b.tok - a.tok || a.name.localeCompare(b.name)).map((x) => x.name);
    topPluginsByConv.set(c.conversationId, sortedConvParents.slice(0, 6));
    let convDiags = buildConversationLiveDiagnostics(
      c,
      hitMap,
      unusedSet,
      skillReadCounts
    );
    diagnosticsByConv.set(c.conversationId, convDiags);
  }
  let computedScopeActiveMs = mergeIntervalsMs(allScopeIntervals) + unplacedScopeActiveMs, scopeActiveMs = options.scopeActiveMsOverride !== void 0 && options.scopeActiveMsOverride > 0 ? options.scopeActiveMsOverride : computedScopeActiveMs, scopeCostUsd = scopeCostKnown ? scopeCostSum : null, scopeContextTokens = sumStepsContextTokens > 0 ? sumStepsContextTokens : sumAllToolsContextTokens, rawParents = Array.from(parentsMap.values()).map((p) => {
    let rawToolMs = mergeIntervalsMs(p.toolIntervals) + p.unplacedToolMs, rawDrivenMs = mergeIntervalsMs(p.drivenIntervals) + p.unplacedDrivenMs || rawToolMs;
    return { p, rawToolMs, rawDrivenMs };
  }), sumDrivenMs = rawParents.reduce((s, r) => s + r.rawDrivenMs, 0), timeScale = scopeActiveMs > 0 && sumDrivenMs > scopeActiveMs ? scopeActiveMs / sumDrivenMs : 1, effectiveScopeActiveMs = scopeActiveMs > 0 ? scopeActiveMs : sumDrivenMs;
  return {
    pluginSkillMetrics: rawParents.map(({ p, rawToolMs, rawDrivenMs }) => {
      let drivenActiveMs = Math.round(rawDrivenMs * timeScale), totalTokens = p.directTokens + p.compoundedCacheTokens;
      p.instructionTokens >= 25e3 && totalTokens > 0 && p.instructionTokens / totalTokens >= 0.75 && p.warnings.add("High markdown carry");
      let drivenCostUsd = p.drivenCostKnown ? p.drivenCostAcc : p.contextCostKnown ? p.contextCostAcc : null, estimatedCostUsd = p.contextCostKnown ? p.contextCostAcc : drivenCostUsd, children = Array.from(p.children.values()).map((ch) => {
        let chDrivenMs = Math.round(
          (mergeIntervalsMs(ch.intervals) + ch.unplacedDrivenMs) * timeScale
        ), chTotalTok = ch.instructionTokens + ch.executionTokens, childSamples = finalizeErrorSamples(ch.errorSamples, 3);
        return {
          key: ch.key,
          name: ch.name,
          kind: ch.kind,
          calls: ch.calls,
          errors: ch.errors,
          ...childSamples.length > 0 ? { errorSamples: childSamples } : {},
          drivenActiveMs: chDrivenMs,
          drivenCostUsd: ch.drivenCostKnown ? ch.drivenCostAcc : null,
          instructionTokens: ch.instructionTokens,
          executionTokens: ch.executionTokens,
          totalTokens: chTotalTok,
          duplicateReads: ch.duplicateReads,
          isUnusedLoad: ch.isUnusedLoad,
          targetPaths: Array.from(ch.targetPaths).slice(0, 8)
        };
      }).sort(
        (a, b) => (b.drivenCostUsd ?? -1) - (a.drivenCostUsd ?? -1) || b.drivenActiveMs - a.drivenActiveMs || b.totalTokens - a.totalTokens || a.name.localeCompare(b.name)
      ), unusedChildren = children.filter((c) => c.isUnusedLoad).map((c) => c.name), dupChildren = children.filter((c) => c.duplicateReads > 0).map((c) => ({ name: c.name, dup: c.duplicateReads })), prescription = buildPrescription(
        p.name,
        p.kind,
        p.instructionTokens,
        totalTokens,
        unusedChildren,
        dupChildren
      ), warnings = Array.from(p.warnings), parentSamples = finalizeErrorSamples(p.errorSamples, 5), timeShare = effectiveScopeActiveMs > 0 ? Math.min(1, drivenActiveMs / effectiveScopeActiveMs) : 0, costShare = scopeCostUsd !== null && scopeCostUsd > 0 && drivenCostUsd !== null ? Math.min(1, drivenCostUsd / scopeCostUsd) : null, tokenShare = scopeContextTokens > 0 ? Math.min(1, totalTokens / scopeContextTokens) : 0;
      return {
        id: p.id,
        name: p.name,
        kind: p.kind,
        calls: p.calls,
        errors: p.errors,
        ...parentSamples.length > 0 ? { errorSamples: parentSamples } : {},
        totalDurationMs: rawToolMs,
        drivenActiveMs,
        timeShare,
        drivenCostUsd,
        costShare,
        instructionTokens: p.instructionTokens,
        executionTokens: p.executionTokens,
        directTokens: p.directTokens,
        compoundedCacheTokens: p.compoundedCacheTokens,
        totalTokens,
        tokenShare,
        estimatedCostUsd,
        warningCount: warnings.length,
        warnings,
        prescription,
        targetPaths: Array.from(p.targetPaths).slice(0, 10),
        children,
        chatCount: p.chatIds.size > 0 ? p.chatIds.size : fallbackChatCount
      };
    }).sort(comparePluginSkillMetricsByImpact),
    diagnosticsByConv,
    topPluginsByConv,
    scopeActiveMs: effectiveScopeActiveMs,
    scopeCostUsd,
    scopeContextTokens
  };
}
function buildConversationLiveDiagnostics(c, hitMap, unusedSet, skillReadCounts) {
  let findings = [], plannerSteps = c.plannerSteps, toolCalls = c.toolCalls, filesTouched = c.filesTouched, topTokenTools = [...toolCalls].filter((tc) => tc.attributedInputTokens > 0 || tc.compoundedCacheTokens > 0).sort(
    (a, b) => b.attributedInputTokens + b.compoundedCacheTokens - (a.attributedInputTokens + a.compoundedCacheTokens)
  ).slice(0, 5);
  for (let tc of topTokenTools) {
    let hit = hitMap.get(tc), label;
    hit ? hit.parentKind === "Plugin" ? label = hit.childName && hit.childName.toLowerCase() !== hit.parentName.toLowerCase() ? `Plugin ${hit.parentName} \u203A ${hit.childName}` : `Plugin ${hit.parentName}` : label = `Skill: ${hit.parentName}` : tc.skillName ? label = `Skill: ${tc.skillName}` : tc.mcpServer ? label = `MCP ${tc.mcpServer}: ${tc.toolName}` : label = `${tc.toolName}${tc.targetPath ? ` (${pathBaseName(tc.targetPath)})` : ""}`, findings.push({
      id: `tok-${tc.stepIndex}-${tc.toolName}`,
      severity: tc.compoundedCacheTokens > 25e3 ? "warning" : "info",
      category: "token_driver",
      title: `Token driver: ${label}`,
      detail: `${(tc.resultBytes / 1024).toFixed(1)} KB output added ~${fmtShortTok(tc.attributedInputTokens)} direct input tokens and ~${fmtShortTok(tc.compoundedCacheTokens)} compounded cache reads.`,
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: tc.attributedInputTokens + tc.compoundedCacheTokens,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex} (Turn ${tc.turnIndex + 1})`
    });
  }
  let reportedUnusedKeys = /* @__PURE__ */ new Set();
  for (let tc of unusedSet) {
    let hit = hitMap.get(tc);
    if (!hit) continue;
    let uk = `${hit.parentId}:${hit.childKey}`;
    if (reportedUnusedKeys.has(uk)) continue;
    reportedUnusedKeys.add(uk);
    let wasted = tc.attributedInputTokens + tc.compoundedCacheTokens, subLabel = hit.childName.toLowerCase() !== hit.parentName.toLowerCase() ? ` \u203A ${hit.childName}` : "";
    findings.push({
      id: `unused-${tc.stepIndex}-${hit.parentId}`,
      severity: "warning",
      category: "unused_skill",
      title: `Unused skill load: ${hit.parentName}${subLabel}`,
      detail: `SKILL.md was loaded (+${fmtShortTok(wasted)} direct + cache carry) without any ${hit.parentName} CLI or MCP tool calls in this chat. Tighten its description trigger so it only activates when needed.`,
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: wasted,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex} (Turn ${tc.turnIndex + 1})`
    });
  }
  for (let [readKey, info] of skillReadCounts.entries()) {
    if (info.count < 2) continue;
    let subLabel = info.hit.childName && info.hit.childName !== "SKILL.md" && info.hit.childName.toLowerCase() !== info.hit.parentName.toLowerCase() ? ` \u203A ${info.hit.childName}` : "";
    findings.push({
      id: `dupskill-${info.firstStep}-${info.hit.childKey}`,
      severity: "warning",
      category: "unused_skill",
      title: `Duplicate skill read: ${info.hit.parentName}${subLabel} (${info.count}\xD7)`,
      detail: `The same SKILL.md was read ${info.count} times in one conversation, adding ~${fmtShortTok(info.wastedTok)} redundant tokens.`,
      stepIndex: info.firstStep,
      turnIndex: info.firstTurn,
      impactTokens: info.wastedTok,
      impactMs: null,
      citation: `Step ${info.firstStep}`
    });
  }
  let convParentTokens = /* @__PURE__ */ new Map();
  for (let tc of toolCalls) {
    let hit = hitMap.get(tc);
    if (!hit) continue;
    let tok = tc.attributedInputTokens + tc.compoundedCacheTokens, cur = convParentTokens.get(hit.parentId) ?? {
      name: hit.parentName,
      instr: 0,
      total: 0,
      firstStep: tc.stepIndex,
      firstTurn: tc.turnIndex
    };
    cur.total += tok, hit.footprint === "instruction" && (cur.instr += tok), convParentTokens.set(hit.parentId, cur);
  }
  for (let [pid, stat] of convParentTokens.entries())
    stat.instr >= 25e3 && stat.total > 0 && stat.instr / stat.total >= 0.75 && findings.push({
      id: `overhead-${pid}`,
      severity: "warning",
      category: "high_skill_overhead",
      title: `High instruction carry: ${stat.name}`,
      detail: `${Math.round(stat.instr / stat.total * 100)}% (+${fmtShortTok(stat.instr)} tok) of ${stat.name}'s context footprint came from SKILL.md / reference markdown carried in prompt cache. Split bulky reference material into on-demand files.`,
      stepIndex: stat.firstStep,
      turnIndex: stat.firstTurn,
      impactTokens: stat.instr,
      impactMs: null,
      citation: `Step ${stat.firstStep}`
    });
  if (c.hasTokenTelemetry) {
    let first200k = plannerSteps.find(
      (s) => s.totalContextTokens >= 2e5 && s.totalContextTokens < 256e3
    ), first256k = plannerSteps.find((s) => s.totalContextTokens >= 256e3);
    first256k && findings.push({
      id: `cliff-256k-${first256k.stepIndex}`,
      severity: "critical",
      category: "compaction_cliff",
      title: `Exceeded 256k soft compaction ceiling at Step ${first256k.stepIndex}`,
      detail: `Context reached ${fmtShortTok(first256k.totalContextTokens)} tokens (${first256k.attributedSummary || "context growth"}), risking forced compaction and cache resets.`,
      stepIndex: first256k.stepIndex,
      turnIndex: first256k.turnIndex,
      impactTokens: first256k.totalContextTokens,
      impactMs: first256k.modelDurationMs,
      citation: `Planner Step ${first256k.stepIndex}`
    }), first200k && (!first256k || first200k.stepIndex !== first256k.stepIndex) && findings.push({
      id: `cliff-200k-${first200k.stepIndex}`,
      severity: "warning",
      category: "compaction_cliff",
      title: `Crossed 200k context cliff at Step ${first200k.stepIndex}`,
      detail: `Context crossed 200k (${fmtShortTok(first200k.totalContextTokens)} tokens \u2014 ${first200k.attributedSummary || "context growth"}). Pipe noisy outputs or delegate broad reads to subagents.`,
      stepIndex: first200k.stepIndex,
      turnIndex: first200k.turnIndex,
      impactTokens: first200k.totalContextTokens,
      impactMs: first200k.modelDurationMs,
      citation: `Planner Step ${first200k.stepIndex}`
    });
  }
  let coveredThrashCalls = /* @__PURE__ */ new Set(), runStart = 0;
  for (; runStart < toolCalls.length; ) {
    let tc = toolCalls[runStart];
    if (!tc.isError) {
      runStart += 1;
      continue;
    }
    let runEnd = runStart + 1;
    for (; runEnd < toolCalls.length && toolCalls[runEnd].isError && toolCalls[runEnd].toolName === tc.toolName; )
      runEnd += 1;
    let streak = toolCalls.slice(runStart, runEnd);
    if (streak.length >= 2) {
      for (let s of streak) coveredThrashCalls.add(s);
      let wastedTok = streak.reduce(
        (s, x) => s + x.attributedInputTokens + x.compoundedCacheTokens,
        0
      ), wastedMs = streak.reduce((s, x) => s + x.durationMs, 0), targetHint = tc.targetPath ? ` (${pathBaseName(tc.targetPath)})` : "";
      findings.push({
        id: `thrash-${tc.stepIndex}-${tc.toolName}`,
        severity: "warning",
        category: "tool_thrash",
        title: `Tool retry thrash: ${tc.toolName}${targetHint} (${streak.length} consecutive errors)`,
        detail: `${streak.length} consecutive failed ${tc.toolName} calls wasted ${fmtShortDur(wastedMs)} and ~${fmtShortTok(wastedTok)} tokens${tc.errorPreview ? `: ${tc.errorPreview.slice(0, 100)}` : ""}.`,
        stepIndex: tc.stepIndex,
        turnIndex: tc.turnIndex,
        impactTokens: wastedTok,
        impactMs: wastedMs,
        citation: `Step ${tc.stepIndex} (Turn ${tc.turnIndex + 1})`
      });
    }
    runStart = runEnd;
  }
  let turnTargetGroups = /* @__PURE__ */ new Map();
  for (let tc of toolCalls) {
    let targetKey = null;
    if (tc.toolName === "edit_file" || tc.toolName === "replace_file_content" || tc.toolName === "multi_replace_file_content") {
      let tgt = (tc.targetPath || tc.argsPreview || "").trim();
      tgt && (targetKey = `${tc.turnIndex}|edit|${tgt}`);
    } else if (tc.toolName === "run_command") {
      let cmd = (tc.argsPreview || "").trim().slice(0, 80);
      cmd && (targetKey = `${tc.turnIndex}|cmd|${cmd}`);
    }
    if (targetKey) {
      let list = turnTargetGroups.get(targetKey) ?? [];
      list.push(tc), turnTargetGroups.set(targetKey, list);
    }
  }
  for (let group of turnTargetGroups.values()) {
    if (group.length < 3) continue;
    let errCalls = group.filter((x) => x.isError);
    if (errCalls.length < 2 || errCalls.every((x) => coveredThrashCalls.has(x))) continue;
    let first = errCalls[0], wastedTok = errCalls.reduce(
      (s, x) => s + x.attributedInputTokens + x.compoundedCacheTokens,
      0
    ), wastedMs = errCalls.reduce((s, x) => s + x.durationMs, 0), targetHint = first.targetPath ? ` (${pathBaseName(first.targetPath)})` : first.argsPreview ? ` (${first.argsPreview.slice(0, 32)})` : "";
    findings.push({
      id: `thrash-turn-${first.turnIndex}-${first.stepIndex}-${first.toolName}`,
      severity: "warning",
      category: "tool_thrash",
      title: `Tool retry thrash: ${first.toolName}${targetHint} (${errCalls.length} errors in ${group.length} attempts)`,
      detail: `${group.length} ${first.toolName} attempts in Turn ${first.turnIndex + 1} hit ${errCalls.length} errors, wasting ${fmtShortDur(wastedMs)} and ~${fmtShortTok(wastedTok)} tokens${first.errorPreview ? `: ${first.errorPreview.slice(0, 100)}` : ""}.`,
      stepIndex: first.stepIndex,
      turnIndex: first.turnIndex,
      impactTokens: wastedTok,
      impactMs: wastedMs,
      citation: `Step ${first.stepIndex} (Turn ${first.turnIndex + 1})`
    });
  }
  if (c.parentConversationId === null) {
    let toolsByTurn = /* @__PURE__ */ new Map();
    for (let tc of toolCalls) {
      let arr = toolsByTurn.get(tc.turnIndex) ?? [];
      arr.push(tc), toolsByTurn.set(tc.turnIndex, arr);
    }
    for (let [turnIdx, tTools] of toolsByTurn.entries()) {
      let explore = tTools.filter(
        (t) => t.category === "file_read" || t.category === "search" || t.category === "command"
      ), writes = tTools.filter((t) => t.category === "file_write"), subs = tTools.filter((t) => t.category === "subagent"), carryTok = explore.reduce((s, t) => s + t.compoundedCacheTokens, 0);
      if (explore.length >= 6 && writes.length === 0 && subs.length === 0 && carryTok >= 25e3) {
        let firstStep = explore[0].stepIndex, durMs = explore.reduce((s, t) => s + t.durationMs, 0);
        findings.push({
          id: `subcand-turn-${turnIdx}`,
          severity: carryTok >= 5e4 ? "warning" : "info",
          category: "subagent_candidate",
          title: `Subagent candidate: ${explore.length} lookups in Turn ${turnIdx + 1}`,
          detail: `${explore.length} read/search/command calls stayed in the parent prompt cache (+${fmtShortTok(carryTok)} carry tokens). Delegate broad codebase exploration to a research subagent.`,
          stepIndex: firstStep,
          turnIndex: turnIdx,
          impactTokens: carryTok,
          impactMs: durMs,
          citation: `Turn ${turnIdx + 1} (Step ${firstStep})`
        });
      }
    }
  }
  for (let step of plannerSteps)
    step.isCacheMiss && findings.push({
      id: `miss-${step.stepIndex}`,
      severity: "warning",
      category: "cache_miss",
      title: `Cache miss at Step ${step.stepIndex}`,
      detail: `${step.cacheMissCause ?? "Prompt cache reset"} \u2014 ${fmtShortTok(step.inputTokens)} uncached input tokens (${Math.round(step.cacheHitRatio * 100)}% cache hit).`,
      stepIndex: step.stepIndex,
      turnIndex: step.turnIndex,
      impactTokens: step.inputTokens,
      impactMs: step.modelDurationMs,
      citation: `Planner Step ${step.stepIndex}`
    });
  let slowestCandidates = [];
  for (let tc of toolCalls)
    tc.durationMs >= 1500 && slowestCandidates.push({
      id: `slow-tc-${tc.stepIndex}-${tc.toolName}`,
      title: `Slow tool: ${tc.toolName}${tc.argsPreview ? ` (${tc.argsPreview.slice(0, 48)})` : ""}`,
      detail: `Took ${fmtShortDur(tc.durationMs)}${tc.isError ? " and exited with an error" : ""}.`,
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      ms: tc.durationMs
    });
  for (let ps of plannerSteps)
    ps.modelDurationMs >= 3e3 && slowestCandidates.push({
      id: `slow-ps-${ps.stepIndex}`,
      title: `Long model step: ${ps.model} (Step ${ps.stepIndex})`,
      detail: `Model thinking/generation took ${fmtShortDur(ps.modelDurationMs)} (${fmtShortTok(ps.outputTokens)} output tokens).`,
      stepIndex: ps.stepIndex,
      turnIndex: ps.turnIndex,
      ms: ps.modelDurationMs
    });
  slowestCandidates.sort((a, b) => b.ms - a.ms).slice(0, 5).forEach((item) => {
    findings.push({
      id: item.id,
      severity: item.ms >= 1e4 ? "warning" : "info",
      category: "slow_step",
      title: item.title,
      detail: item.detail,
      stepIndex: item.stepIndex,
      turnIndex: item.turnIndex,
      impactTokens: null,
      impactMs: item.ms,
      citation: `Step ${item.stepIndex}`
    });
  });
  for (let f of filesTouched)
    f.reads >= 3 && findings.push({
      id: `reread-${f.path}`,
      severity: "info",
      category: "repeated_read",
      title: `Repeated reads: ${pathBaseName(f.path)} (${f.reads}\xD7)`,
      detail: `${f.path} was read ${f.reads} times (${(f.totalBytesRead / 1024).toFixed(1)} KB total), contributing ~${fmtShortTok(f.directTokens)} direct tokens.`,
      stepIndex: null,
      turnIndex: null,
      impactTokens: f.directTokens,
      impactMs: null,
      citation: f.path
    });
  for (let tc of toolCalls)
    tc.isError && findings.push({
      id: `err-${tc.stepIndex}-${tc.toolName}`,
      severity: "critical",
      category: "error_retry",
      title: `Tool error: ${tc.toolName} at Step ${tc.stepIndex}`,
      detail: tc.errorPreview ?? "Tool reported an execution error.",
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: tc.attributedInputTokens,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex}`
    });
  if (plannerSteps.length > 0) {
    let switchCount = 0, missCount = 0, missUncachedTokens = 0, firstSwitch = null, modelTotals = /* @__PURE__ */ new Map();
    for (let i = 0; i < plannerSteps.length; i++) {
      let ps = plannerSteps[i], normModel = (ps.model || "").trim() || "unknown", curTotals = modelTotals.get(normModel) ?? { tokens: 0, steps: 0 };
      curTotals.tokens += ps.inputTokens + ps.cacheReadTokens + ps.outputTokens, curTotals.steps += 1, modelTotals.set(normModel, curTotals), i > 0 && ((plannerSteps[i - 1].model || "").trim() || "unknown") !== normModel && (switchCount += 1, firstSwitch || (firstSwitch = { stepIndex: ps.stepIndex, turnIndex: ps.turnIndex }), ps.isCacheMiss && (missCount += 1, missUncachedTokens += ps.inputTokens));
    }
    if (switchCount > 0 && firstSwitch) {
      let grandTokens = Array.from(modelTotals.values()).reduce(
        (sum, v) => sum + v.tokens,
        0
      ), grandSteps = plannerSteps.length, mixParts = Array.from(modelTotals.entries()).sort((a, b) => b[1].tokens - a[1].tokens || b[1].steps - a[1].steps).slice(0, 4).map(([model, v]) => `${grandTokens > 0 ? Math.round(v.tokens / grandTokens * 100) : Math.round(v.steps / grandSteps * 100)}% ${model}`), missNote = missCount > 0 ? `${missCount} switch(es) triggered a prompt cache miss (+${fmtShortTok(missUncachedTokens)} uncached input).` : "All switches preserved prompt cache.";
      findings.push({
        id: "model-split-summary",
        severity: missCount > 0 ? "warning" : "info",
        category: "model_split",
        title: `Orchestrator switched models ${switchCount}\xD7 across ${modelTotals.size} models`,
        detail: `Model mix${grandTokens > 0 ? "" : " (by steps)"}: ${mixParts.join(", ")} \xB7 ${missNote}`,
        stepIndex: firstSwitch.stepIndex,
        turnIndex: firstSwitch.turnIndex,
        impactTokens: missUncachedTokens > 0 ? missUncachedTokens : null,
        impactMs: null,
        citation: `Step ${firstSwitch.stepIndex}`
      });
    }
  }
  return findings;
}
function mergePluginSkillMetrics(projectLists, globalTotals) {
  let map = /* @__PURE__ */ new Map(), sumMergedTokens = 0, sumMergedDrivenMs = 0;
  for (let { projectPath, metrics } of projectLists)
    for (let m of metrics) {
      let cur = map.get(m.id) ?? {
        id: m.id,
        name: m.name,
        kind: m.kind,
        calls: 0,
        errors: 0,
        errorSamplesMap: /* @__PURE__ */ new Map(),
        totalDurationMs: 0,
        drivenActiveMs: 0,
        anyDrivenCost: !1,
        drivenCostSum: 0,
        anyEstCost: !1,
        estCostSum: 0,
        instructionTokens: 0,
        executionTokens: 0,
        directTokens: 0,
        compoundedCacheTokens: 0,
        totalTokens: 0,
        warnings: /* @__PURE__ */ new Set(),
        targetPaths: /* @__PURE__ */ new Set(),
        childrenMap: /* @__PURE__ */ new Map(),
        chatCount: 0,
        projects: /* @__PURE__ */ new Set()
      };
      cur.calls += m.calls, cur.errors += m.errors;
      for (let s of m.errorSamples ?? [])
        addErrorSample(cur.errorSamplesMap, s);
      cur.totalDurationMs += m.totalDurationMs, cur.drivenActiveMs += m.drivenActiveMs, m.drivenCostUsd !== null && (cur.anyDrivenCost = !0, cur.drivenCostSum += m.drivenCostUsd), m.estimatedCostUsd !== null && (cur.anyEstCost = !0, cur.estCostSum += m.estimatedCostUsd), cur.instructionTokens += m.instructionTokens, cur.executionTokens += m.executionTokens, cur.directTokens += m.directTokens, cur.compoundedCacheTokens += m.compoundedCacheTokens, cur.totalTokens += m.totalTokens, cur.chatCount += m.chatCount, cur.projects.add(projectPath);
      for (let w of m.warnings) cur.warnings.add(w);
      for (let tp of m.targetPaths) cur.targetPaths.add(tp);
      for (let ch of m.children) {
        let existingCh = cur.childrenMap.get(ch.key) ?? {
          key: ch.key,
          name: ch.name,
          kind: ch.kind,
          calls: 0,
          errors: 0,
          drivenActiveMs: 0,
          drivenCostUsd: null,
          instructionTokens: 0,
          executionTokens: 0,
          totalTokens: 0,
          duplicateReads: 0,
          isUnusedLoad: !1,
          targetPaths: [],
          anyCost: !1,
          costSum: 0,
          errorSamplesMap: /* @__PURE__ */ new Map()
        };
        existingCh.calls += ch.calls, existingCh.errors += ch.errors;
        for (let s of ch.errorSamples ?? [])
          addErrorSample(existingCh.errorSamplesMap, s);
        existingCh.drivenActiveMs += ch.drivenActiveMs, existingCh.instructionTokens += ch.instructionTokens, existingCh.executionTokens += ch.executionTokens, existingCh.totalTokens += ch.totalTokens, existingCh.duplicateReads += ch.duplicateReads, existingCh.isUnusedLoad = existingCh.isUnusedLoad || ch.isUnusedLoad, existingCh.targetPaths = Array.from(
          /* @__PURE__ */ new Set([...existingCh.targetPaths, ...ch.targetPaths])
        ).slice(0, 8), ch.drivenCostUsd !== null && (existingCh.anyCost = !0, existingCh.costSum += ch.drivenCostUsd), cur.childrenMap.set(ch.key, existingCh);
      }
      map.set(m.id, cur), sumMergedTokens += m.totalTokens, sumMergedDrivenMs += m.drivenActiveMs;
    }
  let denomActiveMs = globalTotals && globalTotals.activeMs > 0 ? globalTotals.activeMs : sumMergedDrivenMs, denomCostUsd = globalTotals?.estimatedCostUsd ?? null, denomContextTok = globalTotals && globalTotals.contextTokens > 0 ? globalTotals.contextTokens : sumMergedTokens, timeScale = denomActiveMs > 0 && sumMergedDrivenMs > denomActiveMs ? denomActiveMs / sumMergedDrivenMs : 1;
  return Array.from(map.values()).map((e) => {
    let drivenActiveMs = Math.round(e.drivenActiveMs * timeScale), drivenCostUsd = e.anyDrivenCost ? e.drivenCostSum : null, estimatedCostUsd = e.anyEstCost ? e.estCostSum : drivenCostUsd, children = Array.from(e.childrenMap.values()).map(({ anyCost, costSum, errorSamplesMap, ...rest }) => {
      let chSamples = finalizeErrorSamples(errorSamplesMap, 3);
      return {
        ...rest,
        drivenActiveMs: Math.round(rest.drivenActiveMs * timeScale),
        drivenCostUsd: anyCost ? costSum : null,
        ...chSamples.length > 0 ? { errorSamples: chSamples } : {}
      };
    }).sort(
      (a, b) => (b.drivenCostUsd ?? -1) - (a.drivenCostUsd ?? -1) || b.drivenActiveMs - a.drivenActiveMs || b.totalTokens - a.totalTokens || a.name.localeCompare(b.name)
    ), unusedChildren = children.filter((c) => c.isUnusedLoad).map((c) => c.name), dupChildren = children.filter((c) => c.duplicateReads > 0).map((c) => ({ name: c.name, dup: c.duplicateReads })), prescription = buildPrescription(
      e.name,
      e.kind,
      e.instructionTokens,
      e.totalTokens,
      unusedChildren,
      dupChildren
    ), warnings = Array.from(e.warnings), mergedSamples = finalizeErrorSamples(e.errorSamplesMap, 5);
    return {
      id: e.id,
      name: e.name,
      kind: e.kind,
      calls: e.calls,
      errors: e.errors,
      ...mergedSamples.length > 0 ? { errorSamples: mergedSamples } : {},
      totalDurationMs: e.totalDurationMs,
      drivenActiveMs,
      timeShare: denomActiveMs > 0 ? Math.min(1, drivenActiveMs / denomActiveMs) : 0,
      drivenCostUsd,
      costShare: denomCostUsd !== null && denomCostUsd > 0 && drivenCostUsd !== null ? Math.min(1, drivenCostUsd / denomCostUsd) : null,
      instructionTokens: e.instructionTokens,
      executionTokens: e.executionTokens,
      directTokens: e.directTokens,
      compoundedCacheTokens: e.compoundedCacheTokens,
      totalTokens: e.totalTokens,
      tokenShare: denomContextTok > 0 ? Math.min(1, e.totalTokens / denomContextTok) : 0,
      estimatedCostUsd,
      warningCount: warnings.length,
      warnings,
      prescription,
      targetPaths: Array.from(e.targetPaths).slice(0, 10),
      children,
      chatCount: e.chatCount,
      projectCount: e.projects.size
    };
  }).sort(comparePluginSkillMetricsByImpact);
}

// src/server/analytics.ts
function mergeIntervalsWallMs(intervals) {
  if (intervals.length === 0) return 0;
  let sorted = intervals.filter((iv) => iv.end >= iv.start && iv.start > 0).sort((a, b) => a.start - b.start);
  if (sorted.length === 0) return 0;
  let total = 0, curStart = sorted[0].start, curEnd = sorted[0].end;
  for (let i = 1; i < sorted.length; i++) {
    let iv = sorted[i];
    iv.start <= curEnd ? iv.end > curEnd && (curEnd = iv.end) : (total += curEnd - curStart, curStart = iv.start, curEnd = iv.end);
  }
  return total += curEnd - curStart, total;
}
function formatShortTokens(n) {
  return n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n);
}
function formatDurationShort(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  if (ms < 1e3) return `${Math.round(ms)}ms`;
  let totalSec = Math.round(ms / 1e3);
  if (totalSec < 60) return `${(ms / 1e3).toFixed(1)}s`;
  let min = Math.floor(totalSec / 60), remSec = totalSec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  let hr = Math.floor(min / 60), remMin = min % 60;
  return `${hr}h ${remMin}m`;
}
function analyzeConversation(parsed, hookEvents, meta) {
  let stepToTools = /* @__PURE__ */ new Map();
  for (let tc of parsed.toolCalls) {
    let list = stepToTools.get(tc.plannerStepIndex) ?? [];
    list.push(tc), stepToTools.set(tc.plannerStepIndex, list);
  }
  let terminationReason = null, stopOrPostEvents = hookEvents.filter(
    (h) => h.hookEventName === "Stop" || h.hookEventName === "PostInvocation"
  );
  for (let i = hookEvents.length - 1; i >= 0; i--)
    if (hookEvents[i].terminationReason) {
      terminationReason = hookEvents[i].terminationReason;
      break;
    }
  let usableHookModels = hookEvents.map((h) => ({
    tsMs: h.tsMs,
    stepIdx: h.stepIdx,
    cleanModel: typeof h.modelName == "string" ? h.modelName.trim() : ""
  })).filter((h) => {
    let lower = h.cleanModel.toLowerCase();
    return !!(lower && lower !== "auto" && lower !== "unknown");
  }), resolvedPlannerSteps = parsed.plannerSteps.map((step) => {
    let trimmed = typeof step.model == "string" ? step.model.trim() : "";
    if (step.modelSource === "transcript" || step.modelSource === void 0 && trimmed.length > 0 && trimmed !== "unknown")
      return { ...step, model: trimmed };
    let hookMatchModel = null, bestStepTs = Number.NEGATIVE_INFINITY;
    for (let hm of usableHookModels)
      hm.stepIdx === step.stepIndex && hm.tsMs >= bestStepTs && (bestStepTs = hm.tsMs, hookMatchModel = hm.cleanModel);
    if (!hookMatchModel && step.createdAtMs > 0) {
      let bestTimeTs = Number.NEGATIVE_INFINITY;
      for (let hm of usableHookModels)
        hm.tsMs > 0 && hm.tsMs <= step.createdAtMs + 5e3 && hm.tsMs >= bestTimeTs && (bestTimeTs = hm.tsMs, hookMatchModel = hm.cleanModel);
    }
    let resolvedModel = hookMatchModel ?? (step.modelSource === "settings_change" && trimmed && trimmed !== "unknown" ? trimmed : "unknown");
    return { ...step, model: resolvedModel };
  }), plannerStepsAnalyzed = [];
  for (let i = 0; i < resolvedPlannerSteps.length; i++) {
    let step = resolvedPlannerSteps[i], prev = i > 0 ? resolvedPlannerSteps[i - 1] : null, prevContext = prev ? prev.totalContextTokens : 0, isCacheMiss = !1, cacheMissCause = null;
    if (prev && prevContext > 1e3 && step.cacheReadTokens < prevContext * 0.8) {
      isCacheMiss = !0;
      let gapMs = step.createdAtMs > 0 && prev.createdAtMs > 0 ? step.createdAtMs - prev.createdAtMs : 0;
      step.turnIndex > prev.turnIndex && gapMs >= 240 * 1e3 ? cacheMissCause = "Idle gap expired prompt cache TTL" : step.model && prev.model && step.model !== prev.model ? cacheMissCause = `Model changed (${prev.model} \u2192 ${step.model})` : cacheMissCause = "Context compaction or prefix reset";
    }
    let hitDenom = step.inputTokens + step.cacheReadTokens;
    plannerStepsAnalyzed.push({
      stepIndex: step.stepIndex,
      turnIndex: step.turnIndex,
      model: step.model,
      createdAtMs: step.createdAtMs,
      completedAtMs: null,
      modelDurationMs: 0,
      inputTokens: step.inputTokens,
      cacheReadTokens: step.cacheReadTokens,
      outputTokens: step.outputTokens,
      totalContextTokens: step.totalContextTokens,
      cacheHitRatio: hitDenom > 0 ? step.cacheReadTokens / hitDenom : 0,
      isCacheMiss,
      cacheMissCause,
      thinkingChars: step.thinkingChars,
      contentChars: step.contentChars,
      toolCallCount: step.toolCallCount,
      status: step.status,
      attributedSummary: i === 0 ? "System prompt & initial request" : "",
      attributionNote: ""
    });
  }
  let remainingStepsAfter = new Array(plannerStepsAnalyzed.length).fill(0);
  for (let i = 0; i < plannerStepsAnalyzed.length; i++) {
    let count = 0;
    for (let j = i + 1; j < plannerStepsAnalyzed.length && !plannerStepsAnalyzed[j].isCacheMiss; j++)
      count += 1;
    remainingStepsAfter[i] = count;
  }
  let analyzedTools = parsed.toolCalls.map((tc) => ({
    stepIndex: tc.stepIndex,
    plannerStepIndex: tc.plannerStepIndex,
    turnIndex: tc.turnIndex,
    toolCallId: tc.toolCallId,
    toolName: tc.toolName,
    category: tc.category,
    mcpServer: tc.mcpServer,
    skillName: tc.skillName,
    skillPlugin: tc.skillPlugin,
    targetPath: tc.targetPath,
    childConversationId: tc.childConversationId,
    childConversationIds: tc.childConversationIds,
    childLinks: tc.childLinks,
    startedAtMs: tc.startedAtMs,
    completedAtMs: tc.completedAtMs,
    durationMs: tc.durationMs,
    argsPreview: tc.argsPreview,
    resultBytes: tc.resultBytes,
    estResultTokens: tc.estResultTokens,
    attributedInputTokens: 0,
    compoundedCacheTokens: 0,
    isError: tc.isError,
    errorPreview: tc.errorPreview
  })), toolsByPlanner = /* @__PURE__ */ new Map();
  for (let tc of analyzedTools) {
    let arr = toolsByPlanner.get(tc.plannerStepIndex) ?? [];
    arr.push(tc), toolsByPlanner.set(tc.plannerStepIndex, arr);
  }
  for (let i = 1; i < plannerStepsAnalyzed.length; i++) {
    let curr = plannerStepsAnalyzed[i], prev = plannerStepsAnalyzed[i - 1], prevTools = toolsByPlanner.get(prev.stepIndex) ?? [], promptEstTokens = 0;
    if (curr.turnIndex > prev.turnIndex) {
      let turn = parsed.turns.find((t) => t.turnIndex === curr.turnIndex);
      turn && (promptEstTokens = Math.ceil(turn.promptBytes / 4));
    }
    let totalToolEst = prevTools.reduce((sum, tc) => sum + tc.estResultTokens, 0), attributablePool = curr.isCacheMiss ? Math.min(curr.inputTokens, totalToolEst + promptEstTokens) : curr.inputTokens, denom = totalToolEst + promptEstTokens, carryMultiplier = remainingStepsAfter[i];
    if (prevTools.length > 0 && denom > 0 && attributablePool > 0) {
      let toolShare = attributablePool * (totalToolEst / denom);
      for (let tc of prevTools) {
        let share = totalToolEst > 0 ? Math.round(toolShare * (tc.estResultTokens / totalToolEst)) : 0;
        tc.attributedInputTokens = share, tc.compoundedCacheTokens = share * carryMultiplier;
      }
      let topTool = [...prevTools].sort(
        (a, b) => b.attributedInputTokens - a.attributedInputTokens
      )[0];
      curr.attributedSummary = curr.isCacheMiss ? `${curr.cacheMissCause ?? "Cache miss"} (+${formatShortTokens(curr.inputTokens)} uncached)` : `Driven by ${topTool.skillName ?? topTool.toolName} (+${formatShortTokens(topTool.attributedInputTokens)})`;
    } else curr.isCacheMiss ? curr.attributedSummary = curr.cacheMissCause ?? "Cache miss / reset" : curr.turnIndex > prev.turnIndex ? curr.attributedSummary = "User follow-up prompt" : curr.attributedSummary = "Model continuation";
  }
  let consumedHookIds = /* @__PURE__ */ new Set(), extraApprovalIdleMs = 0;
  for (let i = 0; i < plannerStepsAnalyzed.length; i++) {
    let step = plannerStepsAnalyzed[i], tools = toolsByPlanner.get(step.stepIndex) ?? [], nextStep = i + 1 < plannerStepsAnalyzed.length ? plannerStepsAnalyzed[i + 1] : null, estFallbackMs = Math.max(
      400,
      Math.min(18e4, Math.round(step.outputTokens / 65 * 1e3))
    );
    if (tools.length > 0) {
      let validStarts = tools.map((t) => t.startedAtMs).filter((ms) => ms !== null && ms > 0), firstToolStart = validStarts.length > 0 ? Math.min(...validStarts) : null;
      if (firstToolStart !== null && step.createdAtMs > 0 && firstToolStart >= step.createdAtMs) {
        let rawGap = firstToolStart - step.createdAtMs;
        rawGap > 3e5 ? (step.modelDurationMs = estFallbackMs, extraApprovalIdleMs += rawGap - estFallbackMs, step.completedAtMs = step.createdAtMs + estFallbackMs) : (step.modelDurationMs = rawGap, step.completedAtMs = firstToolStart);
      } else
        step.modelDurationMs = estFallbackMs, step.completedAtMs = step.createdAtMs > 0 ? step.createdAtMs + estFallbackMs : null;
    } else {
      let nextTurn = parsed.turns.find((t) => t.turnIndex === step.turnIndex + 1), upperBound = Math.min(
        nextStep && nextStep.createdAtMs > step.createdAtMs ? nextStep.createdAtMs : Number.POSITIVE_INFINITY,
        nextTurn && nextTurn.createdAtMs > step.createdAtMs ? nextTurn.createdAtMs : Number.POSITIVE_INFINITY,
        step.createdAtMs > 0 ? step.createdAtMs + 3e5 : Number.POSITIVE_INFINITY
      ), hookMatch = stopOrPostEvents.find(
        (h) => !consumedHookIds.has(h.id) && step.createdAtMs > 0 && h.tsMs >= step.createdAtMs && h.tsMs <= upperBound && (!nextStep || nextStep.createdAtMs <= step.createdAtMs || h.tsMs <= nextStep.createdAtMs)
      );
      hookMatch && step.createdAtMs > 0 ? (consumedHookIds.add(hookMatch.id), step.modelDurationMs = Math.max(
        100,
        Math.min(3e5, hookMatch.tsMs - step.createdAtMs)
      ), step.completedAtMs = hookMatch.tsMs) : (step.modelDurationMs = estFallbackMs, step.completedAtMs = step.createdAtMs > 0 ? step.createdAtMs + estFallbackMs : null);
    }
  }
  let turnRecords = [], prevTurnEndMs = 0;
  for (let tIdx = 0; tIdx < parsed.turns.length; tIdx++) {
    let t = parsed.turns[tIdx], tSteps = plannerStepsAnalyzed.filter((s) => s.turnIndex === t.turnIndex), tTools = analyzedTools.filter((tc) => tc.turnIndex === t.turnIndex), modelMs2 = tSteps.reduce((sum, s) => sum + s.modelDurationMs, 0), toolIntervals = tTools.filter(
      (tc) => !isIdleWaitTool(tc.toolName) && tc.startedAtMs !== null && tc.startedAtMs > 0
    ).map((tc) => ({
      start: tc.startedAtMs,
      end: Math.max(tc.startedAtMs, tc.completedAtMs ?? tc.startedAtMs + tc.durationMs)
    })), toolWallMs2 = mergeIntervalsWallMs(toolIntervals), activeMs2 = modelMs2 + toolWallMs2, startCandidates = [
      t.createdAtMs,
      ...tSteps.map((s) => s.createdAtMs).filter((ms) => ms > 0)
    ].filter((ms) => ms > 0), startedAtMs2 = startCandidates.length > 0 ? Math.min(...startCandidates) : 0, endCandidates = [
      startedAtMs2,
      ...tSteps.map((s) => s.completedAtMs ?? s.createdAtMs).filter((ms) => ms > 0),
      ...tTools.map((tc) => tc.completedAtMs ?? tc.startedAtMs ?? 0).filter((ms) => ms > 0)
    ].filter((ms) => ms > 0), endedAtMs2 = endCandidates.length > 0 ? Math.max(...endCandidates) : startedAtMs2, userIdleBeforeMs = tIdx > 0 && prevTurnEndMs > 0 && startedAtMs2 > prevTurnEndMs ? startedAtMs2 - prevTurnEndMs : 0;
    prevTurnEndMs = endedAtMs2;
    let inputTokens2 = tSteps.reduce((sum, s) => sum + s.inputTokens, 0), cacheReadTokens2 = tSteps.reduce((sum, s) => sum + s.cacheReadTokens, 0), outputTokens2 = tSteps.reduce((sum, s) => sum + s.outputTokens, 0), denom = inputTokens2 + cacheReadTokens2;
    turnRecords.push({
      turnIndex: t.turnIndex,
      promptPreview: t.promptPreview,
      slashCommand: t.slashCommand,
      startedAtMs: startedAtMs2,
      endedAtMs: endedAtMs2,
      activeMs: activeMs2,
      modelMs: modelMs2,
      toolWallMs: toolWallMs2,
      userIdleBeforeMs,
      inputTokens: inputTokens2,
      cacheReadTokens: cacheReadTokens2,
      outputTokens: outputTokens2,
      cacheHitRatio: denom > 0 ? cacheReadTokens2 / denom : 0
    });
  }
  let filesMap = /* @__PURE__ */ new Map();
  for (let tc of analyzedTools) {
    if (!tc.targetPath) continue;
    let existing = filesMap.get(tc.targetPath) ?? {
      path: tc.targetPath,
      reads: 0,
      edits: 0,
      creates: 0,
      totalBytesRead: 0,
      directTokens: 0,
      compoundedCacheTokens: 0,
      lastTouchedAtMs: 0
    };
    tc.toolName === "write_file" ? existing.creates += 1 : tc.toolName === "edit_file" || tc.toolName === "replace_file_content" || tc.toolName === "multi_replace_file_content" ? existing.edits += 1 : (existing.reads += 1, existing.totalBytesRead += tc.resultBytes), existing.directTokens += tc.attributedInputTokens, existing.compoundedCacheTokens += tc.compoundedCacheTokens;
    let touchTs = tc.completedAtMs ?? tc.startedAtMs ?? 0;
    touchTs > existing.lastTouchedAtMs && (existing.lastTouchedAtMs = touchTs), filesMap.set(tc.targetPath, existing);
  }
  let filesTouched = Array.from(filesMap.values()).sort(
    (a, b) => b.compoundedCacheTokens + b.directTokens - (a.compoundedCacheTokens + a.directTokens)
  ), inputTokens = plannerStepsAnalyzed.reduce((s, p) => s + p.inputTokens, 0), cacheReadTokens = plannerStepsAnalyzed.reduce((s, p) => s + p.cacheReadTokens, 0), outputTokens = plannerStepsAnalyzed.reduce((s, p) => s + p.outputTokens, 0), peakContextTokens = plannerStepsAnalyzed.reduce(
    (max, p) => Math.max(max, p.totalContextTokens),
    0
  ), modelMs = turnRecords.reduce((s, t) => s + t.modelMs, 0), toolWallMs = turnRecords.reduce((s, t) => s + t.toolWallMs, 0), toolSumMs = analyzedTools.filter((tc) => !isIdleWaitTool(tc.toolName)).reduce((s, tc) => s + tc.durationMs, 0), userIdleMs = turnRecords.reduce((s, t) => s + t.userIdleBeforeMs, 0) + extraApprovalIdleMs, startedAtMs = turnRecords.length > 0 && turnRecords[0].startedAtMs > 0 ? turnRecords[0].startedAtMs : parsed.startedAtMs, endedAtMs = turnRecords.length > 0 ? Math.max(parsed.endedAtMs, ...turnRecords.map((t) => t.endedAtMs)) : parsed.endedAtMs, rawActiveMs = modelMs + toolWallMs, wallClockMs = endedAtMs > startedAtMs ? endedAtMs - startedAtMs : rawActiveMs, activeMs = wallClockMs > 0 ? Math.min(rawActiveMs, wallClockMs) : rawActiveMs, errorCount = analyzedTools.filter((t) => t.isError).length, skillsUsed = Array.from(
    new Set(
      analyzedTools.map((t) => t.skillName).filter((s) => typeof s == "string" && s.length > 0)
    )
  ).sort(), diagnostics = buildDiagnostics(
    plannerStepsAnalyzed,
    analyzedTools,
    filesTouched
  ), title = parsed.title;
  if (!(parsed.hasExplicitUserPrompt ?? !0) || title === parsed.conversationId.slice(0, 8)) {
    let roleOrType = meta.subagentRole || meta.subagentType;
    roleOrType && parsed.systemTaskPreview ? title = `${roleOrType} \u2014 ${parsed.systemTaskPreview}`.slice(0, 80) : roleOrType ? title = roleOrType : parsed.systemTaskPreview && (title = parsed.systemTaskPreview.slice(0, 76));
  }
  let resolvedModels = plannerStepsAnalyzed.length > 0 ? Array.from(
    new Set(
      plannerStepsAnalyzed.map((p) => p.model).filter((m) => m && m !== "unknown")
    )
  ) : parsed.models;
  return {
    conversationId: parsed.conversationId,
    title,
    surface: meta.surface,
    transcriptPath: parsed.transcriptPath,
    projectPath: meta.projectPath,
    projectSource: meta.projectSource,
    parentConversationId: meta.parentConversationId,
    subagentRole: meta.subagentRole,
    subagentType: meta.subagentType,
    swarmRole: meta.swarmRole ?? null,
    swarmTitle: meta.swarmTitle ?? null,
    swarmTasks: meta.swarmTasks,
    startedAtMs,
    endedAtMs,
    terminationReason,
    models: resolvedModels,
    slashCommands: parsed.slashCommands,
    skillsUsed,
    hasLiveHooks: hookEvents.length > 0,
    hasTokenTelemetry: parsed.hasTokenTelemetry ?? parsed.plannerSteps.length > 0,
    inputTokens,
    cacheReadTokens,
    outputTokens,
    peakContextTokens,
    activeMs,
    modelMs,
    toolWallMs,
    toolSumMs,
    userIdleMs,
    wallClockMs,
    errorCount,
    turns: turnRecords,
    plannerSteps: plannerStepsAnalyzed.map(({ attributionNote: _unused, ...rest }) => rest),
    toolCalls: analyzedTools,
    diagnostics,
    filesTouched,
    modelUnavailableErrors: parsed.modelUnavailableErrors ?? [],
    indexedAtMs: Date.now()
  };
}
function buildDiagnostics(plannerSteps, toolCalls, filesTouched) {
  let findings = [], topTokenTools = [...toolCalls].filter((tc) => tc.attributedInputTokens > 0 || tc.compoundedCacheTokens > 0).sort(
    (a, b) => b.attributedInputTokens + b.compoundedCacheTokens - (a.attributedInputTokens + a.compoundedCacheTokens)
  ).slice(0, 5);
  for (let tc of topTokenTools) {
    let label = tc.skillName ? `Skill: ${tc.skillName}` : tc.mcpServer ? `MCP ${tc.mcpServer}: ${tc.toolName}` : `${tc.toolName}${tc.targetPath ? ` (${pathBaseName(tc.targetPath)})` : ""}`;
    findings.push({
      id: `tok-${tc.stepIndex}-${tc.toolName}`,
      severity: tc.compoundedCacheTokens > 25e3 ? "warning" : "info",
      category: "token_driver",
      title: `Token driver: ${label}`,
      detail: `${(tc.resultBytes / 1024).toFixed(1)} KB output added ~${formatShortTokens(tc.attributedInputTokens)} direct input tokens and ~${formatShortTokens(tc.compoundedCacheTokens)} compounded cache reads.`,
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: tc.attributedInputTokens + tc.compoundedCacheTokens,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex} (Turn ${tc.turnIndex + 1})`
    });
  }
  for (let step of plannerSteps)
    step.isCacheMiss && findings.push({
      id: `miss-${step.stepIndex}`,
      severity: "warning",
      category: "cache_miss",
      title: `Cache miss at Step ${step.stepIndex}`,
      detail: `${step.cacheMissCause ?? "Prompt cache reset"} \u2014 ${formatShortTokens(step.inputTokens)} uncached input tokens (${Math.round(step.cacheHitRatio * 100)}% cache hit).`,
      stepIndex: step.stepIndex,
      turnIndex: step.turnIndex,
      impactTokens: step.inputTokens,
      impactMs: step.modelDurationMs,
      citation: `Planner Step ${step.stepIndex}`
    });
  let slowestCandidates = [];
  for (let tc of toolCalls)
    tc.durationMs >= 1500 && !isIdleWaitTool(tc.toolName) && slowestCandidates.push({
      id: `slow-tc-${tc.stepIndex}-${tc.toolName}`,
      title: `Slow tool: ${tc.toolName}${tc.argsPreview ? ` (${tc.argsPreview.slice(0, 48)})` : ""}`,
      detail: `Took ${formatDurationShort(tc.durationMs)}${tc.isError ? " and exited with an error" : ""}.`,
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      ms: tc.durationMs
    });
  for (let ps of plannerSteps)
    ps.modelDurationMs >= 3e3 && slowestCandidates.push({
      id: `slow-ps-${ps.stepIndex}`,
      title: `Long model step: ${ps.model} (Step ${ps.stepIndex})`,
      detail: `Model thinking/generation took ${formatDurationShort(ps.modelDurationMs)} (${formatShortTokens(ps.outputTokens)} output tokens).`,
      stepIndex: ps.stepIndex,
      turnIndex: ps.turnIndex,
      ms: ps.modelDurationMs
    });
  slowestCandidates.sort((a, b) => b.ms - a.ms).slice(0, 5).forEach((item) => {
    findings.push({
      id: item.id,
      severity: item.ms >= 1e4 ? "warning" : "info",
      category: "slow_step",
      title: item.title,
      detail: item.detail,
      stepIndex: item.stepIndex,
      turnIndex: item.turnIndex,
      impactTokens: null,
      impactMs: item.ms,
      citation: `Step ${item.stepIndex}`
    });
  });
  for (let f of filesTouched)
    f.reads >= 3 && findings.push({
      id: `reread-${f.path}`,
      severity: "info",
      category: "repeated_read",
      title: `Repeated reads: ${pathBaseName(f.path)} (${f.reads}\xD7)`,
      detail: `${f.path} was read ${f.reads} times (${(f.totalBytesRead / 1024).toFixed(1)} KB total), contributing ~${formatShortTokens(f.directTokens)} direct tokens.`,
      stepIndex: null,
      turnIndex: null,
      impactTokens: f.directTokens,
      impactMs: null,
      citation: f.path
    });
  for (let tc of toolCalls)
    tc.isError && findings.push({
      id: `err-${tc.stepIndex}-${tc.toolName}`,
      severity: "critical",
      category: "error_retry",
      title: `Tool error: ${tc.toolName} at Step ${tc.stepIndex}`,
      detail: tc.errorPreview ?? "Tool reported an execution error.",
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: tc.attributedInputTokens,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex}`
    });
  if (plannerSteps.length > 0) {
    let switchCount = 0, missCount = 0, missUncachedTokens = 0, firstSwitch = null, modelTotals = /* @__PURE__ */ new Map();
    for (let i = 0; i < plannerSteps.length; i++) {
      let ps = plannerSteps[i], normModel = (ps.model || "").trim() || "unknown", curTotals = modelTotals.get(normModel) ?? { tokens: 0, steps: 0 };
      curTotals.tokens += ps.inputTokens + ps.cacheReadTokens + ps.outputTokens, curTotals.steps += 1, modelTotals.set(normModel, curTotals), i > 0 && ((plannerSteps[i - 1].model || "").trim() || "unknown") !== normModel && (switchCount += 1, firstSwitch || (firstSwitch = { stepIndex: ps.stepIndex, turnIndex: ps.turnIndex }), ps.isCacheMiss && (missCount += 1, missUncachedTokens += ps.inputTokens));
    }
    if (switchCount > 0 && firstSwitch) {
      let grandTokens = Array.from(modelTotals.values()).reduce(
        (sum, v) => sum + v.tokens,
        0
      ), grandSteps = plannerSteps.length, mixParts = Array.from(modelTotals.entries()).sort((a, b) => b[1].tokens - a[1].tokens || b[1].steps - a[1].steps).slice(0, 4).map(([model, v]) => `${grandTokens > 0 ? Math.round(v.tokens / grandTokens * 100) : Math.round(v.steps / grandSteps * 100)}% ${model}`), missNote = missCount > 0 ? `${missCount} switch(es) triggered a prompt cache miss (+${formatShortTokens(missUncachedTokens)} uncached input).` : "All switches preserved prompt cache.";
      findings.push({
        id: "model-split-summary",
        severity: missCount > 0 ? "warning" : "info",
        category: "model_split",
        title: `Orchestrator switched models ${switchCount}\xD7 across ${modelTotals.size} models`,
        detail: `Model mix${grandTokens > 0 ? "" : " (by steps)"}: ${mixParts.join(", ")} \xB7 ${missNote}`,
        stepIndex: firstSwitch.stepIndex,
        turnIndex: firstSwitch.turnIndex,
        impactTokens: missUncachedTokens > 0 ? missUncachedTokens : null,
        impactMs: null,
        citation: `Step ${firstSwitch.stepIndex}`
      });
    }
  }
  return findings;
}
function aggregateSkillToolMetrics(toolCalls, plannerSteps, pricingRules) {
  let stepModelMap = /* @__PURE__ */ new Map();
  for (let ps of plannerSteps)
    stepModelMap.set(ps.stepIndex, ps.model);
  let map = /* @__PURE__ */ new Map();
  for (let tc of toolCalls) {
    let category = "Tool", name = tc.toolName, pluginOrServer = null;
    if (tc.category === "skill" && tc.skillName)
      category = "Skill", name = tc.skillName, pluginOrServer = tc.skillPlugin;
    else if (tc.category === "mcp")
      category = "MCP", pluginOrServer = tc.mcpServer, name = tc.mcpServer ? `${tc.mcpServer}:${tc.toolName}` : tc.toolName;
    else if (tc.category === "subagent") {
      category = "Subagent";
      let roleMatch = tc.argsPreview.match(/Role:\s*([^|]+)/i), typeMatch = tc.argsPreview.match(/Type:\s*([^|]+)/i);
      name = roleMatch?.[1]?.trim() || typeMatch?.[1]?.trim() || tc.toolName, pluginOrServer = typeMatch?.[1]?.trim() ?? null;
    }
    let key = `${category}:${name}`, entry = map.get(key) ?? {
      key,
      name,
      category,
      pluginOrServer,
      calls: 0,
      errors: 0,
      totalDurationMs: 0,
      resultBytes: 0,
      directTokens: 0,
      compoundedCacheTokens: 0,
      estimatedCostUsd: null,
      costKnown: !1,
      costAcc: 0,
      intervals: [],
      unplacedDurationMs: 0,
      errorSamplesMap: /* @__PURE__ */ new Map()
    };
    entry.calls += 1, tc.isError && (entry.errors += 1, addErrorSample(
      entry.errorSamplesMap,
      {
        message: normalizeErrorSampleMessage(tc.errorPreview),
        toolName: tc.toolName,
        target: formatErrorSampleTarget(tc),
        count: 1,
        ...tc.conversationId ? { conversationId: tc.conversationId } : {},
        ...tc.conversationTitle ? { conversationTitle: tc.conversationTitle } : {},
        stepIndex: tc.stepIndex
      },
      !1
    )), tc.startedAtMs !== null && tc.startedAtMs > 0 ? entry.intervals.push({
      start: tc.startedAtMs,
      end: Math.max(
        tc.startedAtMs,
        tc.completedAtMs ?? tc.startedAtMs + tc.durationMs
      )
    }) : entry.unplacedDurationMs += tc.durationMs, entry.resultBytes += tc.resultBytes, entry.directTokens += tc.attributedInputTokens, entry.compoundedCacheTokens += tc.compoundedCacheTokens;
    let model = stepModelMap.get(tc.plannerStepIndex) ?? "", stepEst = estimateStepCost(
      {
        inputTokens: tc.attributedInputTokens,
        cacheReadTokens: tc.compoundedCacheTokens,
        outputTokens: 0
      },
      model,
      pricingRules
    );
    !stepEst.unpriced && stepEst.totalUsd !== null && (entry.costKnown = !0, entry.costAcc += stepEst.totalUsd), map.set(key, entry);
  }
  return Array.from(map.values()).map(
    ({
      costKnown,
      costAcc,
      intervals,
      unplacedDurationMs,
      errorSamplesMap,
      ...rest
    }) => {
      let samples = finalizeErrorSamples(errorSamplesMap, 3);
      return {
        ...rest,
        ...samples.length > 0 ? { errorSamples: samples } : {},
        totalDurationMs: mergeIntervalsWallMs(intervals) + unplacedDurationMs,
        estimatedCostUsd: costKnown ? costAcc : null
      };
    }
  ).sort(
    (a, b) => b.compoundedCacheTokens + b.directTokens - (a.compoundedCacheTokens + a.directTokens) || b.totalDurationMs - a.totalDurationMs
  );
}
var PROJECT_NAME_TTL_MS = 3e4, projectNameCache = /* @__PURE__ */ new Map();
function readTextSafe2(filePath) {
  try {
    return !fs5.existsSync(filePath) || !fs5.statSync(filePath).isFile() ? null : fs5.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}
function extractTomlSectionName(content, targetSections) {
  let currentSection = "";
  for (let rawLine of content.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    let secMatch = line.match(/^\[([^\]]+)\]/);
    if (secMatch) {
      currentSection = secMatch[1].trim();
      continue;
    }
    if (targetSections.includes(currentSection)) {
      let nameMatch = line.match(/^name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch[1].trim())
        return nameMatch[1].trim();
    }
  }
  return null;
}
function extractOriginRepoNameFromConfig(configText) {
  let inOrigin = !1;
  for (let rawLine of configText.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!(!line || line.startsWith("#") || line.startsWith(";"))) {
      if (line.startsWith("[")) {
        inOrigin = /^\[remote\s+"origin"\]$/i.test(line);
        continue;
      }
      if (inOrigin) {
        let urlMatch = line.match(/^url\s*=\s*(.+)$/);
        if (urlMatch) {
          let cleaned = urlMatch[1].trim().replace(/\/+$/, "").replace(/\.git$/i, ""), sepIdx = Math.max(
            cleaned.lastIndexOf("/"),
            cleaned.lastIndexOf(":")
          ), repo = sepIdx >= 0 ? cleaned.slice(sepIdx + 1).trim() : cleaned;
          if (repo) return repo;
        }
      }
    }
  }
  return null;
}
function resolveGitOriginRepoName(projectPath) {
  let dotGit = path4.join(projectPath, ".git");
  try {
    if (!fs5.existsSync(dotGit)) return null;
    let st = fs5.statSync(dotGit), configCandidates = [];
    if (st.isDirectory())
      configCandidates.push(path4.join(dotGit, "config"));
    else if (st.isFile()) {
      let gitDirMatch = fs5.readFileSync(dotGit, "utf8").match(/^gitdir:\s*(.+)$/im);
      if (gitDirMatch) {
        let resolvedGitDir = path4.resolve(projectPath, gitDirMatch[1].trim());
        configCandidates.push(path4.join(resolvedGitDir, "config"));
        let commonDirText = readTextSafe2(path4.join(resolvedGitDir, "commondir"));
        if (commonDirText && commonDirText.trim()) {
          let commonDir = path4.resolve(resolvedGitDir, commonDirText.trim());
          configCandidates.push(path4.join(commonDir, "config"));
        }
      }
    }
    for (let cfgPath of configCandidates) {
      let cfg = readTextSafe2(cfgPath);
      if (!cfg) continue;
      let repo = extractOriginRepoNameFromConfig(cfg);
      if (repo) return repo;
    }
  } catch {
    return null;
  }
  return null;
}
function resolveProjectDisplayName(projectPath) {
  let pluginText = readTextSafe2(path4.join(projectPath, "plugin.json"));
  if (pluginText)
    try {
      let parsed = JSON.parse(pluginText);
      if (typeof parsed.displayName == "string" && parsed.displayName.trim())
        return parsed.displayName.trim();
      if (typeof parsed.name == "string" && parsed.name.trim())
        return parsed.name.trim();
    } catch {
    }
  let pkgText = readTextSafe2(path4.join(projectPath, "package.json"));
  if (pkgText)
    try {
      let parsed = JSON.parse(pkgText);
      if (typeof parsed.displayName == "string" && parsed.displayName.trim())
        return parsed.displayName.trim();
      if (typeof parsed.name == "string" && parsed.name.trim()) {
        let rawName = parsed.name.trim(), unscoped = rawName.startsWith("@") && rawName.includes("/") ? rawName.slice(rawName.indexOf("/") + 1).trim() : rawName;
        if (unscoped && !["root", "app"].includes(unscoped.toLowerCase()))
          return unscoped;
      }
    } catch {
    }
  let pyText = readTextSafe2(path4.join(projectPath, "pyproject.toml"));
  if (pyText) {
    let pyName = extractTomlSectionName(pyText, ["project", "tool.poetry"]);
    if (pyName) return pyName;
  }
  let cargoText = readTextSafe2(path4.join(projectPath, "Cargo.toml"));
  if (cargoText) {
    let cargoName = extractTomlSectionName(cargoText, ["package"]);
    if (cargoName) return cargoName;
  }
  let goModText = readTextSafe2(path4.join(projectPath, "go.mod"));
  if (goModText) {
    let modMatch = goModText.match(/^\s*module\s+(\S+)/m);
    if (modMatch) {
      let seg = modMatch[1].trim().split("/").pop();
      if (seg) return seg;
    }
  }
  let gitName = resolveGitOriginRepoName(projectPath);
  return gitName || pathBaseName(projectPath) || projectPath;
}
function projectDisplayName(projectPath) {
  if (!projectPath || projectPath === "Unassigned") return "Unassigned";
  let now = Date.now(), cached2 = projectNameCache.get(projectPath);
  if (cached2 && cached2.expiresAt > now)
    return cached2.name;
  let name = resolveProjectDisplayName(projectPath);
  return projectNameCache.set(projectPath, {
    name,
    expiresAt: now + PROJECT_NAME_TTL_MS
  }), name;
}
function compareModelUsage(a, b) {
  return b.totalTokens - a.totalTokens || b.steps - a.steps || b.modelDurationMs - a.modelDurationMs || a.model.localeCompare(b.model);
}
function aggregateModelUsage(steps, pricingRules, fallbackChatCount = 1) {
  if (steps.length === 0) return [];
  let buckets = /* @__PURE__ */ new Map(), grandSteps = 0, grandTokens = 0, grandModelMs = 0;
  for (let step of steps) {
    let model = (step.model || "").trim() || "unknown", bucket = buckets.get(model) ?? {
      steps: 0,
      inputTokens: 0,
      cacheReadTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      modelDurationMs: 0,
      chatIds: /* @__PURE__ */ new Set(),
      anyPriced: !1,
      costSum: 0
    }, stepTotal = step.inputTokens + step.cacheReadTokens + step.outputTokens;
    bucket.steps += 1, bucket.inputTokens += step.inputTokens, bucket.cacheReadTokens += step.cacheReadTokens, bucket.outputTokens += step.outputTokens, bucket.totalTokens += stepTotal, bucket.modelDurationMs += step.modelDurationMs, step.conversationId && bucket.chatIds.add(step.conversationId);
    let est = estimateStepCost(step, model, pricingRules);
    !est.unpriced && est.totalUsd !== null && (bucket.anyPriced = !0, bucket.costSum += est.totalUsd), buckets.set(model, bucket), grandSteps += 1, grandTokens += stepTotal, grandModelMs += step.modelDurationMs;
  }
  return Array.from(buckets.entries()).map(([model, b]) => {
    let denom = b.inputTokens + b.cacheReadTokens;
    return {
      model,
      steps: b.steps,
      stepShare: grandSteps > 0 ? b.steps / grandSteps : 0,
      inputTokens: b.inputTokens,
      cacheReadTokens: b.cacheReadTokens,
      outputTokens: b.outputTokens,
      totalTokens: b.totalTokens,
      tokenShare: grandTokens > 0 ? b.totalTokens / grandTokens : 0,
      cacheHitRatio: denom > 0 ? b.cacheReadTokens / denom : 0,
      modelDurationMs: b.modelDurationMs,
      timeShare: grandModelMs > 0 ? b.modelDurationMs / grandModelMs : 0,
      estimatedCostUsd: b.anyPriced ? b.costSum : null,
      chatCount: b.chatIds.size > 0 ? b.chatIds.size : fallbackChatCount
    };
  }).sort(compareModelUsage);
}
function mergeModelBreakdowns(lists) {
  let buckets = /* @__PURE__ */ new Map(), grandSteps = 0, grandTokens = 0, grandModelMs = 0;
  for (let list of lists)
    for (let item of list) {
      let model = (item.model || "").trim() || "unknown", cur = buckets.get(model) ?? {
        steps: 0,
        inputTokens: 0,
        cacheReadTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        modelDurationMs: 0,
        chatCount: 0,
        anyPriced: !1,
        costSum: 0
      };
      cur.steps += item.steps, cur.inputTokens += item.inputTokens, cur.cacheReadTokens += item.cacheReadTokens, cur.outputTokens += item.outputTokens, cur.totalTokens += item.totalTokens, cur.modelDurationMs += item.modelDurationMs, cur.chatCount += item.chatCount, item.estimatedCostUsd !== null && (cur.anyPriced = !0, cur.costSum += item.estimatedCostUsd), buckets.set(model, cur), grandSteps += item.steps, grandTokens += item.totalTokens, grandModelMs += item.modelDurationMs;
    }
  return Array.from(buckets.entries()).map(([model, b]) => {
    let denom = b.inputTokens + b.cacheReadTokens;
    return {
      model,
      steps: b.steps,
      stepShare: grandSteps > 0 ? b.steps / grandSteps : 0,
      inputTokens: b.inputTokens,
      cacheReadTokens: b.cacheReadTokens,
      outputTokens: b.outputTokens,
      totalTokens: b.totalTokens,
      tokenShare: grandTokens > 0 ? b.totalTokens / grandTokens : 0,
      cacheHitRatio: denom > 0 ? b.cacheReadTokens / denom : 0,
      modelDurationMs: b.modelDurationMs,
      timeShare: grandModelMs > 0 ? b.modelDurationMs / grandModelMs : 0,
      estimatedCostUsd: b.anyPriced ? b.costSum : null,
      chatCount: b.chatCount
    };
  }).sort(compareModelUsage);
}
function extractModelSwitches(plannerSteps, turns, toolCalls) {
  if (plannerSteps.length < 2) return [];
  let turnMap = /* @__PURE__ */ new Map();
  for (let t of turns)
    turnMap.set(t.turnIndex, t.promptPreview);
  let toolsByPlannerStep = /* @__PURE__ */ new Map();
  for (let tc of toolCalls) {
    let arr = toolsByPlannerStep.get(tc.plannerStepIndex) ?? [];
    arr.push(tc.toolName), toolsByPlannerStep.set(tc.plannerStepIndex, arr);
  }
  let switches = [];
  for (let i = 1; i < plannerSteps.length; i++) {
    let prev = plannerSteps[i - 1], curr = plannerSteps[i], fromModel = (prev.model || "").trim() || "unknown", toModel = (curr.model || "").trim() || "unknown";
    if (fromModel === toModel) continue;
    let prevTools = toolsByPlannerStep.get(prev.stepIndex) ?? [], trigger = "Mid-turn model switch";
    if (prevTools.includes("exit_plan_mode"))
      trigger = "Plan \u2192 Execute handoff (exit_plan_mode)";
    else if (prevTools.includes("enter_plan_mode"))
      trigger = "Entered Plan Mode (enter_plan_mode)";
    else if (prevTools.includes("swarm"))
      trigger = "Swarm orchestration / model switch";
    else if (prevTools.includes("invoke_subagent"))
      trigger = "Orchestrator delegation step";
    else if (curr.turnIndex > prev.turnIndex) {
      let prompt = turnMap.get(curr.turnIndex);
      trigger = prompt ? `New turn: "${prompt.slice(0, 60)}"` : `New turn ${curr.turnIndex + 1}`;
    }
    switches.push({
      stepIndex: curr.stepIndex,
      turnIndex: curr.turnIndex,
      fromModel,
      toModel,
      createdAtMs: curr.createdAtMs,
      isCacheMiss: curr.isCacheMiss,
      inputTokensAfter: curr.inputTokens,
      trigger
    });
  }
  return switches;
}
function buildConversationSummary(row, plannerSteps, toolCalls, turnCount, pricingRules, subagents = []) {
  let cost = aggregateCosts(plannerSteps, pricingRules), modelBreakdown = aggregateModelUsage(plannerSteps, pricingRules, 1), denom = row.inputTokens + row.cacheReadTokens, subagentMs = subagents.reduce((sum, s) => sum + s.activeMs, 0), registry2 = discoverInstalledPlugins(), resolvedParents = /* @__PURE__ */ new Set();
  for (let tc of toolCalls) {
    let hit = resolveToolPluginOrSkill(tc, registry2);
    hit && resolvedParents.add(hit.name);
  }
  return {
    conversationId: row.conversationId,
    title: row.title,
    surface: row.surface,
    projectPath: row.projectPath,
    projectName: projectDisplayName(row.projectPath),
    projectSource: row.projectSource,
    parentConversationId: row.parentConversationId,
    subagentRole: row.subagentRole,
    subagentType: row.subagentType,
    swarmRole: row.swarmRole ?? null,
    swarmTitle: row.swarmTitle ?? null,
    startedAtMs: row.startedAtMs,
    endedAtMs: row.endedAtMs,
    terminationReason: row.terminationReason,
    models: modelBreakdown.length > 0 ? modelBreakdown.map((m) => m.model) : row.models,
    modelBreakdown,
    slashCommands: row.slashCommands,
    turnCount,
    stepCount: plannerSteps.length,
    toolCallCount: toolCalls.length,
    errorCount: row.errorCount,
    skillsUsed: row.skillsUsed,
    topPluginsSkills: Array.from(resolvedParents).slice(0, 6),
    tokens: {
      inputTokens: row.inputTokens,
      cacheReadTokens: row.cacheReadTokens,
      outputTokens: row.outputTokens,
      peakContextTokens: row.peakContextTokens,
      cacheHitRatio: denom > 0 ? row.cacheReadTokens / denom : 0,
      hasTokenTelemetry: row.hasTokenTelemetry,
      estimatedCostUsd: cost.estimatedCostUsd,
      cacheSavingsUsd: cost.cacheSavingsUsd,
      unpricedModels: cost.unpricedModels
    },
    time: {
      activeMs: row.activeMs,
      modelMs: row.modelMs,
      toolWallMs: row.toolWallMs,
      toolSumMs: row.toolSumMs,
      parallelismFactor: row.toolWallMs > 0 ? Number((row.toolSumMs / row.toolWallMs).toFixed(2)) : 1,
      subagentMs,
      userIdleMs: row.userIdleMs,
      wallClockMs: row.wallClockMs
    },
    hasLiveHooks: row.hasLiveHooks
  };
}
function buildConversationDetail(db, conversationId) {
  let row = db.getConversationRecord(conversationId);
  if (!row) return null;
  let pricingRules = db.getPricingRules(), turns = db.getTurnsForConversation(conversationId), rawSteps = db.getPlannerStepsForConversation(conversationId), toolCalls = db.getToolCallsForConversation(conversationId), allConvs = db.getAllConversationRecords(), childrenByParent = /* @__PURE__ */ new Map();
  for (let c of allConvs)
    if (c.parentConversationId) {
      let list = childrenByParent.get(c.parentConversationId) ?? [];
      list.push(c), childrenByParent.set(c.parentConversationId, list);
    }
  let subagentRows = [], visitedDesc = /* @__PURE__ */ new Set([conversationId]), descQueue = [conversationId];
  for (; descQueue.length > 0 && visitedDesc.size < 256; ) {
    let curId = descQueue.shift();
    for (let childRow of childrenByParent.get(curId) ?? [])
      visitedDesc.has(childRow.conversationId) || (visitedDesc.add(childRow.conversationId), subagentRows.push(childRow), descQueue.push(childRow.conversationId));
  }
  let plannerSteps = rawSteps.map((ps) => {
    let est = estimateStepCost(ps, ps.model, pricingRules);
    return {
      ...ps,
      estimatedCostUsd: est.totalUsd
    };
  }), subagentEffInputs = [], subagentSteps = [], subagents = subagentRows.map((child) => {
    let cSteps = db.getPlannerStepsForConversation(child.conversationId), cTools = db.getToolCallsForConversation(child.conversationId), cTurns = db.getTurnsForConversation(child.conversationId);
    for (let st of cSteps)
      subagentSteps.push({ ...st, conversationId: child.conversationId });
    return subagentEffInputs.push({
      conversationId: child.conversationId,
      title: child.title,
      parentConversationId: child.parentConversationId,
      activeMs: child.activeMs,
      hasTokenTelemetry: child.hasTokenTelemetry,
      plannerSteps: cSteps,
      toolCalls: cTools,
      filesTouched: child.filesTouched
    }), buildConversationSummary(
      child,
      cSteps,
      cTools,
      cTurns.length,
      pricingRules
    );
  }), summary = buildConversationSummary(
    row,
    rawSteps,
    toolCalls,
    turns.length,
    pricingRules,
    subagentRows
  ), subagentModelBreakdown = subagentSteps.length > 0 ? aggregateModelUsage(subagentSteps, pricingRules, subagentRows.length) : [], combinedModelBreakdown = subagentSteps.length > 0 ? aggregateModelUsage(
    [
      ...rawSteps.map((st) => ({
        ...st,
        conversationId: row.conversationId
      })),
      ...subagentSteps
    ],
    pricingRules,
    1 + subagentRows.length
  ) : summary.modelBreakdown, skillToolMetrics = aggregateSkillToolMetrics(
    toolCalls.map((tc) => ({
      ...tc,
      conversationId: row.conversationId,
      conversationTitle: row.title
    })),
    rawSteps,
    pricingRules
  ), chatEff = computeScopeSkillEfficiency(
    [
      {
        conversationId: row.conversationId,
        title: row.title,
        parentConversationId: row.parentConversationId,
        activeMs: row.activeMs,
        hasTokenTelemetry: row.hasTokenTelemetry,
        plannerSteps: rawSteps,
        toolCalls,
        filesTouched: row.filesTouched
      },
      ...subagentEffInputs
    ],
    pricingRules
  ), topForRoot = chatEff.topPluginsByConv.get(row.conversationId);
  topForRoot && topForRoot.length > 0 && (summary.topPluginsSkills = topForRoot);
  for (let sub of subagents) {
    let subTop = chatEff.topPluginsByConv.get(sub.conversationId);
    subTop && subTop.length > 0 && (sub.topPluginsSkills = subTop);
  }
  let liveDiagnostics = chatEff.diagnosticsByConv.get(row.conversationId) ?? row.diagnostics, modelSwitches = extractModelSwitches(plannerSteps, turns, toolCalls), combinedTokens = subagents.length > 0 ? mergeTokenSummaries([summary.tokens, ...subagents.map((s) => s.tokens)]) : void 0, swarmTasks = row.swarmTasks && Object.keys(row.swarmTasks).length > 0 ? row.swarmTasks : void 0;
  return {
    summary,
    turns,
    plannerSteps,
    modelSwitches,
    combinedModelBreakdown,
    subagentModelBreakdown,
    toolCalls,
    skillToolMetrics,
    pluginSkillMetrics: chatEff.pluginSkillMetrics,
    filesTouched: row.filesTouched,
    diagnostics: liveDiagnostics,
    subagents,
    scopeActiveMs: chatEff.scopeActiveMs,
    ...swarmTasks ? { swarmTasks } : {},
    ...combinedTokens ? { combinedTokens } : {}
  };
}
function mergeTokenSummaries(items) {
  let inputTokens = 0, cacheReadTokens = 0, outputTokens = 0, peakContextTokens = 0, costSum = 0, savingsSum = 0, anyPriced = !1, unpriced = /* @__PURE__ */ new Set();
  for (let item of items) {
    inputTokens += item.inputTokens, cacheReadTokens += item.cacheReadTokens, outputTokens += item.outputTokens, item.peakContextTokens > peakContextTokens && (peakContextTokens = item.peakContextTokens), item.estimatedCostUsd !== null && (anyPriced = !0, costSum += item.estimatedCostUsd), item.cacheSavingsUsd !== null && (savingsSum += item.cacheSavingsUsd);
    for (let m of item.unpricedModels)
      unpriced.add(m);
  }
  let denom = inputTokens + cacheReadTokens, hasTokenTelemetry = items.some((i) => i.hasTokenTelemetry);
  return {
    inputTokens,
    cacheReadTokens,
    outputTokens,
    peakContextTokens,
    cacheHitRatio: denom > 0 ? cacheReadTokens / denom : 0,
    hasTokenTelemetry,
    estimatedCostUsd: anyPriced ? costSum : null,
    cacheSavingsUsd: anyPriced ? savingsSum : null,
    unpricedModels: Array.from(unpriced).sort()
  };
}
function mergeFileTouches(lists) {
  let map = /* @__PURE__ */ new Map();
  for (let list of lists)
    for (let f of list) {
      let cur = map.get(f.path) ?? {
        path: f.path,
        reads: 0,
        edits: 0,
        creates: 0,
        totalBytesRead: 0,
        directTokens: 0,
        compoundedCacheTokens: 0,
        lastTouchedAtMs: 0
      };
      cur.reads += f.reads, cur.edits += f.edits, cur.creates += f.creates, cur.totalBytesRead += f.totalBytesRead, cur.directTokens += f.directTokens, cur.compoundedCacheTokens += f.compoundedCacheTokens, f.lastTouchedAtMs > cur.lastTouchedAtMs && (cur.lastTouchedAtMs = f.lastTouchedAtMs), map.set(f.path, cur);
    }
  return Array.from(map.values()).sort(
    (a, b) => b.compoundedCacheTokens + b.directTokens - (a.compoundedCacheTokens + a.directTokens)
  );
}
function rowActivityMs(row) {
  return row.endedAtMs > 0 ? row.endedAtMs : row.startedAtMs;
}
var CONTEXT_CLIFF_TOKENS = 2e5, CONTEXT_COMPACTION_TOKENS = 256e3, COMPACTION_CACHE_MISS_CAUSE = "Context compaction or prefix reset";
function emptyContextHealth() {
  return {
    measuredChatCount: 0,
    avgPeakContextTokens: 0,
    maxPeakContextTokens: 0,
    under200kCount: 0,
    under200kRatio: 0,
    cliff200kChats: 0,
    compaction256kChats: 0,
    compactionEventCount: 0
  };
}
function computeContextHealth(chats, compactionEventCount) {
  let measured = chats.filter(
    (c) => c.hasTokenTelemetry && c.peakContextTokens > 0
  );
  if (measured.length === 0)
    return {
      ...emptyContextHealth(),
      compactionEventCount
    };
  let peakSum = 0, maxPeakContextTokens = 0, under200kCount = 0, cliff200kChats = 0, compaction256kChats = 0;
  for (let chat of measured) {
    let peak = chat.peakContextTokens;
    peakSum += peak, peak > maxPeakContextTokens && (maxPeakContextTokens = peak), peak < CONTEXT_CLIFF_TOKENS ? under200kCount += 1 : (cliff200kChats += 1, peak >= CONTEXT_COMPACTION_TOKENS && (compaction256kChats += 1));
  }
  return {
    measuredChatCount: measured.length,
    avgPeakContextTokens: Math.round(peakSum / measured.length),
    maxPeakContextTokens,
    under200kCount,
    under200kRatio: under200kCount / measured.length,
    cliff200kChats,
    compaction256kChats,
    compactionEventCount
  };
}
function countCompactionEvents(steps) {
  let count = 0;
  for (let ps of steps)
    ps.isCacheMiss && ps.cacheMissCause === COMPACTION_CACHE_MISS_CAUSE && (count += 1);
  return count;
}
function computeProjectActiveMs(steps, tools, fallbackTopActiveMsList) {
  let activeIntervals = [];
  for (let ps of steps)
    if (ps.createdAtMs > 0 && ps.modelDurationMs > 0) {
      let end = ps.completedAtMs && ps.completedAtMs >= ps.createdAtMs ? ps.completedAtMs : ps.createdAtMs + ps.modelDurationMs;
      activeIntervals.push({ start: ps.createdAtMs, end });
    }
  for (let tc of tools)
    if (!isIdleWaitTool(tc.toolName) && tc.startedAtMs !== null && tc.startedAtMs > 0) {
      let end = Math.max(
        tc.startedAtMs,
        tc.completedAtMs ?? tc.startedAtMs + tc.durationMs
      );
      activeIntervals.push({ start: tc.startedAtMs, end });
    }
  let mergedProjectWallMs = mergeIntervalsWallMs(activeIntervals), fallbackTopActiveMs = fallbackTopActiveMsList.reduce((s, v) => s + v, 0);
  return mergedProjectWallMs > 0 ? mergedProjectWallMs : fallbackTopActiveMs;
}
function matchesTimeRange(row, sinceMs) {
  return sinceMs === null ? !0 : rowActivityMs(row) >= sinceMs;
}
function matchesPriorTimeRange(row, priorSinceMs, priorUntilMs) {
  let ts = rowActivityMs(row);
  return ts >= priorSinceMs && ts < priorUntilMs;
}
function pctDelta(curr, prev) {
  return !Number.isFinite(curr) || !Number.isFinite(prev) || prev <= 0 ? null : (curr - prev) / prev;
}
function computePriorProjectMetrics(db, projectRows, pricingRules) {
  let rowIds = new Set(projectRows.map((r) => r.conversationId)), topLevel = projectRows.filter(
    (r) => !r.parentConversationId || !rowIds.has(r.parentConversationId)
  ), subagents = projectRows.filter(
    (r) => !!(r.parentConversationId && rowIds.has(r.parentConversationId))
  ), topTimeSource = topLevel.length > 0 ? topLevel : projectRows, allSteps = [], allTools = [], inputTokens = 0, cacheReadTokens = 0, outputTokens = 0, hasTokenTelemetry = !1;
  for (let r of projectRows) {
    let steps = db.getPlannerStepsForConversation(r.conversationId), tools = db.getToolCallsForConversation(r.conversationId);
    allSteps.push(...steps), allTools.push(...tools), inputTokens += r.inputTokens, cacheReadTokens += r.cacheReadTokens, outputTokens += r.outputTokens, r.hasTokenTelemetry && (hasTokenTelemetry = !0);
  }
  let activeMs = computeProjectActiveMs(
    allSteps,
    allTools,
    topTimeSource.map((r) => r.activeMs)
  ), cost = aggregateCosts(allSteps, pricingRules);
  return {
    chatCount: topLevel.length,
    subagentCount: subagents.length,
    inputTokens,
    cacheReadTokens,
    outputTokens,
    hasTokenTelemetry,
    activeMs,
    estimatedCostUsd: cost.estimatedCostUsd,
    unpricedModels: cost.unpricedModels,
    compactionEventCount: countCompactionEvents(allSteps)
  };
}
function buildPeriodComparison(bounds, current, priorRowsByProject, db, pricingRules) {
  let priorBounds = computePriorTimeRangeBounds(bounds);
  if (!priorBounds) return null;
  let allPriorRows = [];
  for (let rows of priorRowsByProject.values())
    allPriorRows.push(...rows);
  if (allPriorRows.length === 0)
    return {
      label: priorBounds.label,
      priorSinceMs: priorBounds.priorSinceMs,
      priorUntilMs: priorBounds.priorUntilMs,
      hasPriorActivity: !1,
      priorChatCount: 0,
      priorSubagentCount: 0,
      priorTotalTokens: 0,
      priorCacheHitRatio: 0,
      priorActiveMs: 0,
      priorEstimatedCostUsd: null,
      priorAvgPeakContextTokens: 0,
      priorMeasuredChatCount: 0,
      chatsDeltaPct: null,
      tokensDeltaPct: null,
      cacheHitDeltaPp: null,
      activeMsDeltaPct: null,
      costDeltaPct: null,
      avgPeakContextDeltaPct: null
    };
  let priorChatCount = 0, priorSubagentCount = 0, priorInputTokens = 0, priorCacheReadTokens = 0, priorOutputTokens = 0, priorHasTokenTelemetry = !1, priorActiveMs = 0, priorCostSum = 0, priorAnyPriced = !1, priorUnpricedSet = /* @__PURE__ */ new Set(), priorCompactionEvents = 0;
  for (let rows of priorRowsByProject.values()) {
    if (rows.length === 0) continue;
    let pm = computePriorProjectMetrics(db, rows, pricingRules);
    priorChatCount += pm.chatCount, priorSubagentCount += pm.subagentCount, priorInputTokens += pm.inputTokens, priorCacheReadTokens += pm.cacheReadTokens, priorOutputTokens += pm.outputTokens, pm.hasTokenTelemetry && (priorHasTokenTelemetry = !0), priorActiveMs += pm.activeMs, pm.estimatedCostUsd !== null && (priorAnyPriced = !0, priorCostSum += pm.estimatedCostUsd);
    for (let m of pm.unpricedModels)
      priorUnpricedSet.add(m);
    priorCompactionEvents += pm.compactionEventCount;
  }
  let priorTotalTokens = priorInputTokens + priorCacheReadTokens + priorOutputTokens, priorDenom = priorInputTokens + priorCacheReadTokens, priorCacheHitRatio = priorDenom > 0 ? priorCacheReadTokens / priorDenom : 0, priorEstimatedCostUsd = priorAnyPriced ? priorCostSum : null, priorUnpricedModels = Array.from(priorUnpricedSet).sort(), priorContextHealth = computeContextHealth(
    allPriorRows,
    priorCompactionEvents
  ), chatsDeltaPct = pctDelta(current.chatCount, priorChatCount), tokensDeltaPct = (current.hasTokenTelemetry || current.chatCount === 0) && priorHasTokenTelemetry ? pctDelta(current.totalTokens, priorTotalTokens) : null, cacheHitDeltaPp = current.hasTokenTelemetry && priorHasTokenTelemetry ? Math.round((current.cacheHitRatio - priorCacheHitRatio) * 100) : null, activeMsDeltaPct = pctDelta(current.activeMs, priorActiveMs), costDeltaPct = current.estimatedCostUsd !== null && priorEstimatedCostUsd !== null && current.unpricedModels.length === 0 && priorUnpricedModels.length === 0 ? pctDelta(current.estimatedCostUsd, priorEstimatedCostUsd) : null, avgPeakContextDeltaPct = current.contextHealth.measuredChatCount > 0 && priorContextHealth.measuredChatCount > 0 ? pctDelta(
    current.contextHealth.avgPeakContextTokens,
    priorContextHealth.avgPeakContextTokens
  ) : null;
  return {
    label: priorBounds.label,
    priorSinceMs: priorBounds.priorSinceMs,
    priorUntilMs: priorBounds.priorUntilMs,
    hasPriorActivity: !0,
    priorChatCount,
    priorSubagentCount,
    priorTotalTokens,
    priorCacheHitRatio,
    priorActiveMs,
    priorEstimatedCostUsd,
    priorAvgPeakContextTokens: priorContextHealth.avgPeakContextTokens,
    priorMeasuredChatCount: priorContextHealth.measuredChatCount,
    chatsDeltaPct,
    tokensDeltaPct,
    cacheHitDeltaPp,
    activeMsDeltaPct,
    costDeltaPct,
    avgPeakContextDeltaPct
  };
}
function emptyTokenSummary() {
  return {
    inputTokens: 0,
    cacheReadTokens: 0,
    outputTokens: 0,
    peakContextTokens: 0,
    cacheHitRatio: 0,
    hasTokenTelemetry: !1,
    estimatedCostUsd: 0,
    cacheSavingsUsd: 0,
    unpricedModels: []
  };
}
function emptyTimeSummary() {
  return {
    activeMs: 0,
    modelMs: 0,
    toolWallMs: 0,
    toolSumMs: 0,
    parallelismFactor: 1,
    subagentMs: 0,
    userIdleMs: 0,
    wallClockMs: 0
  };
}
function buildProjectDetail(db, projectPath, options, internalOpts) {
  let bounds = resolveTimeRangeBounds(options), allProjectRows = (internalOpts?.allRows ?? db.getAllConversationRecords()).filter((r) => r.projectPath === projectPath);
  if (allProjectRows.length === 0) return null;
  let projectRows = allProjectRows.filter(
    (r) => matchesTimeRange(r, bounds.sinceMs)
  ), pricingRules = db.getPricingRules(), includePeriodComparison = internalOpts?.includePeriodComparison !== !1, computeProjectPeriodComparison = (current) => {
    if (!includePeriodComparison) return null;
    let priorBounds = computePriorTimeRangeBounds(bounds);
    if (!priorBounds) return null;
    let priorRows = allProjectRows.filter(
      (r) => matchesPriorTimeRange(r, priorBounds.priorSinceMs, priorBounds.priorUntilMs)
    ), priorMap = /* @__PURE__ */ new Map();
    return priorRows.length > 0 && priorMap.set(projectPath, priorRows), buildPeriodComparison(bounds, current, priorMap, db, pricingRules);
  };
  if (projectRows.length === 0) {
    let emptyCtxHealth = emptyContextHealth(), emptyTokens = emptyTokenSummary();
    return {
      summary: {
        projectPath,
        projectName: projectDisplayName(projectPath),
        chatCount: 0,
        subagentCount: 0,
        swarmCount: 0,
        firstActivityMs: 0,
        lastActivityMs: 0,
        models: [],
        modelBreakdown: [],
        topSkills: [],
        topPluginsSkills: [],
        topTools: [],
        mcpServers: [],
        slashCommands: [],
        tokens: emptyTokens,
        time: emptyTimeSummary(),
        contextHealth: emptyCtxHealth,
        errorCount: 0
      },
      chats: [],
      skillToolMetrics: [],
      pluginSkillMetrics: [],
      filesTouched: [],
      diagnostics: [],
      timeRange: {
        preset: bounds.preset,
        sinceMs: bounds.sinceMs,
        untilMs: bounds.untilMs,
        firstActivityMs: 0,
        lastActivityMs: 0
      },
      periodComparison: computeProjectPeriodComparison({
        chatCount: 0,
        totalTokens: 0,
        cacheHitRatio: 0,
        hasTokenTelemetry: !1,
        activeMs: 0,
        estimatedCostUsd: emptyTokens.estimatedCostUsd,
        unpricedModels: emptyTokens.unpricedModels,
        contextHealth: emptyCtxHealth
      })
    };
  }
  let rowIds = new Set(projectRows.map((r) => r.conversationId)), summaries = [], effInputs = [], allSteps = [], allTools = [];
  for (let r of projectRows) {
    let steps = db.getPlannerStepsForConversation(r.conversationId), tools = db.getToolCallsForConversation(r.conversationId), turns = db.getTurnsForConversation(r.conversationId), children = projectRows.filter(
      (c) => c.parentConversationId === r.conversationId
    );
    summaries.push(
      buildConversationSummary(r, steps, tools, turns.length, pricingRules, children)
    ), effInputs.push({
      conversationId: r.conversationId,
      title: r.title,
      parentConversationId: r.parentConversationId,
      activeMs: r.activeMs,
      hasTokenTelemetry: r.hasTokenTelemetry,
      plannerSteps: steps,
      toolCalls: tools,
      filesTouched: r.filesTouched
    });
    for (let st of steps)
      allSteps.push({ ...st, conversationId: r.conversationId });
    for (let tc of tools)
      allTools.push({
        ...tc,
        conversationId: r.conversationId,
        conversationTitle: r.title
      });
  }
  let topLevel = summaries.filter(
    (s) => !s.parentConversationId || !rowIds.has(s.parentConversationId)
  ), subagents = summaries.filter(
    (s) => s.parentConversationId && rowIds.has(s.parentConversationId)
  ), topTimeSource = topLevel.length > 0 ? topLevel : summaries, activeMs = computeProjectActiveMs(
    allSteps,
    allTools,
    topTimeSource.map((c) => c.time.activeMs)
  ), skillToolMetrics = aggregateSkillToolMetrics(
    allTools,
    allSteps,
    pricingRules
  ), projEff = computeScopeSkillEfficiency(effInputs, pricingRules, {
    scopeActiveMsOverride: activeMs
  }), pluginSkillMetrics = projEff.pluginSkillMetrics;
  for (let s of summaries) {
    let convParents = projEff.topPluginsByConv.get(s.conversationId);
    convParents && (s.topPluginsSkills = convParents);
  }
  let topSkills = skillToolMetrics.filter((m) => m.category === "Skill").map((m) => m.name).slice(0, 6), topPluginsSkills = pluginSkillMetrics.slice(0, 6).map((m) => m.name), topTools = skillToolMetrics.filter((m) => m.category === "Tool").map((m) => m.name).slice(0, 6), mcpServers = Array.from(
    new Set(
      skillToolMetrics.filter((m) => m.category === "MCP" && m.pluginOrServer).map((m) => m.pluginOrServer)
    )
  ).sort(), modelBreakdown = aggregateModelUsage(allSteps, pricingRules, projectRows.length), fallbackSortedModels = Array.from(
    new Set(projectRows.flatMap((r) => r.models))
  ).sort(), models = modelBreakdown.length > 0 ? modelBreakdown.map((m) => m.model) : fallbackSortedModels, slashCommands = Array.from(
    new Set(projectRows.flatMap((r) => r.slashCommands))
  ).sort(), positiveStarts = projectRows.map((r) => r.startedAtMs > 0 ? r.startedAtMs : r.endedAtMs).filter((x) => x > 0), firstActivityMs = positiveStarts.length > 0 ? Math.min(...positiveStarts) : 0, lastActivityMs = Math.max(
    ...projectRows.map((r) => rowActivityMs(r)),
    0
  ), modelMs = summaries.reduce((s, c) => s + c.time.modelMs, 0), toolWallMs = summaries.reduce((s, c) => s + c.time.toolWallMs, 0), toolSumMs = summaries.reduce((s, c) => s + c.time.toolSumMs, 0), subagentMs = subagents.reduce((s, c) => s + c.time.activeMs, 0), userIdleMs = topTimeSource.reduce((s, c) => s + c.time.userIdleMs, 0), wallClockMs = lastActivityMs > firstActivityMs ? lastActivityMs - firstActivityMs : activeMs, time3 = {
    activeMs,
    modelMs,
    toolWallMs,
    toolSumMs,
    parallelismFactor: toolWallMs > 0 ? Number((toolSumMs / toolWallMs).toFixed(2)) : 1,
    subagentMs,
    userIdleMs,
    wallClockMs
  }, tokens = mergeTokenSummaries(summaries.map((s) => s.tokens)), errorCount = summaries.reduce((s, c) => s + c.errorCount, 0), compactionEventCount = countCompactionEvents(allSteps), contextHealth = computeContextHealth(
    summaries.map((s) => s.tokens),
    compactionEventCount
  ), diagnostics = projectRows.flatMap((r) => (projEff.diagnosticsByConv.get(r.conversationId) ?? r.diagnostics).map((d) => ({
    ...d,
    citation: `${r.title.slice(0, 32)} \xB7 ${d.citation}`
  }))).sort((a, b) => (b.impactTokens ?? 0) - (a.impactTokens ?? 0)).slice(0, 12), swarmCount = projectRows.filter(
    (r) => r.swarmRole === "coordinator"
  ).length, summary = {
    projectPath,
    projectName: projectDisplayName(projectPath),
    chatCount: topLevel.length,
    subagentCount: subagents.length,
    swarmCount,
    firstActivityMs,
    lastActivityMs,
    models,
    modelBreakdown,
    topSkills,
    topPluginsSkills,
    topTools,
    mcpServers,
    slashCommands,
    tokens,
    time: time3,
    contextHealth,
    errorCount
  }, periodComparison = computeProjectPeriodComparison({
    chatCount: topLevel.length,
    totalTokens: tokens.inputTokens + tokens.cacheReadTokens + tokens.outputTokens,
    cacheHitRatio: tokens.cacheHitRatio,
    hasTokenTelemetry: tokens.hasTokenTelemetry,
    activeMs,
    estimatedCostUsd: tokens.estimatedCostUsd,
    unpricedModels: tokens.unpricedModels,
    contextHealth
  });
  return {
    summary,
    chats: summaries.sort((a, b) => b.endedAtMs - a.endedAtMs),
    skillToolMetrics,
    pluginSkillMetrics,
    filesTouched: mergeFileTouches(projectRows.map((r) => r.filesTouched)),
    diagnostics,
    timeRange: {
      preset: bounds.preset,
      sinceMs: bounds.sinceMs,
      untilMs: bounds.untilMs,
      firstActivityMs,
      lastActivityMs
    },
    periodComparison
  };
}
function buildDashboardData(db, options) {
  let bounds = resolveTimeRangeBounds(options), allDbRows = db.getAllConversationRecords(), allRows = allDbRows.filter((r) => matchesTimeRange(r, bounds.sinceMs)), pricingRules = db.getPricingRules(), byProject = /* @__PURE__ */ new Map();
  for (let r of allRows) {
    let arr = byProject.get(r.projectPath) ?? [];
    arr.push(r), byProject.set(r.projectPath, arr);
  }
  let projectDetails = [];
  for (let projectPath of byProject.keys()) {
    let detail = buildProjectDetail(db, projectPath, bounds, {
      includePeriodComparison: !1,
      allRows: allDbRows
    });
    detail && detail.chats.length > 0 && projectDetails.push(detail);
  }
  let projects = projectDetails.map((d) => d.summary).sort((a, b) => b.lastActivityMs - a.lastActivityMs), positiveFirsts = projects.map((p) => p.firstActivityMs).filter((x) => x > 0), firstActivityMs = positiveFirsts.length > 0 ? Math.min(...positiveFirsts) : 0, lastActivityMs = projects.reduce(
    (max, p) => p.lastActivityMs > max ? p.lastActivityMs : max,
    0
  ), totalsTokens = projects.length > 0 ? mergeTokenSummaries(projects.map((p) => p.tokens)) : emptyTokenSummary(), totalsModelBreakdown = mergeModelBreakdowns(
    projects.map((p) => p.modelBreakdown)
  ), totalActiveMs = projects.reduce((s, p) => s + p.time.activeMs, 0), totalChatCount = projects.reduce((s, p) => s + p.chatCount, 0), totalSubagentCount = projects.reduce((s, p) => s + p.subagentCount, 0), totalSwarmCount = projects.reduce((s, p) => s + (p.swarmCount ?? 0), 0), totalCompactionEvents = projects.reduce(
    (sum, p) => sum + p.contextHealth.compactionEventCount,
    0
  ), totalsContextHealth = computeContextHealth(
    projectDetails.flatMap((d) => d.chats.map((c) => c.tokens)),
    totalCompactionEvents
  ), priorBounds = computePriorTimeRangeBounds(bounds), periodComparison = null;
  if (priorBounds) {
    let priorRowsByProject = /* @__PURE__ */ new Map();
    for (let r of allDbRows)
      if (matchesPriorTimeRange(
        r,
        priorBounds.priorSinceMs,
        priorBounds.priorUntilMs
      )) {
        let arr = priorRowsByProject.get(r.projectPath) ?? [];
        arr.push(r), priorRowsByProject.set(r.projectPath, arr);
      }
    periodComparison = buildPeriodComparison(
      bounds,
      {
        chatCount: totalChatCount,
        totalTokens: totalsTokens.inputTokens + totalsTokens.cacheReadTokens + totalsTokens.outputTokens,
        cacheHitRatio: totalsTokens.cacheHitRatio,
        hasTokenTelemetry: totalsTokens.hasTokenTelemetry,
        activeMs: totalActiveMs,
        estimatedCostUsd: totalsTokens.estimatedCostUsd,
        unpricedModels: totalsTokens.unpricedModels,
        contextHealth: totalsContextHealth
      },
      priorRowsByProject,
      db,
      pricingRules
    );
  }
  let pluginSkillMetrics = mergePluginSkillMetrics(
    projectDetails.map((d) => ({
      projectPath: d.summary.projectPath,
      metrics: d.pluginSkillMetrics
    })),
    {
      activeMs: totalActiveMs,
      estimatedCostUsd: totalsTokens.estimatedCostUsd,
      contextTokens: totalsTokens.inputTokens + totalsTokens.cacheReadTokens
    }
  ), recentChats = allRows.slice(0, 25).map((r) => {
    let steps = db.getPlannerStepsForConversation(r.conversationId), tools = db.getToolCallsForConversation(r.conversationId), turns = db.getTurnsForConversation(r.conversationId), children = allRows.filter(
      (c) => c.parentConversationId === r.conversationId
    );
    return buildConversationSummary(
      r,
      steps,
      tools,
      turns.length,
      pricingRules,
      children
    );
  }), totalToolWall = projects.reduce((s, p) => s + p.time.toolWallMs, 0), totalToolSum = projects.reduce((s, p) => s + p.time.toolSumMs, 0), { signals: modelSignals, latestGlobalActivityMs } = db.getModelAvailabilitySignals();
  return {
    generatedAtMs: Date.now(),
    timeRange: {
      preset: bounds.preset,
      sinceMs: bounds.sinceMs,
      untilMs: bounds.untilMs,
      firstActivityMs,
      lastActivityMs
    },
    periodComparison,
    totals: {
      projectCount: projects.length,
      chatCount: totalChatCount,
      subagentCount: totalSubagentCount,
      swarmCount: totalSwarmCount,
      tokens: totalsTokens,
      time: {
        activeMs: totalActiveMs,
        modelMs: projects.reduce((s, p) => s + p.time.modelMs, 0),
        toolWallMs: totalToolWall,
        toolSumMs: totalToolSum,
        parallelismFactor: totalToolWall > 0 ? Number((totalToolSum / totalToolWall).toFixed(2)) : 1,
        subagentMs: projects.reduce((s, p) => s + p.time.subagentMs, 0),
        userIdleMs: projects.reduce((s, p) => s + p.time.userIdleMs, 0),
        wallClockMs: projects.reduce((s, p) => s + p.time.wallClockMs, 0)
      },
      contextHealth: totalsContextHealth,
      errorCount: projects.reduce((s, p) => s + p.errorCount, 0),
      modelBreakdown: totalsModelBreakdown
    },
    projects,
    pluginSkillMetrics,
    recentChats,
    pricingRules,
    unpricedModels: totalsTokens.unpricedModels,
    modelSignals,
    latestGlobalActivityMs
  };
}

// src/server/hookIngestor.ts
import crypto from "node:crypto";
import fs6 from "node:fs";
var DEFAULT_MAX_CHUNK_BYTES = 16 * 1024 * 1024;
function ingestHookEvents(db, eventsPath, options = {}) {
  if (!fs6.existsSync(eventsPath))
    return { ingestedCount: 0, touchedConversationIds: [] };
  if (process.platform !== "win32")
    try {
      fs6.chmodSync(eventsPath, 384);
    } catch {
    }
  let stat = fs6.statSync(eventsPath);
  if (stat.size === 0)
    return { ingestedCount: 0, touchedConversationIds: [] };
  let startOffset = db.getIndexedFile(eventsPath)?.lastOffset ?? 0;
  if (startOffset > stat.size && (startOffset = 0), startOffset === stat.size)
    return { ingestedCount: 0, touchedConversationIds: [] };
  let maxChunkBytes = Math.max(
    64,
    options.maxChunkBytes ?? DEFAULT_MAX_CHUNK_BYTES
  ), hardCapBytes = 64 * 1024 * 1024, windowBytes = Math.min(stat.size - startOffset, maxChunkBytes), fd = fs6.openSync(eventsPath, "r"), chunkBuf = Buffer.alloc(0), lastNewlineIdx = -1;
  try {
    for (; ; ) {
      let buf = Buffer.alloc(windowBytes), bytesRead = fs6.readSync(fd, buf, 0, windowBytes, startOffset);
      if (bytesRead <= 0)
        return { ingestedCount: 0, touchedConversationIds: [] };
      if (chunkBuf = buf.subarray(0, bytesRead), lastNewlineIdx = chunkBuf.lastIndexOf(10), lastNewlineIdx >= 0 || startOffset + bytesRead >= stat.size || windowBytes >= hardCapBytes)
        break;
      windowBytes = Math.min(stat.size - startOffset, windowBytes * 2, hardCapBytes);
    }
  } finally {
    fs6.closeSync(fd);
  }
  if (lastNewlineIdx < 0)
    return { ingestedCount: 0, touchedConversationIds: [] };
  let completeBuf = chunkBuf.subarray(0, lastNewlineIdx + 1), newOffset = startOffset + lastNewlineIdx + 1, text = completeBuf.toString("utf8"), toInsert = [], touched = /* @__PURE__ */ new Set(), lines = text.split(`
`);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    let raw;
    try {
      raw = JSON.parse(line);
    } catch {
      continue;
    }
    let conversationId = typeof raw.conversationId == "string" ? raw.conversationId.trim() : "", hookEventName = typeof raw.hookEventName == "string" ? raw.hookEventName.trim() : "";
    if (!conversationId || !hookEventName) continue;
    touched.add(conversationId);
    let workspacePaths = Array.isArray(raw.workspacePaths) ? raw.workspacePaths.filter((p) => typeof p == "string" && p.trim().length > 0) : [], toolCall = raw.toolCall && typeof raw.toolCall == "object" ? raw.toolCall : null, dedupKey = crypto.createHash("sha1").update(`${startOffset}:${i}:${line}`).digest("hex");
    toInsert.push({
      tsMs: typeof raw.tsMs == "number" ? raw.tsMs : Date.now(),
      hookEventName,
      conversationId,
      workspacePaths,
      transcriptPath: typeof raw.transcriptPath == "string" ? raw.transcriptPath : null,
      modelName: typeof raw.modelName == "string" ? raw.modelName : null,
      cwd: typeof raw.cwd == "string" ? raw.cwd : null,
      stepIdx: typeof raw.stepIdx == "number" ? raw.stepIdx : null,
      invocationNum: typeof raw.invocationNum == "number" ? raw.invocationNum : null,
      terminationReason: typeof raw.terminationReason == "string" ? raw.terminationReason : null,
      error: typeof raw.error == "string" ? sanitizePreviewText(raw.error, 300) : null,
      lastUserInput: typeof raw.lastUserInput == "string" ? sanitizePreviewText(raw.lastUserInput, 500) : null,
      toolCallId: toolCall && typeof toolCall.id == "string" ? toolCall.id : null,
      toolName: toolCall && typeof toolCall.name == "string" ? toolCall.name : null,
      argBytes: toolCall && typeof toolCall.argBytes == "number" ? toolCall.argBytes : null,
      dedupKey
    });
  }
  return db.insertHookEvents(toInsert), db.upsertIndexedFile({
    path: eventsPath,
    fileSize: stat.size,
    mtimeMs: stat.mtimeMs,
    lastOffset: newOffset,
    updatedAtMs: Date.now()
  }), {
    ingestedCount: toInsert.length,
    touchedConversationIds: Array.from(touched)
  };
}

// src/server/scanner.ts
var IGNORED_PATH_PREFIXES = [
  "/tmp/",
  "/private/tmp/",
  "/var/",
  "/usr/",
  "/bin/",
  "/sbin/",
  "/opt/",
  "/System/",
  "/Library/",
  "/dev/",
  "/etc/"
], PROJECT_MARKERS = [
  ".git",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "pom.xml"
];
function defaultBrainRoots() {
  let home = os3.homedir();
  return [
    { surface: "antigravity", dir: path5.join(home, ".gemini", "antigravity", "brain") },
    { surface: "cli", dir: path5.join(home, ".gemini", "antigravity-cli", "brain") },
    { surface: "ide", dir: path5.join(home, ".gemini", "antigravity-ide", "brain") }
  ];
}
function inferSurfaceFromPath(filePath) {
  let norm = filePath.replace(/\\/g, "/");
  return norm.includes("/antigravity-cli/") ? "cli" : norm.includes("/antigravity-ide/") ? "ide" : norm.includes("/antigravity/") ? "antigravity" : "unknown";
}
function isIgnoredSystemPath(p, homeOverride) {
  let norm = p.replace(/\\/g, "/"), lower = norm.toLowerCase(), homeLower = (homeOverride || os3.homedir()).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase(), geminiLower = `${homeLower}/.gemini`;
  if (lower === geminiLower || lower.startsWith(`${geminiLower}/`) || norm === "/tmp" || lower === homeLower) return !0;
  let tmpDirNorm = os3.tmpdir().replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  return tmpDirNorm && (lower === tmpDirNorm || lower.startsWith(`${tmpDirNorm}/`)) || /^[a-z]:\/(?:windows|program files|program files \(x86\)|programdata|perflogs|\$recycle\.bin)(?:\/|$)/i.test(
    norm
  ) || lower.includes("/appdata/local/temp/") || lower.endsWith("/appdata/local/temp") ? !0 : IGNORED_PATH_PREFIXES.some((prefix) => norm.startsWith(prefix));
}
var UUID_EXACT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function resolveWorktreeMainRoot(repoDir, options = {}) {
  if (!(!!options.readFileFn || !options.existsFn && !options.isFileFn)) return repoDir;
  let isFileFn = options.isFileFn ?? ((p) => {
    try {
      return fs7.existsSync(p) && fs7.statSync(p).isFile();
    } catch {
      return !1;
    }
  }), readFileFn = options.readFileFn ?? ((p) => {
    try {
      return fs7.existsSync(p) && fs7.statSync(p).isFile() ? fs7.readFileSync(p, "utf8") : null;
    } catch {
      return null;
    }
  }), dotGit = pathJoin(repoDir, ".git");
  if (!isFileFn(dotGit)) return repoDir;
  let pointer = readFileFn(dotGit);
  if (!pointer) return repoDir;
  let gitDirMatch = pointer.match(/^gitdir:\s*(.+)$/im);
  if (!gitDirMatch || !gitDirMatch[1].trim()) return repoDir;
  let rawTarget = gitDirMatch[1].trim(), resolveLocal = (baseDir, relTarget) => isAbsoluteLocalPath(relTarget) ? relTarget : isWindowsPath(baseDir) ? path5.win32.resolve(baseDir, relTarget) : path5.posix.resolve(baseDir, relTarget), resolvedGitDir = resolveLocal(repoDir, rawTarget), commonDirText = readFileFn(pathJoin(resolvedGitDir, "commondir"));
  if (commonDirText && commonDirText.trim()) {
    let commonRaw = commonDirText.trim(), cleanedCommon = resolveLocal(resolvedGitDir, commonRaw).replace(/[\\/]+$/, "");
    if (pathBaseName(cleanedCommon).toLowerCase() === ".git") {
      let parent = pathDirName(cleanedCommon);
      if (parent && parent !== ".") return parent;
    }
  }
  let wtMatch = resolvedGitDir.replace(/[\\/]+$/, "").match(/^(.+)[\\/]\.git[\\/]worktrees[\\/][^\\/]+$/i);
  return wtMatch && wtMatch[1] ? wtMatch[1] : repoDir;
}
function findProjectRootForPath(rawCandidatePath, options = {}) {
  let candidatePath = unwrapFileUri(rawCandidatePath);
  if (!candidatePath || !isAbsoluteLocalPath(candidatePath)) return null;
  let home = options.homeDir ?? os3.homedir();
  if (isIgnoredSystemPath(candidatePath, home)) return null;
  let existsFn = options.existsFn ?? ((p) => fs7.existsSync(p)), isFileFn = options.isFileFn ?? ((p) => {
    try {
      return fs7.existsSync(p) && fs7.statSync(p).isFile();
    } catch {
      return !1;
    }
  }), winMode = isWindowsPath(candidatePath), samePath = (a, b) => {
    let na = a.replace(/[\\/]+$/, ""), nb = b.replace(/[\\/]+$/, "");
    return winMode ? na.toLowerCase() === nb.toLowerCase() : na === nb;
  }, dir = candidatePath;
  try {
    isFileFn(candidatePath) ? dir = pathDirName(candidatePath) : !existsFn(candidatePath) && pathExtName(candidatePath) && (dir = pathDirName(candidatePath));
  } catch {
    dir = pathDirName(candidatePath);
  }
  let fallbackCandidate = null;
  for (let depth = 0; depth < 12 && !(!dir || dir === "/" || /^[a-zA-Z]:[\\/]?$/.test(dir) || samePath(dir, home)); depth++) {
    for (let marker of PROJECT_MARKERS)
      try {
        if (existsFn(pathJoin(dir, marker))) {
          if (marker === ".git") return resolveWorktreeMainRoot(dir, options);
          fallbackCandidate || (fallbackCandidate = dir);
        }
      } catch {
      }
    let parent = pathDirName(dir);
    if (parent === dir || parent === ".") break;
    dir = parent;
  }
  if (fallbackCandidate) return fallbackCandidate;
  let normHome = home.replace(/\\/g, "/").replace(/\/+$/, ""), normCand = candidatePath.replace(/\\/g, "/");
  if (winMode ? normCand.toLowerCase().startsWith(`${normHome.toLowerCase()}/`) : normCand.startsWith(`${normHome}/`)) {
    let segs = normCand.slice(normHome.length + 1).split("/").filter(Boolean);
    if (segs.length >= 2 && ["git", "projects", "Projects", "src", "workspace", "workspaces", "code", "dev", "repos"].includes(
      segs[0]
    ))
      return pathJoin(pathJoin(home, segs[0]), segs[1]);
  }
  return null;
}
function inferProjectFromPaths(candidatePaths) {
  let votes = /* @__PURE__ */ new Map();
  for (let p of candidatePaths) {
    let root = findProjectRootForPath(p);
    if (!root) continue;
    let hasGit = fs7.existsSync(path5.join(root, ".git"));
    votes.set(root, (votes.get(root) ?? 0) + (hasGit ? 3 : 1));
  }
  if (votes.size === 0) return null;
  let bestRoot = null, bestScore = -1;
  for (let [root, score] of votes.entries())
    score > bestScore && (bestScore = score, bestRoot = root);
  return bestRoot;
}
function getSwarmMetaMtimeMs(convDir) {
  let swarmDir = path5.join(convDir, ".system_generated", "swarm");
  try {
    if (!fs7.existsSync(swarmDir) || !fs7.statSync(swarmDir).isDirectory()) return 0;
    let maxMtime = 0;
    for (let entry of fs7.readdirSync(swarmDir, { withFileTypes: !0 })) {
      if (!entry.isFile() || !/\.(?:json|jsonl)$/i.test(entry.name)) continue;
      let st = fs7.statSync(path5.join(swarmDir, entry.name));
      st.mtimeMs > maxMtime && (maxMtime = st.mtimeMs);
    }
    return maxMtime;
  } catch {
    return 0;
  }
}
function collectRosterLinksFromObject(node, selfConversationId, out, depth = 0) {
  if (!node || typeof node != "object" || depth > 6) return;
  if (Array.isArray(node)) {
    for (let item of node)
      collectRosterLinksFromObject(item, selfConversationId, out, depth + 1);
    return;
  }
  let obj = node, idCand = obj.conversationId ?? obj.conversation_id ?? obj.convId ?? obj.conv_id ?? obj.id;
  if (typeof idCand == "string" && UUID_EXACT_RE.test(idCand.trim()) && idCand.trim() !== selfConversationId) {
    let cid = idCand.trim(), roleCand = typeof obj.name == "string" && obj.name.trim() ? obj.name.trim() : typeof obj.role == "string" && obj.role.trim() ? obj.role.trim() : typeof obj.worker == "string" && obj.worker.trim() ? obj.worker.trim() : typeof obj.roster_name == "string" && obj.roster_name.trim() ? obj.roster_name.trim() : null;
    (!out.has(cid) || roleCand && !out.get(cid).role) && out.set(cid, {
      conversationId: cid,
      role: roleCand ? sanitizePreviewText(roleCand, 40) : null,
      typeName: "swarm"
    });
  }
  for (let val of Object.values(obj))
    val && typeof val == "object" && collectRosterLinksFromObject(val, selfConversationId, out, depth + 1);
}
function readSwarmDirMetadata(convDir, selfConversationId) {
  if (!convDir) return null;
  let swarmDir = path5.join(convDir, ".system_generated", "swarm");
  try {
    if (!fs7.existsSync(swarmDir) || !fs7.statSync(swarmDir).isDirectory())
      return null;
  } catch {
    return null;
  }
  let hasPlan = !1, planTitle = null, tasks = {}, rosterMap = /* @__PURE__ */ new Map(), latestMtimeMs = 0, entries;
  try {
    entries = fs7.readdirSync(swarmDir, { withFileTypes: !0 });
  } catch {
    return null;
  }
  let MAX_META_BYTES = 1024 * 1024, extraFilesScanned = 0;
  for (let entry of entries) {
    if (!entry.isFile()) continue;
    let fullPath = path5.join(swarmDir, entry.name), st;
    try {
      st = fs7.statSync(fullPath);
    } catch {
      continue;
    }
    if (st.mtimeMs > latestMtimeMs && (latestMtimeMs = st.mtimeMs), !(st.size === 0 || st.size > MAX_META_BYTES)) {
      if (entry.name.toLowerCase() === "plan.json") {
        try {
          let parsed = JSON.parse(fs7.readFileSync(fullPath, "utf8"));
          if (hasPlan = !0, typeof parsed?.goal?.title == "string" && parsed.goal.title.trim() && (planTitle = sanitizePreviewText(parsed.goal.title.trim(), 80)), parsed?.tasks && typeof parsed.tasks == "object" && !Array.isArray(parsed.tasks))
            for (let [workerKey, desc] of Object.entries(parsed.tasks))
              typeof desc == "string" && desc.trim() && (tasks[workerKey] = sanitizePreviewText(desc.trim(), 120));
        } catch {
        }
        continue;
      }
      if (!(!/\.(?:json|jsonl)$/i.test(entry.name) || extraFilesScanned >= 8)) {
        extraFilesScanned += 1;
        try {
          let text = fs7.readFileSync(fullPath, "utf8");
          if (entry.name.toLowerCase().endsWith(".jsonl"))
            for (let line of text.split(/\r?\n/)) {
              let trimmed = line.trim();
              if (trimmed)
                try {
                  collectRosterLinksFromObject(
                    JSON.parse(trimmed),
                    selfConversationId,
                    rosterMap
                  );
                } catch {
                }
            }
          else
            collectRosterLinksFromObject(
              JSON.parse(text),
              selfConversationId,
              rosterMap
            );
        } catch {
        }
      }
    }
  }
  return {
    hasPlan,
    planTitle,
    tasks,
    rosterLinks: Array.from(rosterMap.values()),
    latestMtimeMs
  };
}
function inferConvDirFromTranscriptPath(transcriptPath) {
  let idx = transcriptPath.replace(/\\/g, "/").lastIndexOf("/.system_generated/logs/");
  return idx > 0 ? transcriptPath.slice(0, idx) : path5.dirname(transcriptPath);
}
function discoverTranscripts(roots, db) {
  let byConv = /* @__PURE__ */ new Map();
  for (let root of roots) {
    if (!fs7.existsSync(root.dir)) continue;
    let entries;
    try {
      entries = fs7.readdirSync(root.dir, { withFileTypes: !0 });
    } catch {
      continue;
    }
    for (let entry of entries) {
      if (!entry.isDirectory()) continue;
      let convId = entry.name, convDir = path5.join(root.dir, convId), candidates = [
        path5.join(convDir, ".system_generated", "logs", "transcript_full.jsonl"),
        path5.join(convDir, ".system_generated", "logs", "transcript.jsonl"),
        path5.join(convDir, "transcript_full.jsonl"),
        path5.join(convDir, "transcript.jsonl")
      ];
      for (let candidate of candidates)
        try {
          if (!fs7.existsSync(candidate)) continue;
          let st = fs7.statSync(candidate);
          if (!st.isFile() || st.size === 0) continue;
          byConv.has(convId) || byConv.set(convId, {
            conversationId: convId,
            transcriptPath: candidate,
            convDir,
            surface: root.surface,
            size: st.size,
            mtimeMs: st.mtimeMs,
            swarmMetaMtimeMs: getSwarmMetaMtimeMs(convDir)
          });
          break;
        } catch {
        }
    }
  }
  for (let hk of db.getHookTranscriptPaths()) {
    if (byConv.has(hk.conversationId)) continue;
    let candidate = hk.transcriptPath;
    if (/[\\/]transcript\.jsonl$/i.test(candidate)) {
      let sep = candidate.endsWith("\\transcript.jsonl") ? "\\" : "/", fullVariant = candidate.slice(0, -16) + "transcript_full.jsonl";
      sep && fs7.existsSync(fullVariant) && (candidate = fullVariant);
    }
    try {
      if (!fs7.existsSync(candidate)) continue;
      let st = fs7.statSync(candidate);
      if (!st.isFile() || st.size === 0) continue;
      let convDir = inferConvDirFromTranscriptPath(candidate);
      byConv.set(hk.conversationId, {
        conversationId: hk.conversationId,
        transcriptPath: candidate,
        convDir,
        surface: inferSurfaceFromPath(candidate),
        size: st.size,
        mtimeMs: st.mtimeMs,
        swarmMetaMtimeMs: convDir ? getSwarmMetaMtimeMs(convDir) : 0
      });
    } catch {
    }
  }
  return Array.from(byConv.values());
}
function resolveProject(conversationId, parsed, hookEvents, db, subagentLinks) {
  let link = subagentLinks.get(conversationId) ?? null, parentConversationId = link?.parentConversationId ?? null, subagentRole = link?.role ?? null, subagentType = link?.typeName ?? null, manual = db.getProjectOverride(conversationId);
  if (manual)
    return {
      projectPath: manual.projectPath,
      projectSource: "manual",
      parentConversationId,
      subagentRole,
      subagentType
    };
  if (parentConversationId) {
    let parentOverride = db.getProjectOverride(parentConversationId);
    if (parentOverride)
      return {
        projectPath: parentOverride.projectPath,
        projectSource: "parent",
        parentConversationId,
        subagentRole,
        subagentType
      };
    let parentRow = db.getConversationRecord(parentConversationId);
    if (parentRow && parentRow.projectPath && parentRow.projectPath !== "Unassigned")
      return {
        projectPath: parentRow.projectPath,
        projectSource: "parent",
        parentConversationId,
        subagentRole,
        subagentType
      };
  }
  for (let ev of hookEvents) {
    for (let wp of ev.workspacePaths)
      if (wp) {
        let normalizedWp = resolveWorktreeMainRoot(wp);
        if (!isIgnoredSystemPath(normalizedWp))
          return {
            projectPath: normalizedWp,
            projectSource: "hook",
            parentConversationId,
            subagentRole,
            subagentType
          };
      }
    if (ev.cwd) {
      let normalizedCwd = resolveWorktreeMainRoot(ev.cwd);
      if (!isIgnoredSystemPath(normalizedCwd))
        return {
          projectPath: normalizedCwd,
          projectSource: "hook",
          parentConversationId,
          subagentRole,
          subagentType
        };
    }
  }
  if (parsed) {
    let inferred = inferProjectFromPaths(parsed.candidatePaths);
    if (inferred)
      return {
        projectPath: inferred,
        projectSource: "inferred",
        parentConversationId,
        subagentRole,
        subagentType
      };
  }
  return {
    projectPath: "Unassigned",
    projectSource: "unassigned",
    parentConversationId,
    subagentRole,
    subagentType
  };
}
var inFlightScans = /* @__PURE__ */ new Map();
function runScan(options) {
  let key = options.db.dbPath, existing = inFlightScans.get(key);
  if (existing) return existing;
  let promise = runScanInternal(options).finally(() => {
    inFlightScans.delete(key);
  });
  return inFlightScans.set(key, promise), promise;
}
async function runScanInternal(options) {
  let { db, dataDir } = options, eventsPath = options.eventsPath ?? path5.join(dataDir, "events.jsonl"), brainRoots = options.brainRoots ?? defaultBrainRoots(), hookResult = ingestHookEvents(db, eventsPath), touchedByHooks = new Set(hookResult.touchedConversationIds), discovered = discoverTranscripts(brainRoots, db), toProcess = [], skipped = 0;
  for (let item of discovered) {
    let indexed = db.getIndexedFile(item.transcriptPath), existingConv = db.getConversationRecord(item.conversationId), latestHookTs = db.getLatestHookTsForConversation(item.conversationId), override = db.getProjectOverride(item.conversationId), fileUnchanged = indexed !== null && indexed.fileSize === item.size && Math.abs(indexed.mtimeMs - item.mtimeMs) < 1 && (!existingConv || item.swarmMetaMtimeMs <= existingConv.indexedAtMs), hookUnchanged = !touchedByHooks.has(item.conversationId) && (!existingConv || latestHookTs <= existingConv.indexedAtMs), overrideUnchanged = !override || !existingConv || override.updatedAtMs <= existingConv.indexedAtMs;
    if (fileUnchanged && hookUnchanged && overrideUnchanged && existingConv) {
      skipped += 1;
      continue;
    }
    toProcess.push(item);
  }
  let swarmMetaMap = /* @__PURE__ */ new Map();
  for (let item of discovered)
    if (item.swarmMetaMtimeMs > 0 || item.convDir) {
      let meta = readSwarmDirMetadata(item.convDir, item.conversationId);
      meta && swarmMetaMap.set(item.conversationId, meta);
    }
  let parsedMap = /* @__PURE__ */ new Map();
  for (let item of toProcess)
    try {
      let parsed = await parseTranscriptFile(
        item.transcriptPath,
        item.conversationId
      );
      parsedMap.set(item.conversationId, parsed);
    } catch {
    }
  let subagentLinks = db.getSubagentLinkMap();
  for (let [convId, parsed] of parsedMap.entries())
    for (let tc of parsed.toolCalls) {
      let links = tc.childLinks && tc.childLinks.length > 0 ? tc.childLinks : tc.childConversationId ? [{ conversationId: tc.childConversationId, role: null, typeName: null }] : [];
      if (links.length === 0) continue;
      let roleMatch = tc.argsPreview.match(/Role:\s*([^|]+)/i), typeMatch = tc.argsPreview.match(/Type:\s*([^|]+)/i), fallbackRole = roleMatch ? roleMatch[1].trim() : null, fallbackType = typeMatch ? typeMatch[1].trim() : null;
      for (let link of links)
        subagentLinks.set(link.conversationId, {
          parentConversationId: convId,
          role: link.role ?? fallbackRole,
          typeName: link.typeName ?? fallbackType
        });
    }
  for (let [convId, swarmMeta] of swarmMetaMap.entries())
    for (let link of swarmMeta.rosterLinks) {
      let existing = subagentLinks.get(link.conversationId);
      existing ? !existing.role && link.role && subagentLinks.set(link.conversationId, {
        ...existing,
        role: link.role,
        typeName: existing.typeName ?? "swarm"
      }) : subagentLinks.set(link.conversationId, {
        parentConversationId: convId,
        role: link.role,
        typeName: "swarm"
      });
    }
  let swarmParentsSet = /* @__PURE__ */ new Set();
  for (let link of subagentLinks.values())
    link.typeName === "swarm" && swarmParentsSet.add(link.parentConversationId);
  toProcess.sort((a, b) => {
    let aIsChild = subagentLinks.has(a.conversationId) ? 1 : 0, bIsChild = subagentLinks.has(b.conversationId) ? 1 : 0;
    return aIsChild - bIsChild;
  });
  let indexedCount = 0;
  for (let item of toProcess) {
    let parsed = parsedMap.get(item.conversationId);
    if (parsed)
      try {
        let hookEvents = db.getHookEventsForConversation(item.conversationId), meta = resolveProject(
          item.conversationId,
          parsed,
          hookEvents,
          db,
          subagentLinks
        ), swarmMeta = swarmMetaMap.get(item.conversationId), swarmRole = meta.subagentType === "swarm" || parsed.detectedSwarmRole === "worker" ? "worker" : swarmMeta?.hasPlan || swarmParentsSet.has(item.conversationId) || parsed.detectedSwarmRole === "coordinator" ? "coordinator" : null, swarmTitle = parsed.swarmTitle || swarmMeta?.planTitle || null, swarmTasks = swarmMeta?.tasks && Object.keys(swarmMeta.tasks).length > 0 ? swarmMeta.tasks : void 0, analyzed = analyzeConversation(parsed, hookEvents, {
          surface: item.surface,
          ...meta,
          swarmRole,
          swarmTitle,
          swarmTasks
        });
        db.upsertConversation(analyzed), db.upsertIndexedFile({
          path: item.transcriptPath,
          fileSize: item.size,
          mtimeMs: item.mtimeMs,
          lastOffset: item.size,
          updatedAtMs: Date.now()
        }), indexedCount += 1;
      } catch (err) {
        process.stderr.write(
          `[flight-recorder] skip conversation ${item.conversationId}: ${err instanceof Error ? err.message : String(err)}
`
        );
      }
  }
  for (let [childId, link] of subagentLinks.entries()) {
    let childRow = db.getConversationRecord(childId), parentRow = db.getConversationRecord(link.parentConversationId);
    if (!childRow || !parentRow) continue;
    let needsLinkUpdate = childRow.parentConversationId !== link.parentConversationId || childRow.subagentRole !== link.role || childRow.subagentType !== link.typeName, needsProjectInherit = childRow.projectSource !== "manual" && parentRow.projectPath !== "Unassigned" && childRow.projectPath !== parentRow.projectPath, needsTitleUpdate = (childRow.title === childId.slice(0, 8) || !childRow.title) && !!(link.role || link.typeName), needsSwarmWorkerRole = link.typeName === "swarm" && childRow.swarmRole !== "worker";
    (needsLinkUpdate || needsProjectInherit || needsTitleUpdate || needsSwarmWorkerRole) && db.db.prepare(`
          UPDATE conversations
          SET parent_conversation_id = ?,
              subagent_role = COALESCE(?, subagent_role),
              subagent_type = COALESCE(?, subagent_type),
              swarm_role = CASE WHEN ? = 'swarm' THEN 'worker' ELSE swarm_role END,
              title = CASE WHEN title = ? OR title = '' THEN COALESCE(?, ?, title) ELSE title END,
              project_path = CASE WHEN project_source != 'manual' AND ? != 'Unassigned' THEN ? ELSE project_path END,
              project_source = CASE WHEN project_source != 'manual' AND ? != 'Unassigned' THEN 'parent' ELSE project_source END
          WHERE conversation_id = ?
        `).run(
      link.parentConversationId,
      link.role,
      link.typeName,
      link.typeName ?? "",
      childId.slice(0, 8),
      link.role,
      link.typeName,
      parentRow.projectPath,
      parentRow.projectPath,
      parentRow.projectPath,
      childId
    ), link.typeName === "swarm" && !parentRow.swarmRole && db.db.prepare("UPDATE conversations SET swarm_role = 'coordinator' WHERE conversation_id = ?").run(parentRow.conversationId);
  }
  return {
    hookEventsIngested: hookResult.ingestedCount,
    transcriptsDiscovered: discovered.length,
    transcriptsIndexed: indexedCount,
    transcriptsSkipped: skipped
  };
}

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER2,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType2,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray2,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean2,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch2,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault2,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion2,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum2,
  ZodError: () => ZodError2,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection2,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral2,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever2,
  ZodNull: () => ZodNull2,
  ZodNullable: () => ZodNullable2,
  ZodNumber: () => ZodNumber2,
  ZodObject: () => ZodObject2,
  ZodOptional: () => ZodOptional2,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly2,
  ZodRecord: () => ZodRecord2,
  ZodSchema: () => ZodType2,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString2,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType2,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion2,
  ZodUnknown: () => ZodUnknown2,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom2,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default2,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType2,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs2(_arg) {
  }
  util2.assertIs = assertIs2;
  function assertNever2(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever2, util2.arrayToEnum = (items) => {
    let obj = {};
    for (let item of items)
      obj[item] = item;
    return obj;
  }, util2.getValidEnumValues = (obj) => {
    let validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] != "number"), filtered = {};
    for (let k of validKeys)
      filtered[k] = obj[k];
    return util2.objectValues(filtered);
  }, util2.objectValues = (obj) => util2.objectKeys(obj).map(function(e) {
    return obj[e];
  }), util2.objectKeys = typeof Object.keys == "function" ? (obj) => Object.keys(obj) : (object3) => {
    let keys = [];
    for (let key in object3)
      Object.prototype.hasOwnProperty.call(object3, key) && keys.push(key);
    return keys;
  }, util2.find = (arr, checker) => {
    for (let item of arr)
      if (checker(item))
        return item;
  }, util2.isInteger = typeof Number.isInteger == "function" ? (val) => Number.isInteger(val) : (val) => typeof val == "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues2(array2, separator = " | ") {
    return array2.map((val) => typeof val == "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues2, util2.jsonStringifyReplacer = (_, value) => typeof value == "bigint" ? value.toString() : value;
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => ({
    ...first,
    ...second
    // second overwrites first
  });
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]), getParsedType2 = (data) => {
  switch (typeof data) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      return Array.isArray(data) ? ZodParsedType.array : data === null ? ZodParsedType.null : data.then && typeof data.then == "function" && data.catch && typeof data.catch == "function" ? ZodParsedType.promise : typeof Map < "u" && data instanceof Map ? ZodParsedType.map : typeof Set < "u" && data instanceof Set ? ZodParsedType.set : typeof Date < "u" && data instanceof Date ? ZodParsedType.date : ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]), quotelessJson = (obj) => JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, "$1:"), ZodError2 = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super(), this.issues = [], this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    }, this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    let actualProto = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, actualProto) : this.__proto__ = actualProto, this.name = "ZodError", this.issues = issues;
  }
  format(_mapper) {
    let mapper = _mapper || function(issue2) {
      return issue2.message;
    }, fieldErrors = { _errors: [] }, processError = (error2) => {
      for (let issue2 of error2.issues)
        if (issue2.code === "invalid_union")
          issue2.unionErrors.map(processError);
        else if (issue2.code === "invalid_return_type")
          processError(issue2.returnTypeError);
        else if (issue2.code === "invalid_arguments")
          processError(issue2.argumentsError);
        else if (issue2.path.length === 0)
          fieldErrors._errors.push(mapper(issue2));
        else {
          let curr = fieldErrors, i = 0;
          for (; i < issue2.path.length; ) {
            let el = issue2.path[i];
            i === issue2.path.length - 1 ? (curr[el] = curr[el] || { _errors: [] }, curr[el]._errors.push(mapper(issue2))) : curr[el] = curr[el] || { _errors: [] }, curr = curr[el], i++;
          }
        }
    };
    return processError(this), fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError))
      throw new Error(`Not a ZodError: ${value}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue2) => issue2.message) {
    let fieldErrors = {}, formErrors = [];
    for (let sub of this.issues)
      if (sub.path.length > 0) {
        let firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [], fieldErrors[firstEl].push(mapper(sub));
      } else
        formErrors.push(mapper(sub));
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError2.create = (issues) => new ZodError2(issues);

// node_modules/zod/v3/locales/en.js
var errorMap = (issue2, _ctx) => {
  let message;
  switch (issue2.code) {
    case ZodIssueCode.invalid_type:
      issue2.received === ZodParsedType.undefined ? message = "Required" : message = `Expected ${issue2.expected}, received ${issue2.received}`;
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue2.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue2.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = "Invalid input";
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue2.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue2.options)}, received '${issue2.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = "Invalid function arguments";
      break;
    case ZodIssueCode.invalid_return_type:
      message = "Invalid function return type";
      break;
    case ZodIssueCode.invalid_date:
      message = "Invalid date";
      break;
    case ZodIssueCode.invalid_string:
      typeof issue2.validation == "object" ? "includes" in issue2.validation ? (message = `Invalid input: must include "${issue2.validation.includes}"`, typeof issue2.validation.position == "number" && (message = `${message} at one or more positions greater than or equal to ${issue2.validation.position}`)) : "startsWith" in issue2.validation ? message = `Invalid input: must start with "${issue2.validation.startsWith}"` : "endsWith" in issue2.validation ? message = `Invalid input: must end with "${issue2.validation.endsWith}"` : util.assertNever(issue2.validation) : issue2.validation !== "regex" ? message = `Invalid ${issue2.validation}` : message = "Invalid";
      break;
    case ZodIssueCode.too_small:
      issue2.type === "array" ? message = `Array must contain ${issue2.exact ? "exactly" : issue2.inclusive ? "at least" : "more than"} ${issue2.minimum} element(s)` : issue2.type === "string" ? message = `String must contain ${issue2.exact ? "exactly" : issue2.inclusive ? "at least" : "over"} ${issue2.minimum} character(s)` : issue2.type === "number" ? message = `Number must be ${issue2.exact ? "exactly equal to " : issue2.inclusive ? "greater than or equal to " : "greater than "}${issue2.minimum}` : issue2.type === "bigint" ? message = `Number must be ${issue2.exact ? "exactly equal to " : issue2.inclusive ? "greater than or equal to " : "greater than "}${issue2.minimum}` : issue2.type === "date" ? message = `Date must be ${issue2.exact ? "exactly equal to " : issue2.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(issue2.minimum))}` : message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      issue2.type === "array" ? message = `Array must contain ${issue2.exact ? "exactly" : issue2.inclusive ? "at most" : "less than"} ${issue2.maximum} element(s)` : issue2.type === "string" ? message = `String must contain ${issue2.exact ? "exactly" : issue2.inclusive ? "at most" : "under"} ${issue2.maximum} character(s)` : issue2.type === "number" ? message = `Number must be ${issue2.exact ? "exactly" : issue2.inclusive ? "less than or equal to" : "less than"} ${issue2.maximum}` : issue2.type === "bigint" ? message = `BigInt must be ${issue2.exact ? "exactly" : issue2.inclusive ? "less than or equal to" : "less than"} ${issue2.maximum}` : issue2.type === "date" ? message = `Date must be ${issue2.exact ? "exactly" : issue2.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(issue2.maximum))}` : message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = "Invalid input";
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = "Intersection results could not be merged";
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue2.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError, util.assertNever(issue2);
  }
  return { message };
}, en_default2 = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default2;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  let { data, path: path8, errorMaps, issueData } = params, fullPath = [...path8, ...issueData.path || []], fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0)
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  let errorMessage = "", maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (let map of maps)
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
}, EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  let overrideMap = getErrorMap(), issue2 = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default2 ? void 0 : en_default2
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue2);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    this.value === "valid" && (this.value = "dirty");
  }
  abort() {
    this.value !== "aborted" && (this.value = "aborted");
  }
  static mergeArray(status, results) {
    let arrayValue = [];
    for (let s of results) {
      if (s.status === "aborted")
        return INVALID;
      s.status === "dirty" && status.dirty(), arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    let syncPairs = [];
    for (let pair of pairs) {
      let key = await pair.key, value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    let finalObject = {};
    for (let pair of pairs) {
      let { key, value } = pair;
      if (key.status === "aborted" || value.status === "aborted")
        return INVALID;
      key.status === "dirty" && status.dirty(), value.status === "dirty" && status.dirty(), key.value !== "__proto__" && (typeof value.value < "u" || pair.alwaysSet) && (finalObject[key.value] = value.value);
    }
    return { status: status.value, value: finalObject };
  }
}, INVALID = Object.freeze({
  status: "aborted"
}), DIRTY = (value) => ({ status: "dirty", value }), OK = (value) => ({ status: "valid", value }), isAborted = (x) => x.status === "aborted", isDirty = (x) => x.status === "dirty", isValid = (x) => x.status === "valid", isAsync = (x) => typeof Promise < "u" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message == "string" ? { message } : message || {}, errorUtil2.toString = (message) => typeof message == "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path8, key) {
    this._cachedPath = [], this.parent = parent, this.data = value, this._path = path8, this._key = key;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}, handleResult = (ctx, result) => {
  if (isValid(result))
    return { success: !0, data: result.value };
  if (!ctx.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      let error2 = new ZodError2(ctx.common.issues);
      return this._error = error2, this._error;
    }
  };
};
function processCreateParams(params) {
  if (!params)
    return {};
  let { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error))
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return errorMap2 ? { errorMap: errorMap2, description } : { errorMap: (iss, ctx) => {
    let { message } = params;
    return iss.code === "invalid_enum_value" ? { message: message ?? ctx.defaultError } : typeof ctx.data > "u" ? { message: message ?? required_error ?? ctx.defaultError } : iss.code !== "invalid_type" ? { message: ctx.defaultError } : { message: message ?? invalid_type_error ?? ctx.defaultError };
  }, description };
}
var ZodType2 = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType2(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType2(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType2(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    let result = this._parse(input);
    if (isAsync(result))
      throw new Error("Synchronous parse encountered promise.");
    return result;
  }
  _parseAsync(input) {
    let result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    let result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    let ctx = {
      common: {
        issues: [],
        async: params?.async ?? !1,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType2(data)
    }, result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    let ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType2(data)
    };
    if (!this["~standard"].async)
      try {
        let result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        err?.message?.toLowerCase()?.includes("encountered") && (this["~standard"].async = !0), ctx.common = {
          issues: [],
          async: !0
        };
      }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    let result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    let ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: !0
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType2(data)
    }, maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx }), result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check2, message) {
    let getIssueProperties = (val) => typeof message == "string" || typeof message > "u" ? { message } : typeof message == "function" ? message(val) : message;
    return this._refinement((val, ctx) => {
      let result = check2(val), setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      return typeof Promise < "u" && result instanceof Promise ? result.then((data) => data ? !0 : (setError(), !1)) : result ? !0 : (setError(), !1);
    });
  }
  refinement(check2, refinementData) {
    return this._refinement((val, ctx) => check2(val) ? !0 : (ctx.addIssue(typeof refinementData == "function" ? refinementData(val, ctx) : refinementData), !1));
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync, this._def = def, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this), this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional2.create(this, this._def);
  }
  nullable() {
    return ZodNullable2.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray2.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion2.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection2.create(this, incoming, this._def);
  }
  transform(transform2) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform: transform2 }
    });
  }
  default(def) {
    let defaultValueFunc = typeof def == "function" ? def : () => def;
    return new ZodDefault2({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    let catchValueFunc = typeof def == "function" ? def : () => def;
    return new ZodCatch2({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    let This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly2.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}, cuidRegex = /^c[^\s-]{8,}$/i, cuid2Regex = /^[0-9a-z]+$/, ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i, uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, nanoidRegex = /^[a-z0-9_-]{21}$/i, jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, _emojiRegex = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", emojiRegex, ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, dateRegexSource = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = "[0-5]\\d";
  args.precision ? secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}` : args.precision == null && (secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`);
  let secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`, opts = [];
  return opts.push(args.local ? "Z?" : "Z"), args.offset && opts.push("([+-]\\d{2}:?\\d{2})"), regex = `${regex}(${opts.join("|")})`, new RegExp(`^${regex}$`);
}
function isValidIP(ip, version2) {
  return !!((version2 === "v4" || !version2) && ipv4Regex.test(ip) || (version2 === "v6" || !version2) && ipv6Regex.test(ip));
}
function isValidJWT2(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return !1;
  try {
    let [header] = jwt.split(".");
    if (!header)
      return !1;
    let base642 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "="), decoded = JSON.parse(atob(base642));
    return !(typeof decoded != "object" || decoded === null || "typ" in decoded && decoded?.typ !== "JWT" || !decoded.alg || alg && decoded.alg !== alg);
  } catch {
    return !1;
  }
}
function isValidCidr(ip, version2) {
  return !!((version2 === "v4" || !version2) && ipv4CidrRegex.test(ip) || (version2 === "v6" || !version2) && ipv6CidrRegex.test(ip));
}
var ZodString2 = class _ZodString2 extends ZodType2 {
  _parse(input) {
    if (this._def.coerce && (input.data = String(input.data)), this._getType(input) !== ZodParsedType.string) {
      let ctx2 = this._getOrReturnCtx(input);
      return addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      }), INVALID;
    }
    let status = new ParseStatus(), ctx;
    for (let check2 of this._def.checks)
      if (check2.kind === "min")
        input.data.length < check2.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check2.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: check2.message
        }), status.dirty());
      else if (check2.kind === "max")
        input.data.length > check2.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check2.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: check2.message
        }), status.dirty());
      else if (check2.kind === "length") {
        let tooBig = input.data.length > check2.value, tooSmall = input.data.length < check2.value;
        (tooBig || tooSmall) && (ctx = this._getOrReturnCtx(input, ctx), tooBig ? addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check2.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: check2.message
        }) : tooSmall && addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check2.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: check2.message
        }), status.dirty());
      } else if (check2.kind === "email")
        emailRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "email",
          code: ZodIssueCode.invalid_string,
          message: check2.message
        }), status.dirty());
      else if (check2.kind === "emoji")
        emojiRegex || (emojiRegex = new RegExp(_emojiRegex, "u")), emojiRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "emoji",
          code: ZodIssueCode.invalid_string,
          message: check2.message
        }), status.dirty());
      else if (check2.kind === "uuid")
        uuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "uuid",
          code: ZodIssueCode.invalid_string,
          message: check2.message
        }), status.dirty());
      else if (check2.kind === "nanoid")
        nanoidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "nanoid",
          code: ZodIssueCode.invalid_string,
          message: check2.message
        }), status.dirty());
      else if (check2.kind === "cuid")
        cuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "cuid",
          code: ZodIssueCode.invalid_string,
          message: check2.message
        }), status.dirty());
      else if (check2.kind === "cuid2")
        cuid2Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "cuid2",
          code: ZodIssueCode.invalid_string,
          message: check2.message
        }), status.dirty());
      else if (check2.kind === "ulid")
        ulidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "ulid",
          code: ZodIssueCode.invalid_string,
          message: check2.message
        }), status.dirty());
      else if (check2.kind === "url")
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          }), status.dirty();
        }
      else check2.kind === "regex" ? (check2.regex.lastIndex = 0, check2.regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "regex",
        code: ZodIssueCode.invalid_string,
        message: check2.message
      }), status.dirty())) : check2.kind === "trim" ? input.data = input.data.trim() : check2.kind === "includes" ? input.data.includes(check2.value, check2.position) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: { includes: check2.value, position: check2.position },
        message: check2.message
      }), status.dirty()) : check2.kind === "toLowerCase" ? input.data = input.data.toLowerCase() : check2.kind === "toUpperCase" ? input.data = input.data.toUpperCase() : check2.kind === "startsWith" ? input.data.startsWith(check2.value) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: { startsWith: check2.value },
        message: check2.message
      }), status.dirty()) : check2.kind === "endsWith" ? input.data.endsWith(check2.value) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: { endsWith: check2.value },
        message: check2.message
      }), status.dirty()) : check2.kind === "datetime" ? datetimeRegex(check2).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: "datetime",
        message: check2.message
      }), status.dirty()) : check2.kind === "date" ? dateRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: "date",
        message: check2.message
      }), status.dirty()) : check2.kind === "time" ? timeRegex(check2).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: "time",
        message: check2.message
      }), status.dirty()) : check2.kind === "duration" ? durationRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "duration",
        code: ZodIssueCode.invalid_string,
        message: check2.message
      }), status.dirty()) : check2.kind === "ip" ? isValidIP(input.data, check2.version) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "ip",
        code: ZodIssueCode.invalid_string,
        message: check2.message
      }), status.dirty()) : check2.kind === "jwt" ? isValidJWT2(input.data, check2.alg) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "jwt",
        code: ZodIssueCode.invalid_string,
        message: check2.message
      }), status.dirty()) : check2.kind === "cidr" ? isValidCidr(input.data, check2.version) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "cidr",
        code: ZodIssueCode.invalid_string,
        message: check2.message
      }), status.dirty()) : check2.kind === "base64" ? base64Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "base64",
        code: ZodIssueCode.invalid_string,
        message: check2.message
      }), status.dirty()) : check2.kind === "base64url" ? base64urlRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "base64url",
        code: ZodIssueCode.invalid_string,
        message: check2.message
      }), status.dirty()) : util.assertNever(check2);
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check2) {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    return typeof options == "string" ? this._addCheck({
      kind: "datetime",
      precision: null,
      offset: !1,
      local: !1,
      message: options
    }) : this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision > "u" ? null : options?.precision,
      offset: options?.offset ?? !1,
      local: options?.local ?? !1,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    return typeof options == "string" ? this._addCheck({
      kind: "time",
      precision: null,
      message: options
    }) : this._addCheck({
      kind: "time",
      precision: typeof options?.precision > "u" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (let ch of this._def.checks)
      ch.kind === "min" && (min === null || ch.value > min) && (min = ch.value);
    return min;
  }
  get maxLength() {
    let max = null;
    for (let ch of this._def.checks)
      ch.kind === "max" && (max === null || ch.value < max) && (max = ch.value);
    return max;
  }
};
ZodString2.create = (params) => new ZodString2({
  checks: [],
  typeName: ZodFirstPartyTypeKind.ZodString,
  coerce: params?.coerce ?? !1,
  ...processCreateParams(params)
});
function floatSafeRemainder2(val, step) {
  let valDecCount = (val.toString().split(".")[1] || "").length, stepDecCount = (step.toString().split(".")[1] || "").length, decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount, valInt = Number.parseInt(val.toFixed(decCount).replace(".", "")), stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber2 = class _ZodNumber extends ZodType2 {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce && (input.data = Number(input.data)), this._getType(input) !== ZodParsedType.number) {
      let ctx2 = this._getOrReturnCtx(input);
      return addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      }), INVALID;
    }
    let ctx, status = new ParseStatus();
    for (let check2 of this._def.checks)
      check2.kind === "int" ? util.isInteger(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: "integer",
        received: "float",
        message: check2.message
      }), status.dirty()) : check2.kind === "min" ? (check2.inclusive ? input.data < check2.value : input.data <= check2.value) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: check2.value,
        type: "number",
        inclusive: check2.inclusive,
        exact: !1,
        message: check2.message
      }), status.dirty()) : check2.kind === "max" ? (check2.inclusive ? input.data > check2.value : input.data >= check2.value) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: check2.value,
        type: "number",
        inclusive: check2.inclusive,
        exact: !1,
        message: check2.message
      }), status.dirty()) : check2.kind === "multipleOf" ? floatSafeRemainder2(input.data, check2.value) !== 0 && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.not_multiple_of,
        multipleOf: check2.value,
        message: check2.message
      }), status.dirty()) : check2.kind === "finite" ? Number.isFinite(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.not_finite,
        message: check2.message
      }), status.dirty()) : util.assertNever(check2);
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, !0, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, !1, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, !0, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, !1, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check2) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (let ch of this._def.checks)
      ch.kind === "min" && (min === null || ch.value > min) && (min = ch.value);
    return min;
  }
  get maxValue() {
    let max = null;
    for (let ch of this._def.checks)
      ch.kind === "max" && (max === null || ch.value < max) && (max = ch.value);
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null, min = null;
    for (let ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf")
        return !0;
      ch.kind === "min" ? (min === null || ch.value > min) && (min = ch.value) : ch.kind === "max" && (max === null || ch.value < max) && (max = ch.value);
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber2.create = (params) => new ZodNumber2({
  checks: [],
  typeName: ZodFirstPartyTypeKind.ZodNumber,
  coerce: params?.coerce || !1,
  ...processCreateParams(params)
});
var ZodBigInt = class _ZodBigInt extends ZodType2 {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce)
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    if (this._getType(input) !== ZodParsedType.bigint)
      return this._getInvalidInput(input);
    let ctx, status = new ParseStatus();
    for (let check2 of this._def.checks)
      check2.kind === "min" ? (check2.inclusive ? input.data < check2.value : input.data <= check2.value) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        type: "bigint",
        minimum: check2.value,
        inclusive: check2.inclusive,
        message: check2.message
      }), status.dirty()) : check2.kind === "max" ? (check2.inclusive ? input.data > check2.value : input.data >= check2.value) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        type: "bigint",
        maximum: check2.value,
        inclusive: check2.inclusive,
        message: check2.message
      }), status.dirty()) : check2.kind === "multipleOf" ? input.data % check2.value !== BigInt(0) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.not_multiple_of,
        multipleOf: check2.value,
        message: check2.message
      }), status.dirty()) : util.assertNever(check2);
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    let ctx = this._getOrReturnCtx(input);
    return addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    }), INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, !0, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, !1, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, !0, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, !1, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check2) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (let ch of this._def.checks)
      ch.kind === "min" && (min === null || ch.value > min) && (min = ch.value);
    return min;
  }
  get maxValue() {
    let max = null;
    for (let ch of this._def.checks)
      ch.kind === "max" && (max === null || ch.value < max) && (max = ch.value);
    return max;
  }
};
ZodBigInt.create = (params) => new ZodBigInt({
  checks: [],
  typeName: ZodFirstPartyTypeKind.ZodBigInt,
  coerce: params?.coerce ?? !1,
  ...processCreateParams(params)
});
var ZodBoolean2 = class extends ZodType2 {
  _parse(input) {
    if (this._def.coerce && (input.data = !!input.data), this._getType(input) !== ZodParsedType.boolean) {
      let ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean2.create = (params) => new ZodBoolean2({
  typeName: ZodFirstPartyTypeKind.ZodBoolean,
  coerce: params?.coerce || !1,
  ...processCreateParams(params)
});
var ZodDate = class _ZodDate extends ZodType2 {
  _parse(input) {
    if (this._def.coerce && (input.data = new Date(input.data)), this._getType(input) !== ZodParsedType.date) {
      let ctx2 = this._getOrReturnCtx(input);
      return addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      }), INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      let ctx2 = this._getOrReturnCtx(input);
      return addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      }), INVALID;
    }
    let status = new ParseStatus(), ctx;
    for (let check2 of this._def.checks)
      check2.kind === "min" ? input.data.getTime() < check2.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        message: check2.message,
        inclusive: !0,
        exact: !1,
        minimum: check2.value,
        type: "date"
      }), status.dirty()) : check2.kind === "max" ? input.data.getTime() > check2.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        message: check2.message,
        inclusive: !0,
        exact: !1,
        maximum: check2.value,
        type: "date"
      }), status.dirty()) : util.assertNever(check2);
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check2) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (let ch of this._def.checks)
      ch.kind === "min" && (min === null || ch.value > min) && (min = ch.value);
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (let ch of this._def.checks)
      ch.kind === "max" && (max === null || ch.value < max) && (max = ch.value);
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => new ZodDate({
  checks: [],
  coerce: params?.coerce || !1,
  typeName: ZodFirstPartyTypeKind.ZodDate,
  ...processCreateParams(params)
});
var ZodSymbol = class extends ZodType2 {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.symbol) {
      let ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => new ZodSymbol({
  typeName: ZodFirstPartyTypeKind.ZodSymbol,
  ...processCreateParams(params)
});
var ZodUndefined = class extends ZodType2 {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.undefined) {
      let ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => new ZodUndefined({
  typeName: ZodFirstPartyTypeKind.ZodUndefined,
  ...processCreateParams(params)
});
var ZodNull2 = class extends ZodType2 {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.null) {
      let ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
};
ZodNull2.create = (params) => new ZodNull2({
  typeName: ZodFirstPartyTypeKind.ZodNull,
  ...processCreateParams(params)
});
var ZodAny = class extends ZodType2 {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => new ZodAny({
  typeName: ZodFirstPartyTypeKind.ZodAny,
  ...processCreateParams(params)
});
var ZodUnknown2 = class extends ZodType2 {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown2.create = (params) => new ZodUnknown2({
  typeName: ZodFirstPartyTypeKind.ZodUnknown,
  ...processCreateParams(params)
});
var ZodNever2 = class extends ZodType2 {
  _parse(input) {
    let ctx = this._getOrReturnCtx(input);
    return addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    }), INVALID;
  }
};
ZodNever2.create = (params) => new ZodNever2({
  typeName: ZodFirstPartyTypeKind.ZodNever,
  ...processCreateParams(params)
});
var ZodVoid = class extends ZodType2 {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.undefined) {
      let ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      }), INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => new ZodVoid({
  typeName: ZodFirstPartyTypeKind.ZodVoid,
  ...processCreateParams(params)
});
var ZodArray2 = class _ZodArray extends ZodType2 {
  _parse(input) {
    let { ctx, status } = this._processInputParams(input), def = this._def;
    if (ctx.parsedType !== ZodParsedType.array)
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      }), INVALID;
    if (def.exactLength !== null) {
      let tooBig = ctx.data.length > def.exactLength.value, tooSmall = ctx.data.length < def.exactLength.value;
      (tooBig || tooSmall) && (addIssueToContext(ctx, {
        code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
        minimum: tooSmall ? def.exactLength.value : void 0,
        maximum: tooBig ? def.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: def.exactLength.message
      }), status.dirty());
    }
    if (def.minLength !== null && ctx.data.length < def.minLength.value && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_small,
      minimum: def.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: def.minLength.message
    }), status.dirty()), def.maxLength !== null && ctx.data.length > def.maxLength.value && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_big,
      maximum: def.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: def.maxLength.message
    }), status.dirty()), ctx.common.async)
      return Promise.all([...ctx.data].map((item, i) => def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i)))).then((result2) => ParseStatus.mergeArray(status, result2));
    let result = [...ctx.data].map((item, i) => def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray2.create = (schema, params) => new ZodArray2({
  type: schema,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: ZodFirstPartyTypeKind.ZodArray,
  ...processCreateParams(params)
});
function deepPartialify(schema) {
  if (schema instanceof ZodObject2) {
    let newShape = {};
    for (let key in schema.shape) {
      let fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional2.create(deepPartialify(fieldSchema));
    }
    return new ZodObject2({
      ...schema._def,
      shape: () => newShape
    });
  } else return schema instanceof ZodArray2 ? new ZodArray2({
    ...schema._def,
    type: deepPartialify(schema.element)
  }) : schema instanceof ZodOptional2 ? ZodOptional2.create(deepPartialify(schema.unwrap())) : schema instanceof ZodNullable2 ? ZodNullable2.create(deepPartialify(schema.unwrap())) : schema instanceof ZodTuple ? ZodTuple.create(schema.items.map((item) => deepPartialify(item))) : schema;
}
var ZodObject2 = class _ZodObject extends ZodType2 {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    let shape = this._def.shape(), keys = util.objectKeys(shape);
    return this._cached = { shape, keys }, this._cached;
  }
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.object) {
      let ctx2 = this._getOrReturnCtx(input);
      return addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      }), INVALID;
    }
    let { status, ctx } = this._processInputParams(input), { shape, keys: shapeKeys } = this._getCached(), extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever2 && this._def.unknownKeys === "strip"))
      for (let key in ctx.data)
        shapeKeys.includes(key) || extraKeys.push(key);
    let pairs = [];
    for (let key of shapeKeys) {
      let keyValidator = shape[key], value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever2) {
      let unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough")
        for (let key of extraKeys)
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
      else if (unknownKeys === "strict")
        extraKeys.length > 0 && (addIssueToContext(ctx, {
          code: ZodIssueCode.unrecognized_keys,
          keys: extraKeys
        }), status.dirty());
      else if (unknownKeys !== "strip")
        throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      let catchall = this._def.catchall;
      for (let key of extraKeys) {
        let value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    return ctx.common.async ? Promise.resolve().then(async () => {
      let syncPairs = [];
      for (let pair of pairs) {
        let key = await pair.key, value = await pair.value;
        syncPairs.push({
          key,
          value,
          alwaysSet: pair.alwaysSet
        });
      }
      return syncPairs;
    }).then((syncPairs) => ParseStatus.mergeObjectSync(status, syncPairs)) : ParseStatus.mergeObjectSync(status, pairs);
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    return errorUtil.errToObj, new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue2, ctx) => {
          let defaultError = this._def.errorMap?.(issue2, ctx).message ?? ctx.defaultError;
          return issue2.code === "unrecognized_keys" ? {
            message: errorUtil.errToObj(message).message ?? defaultError
          } : {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    return new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    let shape = {};
    for (let key of util.objectKeys(mask))
      mask[key] && this.shape[key] && (shape[key] = this.shape[key]);
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    let shape = {};
    for (let key of util.objectKeys(this.shape))
      mask[key] || (shape[key] = this.shape[key]);
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    let newShape = {};
    for (let key of util.objectKeys(this.shape)) {
      let fieldSchema = this.shape[key];
      mask && !mask[key] ? newShape[key] = fieldSchema : newShape[key] = fieldSchema.optional();
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    let newShape = {};
    for (let key of util.objectKeys(this.shape))
      if (mask && !mask[key])
        newShape[key] = this.shape[key];
      else {
        let newField = this.shape[key];
        for (; newField instanceof ZodOptional2; )
          newField = newField._def.innerType;
        newShape[key] = newField;
      }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject2.create = (shape, params) => new ZodObject2({
  shape: () => shape,
  unknownKeys: "strip",
  catchall: ZodNever2.create(),
  typeName: ZodFirstPartyTypeKind.ZodObject,
  ...processCreateParams(params)
});
ZodObject2.strictCreate = (shape, params) => new ZodObject2({
  shape: () => shape,
  unknownKeys: "strict",
  catchall: ZodNever2.create(),
  typeName: ZodFirstPartyTypeKind.ZodObject,
  ...processCreateParams(params)
});
ZodObject2.lazycreate = (shape, params) => new ZodObject2({
  shape,
  unknownKeys: "strip",
  catchall: ZodNever2.create(),
  typeName: ZodFirstPartyTypeKind.ZodObject,
  ...processCreateParams(params)
});
var ZodUnion2 = class extends ZodType2 {
  _parse(input) {
    let { ctx } = this._processInputParams(input), options = this._def.options;
    function handleResults(results) {
      for (let result of results)
        if (result.result.status === "valid")
          return result.result;
      for (let result of results)
        if (result.result.status === "dirty")
          return ctx.common.issues.push(...result.ctx.common.issues), result.result;
      let unionErrors = results.map((result) => new ZodError2(result.ctx.common.issues));
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      }), INVALID;
    }
    if (ctx.common.async)
      return Promise.all(options.map(async (option) => {
        let childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    {
      let dirty, issues = [];
      for (let option of options) {
        let childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        }, result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid")
          return result;
        result.status === "dirty" && !dirty && (dirty = { result, ctx: childCtx }), childCtx.common.issues.length && issues.push(childCtx.common.issues);
      }
      if (dirty)
        return ctx.common.issues.push(...dirty.ctx.common.issues), dirty.result;
      let unionErrors = issues.map((issues2) => new ZodError2(issues2));
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      }), INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion2.create = (types, params) => new ZodUnion2({
  options: types,
  typeName: ZodFirstPartyTypeKind.ZodUnion,
  ...processCreateParams(params)
});
var getDiscriminator = (type) => type instanceof ZodLazy ? getDiscriminator(type.schema) : type instanceof ZodEffects ? getDiscriminator(type.innerType()) : type instanceof ZodLiteral2 ? [type.value] : type instanceof ZodEnum2 ? type.options : type instanceof ZodNativeEnum ? util.objectValues(type.enum) : type instanceof ZodDefault2 ? getDiscriminator(type._def.innerType) : type instanceof ZodUndefined ? [void 0] : type instanceof ZodNull2 ? [null] : type instanceof ZodOptional2 ? [void 0, ...getDiscriminator(type.unwrap())] : type instanceof ZodNullable2 ? [null, ...getDiscriminator(type.unwrap())] : type instanceof ZodBranded || type instanceof ZodReadonly2 ? getDiscriminator(type.unwrap()) : type instanceof ZodCatch2 ? getDiscriminator(type._def.innerType) : [], ZodDiscriminatedUnion2 = class _ZodDiscriminatedUnion extends ZodType2 {
  _parse(input) {
    let { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object)
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      }), INVALID;
    let discriminator = this.discriminator, discriminatorValue = ctx.data[discriminator], option = this.optionsMap.get(discriminatorValue);
    return option ? ctx.common.async ? option._parseAsync({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    }) : option._parseSync({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    }) : (addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_union_discriminator,
      options: Array.from(this.optionsMap.keys()),
      path: [discriminator]
    }), INVALID);
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    let optionsMap = /* @__PURE__ */ new Map();
    for (let type of options) {
      let discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length)
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      for (let value of discriminatorValues) {
        if (optionsMap.has(value))
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues2(a, b) {
  let aType = getParsedType2(a), bType = getParsedType2(b);
  if (a === b)
    return { valid: !0, data: a };
  if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    let bKeys = util.objectKeys(b), sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1), newObj = { ...a, ...b };
    for (let key of sharedKeys) {
      let sharedValue = mergeValues2(a[key], b[key]);
      if (!sharedValue.valid)
        return { valid: !1 };
      newObj[key] = sharedValue.data;
    }
    return { valid: !0, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length)
      return { valid: !1 };
    let newArray = [];
    for (let index = 0; index < a.length; index++) {
      let itemA = a[index], itemB = b[index], sharedValue = mergeValues2(itemA, itemB);
      if (!sharedValue.valid)
        return { valid: !1 };
      newArray.push(sharedValue.data);
    }
    return { valid: !0, data: newArray };
  } else return aType === ZodParsedType.date && bType === ZodParsedType.date && +a == +b ? { valid: !0, data: a } : { valid: !1 };
}
var ZodIntersection2 = class extends ZodType2 {
  _parse(input) {
    let { status, ctx } = this._processInputParams(input), handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight))
        return INVALID;
      let merged = mergeValues2(parsedLeft.value, parsedRight.value);
      return merged.valid ? ((isDirty(parsedLeft) || isDirty(parsedRight)) && status.dirty(), { status: status.value, value: merged.data }) : (addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_intersection_types
      }), INVALID);
    };
    return ctx.common.async ? Promise.all([
      this._def.left._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }),
      this._def.right._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      })
    ]).then(([left, right]) => handleParsed(left, right)) : handleParsed(this._def.left._parseSync({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    }), this._def.right._parseSync({
      data: ctx.data,
      path: ctx.path,
      parent: ctx
    }));
  }
};
ZodIntersection2.create = (left, right, params) => new ZodIntersection2({
  left,
  right,
  typeName: ZodFirstPartyTypeKind.ZodIntersection,
  ...processCreateParams(params)
});
var ZodTuple = class _ZodTuple extends ZodType2 {
  _parse(input) {
    let { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array)
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      }), INVALID;
    if (ctx.data.length < this._def.items.length)
      return addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), INVALID;
    !this._def.rest && ctx.data.length > this._def.items.length && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), status.dirty());
    let items = [...ctx.data].map((item, itemIndex) => {
      let schema = this._def.items[itemIndex] || this._def.rest;
      return schema ? schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex)) : null;
    }).filter((x) => !!x);
    return ctx.common.async ? Promise.all(items).then((results) => ParseStatus.mergeArray(status, results)) : ParseStatus.mergeArray(status, items);
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord2 = class _ZodRecord extends ZodType2 {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    let { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object)
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      }), INVALID;
    let pairs = [], keyType = this._def.keyType, valueType = this._def.valueType;
    for (let key in ctx.data)
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    return ctx.common.async ? ParseStatus.mergeObjectAsync(status, pairs) : ParseStatus.mergeObjectSync(status, pairs);
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    return second instanceof ZodType2 ? new _ZodRecord({
      keyType: first,
      valueType: second,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(third)
    }) : new _ZodRecord({
      keyType: ZodString2.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}, ZodMap = class extends ZodType2 {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    let { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map)
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      }), INVALID;
    let keyType = this._def.keyType, valueType = this._def.valueType, pairs = [...ctx.data.entries()].map(([key, value], index) => ({
      key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
      value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
    }));
    if (ctx.common.async) {
      let finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (let pair of pairs) {
          let key = await pair.key, value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted")
            return INVALID;
          (key.status === "dirty" || value.status === "dirty") && status.dirty(), finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      let finalMap = /* @__PURE__ */ new Map();
      for (let pair of pairs) {
        let key = pair.key, value = pair.value;
        if (key.status === "aborted" || value.status === "aborted")
          return INVALID;
        (key.status === "dirty" || value.status === "dirty") && status.dirty(), finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => new ZodMap({
  valueType,
  keyType,
  typeName: ZodFirstPartyTypeKind.ZodMap,
  ...processCreateParams(params)
});
var ZodSet = class _ZodSet extends ZodType2 {
  _parse(input) {
    let { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set)
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      }), INVALID;
    let def = this._def;
    def.minSize !== null && ctx.data.size < def.minSize.value && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_small,
      minimum: def.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: def.minSize.message
    }), status.dirty()), def.maxSize !== null && ctx.data.size > def.maxSize.value && (addIssueToContext(ctx, {
      code: ZodIssueCode.too_big,
      maximum: def.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: def.maxSize.message
    }), status.dirty());
    let valueType = this._def.valueType;
    function finalizeSet(elements2) {
      let parsedSet = /* @__PURE__ */ new Set();
      for (let element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        element.status === "dirty" && status.dirty(), parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    let elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    return ctx.common.async ? Promise.all(elements).then((elements2) => finalizeSet(elements2)) : finalizeSet(elements);
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => new ZodSet({
  valueType,
  minSize: null,
  maxSize: null,
  typeName: ZodFirstPartyTypeKind.ZodSet,
  ...processCreateParams(params)
});
var ZodFunction = class _ZodFunction extends ZodType2 {
  constructor() {
    super(...arguments), this.validate = this.implement;
  }
  _parse(input) {
    let { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function)
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      }), INVALID;
    function makeArgsIssue(args, error2) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default2].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error2
        }
      });
    }
    function makeReturnsIssue(returns, error2) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default2].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error2
        }
      });
    }
    let params = { errorMap: ctx.common.contextualErrorMap }, fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      let me = this;
      return OK(async function(...args) {
        let error2 = new ZodError2([]), parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          throw error2.addIssue(makeArgsIssue(args, e)), error2;
        }), result = await Reflect.apply(fn, this, parsedArgs);
        return await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          throw error2.addIssue(makeReturnsIssue(result, e)), error2;
        });
      });
    } else {
      let me = this;
      return OK(function(...args) {
        let parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success)
          throw new ZodError2([makeArgsIssue(args, parsedArgs.error)]);
        let result = Reflect.apply(fn, this, parsedArgs.data), parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success)
          throw new ZodError2([makeReturnsIssue(result, parsedReturns.error)]);
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown2.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    return this.parse(func);
  }
  strictImplement(func) {
    return this.parse(func);
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args || ZodTuple.create([]).rest(ZodUnknown2.create()),
      returns: returns || ZodUnknown2.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}, ZodLazy = class extends ZodType2 {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    let { ctx } = this._processInputParams(input);
    return this._def.getter()._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => new ZodLazy({
  getter,
  typeName: ZodFirstPartyTypeKind.ZodLazy,
  ...processCreateParams(params)
});
var ZodLiteral2 = class extends ZodType2 {
  _parse(input) {
    if (input.data !== this._def.value) {
      let ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      }), INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral2.create = (value, params) => new ZodLiteral2({
  value,
  typeName: ZodFirstPartyTypeKind.ZodLiteral,
  ...processCreateParams(params)
});
function createZodEnum(values, params) {
  return new ZodEnum2({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum2 = class _ZodEnum extends ZodType2 {
  _parse(input) {
    if (typeof input.data != "string") {
      let ctx = this._getOrReturnCtx(input), expectedValues = this._def.values;
      return addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      }), INVALID;
    }
    if (this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(input.data)) {
      let ctx = this._getOrReturnCtx(input), expectedValues = this._def.values;
      return addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      }), INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    let enumValues = {};
    for (let val of this._def.values)
      enumValues[val] = val;
    return enumValues;
  }
  get Values() {
    let enumValues = {};
    for (let val of this._def.values)
      enumValues[val] = val;
    return enumValues;
  }
  get Enum() {
    let enumValues = {};
    for (let val of this._def.values)
      enumValues[val] = val;
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum2.create = createZodEnum;
var ZodNativeEnum = class extends ZodType2 {
  _parse(input) {
    let nativeEnumValues = util.getValidEnumValues(this._def.values), ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      let expectedValues = util.objectValues(nativeEnumValues);
      return addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      }), INVALID;
    }
    if (this._cache || (this._cache = new Set(util.getValidEnumValues(this._def.values))), !this._cache.has(input.data)) {
      let expectedValues = util.objectValues(nativeEnumValues);
      return addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      }), INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => new ZodNativeEnum({
  values,
  typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
  ...processCreateParams(params)
});
var ZodPromise = class extends ZodType2 {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    let { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === !1)
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      }), INVALID;
    let promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => this._def.type.parseAsync(data, {
      path: ctx.path,
      errorMap: ctx.common.contextualErrorMap
    })));
  }
};
ZodPromise.create = (schema, params) => new ZodPromise({
  type: schema,
  typeName: ZodFirstPartyTypeKind.ZodPromise,
  ...processCreateParams(params)
});
var ZodEffects = class extends ZodType2 {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    let { status, ctx } = this._processInputParams(input), effect = this._def.effect || null, checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg), arg.fatal ? status.abort() : status.dirty();
      },
      get path() {
        return ctx.path;
      }
    };
    if (checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx), effect.type === "preprocess") {
      let processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async)
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          let result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          return result.status === "aborted" ? INVALID : result.status === "dirty" ? DIRTY(result.value) : status.value === "dirty" ? DIRTY(result.value) : result;
        });
      {
        if (status.value === "aborted")
          return INVALID;
        let result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        return result.status === "aborted" ? INVALID : result.status === "dirty" ? DIRTY(result.value) : status.value === "dirty" ? DIRTY(result.value) : result;
      }
    }
    if (effect.type === "refinement") {
      let executeRefinement = (acc) => {
        let result = effect.refinement(acc, checkCtx);
        if (ctx.common.async)
          return Promise.resolve(result);
        if (result instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return acc;
      };
      if (ctx.common.async === !1) {
        let inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        return inner.status === "aborted" ? INVALID : (inner.status === "dirty" && status.dirty(), executeRefinement(inner.value), { status: status.value, value: inner.value });
      } else
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => inner.status === "aborted" ? INVALID : (inner.status === "dirty" && status.dirty(), executeRefinement(inner.value).then(() => ({ status: status.value, value: inner.value }))));
    }
    if (effect.type === "transform")
      if (ctx.common.async === !1) {
        let base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        let result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: status.value, value: result };
      } else
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => isValid(base) ? Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
          status: status.value,
          value: result
        })) : INVALID);
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => new ZodEffects({
  schema,
  typeName: ZodFirstPartyTypeKind.ZodEffects,
  effect,
  ...processCreateParams(params)
});
ZodEffects.createWithPreprocess = (preprocess2, schema, params) => new ZodEffects({
  schema,
  effect: { type: "preprocess", transform: preprocess2 },
  typeName: ZodFirstPartyTypeKind.ZodEffects,
  ...processCreateParams(params)
});
var ZodOptional2 = class extends ZodType2 {
  _parse(input) {
    return this._getType(input) === ZodParsedType.undefined ? OK(void 0) : this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional2.create = (type, params) => new ZodOptional2({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodOptional,
  ...processCreateParams(params)
});
var ZodNullable2 = class extends ZodType2 {
  _parse(input) {
    return this._getType(input) === ZodParsedType.null ? OK(null) : this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable2.create = (type, params) => new ZodNullable2({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodNullable,
  ...processCreateParams(params)
});
var ZodDefault2 = class extends ZodType2 {
  _parse(input) {
    let { ctx } = this._processInputParams(input), data = ctx.data;
    return ctx.parsedType === ZodParsedType.undefined && (data = this._def.defaultValue()), this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault2.create = (type, params) => new ZodDefault2({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodDefault,
  defaultValue: typeof params.default == "function" ? params.default : () => params.default,
  ...processCreateParams(params)
});
var ZodCatch2 = class extends ZodType2 {
  _parse(input) {
    let { ctx } = this._processInputParams(input), newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    }, result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    return isAsync(result) ? result.then((result2) => ({
      status: "valid",
      value: result2.status === "valid" ? result2.value : this._def.catchValue({
        get error() {
          return new ZodError2(newCtx.common.issues);
        },
        input: newCtx.data
      })
    })) : {
      status: "valid",
      value: result.status === "valid" ? result.value : this._def.catchValue({
        get error() {
          return new ZodError2(newCtx.common.issues);
        },
        input: newCtx.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch2.create = (type, params) => new ZodCatch2({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodCatch,
  catchValue: typeof params.catch == "function" ? params.catch : () => params.catch,
  ...processCreateParams(params)
});
var ZodNaN = class extends ZodType2 {
  _parse(input) {
    if (this._getType(input) !== ZodParsedType.nan) {
      let ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      }), INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => new ZodNaN({
  typeName: ZodFirstPartyTypeKind.ZodNaN,
  ...processCreateParams(params)
});
var BRAND = Symbol("zod_brand"), ZodBranded = class extends ZodType2 {
  _parse(input) {
    let { ctx } = this._processInputParams(input), data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}, ZodPipeline = class _ZodPipeline extends ZodType2 {
  _parse(input) {
    let { status, ctx } = this._processInputParams(input);
    if (ctx.common.async)
      return (async () => {
        let inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        return inResult.status === "aborted" ? INVALID : inResult.status === "dirty" ? (status.dirty(), DIRTY(inResult.value)) : this._def.out._parseAsync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      })();
    {
      let inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      return inResult.status === "aborted" ? INVALID : inResult.status === "dirty" ? (status.dirty(), {
        status: "dirty",
        value: inResult.value
      }) : this._def.out._parseSync({
        data: inResult.value,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}, ZodReadonly2 = class extends ZodType2 {
  _parse(input) {
    let result = this._def.innerType._parse(input), freeze = (data) => (isValid(data) && (data.value = Object.freeze(data.value)), data);
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly2.create = (type, params) => new ZodReadonly2({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodReadonly,
  ...processCreateParams(params)
});
function cleanParams(params, data) {
  let p = typeof params == "function" ? params(data) : typeof params == "string" ? { message: params } : params;
  return typeof p == "string" ? { message: p } : p;
}
function custom2(check2, _params = {}, fatal) {
  return check2 ? ZodAny.create().superRefine((data, ctx) => {
    let r = check2(data);
    if (r instanceof Promise)
      return r.then((r2) => {
        if (!r2) {
          let params = cleanParams(_params, data), _fatal = params.fatal ?? fatal ?? !0;
          ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
        }
      });
    if (!r) {
      let params = cleanParams(_params, data), _fatal = params.fatal ?? fatal ?? !0;
      ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
    }
  }) : ZodAny.create();
}
var late = {
  object: ZodObject2.lazycreate
}, ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2.ZodString = "ZodString", ZodFirstPartyTypeKind2.ZodNumber = "ZodNumber", ZodFirstPartyTypeKind2.ZodNaN = "ZodNaN", ZodFirstPartyTypeKind2.ZodBigInt = "ZodBigInt", ZodFirstPartyTypeKind2.ZodBoolean = "ZodBoolean", ZodFirstPartyTypeKind2.ZodDate = "ZodDate", ZodFirstPartyTypeKind2.ZodSymbol = "ZodSymbol", ZodFirstPartyTypeKind2.ZodUndefined = "ZodUndefined", ZodFirstPartyTypeKind2.ZodNull = "ZodNull", ZodFirstPartyTypeKind2.ZodAny = "ZodAny", ZodFirstPartyTypeKind2.ZodUnknown = "ZodUnknown", ZodFirstPartyTypeKind2.ZodNever = "ZodNever", ZodFirstPartyTypeKind2.ZodVoid = "ZodVoid", ZodFirstPartyTypeKind2.ZodArray = "ZodArray", ZodFirstPartyTypeKind2.ZodObject = "ZodObject", ZodFirstPartyTypeKind2.ZodUnion = "ZodUnion", ZodFirstPartyTypeKind2.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", ZodFirstPartyTypeKind2.ZodIntersection = "ZodIntersection", ZodFirstPartyTypeKind2.ZodTuple = "ZodTuple", ZodFirstPartyTypeKind2.ZodRecord = "ZodRecord", ZodFirstPartyTypeKind2.ZodMap = "ZodMap", ZodFirstPartyTypeKind2.ZodSet = "ZodSet", ZodFirstPartyTypeKind2.ZodFunction = "ZodFunction", ZodFirstPartyTypeKind2.ZodLazy = "ZodLazy", ZodFirstPartyTypeKind2.ZodLiteral = "ZodLiteral", ZodFirstPartyTypeKind2.ZodEnum = "ZodEnum", ZodFirstPartyTypeKind2.ZodEffects = "ZodEffects", ZodFirstPartyTypeKind2.ZodNativeEnum = "ZodNativeEnum", ZodFirstPartyTypeKind2.ZodOptional = "ZodOptional", ZodFirstPartyTypeKind2.ZodNullable = "ZodNullable", ZodFirstPartyTypeKind2.ZodDefault = "ZodDefault", ZodFirstPartyTypeKind2.ZodCatch = "ZodCatch", ZodFirstPartyTypeKind2.ZodPromise = "ZodPromise", ZodFirstPartyTypeKind2.ZodBranded = "ZodBranded", ZodFirstPartyTypeKind2.ZodPipeline = "ZodPipeline", ZodFirstPartyTypeKind2.ZodReadonly = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom2((data) => data instanceof cls, params), stringType = ZodString2.create, numberType = ZodNumber2.create, nanType = ZodNaN.create, bigIntType = ZodBigInt.create, booleanType = ZodBoolean2.create, dateType = ZodDate.create, symbolType = ZodSymbol.create, undefinedType = ZodUndefined.create, nullType = ZodNull2.create, anyType = ZodAny.create, unknownType = ZodUnknown2.create, neverType = ZodNever2.create, voidType = ZodVoid.create, arrayType = ZodArray2.create, objectType = ZodObject2.create, strictObjectType = ZodObject2.strictCreate, unionType = ZodUnion2.create, discriminatedUnionType = ZodDiscriminatedUnion2.create, intersectionType = ZodIntersection2.create, tupleType = ZodTuple.create, recordType = ZodRecord2.create, mapType = ZodMap.create, setType = ZodSet.create, functionType = ZodFunction.create, lazyType = ZodLazy.create, literalType = ZodLiteral2.create, enumType = ZodEnum2.create, nativeEnumType = ZodNativeEnum.create, promiseType = ZodPromise.create, effectsType = ZodEffects.create, optionalType = ZodOptional2.create, nullableType = ZodNullable2.create, preprocessType = ZodEffects.createWithPreprocess, pipelineType = ZodPipeline.create, ostring = () => stringType().optional(), onumber = () => numberType().optional(), oboolean = () => booleanType().optional(), coerce = {
  string: ((arg) => ZodString2.create({ ...arg, coerce: !0 })),
  number: ((arg) => ZodNumber2.create({ ...arg, coerce: !0 })),
  boolean: ((arg) => ZodBoolean2.create({
    ...arg,
    coerce: !0
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: !0 })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: !0 }))
};
var NEVER2 = INVALID;

// node_modules/zod/v4/mini/schemas.js
var ZodMiniType = /* @__PURE__ */ $constructor("ZodMiniType", (inst, def) => {
  if (!inst._zod)
    throw new Error("Uninitialized schema in ZodMiniType.");
  $ZodType.init(inst, def), inst.def = def, inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse }), inst.safeParse = (data, params) => safeParse(inst, data, params), inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync }), inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params), inst.check = (...checks) => inst.clone(
    {
      ...def,
      checks: [
        ...def.checks ?? [],
        ...checks.map((ch) => typeof ch == "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }
    // { parent: true }
  ), inst.clone = (_def, params) => clone(inst, _def, params), inst.brand = () => inst, inst.register = ((reg, meta) => (reg.add(inst, meta), inst));
});
var ZodMiniObject = /* @__PURE__ */ $constructor("ZodMiniObject", (inst, def) => {
  $ZodObject.init(inst, def), ZodMiniType.init(inst, def), util_exports.defineLazy(inst, "shape", () => def.shape);
});
function object2(shape, params) {
  let def = {
    type: "object",
    get shape() {
      return util_exports.assignProp(this, "shape", { ...shape }), this.shape;
    },
    ...util_exports.normalizeParams(params)
  };
  return new ZodMiniObject(def);
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-compat.js
function isZ4Schema(s) {
  return !!s._zod;
}
function objectFromShape(shape) {
  let values = Object.values(shape);
  if (values.length === 0)
    return object2({});
  let allV4 = values.every(isZ4Schema), allV3 = values.every((s) => !isZ4Schema(s));
  if (allV4)
    return object2(shape);
  if (allV3)
    return objectType(shape);
  throw new Error("Mixed Zod versions detected in object shape.");
}
function safeParse3(schema, data) {
  return isZ4Schema(schema) ? safeParse(schema, data) : schema.safeParse(data);
}
async function safeParseAsync3(schema, data) {
  return isZ4Schema(schema) ? await safeParseAsync(schema, data) : await schema.safeParseAsync(data);
}
function getObjectShape(schema) {
  if (!schema)
    return;
  let rawShape;
  if (isZ4Schema(schema) ? rawShape = schema._zod?.def?.shape : rawShape = schema.shape, !!rawShape) {
    if (typeof rawShape == "function")
      try {
        return rawShape();
      } catch {
        return;
      }
    return rawShape;
  }
}
function normalizeObjectSchema(schema) {
  if (schema) {
    if (typeof schema == "object") {
      let asV3 = schema, asV4 = schema;
      if (!asV3._def && !asV4._zod) {
        let values = Object.values(schema);
        if (values.length > 0 && values.every((v) => typeof v == "object" && v !== null && (v._def !== void 0 || v._zod !== void 0 || typeof v.parse == "function")))
          return objectFromShape(schema);
      }
    }
    if (isZ4Schema(schema)) {
      let def = schema._zod?.def;
      if (def && (def.type === "object" || def.shape !== void 0))
        return schema;
    } else if (schema.shape !== void 0)
      return schema;
  }
}
function getDotPath(path8) {
  return path8.length === 0 ? "object root" : path8.reduce((acc, seg, index) => index === 0 ? String(seg) : typeof seg == "number" ? `${acc}[${seg}]` : `${acc}.${seg}`, "");
}
function getParseErrorMessage(error2) {
  if (error2 && typeof error2 == "object") {
    if ("issues" in error2 && Array.isArray(error2.issues) && error2.issues.length > 0)
      return error2.issues.map((i) => i.path?.length ? `${i.message} at ${getDotPath(i.path)}` : i.message).join(`
`);
    if ("message" in error2 && typeof error2.message == "string")
      return error2.message;
    try {
      return JSON.stringify(error2);
    } catch {
      return String(error2);
    }
  }
  return String(error2);
}
function getSchemaDescription(schema) {
  return schema.description;
}
function isSchemaOptional(schema) {
  if (isZ4Schema(schema))
    return schema._zod?.def?.type === "optional";
  let v3Schema = schema;
  return typeof schema.isOptional == "function" ? schema.isOptional() : v3Schema._def?.typeName === "ZodOptional";
}
function getLiteralValue(schema) {
  if (isZ4Schema(schema)) {
    let def2 = schema._zod?.def;
    if (def2) {
      if (def2.value !== void 0)
        return def2.value;
      if (Array.isArray(def2.values) && def2.values.length > 0)
        return def2.values[0];
    }
  }
  let def = schema._def;
  if (def) {
    if (def.value !== void 0)
      return def.value;
    if (Array.isArray(def.values) && def.values.length > 0)
      return def.values[0];
  }
  let directValue = schema.value;
  if (directValue !== void 0)
    return directValue;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/interfaces.js
function isTerminal(status) {
  return status === "completed" || status === "failed" || status === "cancelled";
}

// node_modules/zod-to-json-schema/dist/esm/Options.js
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: !0,
  rejectedAdditionalProperties: !1,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: !1,
  definitions: {},
  errorMessages: !1,
  markdownDescription: !1,
  patternStrategy: "escape",
  applyRegexFlags: !1,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref",
  openAiAnyTypeName: "OpenAiAnyType"
}, getDefaultOptions = (options) => typeof options == "string" ? {
  ...defaultOptions,
  name: options
} : {
  ...defaultOptions,
  ...options
};

// node_modules/zod-to-json-schema/dist/esm/Refs.js
var getRefs = (options) => {
  let _options = getDefaultOptions(options), currentPath = _options.name !== void 0 ? [..._options.basePath, _options.definitionPath, _options.name] : _options.basePath;
  return {
    ..._options,
    flags: { hasReferencedOpenAiAnyType: !1 },
    currentPath,
    propertyPath: void 0,
    seen: new Map(Object.entries(_options.definitions).map(([name, def]) => [
      def._def,
      {
        def: def._def,
        path: [..._options.basePath, _options.definitionPath, name],
        // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
        jsonSchema: void 0
      }
    ]))
  };
};

// node_modules/zod-to-json-schema/dist/esm/errorMessages.js
function addErrorMessage(res, key, errorMessage, refs) {
  refs?.errorMessages && errorMessage && (res.errorMessage = {
    ...res.errorMessage,
    [key]: errorMessage
  });
}
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
  res[key] = value, addErrorMessage(res, key, errorMessage, refs);
}

// node_modules/zod-to-json-schema/dist/esm/getRelativePath.js
var getRelativePath = (pathA, pathB) => {
  let i = 0;
  for (; i < pathA.length && i < pathB.length && pathA[i] === pathB[i]; i++)
    ;
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};

// node_modules/zod-to-json-schema/dist/esm/parsers/any.js
function parseAnyDef(refs) {
  if (refs.target !== "openAi")
    return {};
  let anyDefinitionPath = [
    ...refs.basePath,
    refs.definitionPath,
    refs.openAiAnyTypeName
  ];
  return refs.flags.hasReferencedOpenAiAnyType = !0, {
    $ref: refs.$refStrategy === "relative" ? getRelativePath(anyDefinitionPath, refs.currentPath) : anyDefinitionPath.join("/")
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/array.js
function parseArrayDef(def, refs) {
  let res = {
    type: "array"
  };
  return def.type?._def && def.type?._def?.typeName !== ZodFirstPartyTypeKind.ZodAny && (res.items = parseDef(def.type._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items"]
  })), def.minLength && setResponseValueAndErrors(res, "minItems", def.minLength.value, def.minLength.message, refs), def.maxLength && setResponseValueAndErrors(res, "maxItems", def.maxLength.value, def.maxLength.message, refs), def.exactLength && (setResponseValueAndErrors(res, "minItems", def.exactLength.value, def.exactLength.message, refs), setResponseValueAndErrors(res, "maxItems", def.exactLength.value, def.exactLength.message, refs)), res;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
function parseBigintDef(def, refs) {
  let res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks)
    return res;
  for (let check2 of def.checks)
    switch (check2.kind) {
      case "min":
        refs.target === "jsonSchema7" ? check2.inclusive ? setResponseValueAndErrors(res, "minimum", check2.value, check2.message, refs) : setResponseValueAndErrors(res, "exclusiveMinimum", check2.value, check2.message, refs) : (check2.inclusive || (res.exclusiveMinimum = !0), setResponseValueAndErrors(res, "minimum", check2.value, check2.message, refs));
        break;
      case "max":
        refs.target === "jsonSchema7" ? check2.inclusive ? setResponseValueAndErrors(res, "maximum", check2.value, check2.message, refs) : setResponseValueAndErrors(res, "exclusiveMaximum", check2.value, check2.message, refs) : (check2.inclusive || (res.exclusiveMaximum = !0), setResponseValueAndErrors(res, "maximum", check2.value, check2.message, refs));
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check2.value, check2.message, refs);
        break;
    }
  return res;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
function parseBooleanDef() {
  return {
    type: "boolean"
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
var parseCatchDef = (def, refs) => parseDef(def.innerType._def, refs);

// node_modules/zod-to-json-schema/dist/esm/parsers/date.js
function parseDateDef(def, refs, overrideDateStrategy) {
  let strategy = overrideDateStrategy ?? refs.dateStrategy;
  if (Array.isArray(strategy))
    return {
      anyOf: strategy.map((item, i) => parseDateDef(def, refs, item))
    };
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def, refs);
  }
}
var integerDateParser = (def, refs) => {
  let res = {
    type: "integer",
    format: "unix-time"
  };
  if (refs.target === "openApi3")
    return res;
  for (let check2 of def.checks)
    switch (check2.kind) {
      case "min":
        setResponseValueAndErrors(
          res,
          "minimum",
          check2.value,
          // This is in milliseconds
          check2.message,
          refs
        );
        break;
      case "max":
        setResponseValueAndErrors(
          res,
          "maximum",
          check2.value,
          // This is in milliseconds
          check2.message,
          refs
        );
        break;
    }
  return res;
};

// node_modules/zod-to-json-schema/dist/esm/parsers/default.js
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef(refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
var isJsonSchema7AllOfType = (type) => "type" in type && type.type === "string" ? !1 : "allOf" in type;
function parseIntersectionDef(def, refs) {
  let allOf = [
    parseDef(def.left._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "0"]
    }),
    parseDef(def.right._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "1"]
    })
  ].filter((x) => !!x), unevaluatedProperties = refs.target === "jsonSchema2019-09" ? { unevaluatedProperties: !1 } : void 0, mergedAllOf = [];
  return allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema))
      mergedAllOf.push(...schema.allOf), schema.unevaluatedProperties === void 0 && (unevaluatedProperties = void 0);
    else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === !1) {
        let { additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      } else
        unevaluatedProperties = void 0;
      mergedAllOf.push(nestedSchema);
    }
  }), mergedAllOf.length ? {
    allOf: mergedAllOf,
    ...unevaluatedProperties
  } : void 0;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
function parseLiteralDef(def, refs) {
  let parsedType2 = typeof def.value;
  return parsedType2 !== "bigint" && parsedType2 !== "number" && parsedType2 !== "boolean" && parsedType2 !== "string" ? {
    type: Array.isArray(def.value) ? "array" : "object"
  } : refs.target === "openApi3" ? {
    type: parsedType2 === "bigint" ? "integer" : parsedType2,
    enum: [def.value]
  } : {
    type: parsedType2 === "bigint" ? "integer" : parsedType2,
    const: def.value
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var emojiRegex2, zodPatterns = {
  /**
   * `c` was changed to `[cC]` to replicate /i flag
   */
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  /**
   * `a-z` was added to replicate /i flag
   */
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  /**
   * Constructed a valid Unicode RegExp
   *
   * Lazily instantiate since this type of regex isn't supported
   * in all envs (e.g. React Native).
   *
   * See:
   * https://github.com/colinhacks/zod/issues/2433
   * Fix in Zod:
   * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
   */
  emoji: () => (emojiRegex2 === void 0 && (emojiRegex2 = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u")), emojiRegex2),
  /**
   * Unused
   */
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  /**
   * Unused
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  /**
   * Unused
   */
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
  let res = {
    type: "string"
  };
  if (def.checks)
    for (let check2 of def.checks)
      switch (check2.kind) {
        case "min":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength == "number" ? Math.max(res.minLength, check2.value) : check2.value, check2.message, refs);
          break;
        case "max":
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength == "number" ? Math.min(res.maxLength, check2.value) : check2.value, check2.message, refs);
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check2.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check2.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check2.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check2.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check2.message, refs);
          break;
        case "regex":
          addPattern(res, check2.regex, check2.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check2.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check2.message, refs);
          break;
        case "startsWith":
          addPattern(res, RegExp(`^${escapeLiteralCheckValue(check2.value, refs)}`), check2.message, refs);
          break;
        case "endsWith":
          addPattern(res, RegExp(`${escapeLiteralCheckValue(check2.value, refs)}$`), check2.message, refs);
          break;
        case "datetime":
          addFormat(res, "date-time", check2.message, refs);
          break;
        case "date":
          addFormat(res, "date", check2.message, refs);
          break;
        case "time":
          addFormat(res, "time", check2.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check2.message, refs);
          break;
        case "length":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength == "number" ? Math.max(res.minLength, check2.value) : check2.value, check2.message, refs), setResponseValueAndErrors(res, "maxLength", typeof res.maxLength == "number" ? Math.min(res.maxLength, check2.value) : check2.value, check2.message, refs);
          break;
        case "includes": {
          addPattern(res, RegExp(escapeLiteralCheckValue(check2.value, refs)), check2.message, refs);
          break;
        }
        case "ip": {
          check2.version !== "v6" && addFormat(res, "ipv4", check2.message, refs), check2.version !== "v4" && addFormat(res, "ipv6", check2.message, refs);
          break;
        }
        case "base64url":
          addPattern(res, zodPatterns.base64url, check2.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check2.message, refs);
          break;
        case "cidr": {
          check2.version !== "v6" && addPattern(res, zodPatterns.ipv4Cidr, check2.message, refs), check2.version !== "v4" && addPattern(res, zodPatterns.ipv6Cidr, check2.message, refs);
          break;
        }
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check2.message, refs);
          break;
        case "ulid": {
          addPattern(res, zodPatterns.ulid, check2.message, refs);
          break;
        }
        case "base64": {
          switch (refs.base64Strategy) {
            case "format:binary": {
              addFormat(res, "binary", check2.message, refs);
              break;
            }
            case "contentEncoding:base64": {
              setResponseValueAndErrors(res, "contentEncoding", "base64", check2.message, refs);
              break;
            }
            case "pattern:zod": {
              addPattern(res, zodPatterns.base64, check2.message, refs);
              break;
            }
          }
          break;
        }
        case "nanoid":
          addPattern(res, zodPatterns.nanoid, check2.message, refs);
        case "toLowerCase":
        case "toUpperCase":
        case "trim":
          break;
        default:
      }
  return res;
}
function escapeLiteralCheckValue(literal2, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal2) : literal2;
}
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
  let result = "";
  for (let i = 0; i < source.length; i++)
    ALPHA_NUMERIC.has(source[i]) || (result += "\\"), result += source[i];
  return result;
}
function addFormat(schema, value, message, refs) {
  schema.format || schema.anyOf?.some((x) => x.format) ? (schema.anyOf || (schema.anyOf = []), schema.format && (schema.anyOf.push({
    format: schema.format,
    ...schema.errorMessage && refs.errorMessages && {
      errorMessage: { format: schema.errorMessage.format }
    }
  }), delete schema.format, schema.errorMessage && (delete schema.errorMessage.format, Object.keys(schema.errorMessage).length === 0 && delete schema.errorMessage)), schema.anyOf.push({
    format: value,
    ...message && refs.errorMessages && { errorMessage: { format: message } }
  })) : setResponseValueAndErrors(schema, "format", value, message, refs);
}
function addPattern(schema, regex, message, refs) {
  schema.pattern || schema.allOf?.some((x) => x.pattern) ? (schema.allOf || (schema.allOf = []), schema.pattern && (schema.allOf.push({
    pattern: schema.pattern,
    ...schema.errorMessage && refs.errorMessages && {
      errorMessage: { pattern: schema.errorMessage.pattern }
    }
  }), delete schema.pattern, schema.errorMessage && (delete schema.errorMessage.pattern, Object.keys(schema.errorMessage).length === 0 && delete schema.errorMessage)), schema.allOf.push({
    pattern: stringifyRegExpWithFlags(regex, refs),
    ...message && refs.errorMessages && { errorMessage: { pattern: message } }
  })) : setResponseValueAndErrors(schema, "pattern", stringifyRegExpWithFlags(regex, refs), message, refs);
}
function stringifyRegExpWithFlags(regex, refs) {
  if (!refs.applyRegexFlags || !regex.flags)
    return regex.source;
  let flags = {
    i: regex.flags.includes("i"),
    m: regex.flags.includes("m"),
    s: regex.flags.includes("s")
    // `.` matches newlines
  }, source = flags.i ? regex.source.toLowerCase() : regex.source, pattern = "", isEscaped = !1, inCharGroup = !1, inCharRange = !1;
  for (let i = 0; i < source.length; i++) {
    if (isEscaped) {
      pattern += source[i], isEscaped = !1;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source[i].match(/[a-z]/)) {
          inCharRange ? (pattern += source[i], pattern += `${source[i - 2]}-${source[i]}`.toUpperCase(), inCharRange = !1) : source[i + 1] === "-" && source[i + 2]?.match(/[a-z]/) ? (pattern += source[i], inCharRange = !0) : pattern += `${source[i]}${source[i].toUpperCase()}`;
          continue;
        }
      } else if (source[i].match(/[a-z]/)) {
        pattern += `[${source[i]}${source[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source[i] === ".") {
      pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
      continue;
    }
    pattern += source[i], source[i] === "\\" ? isEscaped = !0 : inCharGroup && source[i] === "]" ? inCharGroup = !1 : !inCharGroup && source[i] === "[" && (inCharGroup = !0);
  }
  try {
    new RegExp(pattern);
  } catch {
    return console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`), regex.source;
  }
  return pattern;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/record.js
function parseRecordDef(def, refs) {
  if (refs.target === "openAi" && console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead."), refs.target === "openApi3" && def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum)
    return {
      type: "object",
      required: def.keyType._def.values,
      properties: def.keyType._def.values.reduce((acc, key) => ({
        ...acc,
        [key]: parseDef(def.valueType._def, {
          ...refs,
          currentPath: [...refs.currentPath, "properties", key]
        }) ?? parseAnyDef(refs)
      }), {}),
      additionalProperties: refs.rejectedAdditionalProperties
    };
  let schema = {
    type: "object",
    additionalProperties: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    }) ?? refs.allowedAdditionalProperties
  };
  if (refs.target === "openApi3")
    return schema;
  if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.checks?.length) {
    let { type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else {
    if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum)
      return {
        ...schema,
        propertyNames: {
          enum: def.keyType._def.values
        }
      };
    if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.type._def.checks?.length) {
      let { type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
      return {
        ...schema,
        propertyNames: keyType
      };
    }
  }
  return schema;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/map.js
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record")
    return parseRecordDef(def, refs);
  let keys = parseDef(def.keyType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "0"]
  }) || parseAnyDef(refs), values = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "1"]
  }) || parseAnyDef(refs);
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [keys, values],
      minItems: 2,
      maxItems: 2
    }
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
function parseNativeEnumDef(def) {
  let object3 = def.values, actualValues = Object.keys(def.values).filter((key) => typeof object3[object3[key]] != "number").map((key) => object3[key]), parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/never.js
function parseNeverDef(refs) {
  return refs.target === "openAi" ? void 0 : {
    not: parseAnyDef({
      ...refs,
      currentPath: [...refs.currentPath, "not"]
    })
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/null.js
function parseNullDef(refs) {
  return refs.target === "openApi3" ? {
    enum: ["null"],
    nullable: !0
  } : {
    type: "null"
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/union.js
var primitiveMappings = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function parseUnionDef(def, refs) {
  if (refs.target === "openApi3")
    return asAnyOf(def, refs);
  let options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
    let types = options.reduce((types2, x) => {
      let type = primitiveMappings[x._def.typeName];
      return type && !types2.includes(type) ? [...types2, type] : types2;
    }, []);
    return {
      type: types.length > 1 ? types : types[0]
    };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    let types = options.reduce((acc, x) => {
      let type = typeof x._def.value;
      switch (type) {
        case "string":
        case "number":
        case "boolean":
          return [...acc, type];
        case "bigint":
          return [...acc, "integer"];
        case "object":
          if (x._def.value === null)
            return [...acc, "null"];
        case "symbol":
        case "undefined":
        case "function":
        default:
          return acc;
      }
    }, []);
    if (types.length === options.length) {
      let uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce((acc, x) => acc.includes(x._def.value) ? acc : [...acc, x._def.value], [])
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum"))
    return {
      type: "string",
      enum: options.reduce((acc, x) => [
        ...acc,
        ...x._def.values.filter((x2) => !acc.includes(x2))
      ], [])
    };
  return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
  let anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", `${i}`]
  })).filter((x) => !!x && (!refs.strictUnions || typeof x == "object" && Object.keys(x).length > 0));
  return anyOf.length ? { anyOf } : void 0;
};

// node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
function parseNullableDef(def, refs) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length))
    return refs.target === "openApi3" ? {
      type: primitiveMappings[def.innerType._def.typeName],
      nullable: !0
    } : {
      type: [
        primitiveMappings[def.innerType._def.typeName],
        "null"
      ]
    };
  if (refs.target === "openApi3") {
    let base2 = parseDef(def.innerType._def, {
      ...refs,
      currentPath: [...refs.currentPath]
    });
    return base2 && "$ref" in base2 ? { allOf: [base2], nullable: !0 } : base2 && { ...base2, nullable: !0 };
  }
  let base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "0"]
  });
  return base && { anyOf: [base, { type: "null" }] };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/number.js
function parseNumberDef(def, refs) {
  let res = {
    type: "number"
  };
  if (!def.checks)
    return res;
  for (let check2 of def.checks)
    switch (check2.kind) {
      case "int":
        res.type = "integer", addErrorMessage(res, "type", check2.message, refs);
        break;
      case "min":
        refs.target === "jsonSchema7" ? check2.inclusive ? setResponseValueAndErrors(res, "minimum", check2.value, check2.message, refs) : setResponseValueAndErrors(res, "exclusiveMinimum", check2.value, check2.message, refs) : (check2.inclusive || (res.exclusiveMinimum = !0), setResponseValueAndErrors(res, "minimum", check2.value, check2.message, refs));
        break;
      case "max":
        refs.target === "jsonSchema7" ? check2.inclusive ? setResponseValueAndErrors(res, "maximum", check2.value, check2.message, refs) : setResponseValueAndErrors(res, "exclusiveMaximum", check2.value, check2.message, refs) : (check2.inclusive || (res.exclusiveMaximum = !0), setResponseValueAndErrors(res, "maximum", check2.value, check2.message, refs));
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check2.value, check2.message, refs);
        break;
    }
  return res;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/object.js
function parseObjectDef(def, refs) {
  let forceOptionalIntoNullable = refs.target === "openAi", result = {
    type: "object",
    properties: {}
  }, required2 = [], shape = def.shape();
  for (let propName in shape) {
    let propDef = shape[propName];
    if (propDef === void 0 || propDef._def === void 0)
      continue;
    let propOptional = safeIsOptional(propDef);
    propOptional && forceOptionalIntoNullable && (propDef._def.typeName === "ZodOptional" && (propDef = propDef._def.innerType), propDef.isNullable() || (propDef = propDef.nullable()), propOptional = !1);
    let parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [...refs.currentPath, "properties", propName],
      propertyPath: [...refs.currentPath, "properties", propName]
    });
    parsedDef !== void 0 && (result.properties[propName] = parsedDef, propOptional || required2.push(propName));
  }
  required2.length && (result.required = required2);
  let additionalProperties = decideAdditionalProperties(def, refs);
  return additionalProperties !== void 0 && (result.additionalProperties = additionalProperties), result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever")
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch {
    return !0;
  }
}

// node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
var parseOptionalDef = (def, refs) => {
  if (refs.currentPath.toString() === refs.propertyPath?.toString())
    return parseDef(def.innerType._def, refs);
  let innerSchema = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "1"]
  });
  return innerSchema ? {
    anyOf: [
      {
        not: parseAnyDef(refs)
      },
      innerSchema
    ]
  } : parseAnyDef(refs);
};

// node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js
var parsePipelineDef = (def, refs) => {
  if (refs.pipeStrategy === "input")
    return parseDef(def.in._def, refs);
  if (refs.pipeStrategy === "output")
    return parseDef(def.out._def, refs);
  let a = parseDef(def.in._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", "0"]
  }), b = parseDef(def.out._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", a ? "1" : "0"]
  });
  return {
    allOf: [a, b].filter((x) => x !== void 0)
  };
};

// node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/set.js
function parseSetDef(def, refs) {
  let schema = {
    type: "array",
    uniqueItems: !0,
    items: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    })
  };
  return def.minSize && setResponseValueAndErrors(schema, "minItems", def.minSize.value, def.minSize.message, refs), def.maxSize && setResponseValueAndErrors(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs), schema;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
function parseTupleDef(def, refs) {
  return def.rest ? {
    type: "array",
    minItems: def.items.length,
    items: def.items.map((x, i) => parseDef(x._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items", `${i}`]
    })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
    additionalItems: parseDef(def.rest._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalItems"]
    })
  } : {
    type: "array",
    minItems: def.items.length,
    maxItems: def.items.length,
    items: def.items.map((x, i) => parseDef(x._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items", `${i}`]
    })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
function parseUndefinedDef(refs) {
  return {
    not: parseAnyDef(refs)
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
function parseUnknownDef(refs) {
  return parseAnyDef(refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
var parseReadonlyDef = (def, refs) => parseDef(def.innerType._def, refs);

// node_modules/zod-to-json-schema/dist/esm/selectParser.js
var selectParser = (def, typeName, refs) => {
  switch (typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return parseStringDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNumber:
      return parseNumberDef(def, refs);
    case ZodFirstPartyTypeKind.ZodObject:
      return parseObjectDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBigInt:
      return parseBigintDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBoolean:
      return parseBooleanDef();
    case ZodFirstPartyTypeKind.ZodDate:
      return parseDateDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUndefined:
      return parseUndefinedDef(refs);
    case ZodFirstPartyTypeKind.ZodNull:
      return parseNullDef(refs);
    case ZodFirstPartyTypeKind.ZodArray:
      return parseArrayDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUnion:
    case ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodIntersection:
      return parseIntersectionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodTuple:
      return parseTupleDef(def, refs);
    case ZodFirstPartyTypeKind.ZodRecord:
      return parseRecordDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLiteral:
      return parseLiteralDef(def, refs);
    case ZodFirstPartyTypeKind.ZodEnum:
      return parseEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNativeEnum:
      return parseNativeEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNullable:
      return parseNullableDef(def, refs);
    case ZodFirstPartyTypeKind.ZodOptional:
      return parseOptionalDef(def, refs);
    case ZodFirstPartyTypeKind.ZodMap:
      return parseMapDef(def, refs);
    case ZodFirstPartyTypeKind.ZodSet:
      return parseSetDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLazy:
      return () => def.getter()._def;
    case ZodFirstPartyTypeKind.ZodPromise:
      return parsePromiseDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNaN:
    case ZodFirstPartyTypeKind.ZodNever:
      return parseNeverDef(refs);
    case ZodFirstPartyTypeKind.ZodEffects:
      return parseEffectsDef(def, refs);
    case ZodFirstPartyTypeKind.ZodAny:
      return parseAnyDef(refs);
    case ZodFirstPartyTypeKind.ZodUnknown:
      return parseUnknownDef(refs);
    case ZodFirstPartyTypeKind.ZodDefault:
      return parseDefaultDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBranded:
      return parseBrandedDef(def, refs);
    case ZodFirstPartyTypeKind.ZodReadonly:
      return parseReadonlyDef(def, refs);
    case ZodFirstPartyTypeKind.ZodCatch:
      return parseCatchDef(def, refs);
    case ZodFirstPartyTypeKind.ZodPipeline:
      return parsePipelineDef(def, refs);
    case ZodFirstPartyTypeKind.ZodFunction:
    case ZodFirstPartyTypeKind.ZodVoid:
    case ZodFirstPartyTypeKind.ZodSymbol:
      return;
    default:
      return /* @__PURE__ */ ((_) => {
      })(typeName);
  }
};

// node_modules/zod-to-json-schema/dist/esm/parseDef.js
function parseDef(def, refs, forceResolution = !1) {
  let seenItem = refs.seen.get(def);
  if (refs.override) {
    let overrideResult = refs.override?.(def, refs, seenItem, forceResolution);
    if (overrideResult !== ignoreOverride)
      return overrideResult;
  }
  if (seenItem && !forceResolution) {
    let seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== void 0)
      return seenSchema;
  }
  let newItem = { def, path: refs.currentPath, jsonSchema: void 0 };
  refs.seen.set(def, newItem);
  let jsonSchemaOrGetter = selectParser(def, def.typeName, refs), jsonSchema = typeof jsonSchemaOrGetter == "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema && addMeta(def, refs, jsonSchema), refs.postProcess) {
    let postProcessResult = refs.postProcess(jsonSchema, def, refs);
    return newItem.jsonSchema = jsonSchema, postProcessResult;
  }
  return newItem.jsonSchema = jsonSchema, jsonSchema;
}
var get$ref = (item, refs) => {
  switch (refs.$refStrategy) {
    case "root":
      return { $ref: item.path.join("/") };
    case "relative":
      return { $ref: getRelativePath(refs.currentPath, item.path) };
    case "none":
    case "seen":
      return item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value) ? (console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`), parseAnyDef(refs)) : refs.$refStrategy === "seen" ? parseAnyDef(refs) : void 0;
  }
}, addMeta = (def, refs, jsonSchema) => (def.description && (jsonSchema.description = def.description, refs.markdownDescription && (jsonSchema.markdownDescription = def.description)), jsonSchema);

// node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js
var zodToJsonSchema = (schema, options) => {
  let refs = getRefs(options), definitions = typeof options == "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name2, schema2]) => ({
    ...acc,
    [name2]: parseDef(schema2._def, {
      ...refs,
      currentPath: [...refs.basePath, refs.definitionPath, name2]
    }, !0) ?? parseAnyDef(refs)
  }), {}) : void 0, name = typeof options == "string" ? options : options?.nameStrategy === "title" ? void 0 : options?.name, main2 = parseDef(schema._def, name === void 0 ? refs : {
    ...refs,
    currentPath: [...refs.basePath, refs.definitionPath, name]
  }, !1) ?? parseAnyDef(refs), title = typeof options == "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
  title !== void 0 && (main2.title = title), refs.flags.hasReferencedOpenAiAnyType && (definitions || (definitions = {}), definitions[refs.openAiAnyTypeName] || (definitions[refs.openAiAnyTypeName] = {
    // Skipping "object" as no properties can be defined and additionalProperties must be "false"
    type: ["string", "number", "integer", "boolean", "array", "null"],
    items: {
      $ref: refs.$refStrategy === "relative" ? "1" : [
        ...refs.basePath,
        refs.definitionPath,
        refs.openAiAnyTypeName
      ].join("/")
    }
  }));
  let combined = name === void 0 ? definitions ? {
    ...main2,
    [refs.definitionPath]: definitions
  } : main2 : {
    $ref: [
      ...refs.$refStrategy === "relative" ? [] : refs.basePath,
      refs.definitionPath,
      name
    ].join("/"),
    [refs.definitionPath]: {
      ...definitions,
      [name]: main2
    }
  };
  return refs.target === "jsonSchema7" ? combined.$schema = "http://json-schema.org/draft-07/schema#" : (refs.target === "jsonSchema2019-09" || refs.target === "openAi") && (combined.$schema = "https://json-schema.org/draft/2019-09/schema#"), refs.target === "openAi" && ("anyOf" in combined || "oneOf" in combined || "allOf" in combined || "type" in combined && Array.isArray(combined.type)) && console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property."), combined;
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
function mapMiniTarget(t) {
  return !t || t === "jsonSchema7" || t === "draft-7" ? "draft-7" : t === "jsonSchema2019-09" || t === "draft-2020-12" ? "draft-2020-12" : "draft-7";
}
function toJsonSchemaCompat(schema, opts) {
  return isZ4Schema(schema) ? toJSONSchema(schema, {
    target: mapMiniTarget(opts?.target),
    io: opts?.pipeStrategy ?? "input"
  }) : zodToJsonSchema(schema, {
    strictUnions: opts?.strictUnions ?? !0,
    pipeStrategy: opts?.pipeStrategy ?? "input"
  });
}
function getMethodLiteral(schema) {
  let methodSchema = getObjectShape(schema)?.method;
  if (!methodSchema)
    throw new Error("Schema is missing a method literal");
  let value = getLiteralValue(methodSchema);
  if (typeof value != "string")
    throw new Error("Schema method literal must be a string");
  return value;
}
function parseWithCompat(schema, data) {
  let result = safeParse3(schema, data);
  if (!result.success)
    throw result.error;
  return result.data;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js
var DEFAULT_REQUEST_TIMEOUT_MSEC = 6e4, Protocol = class {
  constructor(_options) {
    this._options = _options, this._requestMessageId = 0, this._requestHandlers = /* @__PURE__ */ new Map(), this._requestHandlerAbortControllers = /* @__PURE__ */ new Map(), this._notificationHandlers = /* @__PURE__ */ new Map(), this._responseHandlers = /* @__PURE__ */ new Map(), this._progressHandlers = /* @__PURE__ */ new Map(), this._timeoutInfo = /* @__PURE__ */ new Map(), this._pendingDebouncedNotifications = /* @__PURE__ */ new Set(), this._taskProgressTokens = /* @__PURE__ */ new Map(), this._requestResolvers = /* @__PURE__ */ new Map(), this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
      this._oncancel(notification);
    }), this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
      this._onprogress(notification);
    }), this.setRequestHandler(
      PingRequestSchema,
      // Automatic pong by default.
      (_request) => ({})
    ), this._taskStore = _options?.taskStore, this._taskMessageQueue = _options?.taskMessageQueue, this._taskStore && (this.setRequestHandler(GetTaskRequestSchema, async (request, extra) => {
      let task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
      if (!task)
        throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
      return {
        ...task
      };
    }), this.setRequestHandler(GetTaskPayloadRequestSchema, async (request, extra) => {
      let handleTaskResult = async () => {
        let taskId = request.params.taskId;
        if (!await this._taskStore.getTask(taskId, extra.sessionId))
          throw new McpError(ErrorCode.InvalidParams, `Task not found: ${taskId}`);
        if (this._taskMessageQueue) {
          let queuedMessage;
          for (; queuedMessage = await this._taskMessageQueue.dequeue(taskId, extra.sessionId); ) {
            if (queuedMessage.type === "response" || queuedMessage.type === "error") {
              let message = queuedMessage.message, requestId = message.id, resolver = this._requestResolvers.get(requestId);
              if (resolver)
                if (this._requestResolvers.delete(requestId), queuedMessage.type === "response")
                  resolver(message);
                else {
                  let errorMessage = message, error2 = new McpError(errorMessage.error.code, errorMessage.error.message, errorMessage.error.data);
                  resolver(error2);
                }
              else {
                let messageType = queuedMessage.type === "response" ? "Response" : "Error";
                this._onerror(new Error(`${messageType} handler missing for request ${requestId}`));
              }
              continue;
            }
            await this._transport?.send(queuedMessage.message, { relatedRequestId: extra.requestId });
          }
        }
        let task = await this._taskStore.getTask(taskId, extra.sessionId);
        if (!task)
          throw new McpError(ErrorCode.InvalidParams, `Task not found: ${taskId}`);
        if (!isTerminal(task.status))
          return await this._waitForTaskUpdate(taskId, extra.signal, extra.sessionId), await handleTaskResult();
        if (isTerminal(task.status)) {
          let result = await this._taskStore.getTaskResult(taskId, extra.sessionId);
          return this._clearTaskQueue(taskId, extra.sessionId), {
            ...result,
            _meta: {
              ...result._meta,
              [RELATED_TASK_META_KEY]: {
                taskId
              }
            }
          };
        }
        return await handleTaskResult();
      };
      return await handleTaskResult();
    }), this.setRequestHandler(ListTasksRequestSchema, async (request, extra) => {
      try {
        let { tasks, nextCursor } = await this._taskStore.listTasks(request.params?.cursor, extra.sessionId);
        return {
          tasks,
          nextCursor,
          _meta: {}
        };
      } catch (error2) {
        throw new McpError(ErrorCode.InvalidParams, `Failed to list tasks: ${error2 instanceof Error ? error2.message : String(error2)}`);
      }
    }), this.setRequestHandler(CancelTaskRequestSchema, async (request, extra) => {
      try {
        let task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
        if (!task)
          throw new McpError(ErrorCode.InvalidParams, `Task not found: ${request.params.taskId}`);
        if (isTerminal(task.status))
          throw new McpError(ErrorCode.InvalidParams, `Cannot cancel task in terminal status: ${task.status}`);
        await this._taskStore.updateTaskStatus(request.params.taskId, "cancelled", "Client cancelled task execution.", extra.sessionId), this._clearTaskQueue(request.params.taskId, extra.sessionId);
        let cancelledTask = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
        if (!cancelledTask)
          throw new McpError(ErrorCode.InvalidParams, `Task not found after cancellation: ${request.params.taskId}`);
        return {
          _meta: {},
          ...cancelledTask
        };
      } catch (error2) {
        throw error2 instanceof McpError ? error2 : new McpError(ErrorCode.InvalidRequest, `Failed to cancel task: ${error2 instanceof Error ? error2.message : String(error2)}`);
      }
    }));
  }
  async _oncancel(notification) {
    if (!notification.params.requestId)
      return;
    this._requestHandlerAbortControllers.get(notification.params.requestId)?.abort(notification.params.reason);
  }
  _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = !1) {
    this._timeoutInfo.set(messageId, {
      timeoutId: setTimeout(onTimeout, timeout),
      startTime: Date.now(),
      timeout,
      maxTotalTimeout,
      resetTimeoutOnProgress,
      onTimeout
    });
  }
  _resetTimeout(messageId) {
    let info = this._timeoutInfo.get(messageId);
    if (!info)
      return !1;
    let totalElapsed = Date.now() - info.startTime;
    if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout)
      throw this._timeoutInfo.delete(messageId), McpError.fromError(ErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: info.maxTotalTimeout,
        totalElapsed
      });
    return clearTimeout(info.timeoutId), info.timeoutId = setTimeout(info.onTimeout, info.timeout), !0;
  }
  _cleanupTimeout(messageId) {
    let info = this._timeoutInfo.get(messageId);
    info && (clearTimeout(info.timeoutId), this._timeoutInfo.delete(messageId));
  }
  /**
   * Attaches to the given transport, starts it, and starts listening for messages.
   *
   * The Protocol object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
   */
  async connect(transport) {
    if (this._transport)
      throw new Error("Already connected to a transport. Call close() before connecting to a new transport, or use a separate Protocol instance per connection.");
    this._transport = transport;
    let _onclose = this.transport?.onclose;
    this._transport.onclose = () => {
      _onclose?.(), this._onclose();
    };
    let _onerror = this.transport?.onerror;
    this._transport.onerror = (error2) => {
      _onerror?.(error2), this._onerror(error2);
    };
    let _onmessage = this._transport?.onmessage;
    this._transport.onmessage = (message, extra) => {
      _onmessage?.(message, extra), isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message) ? this._onresponse(message) : isJSONRPCRequest(message) ? this._onrequest(message, extra) : isJSONRPCNotification(message) ? this._onnotification(message) : this._onerror(new Error(`Unknown message type: ${JSON.stringify(message)}`));
    }, await this._transport.start();
  }
  _onclose() {
    let responseHandlers = this._responseHandlers;
    this._responseHandlers = /* @__PURE__ */ new Map(), this._progressHandlers.clear(), this._taskProgressTokens.clear(), this._pendingDebouncedNotifications.clear();
    for (let info of this._timeoutInfo.values())
      clearTimeout(info.timeoutId);
    this._timeoutInfo.clear();
    for (let controller of this._requestHandlerAbortControllers.values())
      controller.abort();
    this._requestHandlerAbortControllers.clear();
    let error2 = McpError.fromError(ErrorCode.ConnectionClosed, "Connection closed");
    this._transport = void 0, this.onclose?.();
    for (let handler of responseHandlers.values())
      handler(error2);
  }
  _onerror(error2) {
    this.onerror?.(error2);
  }
  _onnotification(notification) {
    let handler = this._notificationHandlers.get(notification.method) ?? this.fallbackNotificationHandler;
    handler !== void 0 && Promise.resolve().then(() => handler(notification)).catch((error2) => this._onerror(new Error(`Uncaught error in notification handler: ${error2}`)));
  }
  _onrequest(request, extra) {
    let handler = this._requestHandlers.get(request.method) ?? this.fallbackRequestHandler, capturedTransport = this._transport, relatedTaskId = request.params?._meta?.[RELATED_TASK_META_KEY]?.taskId, sessionId = capturedTransport?.sessionId, store = this._taskStore, relatedTaskFound = !0, relatedTaskLookup;
    if (relatedTaskId && store && this._taskMessageQueue && sessionId !== void 0 && (relatedTaskFound = !1, relatedTaskLookup = (async () => {
      if (!await store.getTask(relatedTaskId, sessionId))
        throw new McpError(ErrorCode.InvalidParams, `Task not found: ${relatedTaskId}`);
      relatedTaskFound = !0;
    })()), handler === void 0) {
      let errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: ErrorCode.MethodNotFound,
          message: "Method not found"
        }
      };
      if (relatedTaskId && relatedTaskLookup) {
        let queuedError = { type: "error", message: errorResponse, timestamp: Date.now() };
        relatedTaskLookup.then(() => this._enqueueTaskMessage(relatedTaskId, queuedError, sessionId), () => capturedTransport?.send(errorResponse)).catch((error2) => this._onerror(new Error(`Failed to send an error response: ${error2}`)));
      } else relatedTaskId && this._taskMessageQueue ? this._enqueueTaskMessage(relatedTaskId, {
        type: "error",
        message: errorResponse,
        timestamp: Date.now()
      }, capturedTransport?.sessionId).catch((error2) => this._onerror(new Error(`Failed to enqueue error response: ${error2}`))) : capturedTransport?.send(errorResponse).catch((error2) => this._onerror(new Error(`Failed to send an error response: ${error2}`)));
      return;
    }
    let abortController = new AbortController();
    this._requestHandlerAbortControllers.set(request.id, abortController);
    let taskCreationParams = isTaskAugmentedRequestParams(request.params) ? request.params.task : void 0, taskStore = this._taskStore ? this.requestTaskStore(request, capturedTransport?.sessionId) : void 0, fullExtra = {
      signal: abortController.signal,
      sessionId: capturedTransport?.sessionId,
      _meta: request.params?._meta,
      sendNotification: async (notification) => {
        if (abortController.signal.aborted)
          return;
        let notificationOptions = { relatedRequestId: request.id };
        relatedTaskId && (notificationOptions.relatedTask = { taskId: relatedTaskId }), await this.notification(notification, notificationOptions);
      },
      sendRequest: async (r, resultSchema, options) => {
        if (abortController.signal.aborted)
          throw new McpError(ErrorCode.ConnectionClosed, "Request was cancelled");
        let requestOptions = { ...options, relatedRequestId: request.id };
        relatedTaskId && !requestOptions.relatedTask && (requestOptions.relatedTask = { taskId: relatedTaskId });
        let effectiveTaskId = requestOptions.relatedTask?.taskId ?? relatedTaskId;
        return effectiveTaskId && taskStore && await taskStore.updateTaskStatus(effectiveTaskId, "input_required"), await this.request(r, resultSchema, requestOptions);
      },
      authInfo: extra?.authInfo,
      requestId: request.id,
      requestInfo: extra?.requestInfo,
      taskId: relatedTaskId,
      taskStore,
      taskRequestedTtl: taskCreationParams?.ttl,
      closeSSEStream: extra?.closeSSEStream,
      closeStandaloneSSEStream: extra?.closeStandaloneSSEStream
    };
    (relatedTaskLookup ?? Promise.resolve()).then(() => {
      if (relatedTaskLookup && abortController.signal.aborted)
        throw new McpError(ErrorCode.ConnectionClosed, "Request was cancelled");
      taskCreationParams && this.assertTaskHandlerCapability(request.method);
    }).then(() => handler(request, fullExtra)).then(async (result) => {
      if (abortController.signal.aborted)
        return;
      let response = {
        result,
        jsonrpc: "2.0",
        id: request.id
      };
      relatedTaskId && this._taskMessageQueue ? await this._enqueueTaskMessage(relatedTaskId, {
        type: "response",
        message: response,
        timestamp: Date.now()
      }, capturedTransport?.sessionId) : await capturedTransport?.send(response);
    }, async (error2) => {
      if (abortController.signal.aborted)
        return;
      let errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: Number.isSafeInteger(error2.code) ? error2.code : ErrorCode.InternalError,
          message: error2.message ?? "Internal error",
          ...error2.data !== void 0 && { data: error2.data }
        }
      };
      relatedTaskId && this._taskMessageQueue && relatedTaskFound ? await this._enqueueTaskMessage(relatedTaskId, {
        type: "error",
        message: errorResponse,
        timestamp: Date.now()
      }, capturedTransport?.sessionId) : await capturedTransport?.send(errorResponse);
    }).catch((error2) => this._onerror(new Error(`Failed to send response: ${error2}`))).finally(() => {
      this._requestHandlerAbortControllers.get(request.id) === abortController && this._requestHandlerAbortControllers.delete(request.id);
    });
  }
  _onprogress(notification) {
    let { progressToken, ...params } = notification.params, messageId = Number(progressToken), handler = this._progressHandlers.get(messageId);
    if (!handler) {
      this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
      return;
    }
    let responseHandler = this._responseHandlers.get(messageId), timeoutInfo = this._timeoutInfo.get(messageId);
    if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress)
      try {
        this._resetTimeout(messageId);
      } catch (error2) {
        this._responseHandlers.delete(messageId), this._progressHandlers.delete(messageId), this._cleanupTimeout(messageId), responseHandler(error2);
        return;
      }
    handler(params);
  }
  _onresponse(response) {
    let messageId = Number(response.id), resolver = this._requestResolvers.get(messageId);
    if (resolver) {
      if (this._requestResolvers.delete(messageId), isJSONRPCResultResponse(response))
        resolver(response);
      else {
        let error2 = new McpError(response.error.code, response.error.message, response.error.data);
        resolver(error2);
      }
      return;
    }
    let handler = this._responseHandlers.get(messageId);
    if (handler === void 0) {
      this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
      return;
    }
    this._responseHandlers.delete(messageId), this._cleanupTimeout(messageId);
    let isTaskResponse = !1;
    if (isJSONRPCResultResponse(response) && response.result && typeof response.result == "object") {
      let result = response.result;
      if (result.task && typeof result.task == "object") {
        let task = result.task;
        typeof task.taskId == "string" && (isTaskResponse = !0, this._taskProgressTokens.set(task.taskId, messageId));
      }
    }
    if (isTaskResponse || this._progressHandlers.delete(messageId), isJSONRPCResultResponse(response))
      handler(response);
    else {
      let error2 = McpError.fromError(response.error.code, response.error.message, response.error.data);
      handler(error2);
    }
  }
  get transport() {
    return this._transport;
  }
  /**
   * Closes the connection.
   */
  async close() {
    await this._transport?.close();
  }
  /**
   * Sends a request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * @example
   * ```typescript
   * const stream = protocol.requestStream(request, resultSchema, options);
   * for await (const message of stream) {
   *   switch (message.type) {
   *     case 'taskCreated':
   *       console.log('Task created:', message.task.taskId);
   *       break;
   *     case 'taskStatus':
   *       console.log('Task status:', message.task.status);
   *       break;
   *     case 'result':
   *       console.log('Final result:', message.result);
   *       break;
   *     case 'error':
   *       console.error('Error:', message.error);
   *       break;
   *   }
   * }
   * ```
   *
   * @experimental Use `client.experimental.tasks.requestStream()` to access this method.
   */
  async *requestStream(request, resultSchema, options) {
    let { task } = options ?? {};
    if (!task) {
      try {
        yield { type: "result", result: await this.request(request, resultSchema, options) };
      } catch (error2) {
        yield {
          type: "error",
          error: error2 instanceof McpError ? error2 : new McpError(ErrorCode.InternalError, String(error2))
        };
      }
      return;
    }
    let taskId;
    try {
      let createResult = await this.request(request, CreateTaskResultSchema, options);
      if (createResult.task)
        taskId = createResult.task.taskId, yield { type: "taskCreated", task: createResult.task };
      else
        throw new McpError(ErrorCode.InternalError, "Task creation did not return a task");
      for (; ; ) {
        let task2 = await this.getTask({ taskId }, options);
        if (yield { type: "taskStatus", task: task2 }, isTerminal(task2.status)) {
          task2.status === "completed" ? yield { type: "result", result: await this.getTaskResult({ taskId }, resultSchema, options) } : task2.status === "failed" ? yield {
            type: "error",
            error: new McpError(ErrorCode.InternalError, `Task ${taskId} failed`)
          } : task2.status === "cancelled" && (yield {
            type: "error",
            error: new McpError(ErrorCode.InternalError, `Task ${taskId} was cancelled`)
          });
          return;
        }
        if (task2.status === "input_required") {
          yield { type: "result", result: await this.getTaskResult({ taskId }, resultSchema, options) };
          return;
        }
        let pollInterval = task2.pollInterval ?? this._options?.defaultTaskPollInterval ?? 1e3;
        await new Promise((resolve) => setTimeout(resolve, pollInterval)), options?.signal?.throwIfAborted();
      }
    } catch (error2) {
      yield {
        type: "error",
        error: error2 instanceof McpError ? error2 : new McpError(ErrorCode.InternalError, String(error2))
      };
    }
  }
  /**
   * Sends a request and waits for a response.
   *
   * Do not use this method to emit notifications! Use notification() instead.
   */
  request(request, resultSchema, options) {
    let { relatedRequestId, resumptionToken, onresumptiontoken, task, relatedTask } = options ?? {};
    return new Promise((resolve, reject) => {
      let earlyReject = (error2) => {
        reject(error2);
      };
      if (!this._transport) {
        earlyReject(new Error("Not connected"));
        return;
      }
      if (this._options?.enforceStrictCapabilities === !0)
        try {
          this.assertCapabilityForMethod(request.method), task && this.assertTaskCapability(request.method);
        } catch (e) {
          earlyReject(e);
          return;
        }
      options?.signal?.throwIfAborted();
      let messageId = this._requestMessageId++, jsonrpcRequest = {
        ...request,
        jsonrpc: "2.0",
        id: messageId
      };
      options?.onprogress && (this._progressHandlers.set(messageId, options.onprogress), jsonrpcRequest.params = {
        ...request.params,
        _meta: {
          ...request.params?._meta || {},
          progressToken: messageId
        }
      }), task && (jsonrpcRequest.params = {
        ...jsonrpcRequest.params,
        task
      }), relatedTask && (jsonrpcRequest.params = {
        ...jsonrpcRequest.params,
        _meta: {
          ...jsonrpcRequest.params?._meta || {},
          [RELATED_TASK_META_KEY]: relatedTask
        }
      });
      let cancel = (reason) => {
        this._responseHandlers.delete(messageId), this._progressHandlers.delete(messageId), this._cleanupTimeout(messageId), this._transport?.send({
          jsonrpc: "2.0",
          method: "notifications/cancelled",
          params: {
            requestId: messageId,
            reason: String(reason)
          }
        }, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error3) => this._onerror(new Error(`Failed to send cancellation: ${error3}`)));
        let error2 = reason instanceof McpError ? reason : new McpError(ErrorCode.RequestTimeout, String(reason));
        reject(error2);
      };
      this._responseHandlers.set(messageId, (response) => {
        if (!options?.signal?.aborted) {
          if (response instanceof Error)
            return reject(response);
          try {
            let parseResult = safeParse3(resultSchema, response.result);
            parseResult.success ? resolve(parseResult.data) : reject(parseResult.error);
          } catch (error2) {
            reject(error2);
          }
        }
      }), options?.signal?.addEventListener("abort", () => {
        cancel(options?.signal?.reason);
      });
      let timeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC, timeoutHandler = () => cancel(McpError.fromError(ErrorCode.RequestTimeout, "Request timed out", { timeout }));
      this._setupTimeout(messageId, timeout, options?.maxTotalTimeout, timeoutHandler, options?.resetTimeoutOnProgress ?? !1);
      let relatedTaskId = relatedTask?.taskId;
      if (relatedTaskId) {
        let responseResolver = (response) => {
          let handler = this._responseHandlers.get(messageId);
          handler ? handler(response) : this._onerror(new Error(`Response handler missing for side-channeled request ${messageId}`));
        };
        this._requestResolvers.set(messageId, responseResolver), this._enqueueTaskMessage(relatedTaskId, {
          type: "request",
          message: jsonrpcRequest,
          timestamp: Date.now()
        }).catch((error2) => {
          this._cleanupTimeout(messageId), reject(error2);
        });
      } else
        this._transport.send(jsonrpcRequest, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error2) => {
          this._cleanupTimeout(messageId), reject(error2);
        });
    });
  }
  /**
   * Gets the current status of a task.
   *
   * @experimental Use `client.experimental.tasks.getTask()` to access this method.
   */
  async getTask(params, options) {
    return this.request({ method: "tasks/get", params }, GetTaskResultSchema, options);
  }
  /**
   * Retrieves the result of a completed task.
   *
   * @experimental Use `client.experimental.tasks.getTaskResult()` to access this method.
   */
  async getTaskResult(params, resultSchema, options) {
    return this.request({ method: "tasks/result", params }, resultSchema, options);
  }
  /**
   * Lists tasks, optionally starting from a pagination cursor.
   *
   * @experimental Use `client.experimental.tasks.listTasks()` to access this method.
   */
  async listTasks(params, options) {
    return this.request({ method: "tasks/list", params }, ListTasksResultSchema, options);
  }
  /**
   * Cancels a specific task.
   *
   * @experimental Use `client.experimental.tasks.cancelTask()` to access this method.
   */
  async cancelTask(params, options) {
    return this.request({ method: "tasks/cancel", params }, CancelTaskResultSchema, options);
  }
  /**
   * Emits a notification, which is a one-way message that does not expect a response.
   */
  async notification(notification, options) {
    if (!this._transport)
      throw new Error("Not connected");
    this.assertNotificationCapability(notification.method);
    let relatedTaskId = options?.relatedTask?.taskId;
    if (relatedTaskId) {
      let jsonrpcNotification2 = {
        ...notification,
        jsonrpc: "2.0",
        params: {
          ...notification.params,
          _meta: {
            ...notification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
      await this._enqueueTaskMessage(relatedTaskId, {
        type: "notification",
        message: jsonrpcNotification2,
        timestamp: Date.now()
      });
      return;
    }
    if ((this._options?.debouncedNotificationMethods ?? []).includes(notification.method) && !notification.params && !options?.relatedRequestId && !options?.relatedTask) {
      if (this._pendingDebouncedNotifications.has(notification.method))
        return;
      this._pendingDebouncedNotifications.add(notification.method), Promise.resolve().then(() => {
        if (this._pendingDebouncedNotifications.delete(notification.method), !this._transport)
          return;
        let jsonrpcNotification2 = {
          ...notification,
          jsonrpc: "2.0"
        };
        options?.relatedTask && (jsonrpcNotification2 = {
          ...jsonrpcNotification2,
          params: {
            ...jsonrpcNotification2.params,
            _meta: {
              ...jsonrpcNotification2.params?._meta || {},
              [RELATED_TASK_META_KEY]: options.relatedTask
            }
          }
        }), this._transport?.send(jsonrpcNotification2, options).catch((error2) => this._onerror(error2));
      });
      return;
    }
    let jsonrpcNotification = {
      ...notification,
      jsonrpc: "2.0"
    };
    options?.relatedTask && (jsonrpcNotification = {
      ...jsonrpcNotification,
      params: {
        ...jsonrpcNotification.params,
        _meta: {
          ...jsonrpcNotification.params?._meta || {},
          [RELATED_TASK_META_KEY]: options.relatedTask
        }
      }
    }), await this._transport.send(jsonrpcNotification, options);
  }
  /**
   * Registers a handler to invoke when this protocol object receives a request with the given method.
   *
   * Note that this will replace any previous request handler for the same method.
   */
  setRequestHandler(requestSchema, handler) {
    let method = getMethodLiteral(requestSchema);
    this.assertRequestHandlerCapability(method), this._requestHandlers.set(method, (request, extra) => {
      let parsed = parseWithCompat(requestSchema, request);
      return Promise.resolve(handler(parsed, extra));
    });
  }
  /**
   * Removes the request handler for the given method.
   */
  removeRequestHandler(method) {
    this._requestHandlers.delete(method);
  }
  /**
   * Asserts that a request handler has not already been set for the given method, in preparation for a new one being automatically installed.
   */
  assertCanSetRequestHandler(method) {
    if (this._requestHandlers.has(method))
      throw new Error(`A request handler for ${method} already exists, which would be overridden`);
  }
  /**
   * Registers a handler to invoke when this protocol object receives a notification with the given method.
   *
   * Note that this will replace any previous notification handler for the same method.
   */
  setNotificationHandler(notificationSchema, handler) {
    let method = getMethodLiteral(notificationSchema);
    this._notificationHandlers.set(method, (notification) => {
      let parsed = parseWithCompat(notificationSchema, notification);
      return Promise.resolve(handler(parsed));
    });
  }
  /**
   * Removes the notification handler for the given method.
   */
  removeNotificationHandler(method) {
    this._notificationHandlers.delete(method);
  }
  /**
   * Cleans up the progress handler associated with a task.
   * This should be called when a task reaches a terminal status.
   */
  _cleanupTaskProgressHandler(taskId) {
    let progressToken = this._taskProgressTokens.get(taskId);
    progressToken !== void 0 && (this._progressHandlers.delete(progressToken), this._taskProgressTokens.delete(taskId));
  }
  /**
   * Enqueues a task-related message for side-channel delivery via tasks/result.
   * @param taskId The task ID to associate the message with
   * @param message The message to enqueue
   * @param sessionId Optional session ID for binding the operation to a specific session
   * @throws Error if taskStore is not configured or if enqueue fails (e.g., queue overflow)
   *
   * Note: If enqueue fails, it's the TaskMessageQueue implementation's responsibility to handle
   * the error appropriately (e.g., by failing the task, logging, etc.). The Protocol layer
   * simply propagates the error.
   */
  async _enqueueTaskMessage(taskId, message, sessionId) {
    if (!this._taskStore || !this._taskMessageQueue)
      throw new Error("Cannot enqueue task message: taskStore and taskMessageQueue are not configured");
    let maxQueueSize = this._options?.maxTaskQueueSize;
    await this._taskMessageQueue.enqueue(taskId, message, sessionId ?? this._transport?.sessionId, maxQueueSize);
  }
  /**
   * Clears the message queue for a task and rejects any pending request resolvers.
   * @param taskId The task ID whose queue should be cleared
   * @param sessionId Optional session ID for binding the operation to a specific session
   */
  async _clearTaskQueue(taskId, sessionId) {
    if (this._taskMessageQueue) {
      let messages = await this._taskMessageQueue.dequeueAll(taskId, sessionId);
      for (let message of messages)
        if (message.type === "request" && isJSONRPCRequest(message.message)) {
          let requestId = message.message.id, resolver = this._requestResolvers.get(requestId);
          resolver ? (resolver(new McpError(ErrorCode.InternalError, "Task cancelled or completed")), this._requestResolvers.delete(requestId)) : this._onerror(new Error(`Resolver missing for request ${requestId} during task ${taskId} cleanup`));
        }
    }
  }
  /**
   * Waits for a task update (new messages or status change) with abort signal support.
   * Uses polling to check for updates at the task's configured poll interval.
   * @param taskId The task ID to wait for
   * @param signal Abort signal to cancel the wait
   * @param sessionId Session of the request that waits, passed to the task store
   * @returns Promise that resolves when an update occurs or rejects if aborted
   */
  async _waitForTaskUpdate(taskId, signal, sessionId) {
    let interval = this._options?.defaultTaskPollInterval ?? 1e3;
    try {
      let task = await this._taskStore?.getTask(taskId, sessionId);
      task?.pollInterval && (interval = task.pollInterval);
    } catch {
    }
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
        return;
      }
      let timeoutId = setTimeout(resolve, interval);
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId), reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
      }, { once: !0 });
    });
  }
  requestTaskStore(request, sessionId) {
    let taskStore = this._taskStore;
    if (!taskStore)
      throw new Error("No task store configured");
    return {
      createTask: async (taskParams) => {
        if (!request)
          throw new Error("No request provided");
        return await taskStore.createTask(taskParams, request.id, {
          method: request.method,
          params: request.params
        }, sessionId);
      },
      getTask: async (taskId) => {
        let task = await taskStore.getTask(taskId, sessionId);
        if (!task)
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        return task;
      },
      storeTaskResult: async (taskId, status, result) => {
        await taskStore.storeTaskResult(taskId, status, result, sessionId);
        let task = await taskStore.getTask(taskId, sessionId);
        if (task) {
          let notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: task
          });
          await this.notification(notification), isTerminal(task.status) && this._cleanupTaskProgressHandler(taskId);
        }
      },
      getTaskResult: (taskId) => taskStore.getTaskResult(taskId, sessionId),
      updateTaskStatus: async (taskId, status, statusMessage) => {
        let task = await taskStore.getTask(taskId, sessionId);
        if (!task)
          throw new McpError(ErrorCode.InvalidParams, `Task "${taskId}" not found - it may have been cleaned up`);
        if (isTerminal(task.status))
          throw new McpError(ErrorCode.InvalidParams, `Cannot update task "${taskId}" from terminal status "${task.status}" to "${status}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
        await taskStore.updateTaskStatus(taskId, status, statusMessage, sessionId);
        let updatedTask = await taskStore.getTask(taskId, sessionId);
        if (updatedTask) {
          let notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: updatedTask
          });
          await this.notification(notification), isTerminal(updatedTask.status) && this._cleanupTaskProgressHandler(taskId);
        }
      },
      listTasks: (cursor) => taskStore.listTasks(cursor, sessionId)
    };
  }
};
function isPlainObject2(value) {
  return value !== null && typeof value == "object" && !Array.isArray(value);
}
function mergeCapabilities(base, additional) {
  let result = { ...base };
  for (let key in additional) {
    let k = key, addValue = additional[k];
    if (addValue === void 0)
      continue;
    let baseValue = result[k];
    isPlainObject2(baseValue) && isPlainObject2(addValue) ? result[k] = { ...baseValue, ...addValue } : result[k] = addValue;
  }
  return result;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/validation/ajv-provider.js
var import_ajv = __toESM(require_ajv(), 1), import_ajv_formats = __toESM(require_dist(), 1);
function createDefaultAjvInstance() {
  let ajv = new import_ajv.default({
    strict: !1,
    validateFormats: !0,
    validateSchema: !1,
    allErrors: !0
  });
  return (0, import_ajv_formats.default)(ajv), ajv;
}
var AjvJsonSchemaValidator = class {
  /**
   * Create an AJV validator
   *
   * @param ajv - Optional pre-configured AJV instance. If not provided, a default instance will be created.
   *
   * @example
   * ```typescript
   * // Use default configuration (recommended for most cases)
   * import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
   * const validator = new AjvJsonSchemaValidator();
   *
   * // Or provide custom AJV instance for advanced configuration
   * import { Ajv } from 'ajv';
   * import addFormats from 'ajv-formats';
   *
   * const ajv = new Ajv({ validateFormats: true });
   * addFormats(ajv);
   * const validator = new AjvJsonSchemaValidator(ajv);
   * ```
   */
  constructor(ajv) {
    this._ajv = ajv ?? createDefaultAjvInstance();
  }
  /**
   * Create a validator for the given JSON Schema
   *
   * The validator is compiled once and can be reused multiple times.
   * If the schema has an $id, it will be cached by AJV automatically.
   *
   * @param schema - Standard JSON Schema object
   * @returns A validator function that validates input data
   */
  getValidator(schema) {
    let ajvValidator = "$id" in schema && typeof schema.$id == "string" ? this._ajv.getSchema(schema.$id) ?? this._ajv.compile(schema) : this._ajv.compile(schema);
    return (input) => ajvValidator(input) ? {
      valid: !0,
      data: input,
      errorMessage: void 0
    } : {
      valid: !1,
      data: void 0,
      errorMessage: this._ajv.errorsText(ajvValidator.errors)
    };
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/server.js
var ExperimentalServerTasks = class {
  constructor(_server) {
    this._server = _server;
  }
  /**
   * Sends a request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * This method provides streaming access to request processing, allowing you to
   * observe intermediate task status updates for task-augmented requests.
   *
   * @param request - The request to send
   * @param resultSchema - Zod schema for validating the result
   * @param options - Optional request options (timeout, signal, task creation params, etc.)
   * @returns AsyncGenerator that yields ResponseMessage objects
   *
   * @experimental
   */
  requestStream(request, resultSchema, options) {
    return this._server.requestStream(request, resultSchema, options);
  }
  /**
   * Sends a sampling request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * For task-augmented requests, yields 'taskCreated' and 'taskStatus' messages
   * before the final result.
   *
   * @example
   * ```typescript
   * const stream = server.experimental.tasks.createMessageStream({
   *     messages: [{ role: 'user', content: { type: 'text', text: 'Hello' } }],
   *     maxTokens: 100
   * }, {
   *     onprogress: (progress) => {
   *         // Handle streaming tokens via progress notifications
   *         console.log('Progress:', progress.message);
   *     }
   * });
   *
   * for await (const message of stream) {
   *     switch (message.type) {
   *         case 'taskCreated':
   *             console.log('Task created:', message.task.taskId);
   *             break;
   *         case 'taskStatus':
   *             console.log('Task status:', message.task.status);
   *             break;
   *         case 'result':
   *             console.log('Final result:', message.result);
   *             break;
   *         case 'error':
   *             console.error('Error:', message.error);
   *             break;
   *     }
   * }
   * ```
   *
   * @param params - The sampling request parameters
   * @param options - Optional request options (timeout, signal, task creation params, onprogress, etc.)
   * @returns AsyncGenerator that yields ResponseMessage objects
   *
   * @experimental
   */
  createMessageStream(params, options) {
    let clientCapabilities = this._server.getClientCapabilities();
    if ((params.tools || params.toolChoice) && !clientCapabilities?.sampling?.tools)
      throw new Error("Client does not support sampling tools capability.");
    if (params.messages.length > 0) {
      let lastMessage = params.messages[params.messages.length - 1], lastContent = Array.isArray(lastMessage.content) ? lastMessage.content : [lastMessage.content], hasToolResults = lastContent.some((c) => c.type === "tool_result"), previousMessage = params.messages.length > 1 ? params.messages[params.messages.length - 2] : void 0, previousContent = previousMessage ? Array.isArray(previousMessage.content) ? previousMessage.content : [previousMessage.content] : [], hasPreviousToolUse = previousContent.some((c) => c.type === "tool_use");
      if (hasToolResults) {
        if (lastContent.some((c) => c.type !== "tool_result"))
          throw new Error("The last message must contain only tool_result content if any is present");
        if (!hasPreviousToolUse)
          throw new Error("tool_result blocks are not matching any tool_use from the previous message");
      }
      if (hasPreviousToolUse) {
        let toolUseIds = new Set(previousContent.filter((c) => c.type === "tool_use").map((c) => c.id)), toolResultIds = new Set(lastContent.filter((c) => c.type === "tool_result").map((c) => c.toolUseId));
        if (toolUseIds.size !== toolResultIds.size || ![...toolUseIds].every((id) => toolResultIds.has(id)))
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
      }
    }
    return this.requestStream({
      method: "sampling/createMessage",
      params
    }, CreateMessageResultSchema, options);
  }
  /**
   * Sends an elicitation request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * For task-augmented requests (especially URL-based elicitation), yields 'taskCreated'
   * and 'taskStatus' messages before the final result.
   *
   * @example
   * ```typescript
   * const stream = server.experimental.tasks.elicitInputStream({
   *     mode: 'url',
   *     message: 'Please authenticate',
   *     elicitationId: 'auth-123',
   *     url: 'https://example.com/auth'
   * }, {
   *     task: { ttl: 300000 } // Task-augmented for long-running auth flow
   * });
   *
   * for await (const message of stream) {
   *     switch (message.type) {
   *         case 'taskCreated':
   *             console.log('Task created:', message.task.taskId);
   *             break;
   *         case 'taskStatus':
   *             console.log('Task status:', message.task.status);
   *             break;
   *         case 'result':
   *             console.log('User action:', message.result.action);
   *             break;
   *         case 'error':
   *             console.error('Error:', message.error);
   *             break;
   *     }
   * }
   * ```
   *
   * @param params - The elicitation request parameters
   * @param options - Optional request options (timeout, signal, task creation params, etc.)
   * @returns AsyncGenerator that yields ResponseMessage objects
   *
   * @experimental
   */
  elicitInputStream(params, options) {
    let clientCapabilities = this._server.getClientCapabilities(), mode = params.mode ?? "form";
    switch (mode) {
      case "url": {
        if (!clientCapabilities?.elicitation?.url)
          throw new Error("Client does not support url elicitation.");
        break;
      }
      case "form": {
        if (!clientCapabilities?.elicitation?.form)
          throw new Error("Client does not support form elicitation.");
        break;
      }
    }
    let normalizedParams = mode === "form" && params.mode === void 0 ? { ...params, mode: "form" } : params;
    return this.requestStream({
      method: "elicitation/create",
      params: normalizedParams
    }, ElicitResultSchema, options);
  }
  /**
   * Gets the current status of a task.
   *
   * @param taskId - The task identifier
   * @param options - Optional request options
   * @returns The task status
   *
   * @experimental
   */
  async getTask(taskId, options) {
    return this._server.getTask({ taskId }, options);
  }
  /**
   * Retrieves the result of a completed task.
   *
   * @param taskId - The task identifier
   * @param resultSchema - Zod schema for validating the result
   * @param options - Optional request options
   * @returns The task result
   *
   * @experimental
   */
  async getTaskResult(taskId, resultSchema, options) {
    return this._server.getTaskResult({ taskId }, resultSchema, options);
  }
  /**
   * Lists tasks with optional pagination.
   *
   * @param cursor - Optional pagination cursor
   * @param options - Optional request options
   * @returns List of tasks with optional next cursor
   *
   * @experimental
   */
  async listTasks(cursor, options) {
    return this._server.listTasks(cursor ? { cursor } : void 0, options);
  }
  /**
   * Cancels a running task.
   *
   * @param taskId - The task identifier
   * @param options - Optional request options
   *
   * @experimental
   */
  async cancelTask(taskId, options) {
    return this._server.cancelTask({ taskId }, options);
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/helpers.js
function assertToolsCallTaskCapability(requests, method, entityName) {
  if (!requests)
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  switch (method) {
    case "tools/call":
      if (!requests.tools?.call)
        throw new Error(`${entityName} does not support task creation for tools/call (required for ${method})`);
      break;
    default:
      break;
  }
}
function assertClientRequestTaskCapability(requests, method, entityName) {
  if (!requests)
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  switch (method) {
    case "sampling/createMessage":
      if (!requests.sampling?.createMessage)
        throw new Error(`${entityName} does not support task creation for sampling/createMessage (required for ${method})`);
      break;
    case "elicitation/create":
      if (!requests.elicitation?.create)
        throw new Error(`${entityName} does not support task creation for elicitation/create (required for ${method})`);
      break;
    default:
      break;
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js
var Server = class extends Protocol {
  /**
   * Initializes this server with the given name and version information.
   */
  constructor(_serverInfo, options) {
    super(options), this._serverInfo = _serverInfo, this._loggingLevels = /* @__PURE__ */ new Map(), this.LOG_LEVEL_SEVERITY = new Map(LoggingLevelSchema.options.map((level, index) => [level, index])), this.isMessageIgnored = (level, sessionId) => {
      let currentLevel = this._loggingLevels.get(sessionId);
      return currentLevel ? this.LOG_LEVEL_SEVERITY.get(level) < this.LOG_LEVEL_SEVERITY.get(currentLevel) : !1;
    }, this._capabilities = options?.capabilities ?? {}, this._instructions = options?.instructions, this._jsonSchemaValidator = options?.jsonSchemaValidator ?? new AjvJsonSchemaValidator(), this.setRequestHandler(InitializeRequestSchema, (request) => this._oninitialize(request)), this.setNotificationHandler(InitializedNotificationSchema, () => this.oninitialized?.()), this._capabilities.logging && this.setRequestHandler(SetLevelRequestSchema, async (request, extra) => {
      let transportSessionId = extra.sessionId || extra.requestInfo?.headers["mcp-session-id"] || void 0, { level } = request.params, parseResult = LoggingLevelSchema.safeParse(level);
      return parseResult.success && this._loggingLevels.set(transportSessionId, parseResult.data), {};
    });
  }
  /**
   * Access experimental features.
   *
   * WARNING: These APIs are experimental and may change without notice.
   *
   * @experimental
   */
  get experimental() {
    return this._experimental || (this._experimental = {
      tasks: new ExperimentalServerTasks(this)
    }), this._experimental;
  }
  /**
   * Registers new capabilities. This can only be called before connecting to a transport.
   *
   * The new capabilities will be merged with any existing capabilities previously given (e.g., at initialization).
   */
  registerCapabilities(capabilities) {
    if (this.transport)
      throw new Error("Cannot register capabilities after connecting to transport");
    this._capabilities = mergeCapabilities(this._capabilities, capabilities);
  }
  /**
   * Override request handler registration to enforce server-side validation for tools/call.
   */
  setRequestHandler(requestSchema, handler) {
    let methodSchema = getObjectShape(requestSchema)?.method;
    if (!methodSchema)
      throw new Error("Schema is missing a method literal");
    let methodValue = getLiteralValue(methodSchema);
    if (typeof methodValue != "string")
      throw new Error("Schema method literal must be a string");
    if (methodValue === "tools/call") {
      let wrappedHandler = async (request, extra) => {
        let validatedRequest = safeParse3(CallToolRequestSchema, request);
        if (!validatedRequest.success) {
          let errorMessage = validatedRequest.error instanceof Error ? validatedRequest.error.message : String(validatedRequest.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call request: ${errorMessage}`);
        }
        let { params } = validatedRequest.data, result = await Promise.resolve(handler(request, extra));
        if (params.task) {
          let taskValidationResult = safeParse3(CreateTaskResultSchema, result);
          if (!taskValidationResult.success) {
            let errorMessage = taskValidationResult.error instanceof Error ? taskValidationResult.error.message : String(taskValidationResult.error);
            throw new McpError(ErrorCode.InvalidParams, `Invalid task creation result: ${errorMessage}`);
          }
          return taskValidationResult.data;
        }
        let validationResult = safeParse3(CallToolResultSchema, result);
        if (!validationResult.success) {
          let errorMessage = validationResult.error instanceof Error ? validationResult.error.message : String(validationResult.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call result: ${errorMessage}`);
        }
        return validationResult.data;
      };
      return super.setRequestHandler(requestSchema, wrappedHandler);
    }
    return super.setRequestHandler(requestSchema, handler);
  }
  assertCapabilityForMethod(method) {
    switch (method) {
      case "sampling/createMessage":
        if (!this._clientCapabilities?.sampling)
          throw new Error(`Client does not support sampling (required for ${method})`);
        break;
      case "elicitation/create":
        if (!this._clientCapabilities?.elicitation)
          throw new Error(`Client does not support elicitation (required for ${method})`);
        break;
      case "roots/list":
        if (!this._clientCapabilities?.roots)
          throw new Error(`Client does not support listing roots (required for ${method})`);
        break;
      case "ping":
        break;
    }
  }
  assertNotificationCapability(method) {
    switch (method) {
      case "notifications/message":
        if (!this._capabilities.logging)
          throw new Error(`Server does not support logging (required for ${method})`);
        break;
      case "notifications/resources/updated":
      case "notifications/resources/list_changed":
        if (!this._capabilities.resources)
          throw new Error(`Server does not support notifying about resources (required for ${method})`);
        break;
      case "notifications/tools/list_changed":
        if (!this._capabilities.tools)
          throw new Error(`Server does not support notifying of tool list changes (required for ${method})`);
        break;
      case "notifications/prompts/list_changed":
        if (!this._capabilities.prompts)
          throw new Error(`Server does not support notifying of prompt list changes (required for ${method})`);
        break;
      case "notifications/elicitation/complete":
        if (!this._clientCapabilities?.elicitation?.url)
          throw new Error(`Client does not support URL elicitation (required for ${method})`);
        break;
      case "notifications/cancelled":
        break;
      case "notifications/progress":
        break;
    }
  }
  assertRequestHandlerCapability(method) {
    if (this._capabilities)
      switch (method) {
        case "completion/complete":
          if (!this._capabilities.completions)
            throw new Error(`Server does not support completions (required for ${method})`);
          break;
        case "logging/setLevel":
          if (!this._capabilities.logging)
            throw new Error(`Server does not support logging (required for ${method})`);
          break;
        case "prompts/get":
        case "prompts/list":
          if (!this._capabilities.prompts)
            throw new Error(`Server does not support prompts (required for ${method})`);
          break;
        case "resources/list":
        case "resources/templates/list":
        case "resources/read":
          if (!this._capabilities.resources)
            throw new Error(`Server does not support resources (required for ${method})`);
          break;
        case "tools/call":
        case "tools/list":
          if (!this._capabilities.tools)
            throw new Error(`Server does not support tools (required for ${method})`);
          break;
        case "tasks/get":
        case "tasks/list":
        case "tasks/result":
        case "tasks/cancel":
          if (!this._capabilities.tasks)
            throw new Error(`Server does not support tasks capability (required for ${method})`);
          break;
        case "ping":
        case "initialize":
          break;
      }
  }
  assertTaskCapability(method) {
    assertClientRequestTaskCapability(this._clientCapabilities?.tasks?.requests, method, "Client");
  }
  assertTaskHandlerCapability(method) {
    this._capabilities && assertToolsCallTaskCapability(this._capabilities.tasks?.requests, method, "Server");
  }
  async _oninitialize(request) {
    let requestedVersion = request.params.protocolVersion;
    return this._clientCapabilities = request.params.capabilities, this._clientVersion = request.params.clientInfo, {
      protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion) ? requestedVersion : LATEST_PROTOCOL_VERSION,
      capabilities: this.getCapabilities(),
      serverInfo: this._serverInfo,
      ...this._instructions && { instructions: this._instructions }
    };
  }
  /**
   * After initialization has completed, this will be populated with the client's reported capabilities.
   */
  getClientCapabilities() {
    return this._clientCapabilities;
  }
  /**
   * After initialization has completed, this will be populated with information about the client's name and version.
   */
  getClientVersion() {
    return this._clientVersion;
  }
  getCapabilities() {
    return this._capabilities;
  }
  async ping() {
    return this.request({ method: "ping" }, EmptyResultSchema);
  }
  // Implementation
  async createMessage(params, options) {
    if ((params.tools || params.toolChoice) && !this._clientCapabilities?.sampling?.tools)
      throw new Error("Client does not support sampling tools capability.");
    if (params.messages.length > 0) {
      let lastMessage = params.messages[params.messages.length - 1], lastContent = Array.isArray(lastMessage.content) ? lastMessage.content : [lastMessage.content], hasToolResults = lastContent.some((c) => c.type === "tool_result"), previousMessage = params.messages.length > 1 ? params.messages[params.messages.length - 2] : void 0, previousContent = previousMessage ? Array.isArray(previousMessage.content) ? previousMessage.content : [previousMessage.content] : [], hasPreviousToolUse = previousContent.some((c) => c.type === "tool_use");
      if (hasToolResults) {
        if (lastContent.some((c) => c.type !== "tool_result"))
          throw new Error("The last message must contain only tool_result content if any is present");
        if (!hasPreviousToolUse)
          throw new Error("tool_result blocks are not matching any tool_use from the previous message");
      }
      if (hasPreviousToolUse) {
        let toolUseIds = new Set(previousContent.filter((c) => c.type === "tool_use").map((c) => c.id)), toolResultIds = new Set(lastContent.filter((c) => c.type === "tool_result").map((c) => c.toolUseId));
        if (toolUseIds.size !== toolResultIds.size || ![...toolUseIds].every((id) => toolResultIds.has(id)))
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
      }
    }
    return params.tools ? this.request({ method: "sampling/createMessage", params }, CreateMessageResultWithToolsSchema, options) : this.request({ method: "sampling/createMessage", params }, CreateMessageResultSchema, options);
  }
  /**
   * Creates an elicitation request for the given parameters.
   * For backwards compatibility, `mode` may be omitted for form requests and will default to `'form'`.
   * @param params The parameters for the elicitation request.
   * @param options Optional request options.
   * @returns The result of the elicitation request.
   */
  async elicitInput(params, options) {
    switch (params.mode ?? "form") {
      case "url": {
        if (!this._clientCapabilities?.elicitation?.url)
          throw new Error("Client does not support url elicitation.");
        let urlParams = params;
        return this.request({ method: "elicitation/create", params: urlParams }, ElicitResultSchema, options);
      }
      case "form": {
        if (!this._clientCapabilities?.elicitation?.form)
          throw new Error("Client does not support form elicitation.");
        let formParams = params.mode === "form" ? params : { ...params, mode: "form" }, result = await this.request({ method: "elicitation/create", params: formParams }, ElicitResultSchema, options);
        if (result.action === "accept" && result.content && formParams.requestedSchema)
          try {
            let validationResult = this._jsonSchemaValidator.getValidator(formParams.requestedSchema)(result.content);
            if (!validationResult.valid)
              throw new McpError(ErrorCode.InvalidParams, `Elicitation response content does not match requested schema: ${validationResult.errorMessage}`);
          } catch (error2) {
            throw error2 instanceof McpError ? error2 : new McpError(ErrorCode.InternalError, `Error validating elicitation response: ${error2 instanceof Error ? error2.message : String(error2)}`);
          }
        return result;
      }
    }
  }
  /**
   * Creates a reusable callback that, when invoked, will send a `notifications/elicitation/complete`
   * notification for the specified elicitation ID.
   *
   * @param elicitationId The ID of the elicitation to mark as complete.
   * @param options Optional notification options. Useful when the completion notification should be related to a prior request.
   * @returns A function that emits the completion notification when awaited.
   */
  createElicitationCompletionNotifier(elicitationId, options) {
    if (!this._clientCapabilities?.elicitation?.url)
      throw new Error("Client does not support URL elicitation (required for notifications/elicitation/complete)");
    return () => this.notification({
      method: "notifications/elicitation/complete",
      params: {
        elicitationId
      }
    }, options);
  }
  async listRoots(params, options) {
    return this.request({ method: "roots/list", params }, ListRootsResultSchema, options);
  }
  /**
   * Sends a logging message to the client, if connected.
   * Note: You only need to send the parameters object, not the entire JSON RPC message
   * @see LoggingMessageNotification
   * @param params
   * @param sessionId optional for stateless and backward compatibility
   */
  async sendLoggingMessage(params, sessionId) {
    if (this._capabilities.logging && !this.isMessageIgnored(params.level, sessionId))
      return this.notification({ method: "notifications/message", params });
  }
  async sendResourceUpdated(params) {
    return this.notification({
      method: "notifications/resources/updated",
      params
    });
  }
  async sendResourceListChanged() {
    return this.notification({
      method: "notifications/resources/list_changed"
    });
  }
  async sendToolListChanged() {
    return this.notification({ method: "notifications/tools/list_changed" });
  }
  async sendPromptListChanged() {
    return this.notification({ method: "notifications/prompts/list_changed" });
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/completable.js
var COMPLETABLE_SYMBOL = Symbol.for("mcp.completable");
function isCompletable(schema) {
  return !!schema && typeof schema == "object" && COMPLETABLE_SYMBOL in schema;
}
function getCompleter(schema) {
  return schema[COMPLETABLE_SYMBOL]?.complete;
}
var McpZodTypeKind;
(function(McpZodTypeKind2) {
  McpZodTypeKind2.Completable = "McpCompletable";
})(McpZodTypeKind || (McpZodTypeKind = {}));

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/toolNameValidation.js
var TOOL_NAME_REGEX = /^[A-Za-z0-9._-]{1,128}$/;
function validateToolName(name) {
  let warnings = [];
  if (name.length === 0)
    return {
      isValid: !1,
      warnings: ["Tool name cannot be empty"]
    };
  if (name.length > 128)
    return {
      isValid: !1,
      warnings: [`Tool name exceeds maximum length of 128 characters (current: ${name.length})`]
    };
  if (name.includes(" ") && warnings.push("Tool name contains spaces, which may cause parsing issues"), name.includes(",") && warnings.push("Tool name contains commas, which may cause parsing issues"), (name.startsWith("-") || name.endsWith("-")) && warnings.push("Tool name starts or ends with a dash, which may cause parsing issues in some contexts"), (name.startsWith(".") || name.endsWith(".")) && warnings.push("Tool name starts or ends with a dot, which may cause parsing issues in some contexts"), !TOOL_NAME_REGEX.test(name)) {
    let invalidChars = name.split("").filter((char) => !/[A-Za-z0-9._-]/.test(char)).filter((char, index, arr) => arr.indexOf(char) === index);
    return warnings.push(`Tool name contains invalid characters: ${invalidChars.map((c) => `"${c}"`).join(", ")}`, "Allowed characters are: A-Z, a-z, 0-9, underscore (_), dash (-), and dot (.)"), {
      isValid: !1,
      warnings
    };
  }
  return {
    isValid: !0,
    warnings
  };
}
function issueToolNameWarning(name, warnings) {
  if (warnings.length > 0) {
    console.warn(`Tool name validation warning for "${name}":`);
    for (let warning of warnings)
      console.warn(`  - ${warning}`);
    console.warn("Tool registration will proceed, but this may cause compatibility issues."), console.warn("Consider updating the tool name to conform to the MCP tool naming standard."), console.warn("See SEP: Specify Format for Tool Names (https://github.com/modelcontextprotocol/modelcontextprotocol/issues/986) for more details.");
  }
}
function validateAndWarnToolName(name) {
  let result = validateToolName(name);
  return issueToolNameWarning(name, result.warnings), result.isValid;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/mcp-server.js
var ExperimentalMcpServerTasks = class {
  constructor(_mcpServer) {
    this._mcpServer = _mcpServer;
  }
  registerToolTask(name, config2, handler) {
    let execution = { taskSupport: "required", ...config2.execution };
    if (execution.taskSupport === "forbidden")
      throw new Error(`Cannot register task-based tool '${name}' with taskSupport 'forbidden'. Use registerTool() instead.`);
    return this._mcpServer._createRegisteredTool(name, config2.title, config2.description, config2.inputSchema, config2.outputSchema, config2.annotations, execution, config2._meta, handler);
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js
function toolInputElementCount(value, max) {
  let count = 0, stack = [value];
  for (; stack.length > 0; ) {
    let node = stack.pop();
    if (!(node === null || typeof node != "object"))
      if (Array.isArray(node))
        for (let child of node) {
          if (++count > max)
            return count;
          child !== null && typeof child == "object" && stack.push(child);
        }
      else
        for (let key in node) {
          if (!Object.prototype.hasOwnProperty.call(node, key))
            continue;
          if (++count > max)
            return count;
          let child = node[key];
          child !== null && typeof child == "object" && stack.push(child);
        }
  }
  return count;
}
function resolveMaxToolInputElements(value) {
  if (!(value === void 0 || value === 1 / 0)) {
    if (typeof value != "number" || Number.isNaN(value) || value < 1)
      throw new RangeError(`maxToolInputElements must be a number of at least 1, or Infinity, got ${String(value)}`);
    return value;
  }
}
var McpServer = class {
  constructor(serverInfo, options) {
    this._registeredResources = {}, this._registeredResourceTemplates = {}, this._registeredTools = {}, this._registeredPrompts = {}, this._toolHandlersInitialized = !1, this._completionHandlerInitialized = !1, this._resourceHandlersInitialized = !1, this._promptHandlersInitialized = !1, this.server = new Server(serverInfo, options), this._maxToolInputElements = resolveMaxToolInputElements(options?.maxToolInputElements), options?.capabilities?.tools && this.setToolRequestHandlers(), options?.capabilities?.resources && this.setResourceRequestHandlers(), options?.capabilities?.prompts && this.setPromptRequestHandlers();
  }
  /**
   * Access experimental features.
   *
   * WARNING: These APIs are experimental and may change without notice.
   *
   * @experimental
   */
  get experimental() {
    return this._experimental || (this._experimental = {
      tasks: new ExperimentalMcpServerTasks(this)
    }), this._experimental;
  }
  /**
   * Attaches to the given transport, starts it, and starts listening for messages.
   *
   * The `server` object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
   */
  async connect(transport) {
    return await this.server.connect(transport);
  }
  /**
   * Closes the connection.
   */
  async close() {
    await this.server.close();
  }
  setToolRequestHandlers() {
    this._toolHandlersInitialized || (this.server.assertCanSetRequestHandler(getMethodValue(ListToolsRequestSchema)), this.server.assertCanSetRequestHandler(getMethodValue(CallToolRequestSchema)), this.server.registerCapabilities({
      tools: {
        listChanged: !0
      }
    }), this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: Object.entries(this._registeredTools).filter(([, tool]) => tool.enabled).map(([name, tool]) => {
        let toolDefinition = {
          name,
          title: tool.title,
          description: tool.description,
          inputSchema: (() => {
            let obj = normalizeObjectSchema(tool.inputSchema);
            return obj ? toJsonSchemaCompat(obj, {
              strictUnions: !0,
              pipeStrategy: "input"
            }) : EMPTY_OBJECT_JSON_SCHEMA;
          })(),
          annotations: tool.annotations,
          execution: tool.execution,
          _meta: tool._meta
        };
        if (tool.outputSchema) {
          let obj = normalizeObjectSchema(tool.outputSchema);
          obj && (toolDefinition.outputSchema = toJsonSchemaCompat(obj, {
            strictUnions: !0,
            pipeStrategy: "output"
          }));
        }
        return toolDefinition;
      })
    })), this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      try {
        let tool = this._registeredTools[request.params.name];
        if (!tool)
          throw new McpError(ErrorCode.InvalidParams, `Tool ${request.params.name} not found`);
        if (!tool.enabled)
          throw new McpError(ErrorCode.InvalidParams, `Tool ${request.params.name} disabled`);
        let isTaskRequest = !!request.params.task, taskSupport = tool.execution?.taskSupport, isTaskHandler = "createTask" in tool.handler;
        if ((taskSupport === "required" || taskSupport === "optional") && !isTaskHandler)
          throw new McpError(ErrorCode.InternalError, `Tool ${request.params.name} has taskSupport '${taskSupport}' but was not registered with registerToolTask`);
        if (taskSupport === "required" && !isTaskRequest)
          throw new McpError(ErrorCode.MethodNotFound, `Tool ${request.params.name} requires task augmentation (taskSupport: 'required')`);
        if (taskSupport === "optional" && !isTaskRequest && isTaskHandler)
          return await this.handleAutomaticTaskPolling(tool, request, extra);
        let args = await this.validateToolInput(tool, request.params.arguments, request.params.name), result = await this.executeToolHandler(tool, args, extra);
        return isTaskRequest || await this.validateToolOutput(tool, result, request.params.name), result;
      } catch (error2) {
        if (error2 instanceof McpError && error2.code === ErrorCode.UrlElicitationRequired)
          throw error2;
        return this.createToolError(error2 instanceof Error ? error2.message : String(error2));
      }
    }), this._toolHandlersInitialized = !0);
  }
  /**
   * Creates a tool error result.
   *
   * @param errorMessage - The error message.
   * @returns The tool error result.
   */
  createToolError(errorMessage) {
    return {
      content: [
        {
          type: "text",
          text: errorMessage
        }
      ],
      isError: !0
    };
  }
  /**
   * Validates tool input arguments against the tool's input schema.
   */
  async validateToolInput(tool, args, toolName) {
    if (this._maxToolInputElements !== void 0 && toolInputElementCount(args, this._maxToolInputElements) > this._maxToolInputElements)
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments for tool ${toolName}: arguments contain more than the maximum of ${this._maxToolInputElements} elements`);
    if (!tool.inputSchema)
      return;
    let schemaToParse = normalizeObjectSchema(tool.inputSchema) ?? tool.inputSchema, parseResult = await safeParseAsync3(schemaToParse, args ?? {});
    if (!parseResult.success) {
      let error2 = "error" in parseResult ? parseResult.error : "Unknown error", errorMessage = getParseErrorMessage(error2);
      throw new McpError(ErrorCode.InvalidParams, `Input validation error: Invalid arguments for tool ${toolName}: ${errorMessage}`);
    }
    return parseResult.data;
  }
  /**
   * Validates tool output against the tool's output schema.
   */
  async validateToolOutput(tool, result, toolName) {
    if (!tool.outputSchema || !("content" in result) || result.isError)
      return;
    if (!result.structuredContent)
      throw new McpError(ErrorCode.InvalidParams, `Output validation error: Tool ${toolName} has an output schema but no structured content was provided`);
    let outputObj = normalizeObjectSchema(tool.outputSchema), parseResult = await safeParseAsync3(outputObj, result.structuredContent);
    if (!parseResult.success) {
      let error2 = "error" in parseResult ? parseResult.error : "Unknown error", errorMessage = getParseErrorMessage(error2);
      throw new McpError(ErrorCode.InvalidParams, `Output validation error: Invalid structured content for tool ${toolName}: ${errorMessage}`);
    }
  }
  /**
   * Executes a tool handler (either regular or task-based).
   */
  async executeToolHandler(tool, args, extra) {
    let handler = tool.handler;
    if ("createTask" in handler) {
      if (!extra.taskStore)
        throw new Error("No task store provided.");
      let taskExtra = { ...extra, taskStore: extra.taskStore };
      if (tool.inputSchema) {
        let typedHandler = handler;
        return await Promise.resolve(typedHandler.createTask(args, taskExtra));
      } else {
        let typedHandler = handler;
        return await Promise.resolve(typedHandler.createTask(taskExtra));
      }
    }
    if (tool.inputSchema) {
      let typedHandler = handler;
      return await Promise.resolve(typedHandler(args, extra));
    } else {
      let typedHandler = handler;
      return await Promise.resolve(typedHandler(extra));
    }
  }
  /**
   * Handles automatic task polling for tools with taskSupport 'optional'.
   */
  async handleAutomaticTaskPolling(tool, request, extra) {
    if (!extra.taskStore)
      throw new Error("No task store provided for task-capable tool.");
    let args = await this.validateToolInput(tool, request.params.arguments, request.params.name), handler = tool.handler, taskExtra = { ...extra, taskStore: extra.taskStore }, createTaskResult = args ? await Promise.resolve(handler.createTask(args, taskExtra)) : (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Promise.resolve(handler.createTask(taskExtra))
    ), taskId = createTaskResult.task.taskId, task = createTaskResult.task, pollInterval = task.pollInterval ?? 5e3;
    for (; task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled"; ) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      let updatedTask = await extra.taskStore.getTask(taskId);
      if (!updatedTask)
        throw new McpError(ErrorCode.InternalError, `Task ${taskId} not found during polling`);
      task = updatedTask;
    }
    return await extra.taskStore.getTaskResult(taskId);
  }
  setCompletionRequestHandler() {
    this._completionHandlerInitialized || (this.server.assertCanSetRequestHandler(getMethodValue(CompleteRequestSchema)), this.server.registerCapabilities({
      completions: {}
    }), this.server.setRequestHandler(CompleteRequestSchema, async (request) => {
      switch (request.params.ref.type) {
        case "ref/prompt":
          return assertCompleteRequestPrompt(request), this.handlePromptCompletion(request, request.params.ref);
        case "ref/resource":
          return assertCompleteRequestResourceTemplate(request), this.handleResourceCompletion(request, request.params.ref);
        default:
          throw new McpError(ErrorCode.InvalidParams, `Invalid completion reference: ${request.params.ref}`);
      }
    }), this._completionHandlerInitialized = !0);
  }
  async handlePromptCompletion(request, ref) {
    let prompt = this._registeredPrompts[ref.name];
    if (!prompt)
      throw new McpError(ErrorCode.InvalidParams, `Prompt ${ref.name} not found`);
    if (!prompt.enabled)
      throw new McpError(ErrorCode.InvalidParams, `Prompt ${ref.name} disabled`);
    if (!prompt.argsSchema)
      return EMPTY_COMPLETION_RESULT;
    let field = getObjectShape(prompt.argsSchema)?.[request.params.argument.name];
    if (!isCompletable(field))
      return EMPTY_COMPLETION_RESULT;
    let completer = getCompleter(field);
    if (!completer)
      return EMPTY_COMPLETION_RESULT;
    let suggestions = await completer(request.params.argument.value, request.params.context);
    return createCompletionResult(suggestions);
  }
  async handleResourceCompletion(request, ref) {
    let template = Object.values(this._registeredResourceTemplates).find((t) => t.resourceTemplate.uriTemplate.toString() === ref.uri);
    if (!template) {
      if (this._registeredResources[ref.uri])
        return EMPTY_COMPLETION_RESULT;
      throw new McpError(ErrorCode.InvalidParams, `Resource template ${request.params.ref.uri} not found`);
    }
    let completer = template.resourceTemplate.completeCallback(request.params.argument.name);
    if (!completer)
      return EMPTY_COMPLETION_RESULT;
    let suggestions = await completer(request.params.argument.value, request.params.context);
    return createCompletionResult(suggestions);
  }
  setResourceRequestHandlers() {
    this._resourceHandlersInitialized || (this.server.assertCanSetRequestHandler(getMethodValue(ListResourcesRequestSchema)), this.server.assertCanSetRequestHandler(getMethodValue(ListResourceTemplatesRequestSchema)), this.server.assertCanSetRequestHandler(getMethodValue(ReadResourceRequestSchema)), this.server.registerCapabilities({
      resources: {
        listChanged: !0
      }
    }), this.server.setRequestHandler(ListResourcesRequestSchema, async (request, extra) => {
      let resources = Object.entries(this._registeredResources).filter(([_, resource]) => resource.enabled).map(([uri, resource]) => ({
        uri,
        name: resource.name,
        ...resource.metadata
      })), templateResources = [];
      for (let template of Object.values(this._registeredResourceTemplates)) {
        if (!template.resourceTemplate.listCallback)
          continue;
        let result = await template.resourceTemplate.listCallback(extra);
        for (let resource of result.resources)
          templateResources.push({
            ...template.metadata,
            // the defined resource metadata should override the template metadata if present
            ...resource
          });
      }
      return { resources: [...resources, ...templateResources] };
    }), this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({ resourceTemplates: Object.entries(this._registeredResourceTemplates).map(([name, template]) => ({
      name,
      uriTemplate: template.resourceTemplate.uriTemplate.toString(),
      ...template.metadata
    })) })), this.server.setRequestHandler(ReadResourceRequestSchema, async (request, extra) => {
      let uri = new URL(request.params.uri), resource = this._registeredResources[uri.toString()];
      if (resource) {
        if (!resource.enabled)
          throw new McpError(ErrorCode.InvalidParams, `Resource ${uri} disabled`);
        return resource.readCallback(uri, extra);
      }
      for (let template of Object.values(this._registeredResourceTemplates)) {
        let variables = template.resourceTemplate.uriTemplate.match(uri.toString());
        if (variables)
          return template.readCallback(uri, variables, extra);
      }
      throw new McpError(ErrorCode.InvalidParams, `Resource ${uri} not found`);
    }), this._resourceHandlersInitialized = !0);
  }
  setPromptRequestHandlers() {
    this._promptHandlersInitialized || (this.server.assertCanSetRequestHandler(getMethodValue(ListPromptsRequestSchema)), this.server.assertCanSetRequestHandler(getMethodValue(GetPromptRequestSchema)), this.server.registerCapabilities({
      prompts: {
        listChanged: !0
      }
    }), this.server.setRequestHandler(ListPromptsRequestSchema, () => ({
      prompts: Object.entries(this._registeredPrompts).filter(([, prompt]) => prompt.enabled).map(([name, prompt]) => ({
        name,
        title: prompt.title,
        description: prompt.description,
        arguments: prompt.argsSchema ? promptArgumentsFromSchema(prompt.argsSchema) : void 0
      }))
    })), this.server.setRequestHandler(GetPromptRequestSchema, async (request, extra) => {
      let prompt = this._registeredPrompts[request.params.name];
      if (!prompt)
        throw new McpError(ErrorCode.InvalidParams, `Prompt ${request.params.name} not found`);
      if (!prompt.enabled)
        throw new McpError(ErrorCode.InvalidParams, `Prompt ${request.params.name} disabled`);
      if (prompt.argsSchema) {
        let argsObj = normalizeObjectSchema(prompt.argsSchema), parseResult = await safeParseAsync3(argsObj, request.params.arguments ?? {});
        if (!parseResult.success) {
          let error2 = "error" in parseResult ? parseResult.error : "Unknown error", errorMessage = getParseErrorMessage(error2);
          throw new McpError(ErrorCode.InvalidParams, `Invalid arguments for prompt ${request.params.name}: ${errorMessage}`);
        }
        let args = parseResult.data, cb = prompt.callback;
        return await Promise.resolve(cb(args, extra));
      } else {
        let cb = prompt.callback;
        return await Promise.resolve(cb(extra));
      }
    }), this._promptHandlersInitialized = !0);
  }
  resource(name, uriOrTemplate, ...rest) {
    let metadata;
    typeof rest[0] == "object" && (metadata = rest.shift());
    let readCallback = rest[0];
    if (typeof uriOrTemplate == "string") {
      if (this._registeredResources[uriOrTemplate])
        throw new Error(`Resource ${uriOrTemplate} is already registered`);
      let registeredResource = this._createRegisteredResource(name, void 0, uriOrTemplate, metadata, readCallback);
      return this.setResourceRequestHandlers(), this.sendResourceListChanged(), registeredResource;
    } else {
      if (this._registeredResourceTemplates[name])
        throw new Error(`Resource template ${name} is already registered`);
      let registeredResourceTemplate = this._createRegisteredResourceTemplate(name, void 0, uriOrTemplate, metadata, readCallback);
      return this.setResourceRequestHandlers(), this.sendResourceListChanged(), registeredResourceTemplate;
    }
  }
  registerResource(name, uriOrTemplate, config2, readCallback) {
    if (typeof uriOrTemplate == "string") {
      if (this._registeredResources[uriOrTemplate])
        throw new Error(`Resource ${uriOrTemplate} is already registered`);
      let registeredResource = this._createRegisteredResource(name, config2.title, uriOrTemplate, config2, readCallback);
      return this.setResourceRequestHandlers(), this.sendResourceListChanged(), registeredResource;
    } else {
      if (this._registeredResourceTemplates[name])
        throw new Error(`Resource template ${name} is already registered`);
      let registeredResourceTemplate = this._createRegisteredResourceTemplate(name, config2.title, uriOrTemplate, config2, readCallback);
      return this.setResourceRequestHandlers(), this.sendResourceListChanged(), registeredResourceTemplate;
    }
  }
  _createRegisteredResource(name, title, uri, metadata, readCallback) {
    let registeredResource = {
      name,
      title,
      metadata,
      readCallback,
      enabled: !0,
      disable: () => registeredResource.update({ enabled: !1 }),
      enable: () => registeredResource.update({ enabled: !0 }),
      remove: () => registeredResource.update({ uri: null }),
      update: (updates) => {
        typeof updates.uri < "u" && updates.uri !== uri && (delete this._registeredResources[uri], updates.uri && (this._registeredResources[updates.uri] = registeredResource)), typeof updates.name < "u" && (registeredResource.name = updates.name), typeof updates.title < "u" && (registeredResource.title = updates.title), typeof updates.metadata < "u" && (registeredResource.metadata = updates.metadata), typeof updates.callback < "u" && (registeredResource.readCallback = updates.callback), typeof updates.enabled < "u" && (registeredResource.enabled = updates.enabled), this.sendResourceListChanged();
      }
    };
    return this._registeredResources[uri] = registeredResource, registeredResource;
  }
  _createRegisteredResourceTemplate(name, title, template, metadata, readCallback) {
    let registeredResourceTemplate = {
      resourceTemplate: template,
      title,
      metadata,
      readCallback,
      enabled: !0,
      disable: () => registeredResourceTemplate.update({ enabled: !1 }),
      enable: () => registeredResourceTemplate.update({ enabled: !0 }),
      remove: () => registeredResourceTemplate.update({ name: null }),
      update: (updates) => {
        typeof updates.name < "u" && updates.name !== name && (delete this._registeredResourceTemplates[name], updates.name && (this._registeredResourceTemplates[updates.name] = registeredResourceTemplate)), typeof updates.title < "u" && (registeredResourceTemplate.title = updates.title), typeof updates.template < "u" && (registeredResourceTemplate.resourceTemplate = updates.template), typeof updates.metadata < "u" && (registeredResourceTemplate.metadata = updates.metadata), typeof updates.callback < "u" && (registeredResourceTemplate.readCallback = updates.callback), typeof updates.enabled < "u" && (registeredResourceTemplate.enabled = updates.enabled), this.sendResourceListChanged();
      }
    };
    this._registeredResourceTemplates[name] = registeredResourceTemplate;
    let variableNames = template.uriTemplate.variableNames;
    return Array.isArray(variableNames) && variableNames.some((v) => !!template.completeCallback(v)) && this.setCompletionRequestHandler(), registeredResourceTemplate;
  }
  _createRegisteredPrompt(name, title, description, argsSchema, callback) {
    let registeredPrompt = {
      title,
      description,
      argsSchema: argsSchema === void 0 ? void 0 : objectFromShape(argsSchema),
      callback,
      enabled: !0,
      disable: () => registeredPrompt.update({ enabled: !1 }),
      enable: () => registeredPrompt.update({ enabled: !0 }),
      remove: () => registeredPrompt.update({ name: null }),
      update: (updates) => {
        typeof updates.name < "u" && updates.name !== name && (delete this._registeredPrompts[name], updates.name && (this._registeredPrompts[updates.name] = registeredPrompt)), typeof updates.title < "u" && (registeredPrompt.title = updates.title), typeof updates.description < "u" && (registeredPrompt.description = updates.description), typeof updates.argsSchema < "u" && (registeredPrompt.argsSchema = objectFromShape(updates.argsSchema)), typeof updates.callback < "u" && (registeredPrompt.callback = updates.callback), typeof updates.enabled < "u" && (registeredPrompt.enabled = updates.enabled), this.sendPromptListChanged();
      }
    };
    return this._registeredPrompts[name] = registeredPrompt, argsSchema && Object.values(argsSchema).some((field) => {
      let inner = field instanceof ZodOptional2 ? field._def?.innerType : field;
      return isCompletable(inner);
    }) && this.setCompletionRequestHandler(), registeredPrompt;
  }
  _createRegisteredTool(name, title, description, inputSchema, outputSchema, annotations, execution, _meta, handler) {
    validateAndWarnToolName(name);
    let registeredTool = {
      title,
      description,
      inputSchema: getZodSchemaObject(inputSchema),
      outputSchema: getZodSchemaObject(outputSchema),
      annotations,
      execution,
      _meta,
      handler,
      enabled: !0,
      disable: () => registeredTool.update({ enabled: !1 }),
      enable: () => registeredTool.update({ enabled: !0 }),
      remove: () => registeredTool.update({ name: null }),
      update: (updates) => {
        typeof updates.name < "u" && updates.name !== name && (typeof updates.name == "string" && validateAndWarnToolName(updates.name), delete this._registeredTools[name], updates.name && (this._registeredTools[updates.name] = registeredTool)), typeof updates.title < "u" && (registeredTool.title = updates.title), typeof updates.description < "u" && (registeredTool.description = updates.description), typeof updates.paramsSchema < "u" && (registeredTool.inputSchema = objectFromShape(updates.paramsSchema)), typeof updates.outputSchema < "u" && (registeredTool.outputSchema = objectFromShape(updates.outputSchema)), typeof updates.callback < "u" && (registeredTool.handler = updates.callback), typeof updates.annotations < "u" && (registeredTool.annotations = updates.annotations), typeof updates._meta < "u" && (registeredTool._meta = updates._meta), typeof updates.enabled < "u" && (registeredTool.enabled = updates.enabled), this.sendToolListChanged();
      }
    };
    return this._registeredTools[name] = registeredTool, this.setToolRequestHandlers(), this.sendToolListChanged(), registeredTool;
  }
  /**
   * tool() implementation. Parses arguments passed to overrides defined above.
   */
  tool(name, ...rest) {
    if (this._registeredTools[name])
      throw new Error(`Tool ${name} is already registered`);
    let description, inputSchema, outputSchema, annotations;
    if (typeof rest[0] == "string" && (description = rest.shift()), rest.length > 1) {
      let firstArg = rest[0];
      if (isZodRawShapeCompat(firstArg))
        inputSchema = rest.shift(), rest.length > 1 && typeof rest[0] == "object" && rest[0] !== null && !isZodRawShapeCompat(rest[0]) && (annotations = rest.shift());
      else if (typeof firstArg == "object" && firstArg !== null) {
        if (Object.values(firstArg).some((v) => typeof v == "object" && v !== null))
          throw new Error(`Tool ${name} expected a Zod schema or ToolAnnotations, but received an unrecognized object`);
        annotations = rest.shift();
      }
    }
    let callback = rest[0];
    return this._createRegisteredTool(name, void 0, description, inputSchema, outputSchema, annotations, { taskSupport: "forbidden" }, void 0, callback);
  }
  /**
   * Registers a tool with a config object and callback.
   */
  registerTool(name, config2, cb) {
    if (this._registeredTools[name])
      throw new Error(`Tool ${name} is already registered`);
    let { title, description, inputSchema, outputSchema, annotations, _meta } = config2;
    return this._createRegisteredTool(name, title, description, inputSchema, outputSchema, annotations, { taskSupport: "forbidden" }, _meta, cb);
  }
  prompt(name, ...rest) {
    if (this._registeredPrompts[name])
      throw new Error(`Prompt ${name} is already registered`);
    let description;
    typeof rest[0] == "string" && (description = rest.shift());
    let argsSchema;
    rest.length > 1 && (argsSchema = rest.shift());
    let cb = rest[0], registeredPrompt = this._createRegisteredPrompt(name, void 0, description, argsSchema, cb);
    return this.setPromptRequestHandlers(), this.sendPromptListChanged(), registeredPrompt;
  }
  /**
   * Registers a prompt with a config object and callback.
   */
  registerPrompt(name, config2, cb) {
    if (this._registeredPrompts[name])
      throw new Error(`Prompt ${name} is already registered`);
    let { title, description, argsSchema } = config2, registeredPrompt = this._createRegisteredPrompt(name, title, description, argsSchema, cb);
    return this.setPromptRequestHandlers(), this.sendPromptListChanged(), registeredPrompt;
  }
  /**
   * Checks if the server is connected to a transport.
   * @returns True if the server is connected
   */
  isConnected() {
    return this.server.transport !== void 0;
  }
  /**
   * Sends a logging message to the client, if connected.
   * Note: You only need to send the parameters object, not the entire JSON RPC message
   * @see LoggingMessageNotification
   * @param params
   * @param sessionId optional for stateless and backward compatibility
   */
  async sendLoggingMessage(params, sessionId) {
    return this.server.sendLoggingMessage(params, sessionId);
  }
  /**
   * Sends a resource list changed event to the client, if connected.
   */
  sendResourceListChanged() {
    this.isConnected() && this.server.sendResourceListChanged();
  }
  /**
   * Sends a tool list changed event to the client, if connected.
   */
  sendToolListChanged() {
    this.isConnected() && this.server.sendToolListChanged();
  }
  /**
   * Sends a prompt list changed event to the client, if connected.
   */
  sendPromptListChanged() {
    this.isConnected() && this.server.sendPromptListChanged();
  }
};
var EMPTY_OBJECT_JSON_SCHEMA = {
  type: "object",
  properties: {}
};
function isZodTypeLike(value) {
  return value !== null && typeof value == "object" && "parse" in value && typeof value.parse == "function" && "safeParse" in value && typeof value.safeParse == "function";
}
function isZodSchemaInstance(obj) {
  return "_def" in obj || "_zod" in obj || isZodTypeLike(obj);
}
function isZodRawShapeCompat(obj) {
  return typeof obj != "object" || obj === null || isZodSchemaInstance(obj) ? !1 : Object.keys(obj).length === 0 ? !0 : Object.values(obj).some(isZodTypeLike);
}
function getZodSchemaObject(schema) {
  if (schema) {
    if (isZodRawShapeCompat(schema))
      return objectFromShape(schema);
    if (!isZodSchemaInstance(schema))
      throw new Error("inputSchema must be a Zod schema or raw shape, received an unrecognized object");
    return schema;
  }
}
function promptArgumentsFromSchema(schema) {
  let shape = getObjectShape(schema);
  return shape ? Object.entries(shape).map(([name, field]) => {
    let description = getSchemaDescription(field), isOptional = isSchemaOptional(field);
    return {
      name,
      description,
      required: !isOptional
    };
  }) : [];
}
function getMethodValue(schema) {
  let methodSchema = getObjectShape(schema)?.method;
  if (!methodSchema)
    throw new Error("Schema is missing a method literal");
  let value = getLiteralValue(methodSchema);
  if (typeof value == "string")
    return value;
  throw new Error("Schema method literal must be a string");
}
function createCompletionResult(suggestions) {
  return {
    completion: {
      values: suggestions.slice(0, 100),
      total: suggestions.length,
      hasMore: suggestions.length > 100
    }
  };
}
var EMPTY_COMPLETION_RESULT = {
  completion: {
    values: [],
    hasMore: !1
  }
};

// src/server/appService.ts
import fs9 from "node:fs";

// src/server/updateCheck.ts
import fs8 from "node:fs";
import path6 from "node:path";

// src/shared/updateCheck.ts
var SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/i;
function parseSemver(raw) {
  let match = SEMVER_RE.exec(raw.trim());
  if (!match) return null;
  let major = Number(match[1]), minor = Number(match[2]), patch = Number(match[3]);
  return !Number.isSafeInteger(major) || !Number.isSafeInteger(minor) || !Number.isSafeInteger(patch) ? null : {
    major,
    minor,
    patch,
    prerelease: match[4] ?? null
  };
}
function comparePrerelease(a, b) {
  let aParts = a.split("."), bParts = b.split("."), len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    let ap = aParts[i], bp = bParts[i];
    if (ap === void 0) return -1;
    if (bp === void 0) return 1;
    if (ap === bp) continue;
    let aNum = /^\d+$/.test(ap), bNum = /^\d+$/.test(bp);
    if (aNum && bNum) {
      let diff = Number(ap) - Number(bp);
      if (diff !== 0) return diff < 0 ? -1 : 1;
    } else return aNum !== bNum ? aNum ? -1 : 1 : ap < bp ? -1 : 1;
  }
  return 0;
}
function compareSemver(a, b) {
  let pa = parseSemver(a), pb = parseSemver(b);
  return !pa || !pb ? null : pa.major !== pb.major ? pa.major < pb.major ? -1 : 1 : pa.minor !== pb.minor ? pa.minor < pb.minor ? -1 : 1 : pa.patch !== pb.patch ? pa.patch < pb.patch ? -1 : 1 : pa.prerelease === pb.prerelease ? 0 : pa.prerelease === null ? 1 : pb.prerelease === null ? -1 : comparePrerelease(pa.prerelease, pb.prerelease);
}
function buildGitPullCommand(pluginRoot, platform = process.platform) {
  return platform === "win32" ? `git -C "${pluginRoot.replace(/"/g, '\\"')}" pull` : /^[a-zA-Z0-9._/~-]+$/.test(pluginRoot) ? `git -C ${pluginRoot} pull` : `git -C '${pluginRoot.replace(/'/g, "'\\''")}' pull`;
}

// src/server/updateCheck.ts
var FALLBACK_PLUGIN_VERSION = "0.4.2", REPO_URL = "https://github.com/fmedery/antigravity-plugin-flight-recorder", REMOTE_RELEASE_URL = "https://api.github.com/repos/fmedery/antigravity-plugin-flight-recorder/releases/latest", REMOTE_MANIFEST_URL = "https://raw.githubusercontent.com/fmedery/antigravity-plugin-flight-recorder/main/plugin.json", MAX_RESPONSE_BYTES = 131072, DEFAULT_TIMEOUT_MS = 5e3, DEFAULT_CACHE_TTL_MS = 3e4, checkCache = /* @__PURE__ */ new Map();
function readInstalledVersion(pluginRoot) {
  if (!pluginRoot) return FALLBACK_PLUGIN_VERSION;
  try {
    let manifestPath = path6.join(pluginRoot, "plugin.json");
    if (!fs8.existsSync(manifestPath)) return FALLBACK_PLUGIN_VERSION;
    let raw = JSON.parse(fs8.readFileSync(manifestPath, "utf8"));
    if (typeof raw.version == "string" && parseSemver(raw.version))
      return raw.version.trim().replace(/^v/i, "");
  } catch {
  }
  return FALLBACK_PLUGIN_VERSION;
}
function detectInstallMethod(pluginRoot) {
  if (!pluginRoot) return "zip";
  try {
    if (fs8.existsSync(path6.join(pluginRoot, ".git")))
      return "git";
    let dirName = path6.basename(pluginRoot);
    if (/^-?\d{10,}$/.test(dirName))
      return "marketplace";
    for (let marker of [
      ".marketplace",
      ".antigravity-marketplace",
      "install_metadata.json"
    ])
      if (fs8.existsSync(path6.join(pluginRoot, marker)))
        return "marketplace";
    let manifestPath = path6.join(pluginRoot, "plugin.json");
    if (fs8.existsSync(manifestPath)) {
      let raw = JSON.parse(fs8.readFileSync(manifestPath, "utf8"));
      if (typeof raw.source == "string" && /(?:marketplace|antigravity-plugins-)/i.test(raw.source))
        return "marketplace";
    }
    return "zip";
  } catch {
    return "zip";
  }
}
async function readBoundedJson(res) {
  let contentLength = Number(res.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES)
    return { ok: !1, message: "Remote manifest exceeded expected size." };
  let rawText = await res.text();
  if (Buffer.byteLength(rawText, "utf8") > MAX_RESPONSE_BYTES)
    return { ok: !1, message: "Remote manifest exceeded expected size." };
  try {
    let parsed = JSON.parse(rawText);
    return !parsed || typeof parsed != "object" || Array.isArray(parsed) ? { ok: !1, message: "Remote manifest did not contain a valid version." } : { ok: !0, data: parsed };
  } catch {
    return { ok: !1, message: "Remote manifest did not contain a valid version." };
  }
}
function sanitizeReleaseUrl(candidate, tagName) {
  return typeof candidate == "string" && candidate.startsWith(`${REPO_URL}/`) ? candidate : `${REPO_URL}/releases/tag/${encodeURIComponent(tagName)}`;
}
async function fetchLatestVersionInfo(fetchImpl, timeoutMs) {
  let relRes = await fetchImpl(REMOTE_RELEASE_URL, {
    headers: {
      "User-Agent": "flight-recorder",
      Accept: "application/vnd.github+json"
    },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (relRes.ok) {
    let body = await readBoundedJson(relRes);
    if (!body.ok) return body;
    let d = body.data;
    if (typeof d.tag_name == "string" && d.draft !== !0 && d.prerelease !== !0 && parseSemver(d.tag_name)) {
      let cleanTag = d.tag_name.trim();
      return {
        ok: !0,
        latestVersion: cleanTag.replace(/^v/i, ""),
        releaseUrl: sanitizeReleaseUrl(d.html_url, cleanTag),
        source: "github_release"
      };
    }
    return { ok: !1, message: "Remote release did not contain a valid version." };
  }
  if (relRes.status === 404 || relRes.status === 403 || relRes.status === 429) {
    let manRes = await fetchImpl(REMOTE_MANIFEST_URL, {
      headers: {
        "User-Agent": "flight-recorder",
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!manRes.ok)
      return { ok: !1, message: `GitHub returned HTTP ${manRes.status}.` };
    let body = await readBoundedJson(manRes);
    if (!body.ok) return body;
    let d = body.data;
    return d.name !== "flight-recorder" || typeof d.version != "string" || !parseSemver(d.version) ? {
      ok: !1,
      message: "Remote manifest did not contain a valid version."
    } : {
      ok: !0,
      latestVersion: d.version.trim().replace(/^v/i, ""),
      releaseUrl: REPO_URL,
      source: "manifest"
    };
  }
  return { ok: !1, message: `GitHub returned HTTP ${relRes.status}.` };
}
async function checkForUpdate(opts = {}) {
  let pluginRoot = opts.pluginRoot ?? null, platform = opts.platform ?? process.platform, fetchImpl = opts.fetchImpl ?? globalThis.fetch, timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, cacheTtlMs = opts.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS, nowMs = opts.nowMs ?? Date.now(), useCache = cacheTtlMs > 0 && fetchImpl === globalThis.fetch, cacheKey = `${pluginRoot ?? ""}::${platform}`;
  if (useCache) {
    let cached2 = checkCache.get(cacheKey);
    if (cached2 && nowMs < cached2.expiresAtMs)
      return cached2.result;
  }
  let currentVersion = readInstalledVersion(pluginRoot), installMethod = detectInstallMethod(pluginRoot), updateCommand = installMethod === "git" && pluginRoot ? buildGitPullCommand(pluginRoot, platform) : null, baseResult = {
    currentVersion,
    installMethod,
    pluginRoot,
    updateCommand,
    repoUrl: REPO_URL,
    checkedAtMs: nowMs
  };
  try {
    let fetched = await fetchLatestVersionInfo(fetchImpl, timeoutMs);
    if (!fetched.ok)
      return {
        ...baseResult,
        status: "error",
        latestVersion: null,
        message: fetched.message
      };
    let cmp = compareSemver(currentVersion, fetched.latestVersion);
    if (cmp === null)
      return {
        ...baseResult,
        status: "error",
        latestVersion: null,
        message: "Unable to compare installed and remote versions."
      };
    let result = {
      ...baseResult,
      status: cmp < 0 ? "update_available" : "up_to_date",
      latestVersion: fetched.latestVersion,
      releaseUrl: fetched.releaseUrl,
      source: fetched.source
    };
    return useCache && checkCache.set(cacheKey, {
      expiresAtMs: nowMs + cacheTtlMs,
      result
    }), result;
  } catch (err) {
    let name = err instanceof Error ? err.name : "";
    return {
      ...baseResult,
      status: "error",
      latestVersion: null,
      message: name === "TimeoutError" || name === "AbortError" ? "Request timed out." : "Could not reach GitHub (offline or blocked)."
    };
  }
}

// src/server/appService.ts
var SIDECAR_ID = "flight-recorder/dashboard", timeRangeSchema = external_exports.enum(["today", "7d", "30d", "all"]).optional(), sinceMsSchema = external_exports.number().finite().positive().nullable().optional(), pricingRuleSchema = external_exports.object({
  id: external_exports.string().min(1).max(160),
  pattern: external_exports.string().min(1).max(160),
  label: external_exports.string().min(1).max(160),
  inputPer1M: external_exports.number().finite().min(0).max(1e5),
  cacheReadPer1M: external_exports.number().finite().min(0).max(1e5),
  outputPer1M: external_exports.number().finite().min(0).max(1e5),
  enabled: external_exports.boolean(),
  retired: external_exports.boolean().optional()
}), dashboardQueryShape = {
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema,
  skipScan: external_exports.boolean().optional()
}, DashboardQuerySchema = external_exports.object(dashboardQueryShape), projectDetailQueryShape = {
  projectPath: external_exports.string().min(1).max(2048),
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema
}, ProjectDetailQuerySchema = external_exports.object(projectDetailQueryShape), chatDetailQueryShape = {
  conversationId: external_exports.string().min(1).max(256)
}, ChatDetailQuerySchema = external_exports.object(chatDetailQueryShape), rescanQueryShape = {
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema,
  onlyIfChanged: external_exports.boolean().optional()
}, RescanQuerySchema = external_exports.object(rescanQueryShape), updatePricingShape = {
  rules: external_exports.array(pricingRuleSchema).max(100),
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema
}, UpdatePricingSchema = external_exports.object(updatePricingShape), assignProjectShape = {
  conversationId: external_exports.string().min(1).max(128),
  projectPath: external_exports.string().max(1024),
  timeRange: timeRangeSchema,
  sinceMs: sinceMsSchema
}, AssignProjectSchema = external_exports.object(assignProjectShape), AppServiceError = class extends Error {
  statusCode;
  constructor(message, statusCode = 400) {
    super(message), this.name = "AppServiceError", this.statusCode = statusCode;
  }
};
function buildSidecarDeepLink(params) {
  let qs = new URLSearchParams();
  params.view && params.view !== "projects" && qs.set("view", params.view), params.projectPath && qs.set("targetProjectPath", params.projectPath), params.conversationId && qs.set("targetConversationId", params.conversationId), params.timeRange && params.timeRange !== "all" && qs.set("timeRange", params.timeRange);
  let query = qs.toString();
  return query ? `sidecar://${SIDECAR_ID}/?${query}` : `sidecar://${SIDECAR_ID}/`;
}
function createTrackerAppService(ctx) {
  let scanNow = async () => runScan({
    db: ctx.db,
    dataDir: ctx.dataDir,
    brainRoots: ctx.brainRoots,
    eventsPath: ctx.eventsPath
  });
  return {
    scanNow,
    async getDashboardData(input = {}) {
      return input.skipScan || await scanNow(), buildDashboardData(ctx.db, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      });
    },
    async getProjectDetail(input) {
      let detail = buildProjectDetail(ctx.db, input.projectPath, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      });
      if (detail || (await scanNow(), detail = buildProjectDetail(ctx.db, input.projectPath, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      })), !detail)
        throw new AppServiceError(`Project not found: ${input.projectPath}`, 404);
      return detail;
    },
    async getChatDetail(input) {
      let detail = buildConversationDetail(ctx.db, input.conversationId);
      if (detail || (await scanNow(), detail = buildConversationDetail(ctx.db, input.conversationId)), !detail)
        throw new AppServiceError(
          `Conversation not found: ${input.conversationId}`,
          404
        );
      return detail;
    },
    async rescanAll(input = {}) {
      let stats = await scanNow(), scannedAtMs = Date.now(), changed = stats.transcriptsIndexed > 0 || stats.hookEventsIngested > 0;
      if (input.onlyIfChanged && !changed)
        return {
          stats,
          changed: !1,
          scannedAtMs
        };
      let dashboard = buildDashboardData(ctx.db, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      });
      return {
        stats,
        changed,
        scannedAtMs,
        dashboard
      };
    },
    async updatePricing(input) {
      return ctx.db.savePricingRules(input.rules), { dashboard: buildDashboardData(ctx.db, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      }) };
    },
    async assignProject(input) {
      ctx.db.setProjectOverride(
        input.conversationId,
        input.projectPath.trim() || "Unassigned"
      );
      let dashboard = buildDashboardData(ctx.db, {
        preset: input.timeRange,
        sinceMs: input.sinceMs
      }), chatDetail = buildConversationDetail(ctx.db, input.conversationId);
      return {
        dashboard,
        chatDetail
      };
    },
    async checkUpdate() {
      return checkForUpdate({ pluginRoot: ctx.pluginRoot });
    }
  };
}

// src/server/tools.ts
function fmtK(n) {
  return n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n);
}
function fmtDur(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  if (ms < 1e3) return `${Math.round(ms)}ms`;
  let totalSec = Math.round(ms / 1e3);
  if (totalSec < 60) return `${(ms / 1e3).toFixed(1)}s`;
  let min = Math.floor(totalSec / 60), remSec = totalSec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  let hr = Math.floor(min / 60), remMin = min % 60;
  return `${hr}h ${remMin}m`;
}
function fmtTokenTotal(tokens) {
  if (!tokens.hasTokenTelemetry) return "N/A (legacy)";
  let total = tokens.inputTokens + tokens.cacheReadTokens + tokens.outputTokens;
  return `${fmtK(total)} tokens (${Math.round(tokens.cacheHitRatio * 100)}% cache)`;
}
function fmtCost(usd, unpriced) {
  if (usd === null)
    return unpriced.length > 0 ? `Unpriced (${unpriced.join(", ")})` : "N/A";
  let base = `$${usd.toFixed(usd < 0.1 ? 4 : 2)} est.`;
  return unpriced.length > 0 ? `${base} (+ ${unpriced.length} unpriced model)` : base;
}
function fmtContextHealth(ch) {
  if (ch.measuredChatCount === 0) return null;
  let underPct = Math.round(ch.under200kRatio * 100);
  return ch.cliff200kChats === 0 && ch.compactionEventCount === 0 ? `${fmtK(ch.avgPeakContextTokens)} avg peak (${underPct}% <200k, max ${fmtK(ch.maxPeakContextTokens)})` : `${fmtK(ch.avgPeakContextTokens)} avg peak (${underPct}% <200k, ${ch.cliff200kChats} \u2265200k, ${ch.compaction256kChats} \u2265256k, ${ch.compactionEventCount} reset${ch.compactionEventCount === 1 ? "" : "s"})`;
}
function fmtSignedPct(ratio) {
  if (ratio === null || !Number.isFinite(ratio)) return null;
  let pct = Math.round(ratio * 100);
  return pct > 999 ? ">+999%" : pct < -999 ? "<-999%" : pct > 0 ? `+${pct}%` : `${pct}%`;
}
function fmtPeriodComparison(cmp) {
  if (!cmp || !cmp.hasPriorActivity) return null;
  let parts = [], chats = fmtSignedPct(cmp.chatsDeltaPct);
  chats && parts.push(`${chats} chats`);
  let tokens = fmtSignedPct(cmp.tokensDeltaPct);
  if (tokens && parts.push(`${tokens} tokens`), cmp.cacheHitDeltaPp !== null && Math.round(cmp.cacheHitDeltaPp) !== 0) {
    let pp = Math.round(cmp.cacheHitDeltaPp);
    parts.push(`${pp > 0 ? "+" : ""}${pp}pp cache`);
  }
  let active = fmtSignedPct(cmp.activeMsDeltaPct);
  active && parts.push(`${active} active`);
  let cost = fmtSignedPct(cmp.costDeltaPct);
  cost && parts.push(`${cost} cost`);
  let avgPeak = fmtSignedPct(cmp.avgPeakContextDeltaPct);
  return avgPeak && parts.push(`${avgPeak} avg peak`), parts.length > 0 ? `${cmp.label}: ${parts.join(", ")}` : null;
}
function fmtModelMix(breakdown, maxItems = 4) {
  if (breakdown.length === 0) return "unknown";
  let hasTokens = breakdown.some((m) => m.totalTokens > 0), sorted = [...breakdown].sort(
    (a, b) => hasTokens ? b.tokenShare - a.tokenShare : b.stepShare - a.stepShare
  ), visible = sorted.slice(0, maxItems), parts = visible.map((m) => {
    let share = hasTokens ? m.tokenShare : m.stepShare;
    return `${m.model} ${Math.round(share * 100)}%`;
  }), rest = sorted.length - visible.length;
  return rest > 0 && parts.push(`+${rest} more`), `${parts.join(", ")}${hasTokens ? "" : " (by steps)"}`;
}
function fmtModelBreakdownLines(breakdown, includeChats) {
  if (breakdown.length === 0) return ["  - unknown"];
  let hasAnyTokens = breakdown.some((m) => m.totalTokens > 0);
  return breakdown.map((m) => {
    let tokSegment = m.totalTokens > 0 || hasAnyTokens ? `${Math.round(m.tokenShare * 100)}% tokens (${fmtK(m.totalTokens)}, ${Math.round(m.cacheHitRatio * 100)}% cache)` : "0 tokens (legacy)", costSegment = m.estimatedCostUsd === null ? "Unpriced" : `$${m.estimatedCostUsd.toFixed(m.estimatedCostUsd < 0.1 ? 4 : 2)} est.`, chatSegment = includeChats ? ` \xB7 ${m.chatCount} chats` : "";
    return `  - \`${m.model}\`: ${tokSegment} \xB7 ${Math.round(m.stepShare * 100)}% steps (${m.steps}) \xB7 ${Math.round(m.timeShare * 100)}% model time (${fmtDur(m.modelDurationMs)})${chatSegment} \xB7 ${costSegment}`;
  });
}
function fmtPluginSkillLines(metrics, includeProjects) {
  return metrics.slice(0, 12).map((m) => {
    let scopePart = includeProjects && m.projectCount ? ` \xB7 ${m.projectCount} projects` : ` \xB7 ${m.chatCount} chats`, spendPart = m.drivenCostUsd !== null ? `${m.costShare !== null ? `${Math.round(m.costShare * 100)}% spend ` : ""}($$${m.drivenCostUsd.toFixed(m.drivenCostUsd < 0.1 ? 4 : 2)} est.) \xB7 `.replace("$$", "$") : "", timePart = `${Math.round(m.timeShare * 100)}% active time (${fmtDur(m.drivenActiveMs)})`, childPart = m.children.length > 1 ? ` \xB7 ${m.children.length} sub-skills/tools` : ` \xB7 ${m.calls} calls`, errPart = m.errors > 0 ? ` \xB7 ${m.errors} err` : "", warnPart = m.warnings.length > 0 ? ` [${m.warnings.join(", ")}]` : "";
    return `  - [${m.kind}] **${m.name}**: ${spendPart}${timePart} \xB7 +${fmtK(m.totalTokens)} context (+${fmtK(m.instructionTokens)} instr / +${fmtK(m.executionTokens)} exec)${childPart}${scopePart}${errPart}${warnPart}`;
  });
}
function resolveProjectMatch(db, projectPath, projectName) {
  let dash = buildDashboardData(db);
  if (dash.projects.length === 0) return null;
  if (projectPath) {
    let cleanInput = unwrapFileUri(projectPath), exact = dash.projects.find((p) => sameLocalPath(p.projectPath, cleanInput));
    if (exact) return exact.projectPath;
    let byBasename = dash.projects.find(
      (p) => p.projectName.toLowerCase() === pathBaseName(cleanInput).toLowerCase()
    );
    if (byBasename) return byBasename.projectPath;
  }
  if (projectName) {
    let lower = projectName.toLowerCase(), match = dash.projects.find(
      (p) => p.projectName.toLowerCase() === lower || p.projectPath.toLowerCase().includes(lower)
    );
    if (match) return match.projectPath;
  }
  return (dash.projects.find((p) => p.projectPath !== "Unassigned") ?? dash.projects[0]).projectPath;
}
function createTrackerMcpServer(ctx) {
  let server = new McpServer({
    name: "flight-recorder",
    version: readInstalledVersion(ctx.pluginRoot)
  }), appService = createTrackerAppService(ctx), scanNow = () => appService.scanNow();
  return server.registerTool(
    "open_flight_recorder",
    {
      title: "Flight Recorder",
      description: "Scan latest telemetry and return a summary plus a sidecar:// link to open the interactive Flight Recorder dashboard (projects, chats, skills, tools, token/cache attribution, estimated USD costs, and timing waterfalls). All arguments are optional.",
      inputSchema: {
        projectPath: external_exports.string().optional().describe("Optional absolute project workspace path to open directly."),
        conversationId: external_exports.string().optional().describe("Optional conversation UUID to open directly on a specific chat."),
        view: external_exports.enum(["projects", "project", "chat"]).optional().describe("Initial view tab ('projects', 'project', or 'chat')."),
        timeRange: timeRangeSchema.describe(
          "Optional time window preset ('today', '7d', '30d', or 'all'). Defaults to 'all'."
        )
      }
    },
    async ({ projectPath, conversationId, view, timeRange }) => {
      await scanNow();
      let dashboard = buildDashboardData(ctx.db, { preset: timeRange }), resolvedProject = projectPath ? resolveProjectMatch(ctx.db, projectPath) : null, initialView = view ?? (conversationId ? "chat" : resolvedProject ? "project" : "projects"), slimProjects = dashboard.projects.slice(0, 40).map((p) => ({
        ...p,
        topSkills: p.topSkills.slice(0, 5),
        topTools: p.topTools.slice(0, 5)
      })), slimPluginSkills = dashboard.pluginSkillMetrics.slice(0, 30).map((m) => ({
        ...m,
        targetPaths: m.targetPaths.slice(0, 5),
        errorSamples: m.errorSamples?.slice(0, 3),
        children: m.children.slice(0, 15).map((ch) => ({
          ...ch,
          targetPaths: ch.targetPaths.slice(0, 3),
          errorSamples: ch.errorSamples?.slice(0, 2)
        }))
      })), sidecarLink = buildSidecarDeepLink({
        view: initialView,
        projectPath: resolvedProject,
        conversationId: conversationId ?? null,
        timeRange
      }), structured = {
        initialView,
        selectedProjectPath: resolvedProject,
        selectedConversationId: conversationId ?? null,
        sidecarLink,
        dashboard: {
          ...dashboard,
          projects: slimProjects,
          pluginSkillMetrics: slimPluginSkills,
          recentChats: dashboard.recentChats.slice(0, 20)
        }
      }, globalMix = dashboard.totals.modelBreakdown.length > 0 ? `, model mix: ${fmtModelMix(dashboard.totals.modelBreakdown, 4)}` : "", ctxSummary = fmtContextHealth(dashboard.totals.contextHealth), cmpSummary = fmtPeriodComparison(dashboard.periodComparison), swarmCount = dashboard.totals.swarmCount ?? 0, swarmPart = swarmCount > 0 ? `, ${swarmCount} swarm${swarmCount === 1 ? "" : "s"}` : "";
      return {
        content: [{ type: "text", text: `Flight Recorder loaded: ${dashboard.totals.projectCount} projects, ${dashboard.totals.chatCount} chats (+${dashboard.totals.subagentCount} subagents${swarmPart}), ${fmtK(dashboard.totals.tokens.inputTokens + dashboard.totals.tokens.cacheReadTokens + dashboard.totals.tokens.outputTokens)} total tokens (${Math.round(dashboard.totals.tokens.cacheHitRatio * 100)}% cache hit), ${fmtDur(dashboard.totals.time.activeMs)} active agent time${ctxSummary ? `, context health: ${ctxSummary}` : ""}${cmpSummary ? ` (${cmpSummary})` : ""}${globalMix}.

Open dashboard in side panel: [Flight Recorder](${sidecarLink})` }],
        structuredContent: structured
      };
    }
  ), server.registerTool(
    "list_projects",
    {
      title: "List Tracked Projects",
      description: "List all Antigravity projects discovered from transcripts and live hooks with chat counts, per-model usage percentages, token usage, cache hit ratio, active time, and estimated USD cost.",
      inputSchema: {
        limit: external_exports.number().int().min(1).max(100).optional(),
        timeRange: timeRangeSchema
      }
    },
    async ({ limit, timeRange }) => {
      await scanNow();
      let dash = buildDashboardData(ctx.db, { preset: timeRange }), list = dash.projects.slice(0, limit ?? 30), lines = list.map((p) => {
        let sc = p.swarmCount ?? 0, swarmStr = sc > 0 ? `, ${sc} swarm${sc === 1 ? "" : "s"}` : "";
        return `- **${p.projectName}** (\`${p.projectPath}\`): ${p.chatCount} chats (+${p.subagentCount} subagents${swarmStr}), ${fmtTokenTotal(p.tokens)}, ${fmtDur(p.time.activeMs)} active, ${fmtCost(p.tokens.estimatedCostUsd, p.tokens.unpricedModels)}, models: [${fmtModelMix(p.modelBreakdown, 3)}], plugins/skills: [${p.topPluginsSkills.join(", ") || "none"}]`;
      }), pluginSection = dash.pluginSkillMetrics.length > 0 ? `

Most Token-Hungry Plugins & Skills (All Projects):
${fmtPluginSkillLines(dash.pluginSkillMetrics, !0).join(`
`)}` : "", ctxSummary = fmtContextHealth(dash.totals.contextHealth), cmpSummary = fmtPeriodComparison(dash.periodComparison), metaSummary = [
        ...ctxSummary ? [`Context Health: ${ctxSummary}`] : [],
        ...cmpSummary ? [`Period Trend: ${cmpSummary}`] : []
      ], metaHeader = metaSummary.length > 0 ? `
${metaSummary.join(`
`)}` : "";
      return {
        content: [
          {
            type: "text",
            text: list.length > 0 ? `Tracked Projects (${dash.projects.length} total):${metaHeader}
${lines.join(`
`)}${pluginSection}` : "No projects found in Antigravity transcripts yet."
          }
        ],
        structuredContent: {
          totals: dash.totals,
          periodComparison: dash.periodComparison,
          projects: list,
          pluginSkillMetrics: dash.pluginSkillMetrics
        }
      };
    }
  ), server.registerTool(
    "get_project_summary",
    {
      title: "Get Project Summary",
      description: "Get a full breakdown of what tasks, skills, tools, MCP servers, subagents, per-model usage breakdown, files, tokens, cache hits, estimated cost, and time built a project.",
      inputSchema: {
        projectPath: external_exports.string().optional(),
        projectName: external_exports.string().optional(),
        timeRange: timeRangeSchema
      }
    },
    async ({ projectPath, projectName, timeRange }) => {
      await scanNow();
      let resolved = resolveProjectMatch(ctx.db, projectPath, projectName);
      if (!resolved)
        return {
          content: [{ type: "text", text: "No tracked projects found." }]
        };
      let detail = buildProjectDetail(ctx.db, resolved, { preset: timeRange });
      if (!detail)
        return {
          content: [
            { type: "text", text: `Project not found: ${projectPath ?? projectName}` }
          ]
        };
      let s = detail.summary, totalTok = s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens, topMetrics = detail.skillToolMetrics.slice(0, 10).map(
        (m) => `  - ${m.category} \`${m.name}\`: ${m.calls} calls, ${fmtDur(m.totalDurationMs)}, +${fmtK(m.directTokens)} direct / +${fmtK(m.compoundedCacheTokens)} cache carry`
      ), topChats = detail.chats.slice(0, 10).map((c) => {
        let modeTag = c.swarmRole === "coordinator" ? "[Swarm] " : c.swarmRole === "worker" || c.subagentType === "swarm" ? `[Swarm Worker: ${c.subagentRole || "worker"}] ` : "";
        return `  - \`${c.conversationId}\` ${modeTag}"${c.title}": ${c.tokens.hasTokenTelemetry ? `${fmtK(c.tokens.inputTokens + c.tokens.cacheReadTokens + c.tokens.outputTokens)} tok (${Math.round(c.tokens.cacheHitRatio * 100)}% cache)` : "N/A (legacy)"}, ${fmtDur(c.time.activeMs)} active`;
      }), ctxSummary = fmtContextHealth(s.contextHealth), cmpSummary = fmtPeriodComparison(detail.periodComparison), projSwarmCount = s.swarmCount ?? 0;
      return {
        content: [{ type: "text", text: [
          `# Project: ${s.projectName} (\`${s.projectPath}\`)`,
          `- **Chats**: ${s.chatCount} top-level, ${s.subagentCount} subagents${projSwarmCount > 0 ? ` (${projSwarmCount} swarm${projSwarmCount === 1 ? "" : "s"})` : ""}`,
          ...projSwarmCount > 0 ? [`- **Swarm Runs**: ${projSwarmCount}`] : [],
          `- **Model Mix**: ${fmtModelMix(s.modelBreakdown, 6)}`,
          "- **Model Breakdown**:",
          ...fmtModelBreakdownLines(s.modelBreakdown, !0),
          `- **Tokens**: ${s.tokens.hasTokenTelemetry ? `${fmtK(totalTok)} total (${fmtK(s.tokens.inputTokens)} new input, ${fmtK(s.tokens.cacheReadTokens)} cache read [${Math.round(s.tokens.cacheHitRatio * 100)}% hit], ${fmtK(s.tokens.outputTokens)} output), peak context ${fmtK(s.tokens.peakContextTokens)}` : "N/A (legacy transcripts without token counters)"}`,
          ...ctxSummary ? [`- **Context Health**: ${ctxSummary}`] : [],
          ...cmpSummary ? [`- **Period Trend**: ${cmpSummary}`] : [],
          `- **Estimated Cost**: ${fmtCost(s.tokens.estimatedCostUsd, s.tokens.unpricedModels)}`,
          `- **Time**: ${fmtDur(s.time.activeMs)} active (${fmtDur(s.time.modelMs)} model, ${fmtDur(s.time.toolWallMs)} tools @ ${s.time.parallelismFactor}x parallel, ${fmtDur(s.time.subagentMs)} subagents), ${fmtDur(s.time.userIdleMs)} user idle excluded`,
          ...detail.pluginSkillMetrics.length > 0 ? [
            "- **Most Token-Hungry Plugins & Skills**:",
            ...fmtPluginSkillLines(detail.pluginSkillMetrics, !1)
          ] : [],
          `- **MCP Servers**: ${s.mcpServers.join(", ") || "none"}`,
          "- **Top Tools & Skills**:",
          ...topMetrics,
          "- **Recent Chats**:",
          ...topChats
        ].join(`
`) }],
        structuredContent: {
          summary: detail.summary,
          periodComparison: detail.periodComparison,
          chats: detail.chats.slice(0, 25),
          pluginSkillMetrics: detail.pluginSkillMetrics,
          skillToolMetrics: detail.skillToolMetrics.slice(0, 25),
          filesTouched: detail.filesTouched.slice(0, 30),
          diagnostics: detail.diagnostics
        }
      };
    }
  ), server.registerTool(
    "get_chat_analysis",
    {
      title: "Get Chat Analysis",
      description: "Inspect a specific chat (by conversationId, or latest chat in projectPath) turn by turn and step by step: per-model breakdown, orchestrator model switches, tools, skills, token/cache growth, and active vs idle time.",
      inputSchema: {
        conversationId: external_exports.string().optional(),
        projectPath: external_exports.string().optional()
      }
    },
    async ({ conversationId, projectPath }) => {
      await scanNow();
      let targetId = conversationId;
      if (!targetId) {
        let dash = buildDashboardData(ctx.db);
        targetId = (projectPath ? dash.recentChats.filter((c) => sameLocalPath(c.projectPath, projectPath)) : dash.recentChats)[0]?.conversationId;
      }
      if (!targetId)
        return {
          content: [{ type: "text", text: "No matching conversation found." }]
        };
      let detail = buildConversationDetail(ctx.db, targetId);
      if (!detail)
        return {
          content: [
            { type: "text", text: `Conversation not found: ${targetId}` }
          ]
        };
      let s = detail.summary, totalTok = s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens, turnLines = detail.turns.map(
        (t) => `  - Turn ${t.turnIndex + 1}${t.slashCommand ? ` (${t.slashCommand})` : ""}: "${t.promptPreview}" \u2014 ${fmtDur(t.activeMs)} active (${fmtDur(t.modelMs)} model, ${fmtDur(t.toolWallMs)} tools)${t.userIdleBeforeMs > 0 ? `, ${fmtDur(t.userIdleBeforeMs)} idle before` : ""}, ${s.tokens.hasTokenTelemetry ? `${fmtK(t.inputTokens)} new / ${fmtK(t.cacheReadTokens)} cache (${Math.round(t.cacheHitRatio * 100)}% hit)` : "N/A (legacy)"}`
      ), stepLines = detail.plannerSteps.slice(0, 30).map(
        (p) => `  - Step ${p.stepIndex} (${p.model}): ${s.tokens.hasTokenTelemetry ? `${fmtK(p.inputTokens)} in, ${fmtK(p.cacheReadTokens)} cache (${Math.round(p.cacheHitRatio * 100)}%), ${fmtK(p.outputTokens)} out` : "N/A (legacy)"}, ${fmtDur(p.modelDurationMs)}${p.isCacheMiss ? ` [CACHE MISS: ${p.cacheMissCause}]` : ""} \u2014 ${p.attributedSummary}`
      ), switchLines = detail.modelSwitches.slice(0, 20).map(
        (sw) => `  - Step ${sw.stepIndex} (Turn ${sw.turnIndex + 1}): \`${sw.fromModel}\` \u2192 \`${sw.toModel}\` \u2014 ${sw.trigger}${sw.isCacheMiss ? ` [CACHE MISS, +${fmtK(sw.inputTokensAfter)} uncached]` : ""}`
      ), isSwarmCoordinator = s.swarmRole === "coordinator", isSwarmWorker = s.swarmRole === "worker" || s.subagentType === "swarm", hasSwarmWorkers = detail.subagents.some(
        (sub) => sub.swarmRole === "worker" || sub.subagentType === "swarm"
      ), isSwarmParent = isSwarmCoordinator || hasSwarmWorkers, subagentLines = detail.subagents.slice(0, 20).map((sub) => {
        let subTok = sub.tokens.inputTokens + sub.tokens.cacheReadTokens + sub.tokens.outputTokens, subLabel = sub.subagentRole || (sub.subagentType === "swarm" ? "worker" : sub.subagentType) || sub.title, subModels = fmtModelMix(sub.modelBreakdown, 3), tokPart = sub.tokens.hasTokenTelemetry ? fmtK(subTok) : "N/A (legacy)", swarmTag = sub.swarmRole === "worker" || sub.subagentType === "swarm" ? " `[swarm]`" : "", taskDesc = sub.subagentRole ? detail.swarmTasks?.[sub.subagentRole] : void 0, taskPart = taskDesc ? ` \u2014 ${taskDesc}` : "";
        return `  - **${subLabel}**${swarmTag} (\`${sub.conversationId.slice(0, 8)}\`): ${subModels} \xB7 ${tokPart} tok \xB7 ${fmtDur(sub.time.activeMs)}${taskPart}`;
      }), modeLine = isSwarmCoordinator ? `- **Mode**: Swarm coordinator${s.swarmTitle ? ` ("${s.swarmTitle}")` : ""}` : isSwarmWorker ? `- **Mode**: Swarm worker (${s.subagentRole ?? "worker"}${s.parentConversationId ? `, parent \`${s.parentConversationId.slice(0, 8)}\`` : ""})` : null, combinedSwarmLines = [];
      if (isSwarmParent && detail.subagents.length > 0 && detail.combinedTokens) {
        let cTok = detail.combinedTokens.inputTokens + detail.combinedTokens.cacheReadTokens + detail.combinedTokens.outputTokens;
        combinedSwarmLines.push(
          `- **Combined Swarm Totals (Coordinator + ${detail.subagents.length} workers)**: ${detail.combinedTokens.hasTokenTelemetry ? `${fmtK(cTok)} tokens (${Math.round(detail.combinedTokens.cacheHitRatio * 100)}% cache)` : "N/A (legacy)"} \xB7 ${fmtCost(detail.combinedTokens.estimatedCostUsd, detail.combinedTokens.unpricedModels)} \xB7 ${fmtDur(detail.scopeActiveMs ?? s.time.activeMs)} merged active time`
        );
      }
      return {
        content: [{ type: "text", text: [
          `# Chat: ${s.title} (\`${s.conversationId}\`)`,
          `- **Project**: ${s.projectName} (\`${s.projectPath}\`, source: ${s.projectSource})`,
          ...modeLine ? [modeLine] : [],
          ...combinedSwarmLines,
          `- **Model Mix**: ${fmtModelMix(s.modelBreakdown, 6)}`,
          "- **Model Breakdown**:",
          ...fmtModelBreakdownLines(s.modelBreakdown, !1),
          ...detail.subagents.length > 0 ? [
            `- **Combined Model Mix (${isSwarmParent ? "Coordinator" : "Parent"} + ${detail.subagents.length} ${isSwarmParent ? "workers" : "subagents"})**: ${fmtModelMix(detail.combinedModelBreakdown ?? s.modelBreakdown, 6)}`,
            ...(detail.subagentModelBreakdown?.length ?? 0) > 0 ? [
              `- **${isSwarmParent ? "Swarm Worker" : "Subagent"} Model Breakdown**:`,
              ...fmtModelBreakdownLines(detail.subagentModelBreakdown, !0)
            ] : [],
            `- **${isSwarmParent ? "Swarm Workers" : "Spawned Subagents"} (${detail.subagents.length})**:`,
            ...subagentLines
          ] : [],
          ...detail.pluginSkillMetrics.length > 0 ? [
            "- **Most Token-Hungry Plugins & Skills**:",
            ...fmtPluginSkillLines(detail.pluginSkillMetrics, !1)
          ] : [],
          ...detail.modelSwitches.length > 0 ? [`- **Model Switches (${detail.modelSwitches.length})**:`, ...switchLines] : [],
          `- **Tokens**: ${s.tokens.hasTokenTelemetry ? `${fmtK(totalTok)} total, peak context ${fmtK(s.tokens.peakContextTokens)}, ${Math.round(s.tokens.cacheHitRatio * 100)}% cache hit` : "N/A (legacy transcript without token counters)"}`,
          `- **Estimated Cost**: ${fmtCost(s.tokens.estimatedCostUsd, s.tokens.unpricedModels)}`,
          `- **Time**: ${fmtDur(s.time.activeMs)} active (${fmtDur(s.time.modelMs)} model, ${fmtDur(s.time.toolWallMs)} tool wall @ ${s.time.parallelismFactor}x parallel, ${fmtDur(s.time.subagentMs)} subagents) \xB7 ${fmtDur(s.time.userIdleMs)} user idle`,
          `- **Turns (${detail.turns.length})**:`,
          ...turnLines,
          `- **Planner Steps (${detail.plannerSteps.length})**:`,
          ...stepLines
        ].join(`
`) }],
        structuredContent: {
          summary: detail.summary,
          turns: detail.turns,
          plannerSteps: detail.plannerSteps.slice(0, 60),
          modelSwitches: detail.modelSwitches,
          combinedModelBreakdown: detail.combinedModelBreakdown,
          subagentModelBreakdown: detail.subagentModelBreakdown,
          pluginSkillMetrics: detail.pluginSkillMetrics,
          skillToolMetrics: detail.skillToolMetrics.slice(0, 30),
          diagnostics: detail.diagnostics,
          subagents: detail.subagents,
          ...detail.swarmTasks ? { swarmTasks: detail.swarmTasks } : {},
          ...detail.combinedTokens ? { combinedTokens: detail.combinedTokens } : {}
        }
      };
    }
  ), server.registerTool(
    "explain_bottlenecks",
    {
      title: "Explain Token & Time Bottlenecks",
      description: "Explain why tokens spiked (direct + compounded cache carry + cache misses) and where time went across a chat or project, citing exact steps and tools.",
      inputSchema: {
        conversationId: external_exports.string().optional(),
        projectPath: external_exports.string().optional(),
        focus: external_exports.enum(["all", "tokens", "time"]).optional()
      }
    },
    async ({ conversationId, projectPath, focus }) => {
      await scanNow();
      let mode = focus ?? "all", diagnostics = [], scopeLabel = "";
      if (conversationId) {
        let chat = buildConversationDetail(ctx.db, conversationId);
        if (!chat)
          return {
            content: [{ type: "text", text: `Conversation not found: ${conversationId}` }]
          };
        diagnostics = chat.diagnostics, scopeLabel = `Chat "${chat.summary.title}" (${conversationId})`;
      } else {
        let resolved = resolveProjectMatch(ctx.db, projectPath);
        if (!resolved)
          return {
            content: [{ type: "text", text: "No tracked conversations or projects found." }]
          };
        let proj = buildProjectDetail(ctx.db, resolved);
        if (!proj)
          return {
            content: [{ type: "text", text: `Project not found: ${resolved}` }]
          };
        diagnostics = proj.diagnostics, scopeLabel = `Project ${proj.summary.projectName}`;
      }
      let filtered = diagnostics.filter((d) => mode === "tokens" ? d.category === "token_driver" || d.category === "cache_miss" || d.category === "repeated_read" || d.category === "model_split" || d.category === "unused_skill" || d.category === "high_skill_overhead" || d.category === "tool_thrash" || d.category === "subagent_candidate" || d.category === "compaction_cliff" : mode === "time" ? d.category === "slow_step" || d.category === "error_retry" || d.category === "tool_thrash" : !0), lines = filtered.map(
        (d, idx) => `${idx + 1}. **[${d.severity.toUpperCase()}] ${d.title}** (${d.citation}) \u2014 ${d.detail}`
      );
      return {
        content: [
          {
            type: "text",
            text: lines.length > 0 ? `# Bottleneck Diagnosis for ${scopeLabel}
${lines.join(`
`)}` : `No notable token or timing bottlenecks found for ${scopeLabel}.`
          }
        ],
        structuredContent: {
          scope: scopeLabel,
          focus: mode,
          findings: filtered
        }
      };
    }
  ), server.registerTool(
    "get_skill_optimization",
    {
      title: "Get Skill & Plugin Optimization Analysis",
      description: "Inspect parent plugins and skills (or drill down into a specific plugin/skill) across a chat, project, or all projects\u2014showing share of total spend, share of active time, instruction markdown carry vs. tool execution tokens, child sub-skills/tools, file paths, and optimization prescriptions.",
      inputSchema: {
        pluginOrSkill: external_exports.string().optional().describe("Optional parent plugin or skill name/id to filter and drill into."),
        projectPath: external_exports.string().optional().describe("Optional project workspace path or name."),
        conversationId: external_exports.string().optional().describe("Optional conversation UUID for single-chat (+ subagents) analysis.")
      }
    },
    async ({ pluginOrSkill, projectPath, conversationId }) => {
      await scanNow();
      let scopeLabel = "All Projects", totalActiveMs = 0, totalEstimatedCostUsd = null, metrics = [], diagnostics = [];
      if (conversationId) {
        let chat = buildConversationDetail(ctx.db, conversationId);
        if (!chat)
          return {
            content: [{ type: "text", text: `Conversation not found: ${conversationId}` }]
          };
        let subCostSum = chat.subagents.reduce(
          (acc, sub) => acc + (sub.tokens.estimatedCostUsd ?? 0),
          0
        ), anyCost = chat.summary.tokens.estimatedCostUsd !== null || chat.subagents.some((s) => s.tokens.estimatedCostUsd !== null);
        scopeLabel = `Chat "${chat.summary.title}" (${conversationId})${chat.subagents.length > 0 ? ` + ${chat.subagents.length} subagent(s)` : ""}`, totalActiveMs = chat.scopeActiveMs ?? chat.summary.time.activeMs, totalEstimatedCostUsd = anyCost ? (chat.summary.tokens.estimatedCostUsd ?? 0) + subCostSum : null, metrics = chat.pluginSkillMetrics, diagnostics = chat.diagnostics;
      } else if (projectPath) {
        let resolved = resolveProjectMatch(ctx.db, projectPath);
        if (!resolved)
          return {
            content: [{ type: "text", text: `Project not found: ${projectPath}` }]
          };
        let proj = buildProjectDetail(ctx.db, resolved);
        if (!proj)
          return {
            content: [{ type: "text", text: `Project not found: ${resolved}` }]
          };
        scopeLabel = `Project ${proj.summary.projectName} (${proj.summary.projectPath})`, totalActiveMs = proj.summary.time.activeMs, totalEstimatedCostUsd = proj.summary.tokens.estimatedCostUsd, metrics = proj.pluginSkillMetrics, diagnostics = proj.diagnostics;
      } else {
        let dash = buildDashboardData(ctx.db);
        totalActiveMs = dash.totals.time.activeMs, totalEstimatedCostUsd = dash.totals.tokens.estimatedCostUsd, metrics = dash.pluginSkillMetrics;
      }
      let needle = (pluginOrSkill || "").trim().toLowerCase(), matched = needle ? metrics.filter(
        (m) => m.name.toLowerCase().includes(needle) || m.id.toLowerCase().includes(needle) || m.children.some((ch) => ch.name.toLowerCase().includes(needle))
      ) : metrics, relatedDiagnostics = diagnostics.filter(
        (d) => d.category === "unused_skill" || d.category === "high_skill_overhead" || d.category === "tool_thrash" || d.category === "subagent_candidate" || d.category === "compaction_cliff" || needle && d.title.toLowerCase().includes(needle)
      );
      if (matched.length === 0)
        return {
          content: [
            {
              type: "text",
              text: needle ? `No plugin or skill matching "${pluginOrSkill}" found in ${scopeLabel}.` : `No plugin or skill activity recorded in ${scopeLabel}.`
            }
          ],
          structuredContent: {
            scope: scopeLabel,
            totalActiveMs,
            totalEstimatedCostUsd,
            items: [],
            relatedDiagnostics
          }
        };
      let blocks = matched.slice(0, 10).map((m, idx) => {
        let spendStr = m.drivenCostUsd !== null ? `${m.costShare !== null ? `${Math.round(m.costShare * 100)}% of spend ` : ""}($$${m.drivenCostUsd.toFixed(m.drivenCostUsd < 0.1 ? 4 : 2)} est.)`.replace("$$", "$") : "Unpriced", childLines = m.children.slice(0, 12).map((ch) => {
          let chCost = ch.drivenCostUsd !== null ? ` \xB7 $$${ch.drivenCostUsd.toFixed(ch.drivenCostUsd < 0.1 ? 4 : 2)}`.replace("$$", "$") : "", flags = [
            ch.errors > 0 ? `${ch.errors} err` : "",
            ch.isUnusedLoad ? "UNUSED LOAD" : "",
            ch.duplicateReads > 0 ? `${ch.duplicateReads}\xD7 dup read` : ""
          ].filter(Boolean).join(", ");
          return `    - [${ch.kind}] \`${ch.name}\`: ${fmtDur(ch.drivenActiveMs)}${chCost} \xB7 +${fmtK(ch.instructionTokens)} instr / +${fmtK(ch.executionTokens)} exec \xB7 ${ch.calls} calls${flags ? ` [${flags}]` : ""}`;
        }), errSamplesNote = m.errorSamples && m.errorSamples.length > 0 ? m.errorSamples.slice(0, 3).map(
          (s) => `\`${s.toolName}\`${s.target ? ` (${s.target})` : ""}: ${s.message}${s.count > 1 ? ` (${s.count}\xD7)` : ""}`
        ).join(" | ") : "Inspect child tools or chat waterfall for details.";
        return [
          `## ${idx + 1}. [${m.kind}] ${m.name}`,
          `- **Driven Spend**: ${spendStr}`,
          `- **Driven Active Time**: ${Math.round(m.timeShare * 100)}% of scope (${fmtDur(m.drivenActiveMs)}; raw tool calls: ${fmtDur(m.totalDurationMs)})`,
          `- **Context Footprint**: +${fmtK(m.totalTokens)} tokens (${Math.round(m.tokenShare * 100)}% of context reads \u2014 +${fmtK(m.instructionTokens)} instruction / +${fmtK(m.executionTokens)} execution)`,
          ...m.targetPaths.length > 0 ? [`- **Skill / Target Paths**: ${m.targetPaths.map((p) => `\`${p}\``).join(", ")}`] : [],
          ...m.errors > 0 ? [`- **Errors (${m.errors})**: ${errSamplesNote}`] : [],
          ...m.prescription ? [`- **Prescription**: ${m.prescription}`] : [],
          `- **Breakdown (${m.children.length})**:`,
          ...childLines
        ].join(`
`);
      });
      return {
        content: [
          {
            type: "text",
            text: `# Skill & Plugin Optimization (${scopeLabel})

${blocks.join(`

`)}`
          }
        ],
        structuredContent: {
          scope: scopeLabel,
          totalActiveMs,
          totalEstimatedCostUsd,
          items: matched,
          relatedDiagnostics
        }
      };
    }
  ), server;
}

// src/server/index.ts
async function main() {
  let pluginRoot = path7.resolve(import.meta.dirname, "..", ".."), dataDir = resolveDataDir({
    argv: process.argv.slice(2),
    pluginRoot,
    preferSharedPluginData: !1
  }), db = new TrackerDatabase(dataDir), server = createTrackerMcpServer({
    db,
    dataDir,
    pluginRoot
  }), transport = new StdioServerTransport();
  await server.connect(transport), runScan({ db, dataDir }).catch((err) => {
    process.stderr.write(
      `[flight-recorder] initial scan warning: ${err instanceof Error ? err.message : String(err)}
`
    );
  });
  let shutdown = () => {
    try {
      db.close();
    } catch {
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown), process.on("SIGTERM", shutdown);
}
main().catch((err) => {
  process.stderr.write(
    `[flight-recorder] fatal error: ${err instanceof Error ? err.stack ?? err.message : String(err)}
`
  ), process.exit(1);
});
