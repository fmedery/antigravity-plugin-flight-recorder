/* flight-recorder v0.5.0 */
import { createRequire as __frCreateRequire } from "node:module"; const require = __frCreateRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
};

// src/server/sidecar.ts
import crypto2 from "node:crypto";
import http from "node:http";
import net from "node:net";
import os5 from "node:os";
import path8 from "node:path";
import { pathToFileURL } from "node:url";

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
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
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever, util2.arrayToEnum = (items) => {
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
  }), util2.objectKeys = typeof Object.keys == "function" ? (obj) => Object.keys(obj) : (object) => {
    let keys = [];
    for (let key in object)
      Object.prototype.hasOwnProperty.call(object, key) && keys.push(key);
    return keys;
  }, util2.find = (arr, checker) => {
    for (let item of arr)
      if (checker(item))
        return item;
  }, util2.isInteger = typeof Number.isInteger == "function" ? (val) => Number.isInteger(val) : (val) => typeof val == "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val == "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues, util2.jsonStringifyReplacer = (_, value) => typeof value == "bigint" ? value.toString() : value;
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
]), getParsedType = (data) => {
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
]), quotelessJson = (obj) => JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, "$1:"), ZodError = class _ZodError extends Error {
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
    let mapper = _mapper || function(issue) {
      return issue.message;
    }, fieldErrors = { _errors: [] }, processError = (error) => {
      for (let issue of error.issues)
        if (issue.code === "invalid_union")
          issue.unionErrors.map(processError);
        else if (issue.code === "invalid_return_type")
          processError(issue.returnTypeError);
        else if (issue.code === "invalid_arguments")
          processError(issue.argumentsError);
        else if (issue.path.length === 0)
          fieldErrors._errors.push(mapper(issue));
        else {
          let curr = fieldErrors, i = 0;
          for (; i < issue.path.length; ) {
            let el = issue.path[i];
            i === issue.path.length - 1 ? (curr[el] = curr[el] || { _errors: [] }, curr[el]._errors.push(mapper(issue))) : curr[el] = curr[el] || { _errors: [] }, curr = curr[el], i++;
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
  flatten(mapper = (issue) => issue.message) {
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
ZodError.create = (issues) => new ZodError(issues);

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      issue.received === ZodParsedType.undefined ? message = "Required" : message = `Expected ${issue.expected}, received ${issue.received}`;
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = "Invalid input";
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
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
      typeof issue.validation == "object" ? "includes" in issue.validation ? (message = `Invalid input: must include "${issue.validation.includes}"`, typeof issue.validation.position == "number" && (message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`)) : "startsWith" in issue.validation ? message = `Invalid input: must start with "${issue.validation.startsWith}"` : "endsWith" in issue.validation ? message = `Invalid input: must end with "${issue.validation.endsWith}"` : util.assertNever(issue.validation) : issue.validation !== "regex" ? message = `Invalid ${issue.validation}` : message = "Invalid";
      break;
    case ZodIssueCode.too_small:
      issue.type === "array" ? message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "more than"} ${issue.minimum} element(s)` : issue.type === "string" ? message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "over"} ${issue.minimum} character(s)` : issue.type === "number" ? message = `Number must be ${issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than "}${issue.minimum}` : issue.type === "bigint" ? message = `Number must be ${issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than "}${issue.minimum}` : issue.type === "date" ? message = `Date must be ${issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(issue.minimum))}` : message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      issue.type === "array" ? message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "less than"} ${issue.maximum} element(s)` : issue.type === "string" ? message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "under"} ${issue.maximum} character(s)` : issue.type === "number" ? message = `Number must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ${issue.maximum}` : issue.type === "bigint" ? message = `BigInt must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ${issue.maximum}` : issue.type === "date" ? message = `Date must be ${issue.exact ? "exactly" : issue.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(issue.maximum))}` : message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = "Invalid input";
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = "Intersection results could not be merged";
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError, util.assertNever(issue);
  }
  return { message };
}, en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  let { data, path: path9, errorMaps, issueData } = params, fullPath = [...path9, ...issueData.path || []], fullIssue = {
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
  let overrideMap = getErrorMap(), issue = makeIssue({
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
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
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
  constructor(parent, value, path9, key) {
    this._cachedPath = [], this.parent = parent, this.data = value, this._path = path9, this._key = key;
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
      let error = new ZodError(ctx.common.issues);
      return this._error = error, this._error;
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
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
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
        parsedType: getParsedType(input.data),
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
      parsedType: getParsedType(data)
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
      parsedType: getParsedType(data)
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
      parsedType: getParsedType(data)
    }, maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx }), result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    let getIssueProperties = (val) => typeof message == "string" || typeof message > "u" ? { message } : typeof message == "function" ? message(val) : message;
    return this._refinement((val, ctx) => {
      let result = check(val), setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      return typeof Promise < "u" && result instanceof Promise ? result.then((data) => data ? !0 : (setError(), !1)) : result ? !0 : (setError(), !1);
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => check(val) ? !0 : (ctx.addIssue(typeof refinementData == "function" ? refinementData(val, ctx) : refinementData), !1));
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
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    let defaultValueFunc = typeof def == "function" ? def : () => def;
    return new ZodDefault({
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
    return new ZodCatch({
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
    return ZodReadonly.create(this);
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
function isValidIP(ip, version) {
  return !!((version === "v4" || !version) && ipv4Regex.test(ip) || (version === "v6" || !version) && ipv6Regex.test(ip));
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return !1;
  try {
    let [header] = jwt.split(".");
    if (!header)
      return !1;
    let base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "="), decoded = JSON.parse(atob(base64));
    return !(typeof decoded != "object" || decoded === null || "typ" in decoded && decoded?.typ !== "JWT" || !decoded.alg || alg && decoded.alg !== alg);
  } catch {
    return !1;
  }
}
function isValidCidr(ip, version) {
  return !!((version === "v4" || !version) && ipv4CidrRegex.test(ip) || (version === "v6" || !version) && ipv6CidrRegex.test(ip));
}
var ZodString = class _ZodString extends ZodType {
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
    for (let check of this._def.checks)
      if (check.kind === "min")
        input.data.length < check.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: check.message
        }), status.dirty());
      else if (check.kind === "max")
        input.data.length > check.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: check.message
        }), status.dirty());
      else if (check.kind === "length") {
        let tooBig = input.data.length > check.value, tooSmall = input.data.length < check.value;
        (tooBig || tooSmall) && (ctx = this._getOrReturnCtx(input, ctx), tooBig ? addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: check.message
        }) : tooSmall && addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: check.message
        }), status.dirty());
      } else if (check.kind === "email")
        emailRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "email",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      else if (check.kind === "emoji")
        emojiRegex || (emojiRegex = new RegExp(_emojiRegex, "u")), emojiRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "emoji",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      else if (check.kind === "uuid")
        uuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "uuid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      else if (check.kind === "nanoid")
        nanoidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "nanoid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      else if (check.kind === "cuid")
        cuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "cuid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      else if (check.kind === "cuid2")
        cuid2Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "cuid2",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      else if (check.kind === "ulid")
        ulidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "ulid",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      else if (check.kind === "url")
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          }), status.dirty();
        }
      else check.kind === "regex" ? (check.regex.lastIndex = 0, check.regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "regex",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty())) : check.kind === "trim" ? input.data = input.data.trim() : check.kind === "includes" ? input.data.includes(check.value, check.position) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: { includes: check.value, position: check.position },
        message: check.message
      }), status.dirty()) : check.kind === "toLowerCase" ? input.data = input.data.toLowerCase() : check.kind === "toUpperCase" ? input.data = input.data.toUpperCase() : check.kind === "startsWith" ? input.data.startsWith(check.value) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: { startsWith: check.value },
        message: check.message
      }), status.dirty()) : check.kind === "endsWith" ? input.data.endsWith(check.value) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: { endsWith: check.value },
        message: check.message
      }), status.dirty()) : check.kind === "datetime" ? datetimeRegex(check).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: "datetime",
        message: check.message
      }), status.dirty()) : check.kind === "date" ? dateRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: "date",
        message: check.message
      }), status.dirty()) : check.kind === "time" ? timeRegex(check).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: "time",
        message: check.message
      }), status.dirty()) : check.kind === "duration" ? durationRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "duration",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()) : check.kind === "ip" ? isValidIP(input.data, check.version) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "ip",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()) : check.kind === "jwt" ? isValidJWT(input.data, check.alg) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "jwt",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()) : check.kind === "cidr" ? isValidCidr(input.data, check.version) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "cidr",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()) : check.kind === "base64" ? base64Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "base64",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()) : check.kind === "base64url" ? base64urlRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "base64url",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()) : util.assertNever(check);
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
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
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
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
ZodString.create = (params) => new ZodString({
  checks: [],
  typeName: ZodFirstPartyTypeKind.ZodString,
  coerce: params?.coerce ?? !1,
  ...processCreateParams(params)
});
function floatSafeRemainder(val, step) {
  let valDecCount = (val.toString().split(".")[1] || "").length, stepDecCount = (step.toString().split(".")[1] || "").length, decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount, valInt = Number.parseInt(val.toFixed(decCount).replace(".", "")), stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
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
    for (let check of this._def.checks)
      check.kind === "int" ? util.isInteger(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: "integer",
        received: "float",
        message: check.message
      }), status.dirty()) : check.kind === "min" ? (check.inclusive ? input.data < check.value : input.data <= check.value) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: check.value,
        type: "number",
        inclusive: check.inclusive,
        exact: !1,
        message: check.message
      }), status.dirty()) : check.kind === "max" ? (check.inclusive ? input.data > check.value : input.data >= check.value) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: check.value,
        type: "number",
        inclusive: check.inclusive,
        exact: !1,
        message: check.message
      }), status.dirty()) : check.kind === "multipleOf" ? floatSafeRemainder(input.data, check.value) !== 0 && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.not_multiple_of,
        multipleOf: check.value,
        message: check.message
      }), status.dirty()) : check.kind === "finite" ? Number.isFinite(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.not_finite,
        message: check.message
      }), status.dirty()) : util.assertNever(check);
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
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
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
ZodNumber.create = (params) => new ZodNumber({
  checks: [],
  typeName: ZodFirstPartyTypeKind.ZodNumber,
  coerce: params?.coerce || !1,
  ...processCreateParams(params)
});
var ZodBigInt = class _ZodBigInt extends ZodType {
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
    for (let check of this._def.checks)
      check.kind === "min" ? (check.inclusive ? input.data < check.value : input.data <= check.value) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        type: "bigint",
        minimum: check.value,
        inclusive: check.inclusive,
        message: check.message
      }), status.dirty()) : check.kind === "max" ? (check.inclusive ? input.data > check.value : input.data >= check.value) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        type: "bigint",
        maximum: check.value,
        inclusive: check.inclusive,
        message: check.message
      }), status.dirty()) : check.kind === "multipleOf" ? input.data % check.value !== BigInt(0) && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.not_multiple_of,
        multipleOf: check.value,
        message: check.message
      }), status.dirty()) : util.assertNever(check);
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
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
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
var ZodBoolean = class extends ZodType {
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
ZodBoolean.create = (params) => new ZodBoolean({
  typeName: ZodFirstPartyTypeKind.ZodBoolean,
  coerce: params?.coerce || !1,
  ...processCreateParams(params)
});
var ZodDate = class _ZodDate extends ZodType {
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
    for (let check of this._def.checks)
      check.kind === "min" ? input.data.getTime() < check.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        message: check.message,
        inclusive: !0,
        exact: !1,
        minimum: check.value,
        type: "date"
      }), status.dirty()) : check.kind === "max" ? input.data.getTime() > check.value && (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        message: check.message,
        inclusive: !0,
        exact: !1,
        maximum: check.value,
        type: "date"
      }), status.dirty()) : util.assertNever(check);
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
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
var ZodSymbol = class extends ZodType {
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
var ZodUndefined = class extends ZodType {
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
var ZodNull = class extends ZodType {
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
ZodNull.create = (params) => new ZodNull({
  typeName: ZodFirstPartyTypeKind.ZodNull,
  ...processCreateParams(params)
});
var ZodAny = class extends ZodType {
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
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => new ZodUnknown({
  typeName: ZodFirstPartyTypeKind.ZodUnknown,
  ...processCreateParams(params)
});
var ZodNever = class extends ZodType {
  _parse(input) {
    let ctx = this._getOrReturnCtx(input);
    return addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    }), INVALID;
  }
};
ZodNever.create = (params) => new ZodNever({
  typeName: ZodFirstPartyTypeKind.ZodNever,
  ...processCreateParams(params)
});
var ZodVoid = class extends ZodType {
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
var ZodArray = class _ZodArray extends ZodType {
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
ZodArray.create = (schema, params) => new ZodArray({
  type: schema,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: ZodFirstPartyTypeKind.ZodArray,
  ...processCreateParams(params)
});
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    let newShape = {};
    for (let key in schema.shape) {
      let fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else return schema instanceof ZodArray ? new ZodArray({
    ...schema._def,
    type: deepPartialify(schema.element)
  }) : schema instanceof ZodOptional ? ZodOptional.create(deepPartialify(schema.unwrap())) : schema instanceof ZodNullable ? ZodNullable.create(deepPartialify(schema.unwrap())) : schema instanceof ZodTuple ? ZodTuple.create(schema.items.map((item) => deepPartialify(item))) : schema;
}
var ZodObject = class _ZodObject extends ZodType {
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
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip"))
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
    if (this._def.catchall instanceof ZodNever) {
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
        errorMap: (issue, ctx) => {
          let defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          return issue.code === "unrecognized_keys" ? {
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
        for (; newField instanceof ZodOptional; )
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
ZodObject.create = (shape, params) => new ZodObject({
  shape: () => shape,
  unknownKeys: "strip",
  catchall: ZodNever.create(),
  typeName: ZodFirstPartyTypeKind.ZodObject,
  ...processCreateParams(params)
});
ZodObject.strictCreate = (shape, params) => new ZodObject({
  shape: () => shape,
  unknownKeys: "strict",
  catchall: ZodNever.create(),
  typeName: ZodFirstPartyTypeKind.ZodObject,
  ...processCreateParams(params)
});
ZodObject.lazycreate = (shape, params) => new ZodObject({
  shape,
  unknownKeys: "strip",
  catchall: ZodNever.create(),
  typeName: ZodFirstPartyTypeKind.ZodObject,
  ...processCreateParams(params)
});
var ZodUnion = class extends ZodType {
  _parse(input) {
    let { ctx } = this._processInputParams(input), options = this._def.options;
    function handleResults(results) {
      for (let result of results)
        if (result.result.status === "valid")
          return result.result;
      for (let result of results)
        if (result.result.status === "dirty")
          return ctx.common.issues.push(...result.ctx.common.issues), result.result;
      let unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
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
      let unionErrors = issues.map((issues2) => new ZodError(issues2));
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
ZodUnion.create = (types, params) => new ZodUnion({
  options: types,
  typeName: ZodFirstPartyTypeKind.ZodUnion,
  ...processCreateParams(params)
});
var getDiscriminator = (type) => type instanceof ZodLazy ? getDiscriminator(type.schema) : type instanceof ZodEffects ? getDiscriminator(type.innerType()) : type instanceof ZodLiteral ? [type.value] : type instanceof ZodEnum ? type.options : type instanceof ZodNativeEnum ? util.objectValues(type.enum) : type instanceof ZodDefault ? getDiscriminator(type._def.innerType) : type instanceof ZodUndefined ? [void 0] : type instanceof ZodNull ? [null] : type instanceof ZodOptional ? [void 0, ...getDiscriminator(type.unwrap())] : type instanceof ZodNullable ? [null, ...getDiscriminator(type.unwrap())] : type instanceof ZodBranded || type instanceof ZodReadonly ? getDiscriminator(type.unwrap()) : type instanceof ZodCatch ? getDiscriminator(type._def.innerType) : [], ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
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
function mergeValues(a, b) {
  let aType = getParsedType(a), bType = getParsedType(b);
  if (a === b)
    return { valid: !0, data: a };
  if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    let bKeys = util.objectKeys(b), sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1), newObj = { ...a, ...b };
    for (let key of sharedKeys) {
      let sharedValue = mergeValues(a[key], b[key]);
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
      let itemA = a[index], itemB = b[index], sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid)
        return { valid: !1 };
      newArray.push(sharedValue.data);
    }
    return { valid: !0, data: newArray };
  } else return aType === ZodParsedType.date && bType === ZodParsedType.date && +a == +b ? { valid: !0, data: a } : { valid: !1 };
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    let { status, ctx } = this._processInputParams(input), handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight))
        return INVALID;
      let merged = mergeValues(parsedLeft.value, parsedRight.value);
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
ZodIntersection.create = (left, right, params) => new ZodIntersection({
  left,
  right,
  typeName: ZodFirstPartyTypeKind.ZodIntersection,
  ...processCreateParams(params)
});
var ZodTuple = class _ZodTuple extends ZodType {
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
var ZodRecord = class _ZodRecord extends ZodType {
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
    return second instanceof ZodType ? new _ZodRecord({
      keyType: first,
      valueType: second,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(third)
    }) : new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}, ZodMap = class extends ZodType {
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
var ZodSet = class _ZodSet extends ZodType {
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
var ZodFunction = class _ZodFunction extends ZodType {
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
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    let params = { errorMap: ctx.common.contextualErrorMap }, fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      let me = this;
      return OK(async function(...args) {
        let error = new ZodError([]), parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          throw error.addIssue(makeArgsIssue(args, e)), error;
        }), result = await Reflect.apply(fn, this, parsedArgs);
        return await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          throw error.addIssue(makeReturnsIssue(result, e)), error;
        });
      });
    } else {
      let me = this;
      return OK(function(...args) {
        let parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success)
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        let result = Reflect.apply(fn, this, parsedArgs.data), parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success)
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
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
      args: ZodTuple.create(items).rest(ZodUnknown.create())
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
      args: args || ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}, ZodLazy = class extends ZodType {
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
var ZodLiteral = class extends ZodType {
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
ZodLiteral.create = (value, params) => new ZodLiteral({
  value,
  typeName: ZodFirstPartyTypeKind.ZodLiteral,
  ...processCreateParams(params)
});
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
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
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
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
var ZodPromise = class extends ZodType {
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
var ZodEffects = class extends ZodType {
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
ZodEffects.createWithPreprocess = (preprocess, schema, params) => new ZodEffects({
  schema,
  effect: { type: "preprocess", transform: preprocess },
  typeName: ZodFirstPartyTypeKind.ZodEffects,
  ...processCreateParams(params)
});
var ZodOptional = class extends ZodType {
  _parse(input) {
    return this._getType(input) === ZodParsedType.undefined ? OK(void 0) : this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => new ZodOptional({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodOptional,
  ...processCreateParams(params)
});
var ZodNullable = class extends ZodType {
  _parse(input) {
    return this._getType(input) === ZodParsedType.null ? OK(null) : this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => new ZodNullable({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodNullable,
  ...processCreateParams(params)
});
var ZodDefault = class extends ZodType {
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
ZodDefault.create = (type, params) => new ZodDefault({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodDefault,
  defaultValue: typeof params.default == "function" ? params.default : () => params.default,
  ...processCreateParams(params)
});
var ZodCatch = class extends ZodType {
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
          return new ZodError(newCtx.common.issues);
        },
        input: newCtx.data
      })
    })) : {
      status: "valid",
      value: result.status === "valid" ? result.value : this._def.catchValue({
        get error() {
          return new ZodError(newCtx.common.issues);
        },
        input: newCtx.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => new ZodCatch({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodCatch,
  catchValue: typeof params.catch == "function" ? params.catch : () => params.catch,
  ...processCreateParams(params)
});
var ZodNaN = class extends ZodType {
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
var BRAND = Symbol("zod_brand"), ZodBranded = class extends ZodType {
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
}, ZodPipeline = class _ZodPipeline extends ZodType {
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
}, ZodReadonly = class extends ZodType {
  _parse(input) {
    let result = this._def.innerType._parse(input), freeze = (data) => (isValid(data) && (data.value = Object.freeze(data.value)), data);
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => new ZodReadonly({
  innerType: type,
  typeName: ZodFirstPartyTypeKind.ZodReadonly,
  ...processCreateParams(params)
});
function cleanParams(params, data) {
  let p = typeof params == "function" ? params(data) : typeof params == "string" ? { message: params } : params;
  return typeof p == "string" ? { message: p } : p;
}
function custom(check, _params = {}, fatal) {
  return check ? ZodAny.create().superRefine((data, ctx) => {
    let r = check(data);
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
  object: ZodObject.lazycreate
}, ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2.ZodString = "ZodString", ZodFirstPartyTypeKind2.ZodNumber = "ZodNumber", ZodFirstPartyTypeKind2.ZodNaN = "ZodNaN", ZodFirstPartyTypeKind2.ZodBigInt = "ZodBigInt", ZodFirstPartyTypeKind2.ZodBoolean = "ZodBoolean", ZodFirstPartyTypeKind2.ZodDate = "ZodDate", ZodFirstPartyTypeKind2.ZodSymbol = "ZodSymbol", ZodFirstPartyTypeKind2.ZodUndefined = "ZodUndefined", ZodFirstPartyTypeKind2.ZodNull = "ZodNull", ZodFirstPartyTypeKind2.ZodAny = "ZodAny", ZodFirstPartyTypeKind2.ZodUnknown = "ZodUnknown", ZodFirstPartyTypeKind2.ZodNever = "ZodNever", ZodFirstPartyTypeKind2.ZodVoid = "ZodVoid", ZodFirstPartyTypeKind2.ZodArray = "ZodArray", ZodFirstPartyTypeKind2.ZodObject = "ZodObject", ZodFirstPartyTypeKind2.ZodUnion = "ZodUnion", ZodFirstPartyTypeKind2.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", ZodFirstPartyTypeKind2.ZodIntersection = "ZodIntersection", ZodFirstPartyTypeKind2.ZodTuple = "ZodTuple", ZodFirstPartyTypeKind2.ZodRecord = "ZodRecord", ZodFirstPartyTypeKind2.ZodMap = "ZodMap", ZodFirstPartyTypeKind2.ZodSet = "ZodSet", ZodFirstPartyTypeKind2.ZodFunction = "ZodFunction", ZodFirstPartyTypeKind2.ZodLazy = "ZodLazy", ZodFirstPartyTypeKind2.ZodLiteral = "ZodLiteral", ZodFirstPartyTypeKind2.ZodEnum = "ZodEnum", ZodFirstPartyTypeKind2.ZodEffects = "ZodEffects", ZodFirstPartyTypeKind2.ZodNativeEnum = "ZodNativeEnum", ZodFirstPartyTypeKind2.ZodOptional = "ZodOptional", ZodFirstPartyTypeKind2.ZodNullable = "ZodNullable", ZodFirstPartyTypeKind2.ZodDefault = "ZodDefault", ZodFirstPartyTypeKind2.ZodCatch = "ZodCatch", ZodFirstPartyTypeKind2.ZodPromise = "ZodPromise", ZodFirstPartyTypeKind2.ZodBranded = "ZodBranded", ZodFirstPartyTypeKind2.ZodPipeline = "ZodPipeline", ZodFirstPartyTypeKind2.ZodReadonly = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params), stringType = ZodString.create, numberType = ZodNumber.create, nanType = ZodNaN.create, bigIntType = ZodBigInt.create, booleanType = ZodBoolean.create, dateType = ZodDate.create, symbolType = ZodSymbol.create, undefinedType = ZodUndefined.create, nullType = ZodNull.create, anyType = ZodAny.create, unknownType = ZodUnknown.create, neverType = ZodNever.create, voidType = ZodVoid.create, arrayType = ZodArray.create, objectType = ZodObject.create, strictObjectType = ZodObject.strictCreate, unionType = ZodUnion.create, discriminatedUnionType = ZodDiscriminatedUnion.create, intersectionType = ZodIntersection.create, tupleType = ZodTuple.create, recordType = ZodRecord.create, mapType = ZodMap.create, setType = ZodSet.create, functionType = ZodFunction.create, lazyType = ZodLazy.create, literalType = ZodLiteral.create, enumType = ZodEnum.create, nativeEnumType = ZodNativeEnum.create, promiseType = ZodPromise.create, effectsType = ZodEffects.create, optionalType = ZodOptional.create, nullableType = ZodNullable.create, preprocessType = ZodEffects.createWithPreprocess, pipelineType = ZodPipeline.create, ostring = () => stringType().optional(), onumber = () => numberType().optional(), oboolean = () => booleanType().optional(), coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: !0 })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: !0 })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: !0
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: !0 })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: !0 }))
};
var NEVER = INVALID;

// src/server/appService.ts
import fs7 from "node:fs";

// src/server/analytics.ts
import fs3 from "node:fs";
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

// src/server/transcriptParser.ts
import fs from "node:fs";
import readline from "node:readline";

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
    if (fs.existsSync(skillMdPath) && fs.statSync(skillMdPath).isFile()) {
      let content = fs.readFileSync(skillMdPath, "utf8");
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
        let uuid = m[1];
        !uuid || seen.has(uuid) || (seen.add(uuid), rawMatches.push({ uuid, line }));
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
      let uuid = m[1];
      !uuid || seen.has(uuid) || (seen.add(uuid), links.push({ conversationId: uuid, role: null, typeName: "run_workflow" }));
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
  }, stream = fs.createReadStream(transcriptPath, { encoding: "utf8" }), rl = readline.createInterface({ input: stream, crlfDelay: 1 / 0 });
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

// src/server/skillEfficiency.ts
import fs2 from "node:fs";
import os from "node:os";
import path from "node:path";
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
    return !fs2.existsSync(filePath) || !fs2.statSync(filePath).isFile() ? null : fs2.readFileSync(filePath, "utf8");
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
    if (!fs2.existsSync(dirPath)) return;
    let entries = fs2.readdirSync(dirPath, { withFileTypes: !0 });
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
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function textMentionsAnyToken(body, tokens) {
  if (!body || tokens.length === 0) return !1;
  let cleanBody = body.replace(/https?:\/\/[^\s)>\]"']+/gi, " ");
  for (let tok of tokens) {
    if (!tok) continue;
    let pattern = tok.endsWith("_") ? `(?:^|[^a-zA-Z0-9_-])${escapeRegex(tok)}[a-zA-Z0-9_-]+` : `(?:^|[^a-zA-Z0-9_-])${escapeRegex(tok)}(?:$|[^a-zA-Z0-9_-])`;
    if (new RegExp(pattern, "i").test(cleanBody)) return !0;
  }
  return !1;
}
function discoverInstalledPlugins(pluginsDirs) {
  let dirs = Array.isArray(pluginsDirs) ? pluginsDirs : typeof pluginsDirs == "string" ? [pluginsDirs] : [
    path.join(os.homedir(), ".gemini", "config", "plugins"),
    path.join(os.homedir(), ".gemini", "antigravity", "builtin", "plugins")
  ], cacheKey = dirs.join(path.delimiter), now = Date.now(), cached = pluginRegistryCache.get(cacheKey);
  if (cached && cached.expiresAt > now)
    return cached.registry;
  let byId = /* @__PURE__ */ new Map(), cliToPlugin = /* @__PURE__ */ new Map(), mcpToPlugin = /* @__PURE__ */ new Map();
  for (let pluginsDir of dirs)
    try {
      if (fs2.existsSync(pluginsDir)) {
        let entries = fs2.readdirSync(pluginsDir, { withFileTypes: !0 });
        for (let entry of entries) {
          if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
          let pluginPath = path.join(pluginsDir, entry.name), stat = null;
          try {
            stat = fs2.statSync(pluginPath);
          } catch {
            stat = null;
          }
          if (!stat || !stat.isDirectory()) continue;
          let id = entry.name, displayName = entry.name, manifestText = readTextSafe(path.join(pluginPath, "plugin.json"));
          if (manifestText)
            try {
              let parsed = JSON.parse(manifestText);
              typeof parsed.name == "string" && parsed.name.trim() && (id = parsed.name.trim()), typeof parsed.displayName == "string" && parsed.displayName.trim() ? displayName = parsed.displayName.trim() : displayName = id;
            } catch {
            }
          if (byId.has(id)) continue;
          let mcpSet = /* @__PURE__ */ new Set(), mcpText = readTextSafe(path.join(pluginPath, "mcp_config.json"));
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
          collectPluginCliBinaries(path.join(pluginPath, "bin"), idLower, entryLower, cliSet);
          let skillsDir = path.join(pluginPath, "skills"), rawSkills = [];
          try {
            if (fs2.existsSync(skillsDir))
              for (let skillEnt of fs2.readdirSync(skillsDir, { withFileTypes: !0 })) {
                if (!skillEnt.isDirectory() && !skillEnt.isSymbolicLink()) continue;
                let skillFolder = path.join(skillsDir, skillEnt.name);
                collectPluginCliBinaries(
                  path.join(skillFolder, "scripts"),
                  idLower,
                  entryLower,
                  cliSet
                );
                let skillMd = readTextSafe(path.join(skillFolder, "SKILL.md")) ?? "", yamlName = skillMd ? extractYamlSkillName(skillMd) : null;
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
  let registry = { byId, cliToPlugin, mcpToPlugin };
  return pluginRegistryCache.set(cacheKey, {
    registry,
    expiresAt: now + PLUGIN_REGISTRY_TTL_MS
  }), registry;
}
function isSkillRequiresExecution(plugin, skillName) {
  if (!plugin || !plugin.hasExecutableSurface) return !1;
  let distinctSkillNames = /* @__PURE__ */ new Set();
  for (let meta of plugin.skills.values())
    distinctSkillNames.add(meta.name);
  let singleSkill = distinctSkillNames.size <= 1, mentions = !!(skillName ? plugin.skills.get(skillName) : void 0)?.mentionsMcpOrCli;
  return !!(plugin.cliNames.length > 0 && (singleSkill || mentions) || plugin.mcpServerNames.length > 0 && (singleSkill || mentions));
}
function resolveToolPluginAndChild(tc, registry) {
  let makePluginHit = (rawPluginId, childKind, childName, footprint, skillNameForExecCheck) => {
    let info = registry.byId.get(rawPluginId);
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
      if (registry.byId.has(tc.skillName))
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
    let mappedPlugin = registry.mcpToPlugin.get(rawServer);
    if (mappedPlugin)
      return makePluginHit(mappedPlugin, "MCP", childLabel, "execution", null);
    if (registry.byId.has(rawServer))
      return makePluginHit(rawServer, "MCP", childLabel, "execution", null);
    let longestMatch = "";
    for (let knownId of registry.byId.keys())
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
        let rawTok = firstTokMatch[1] ?? firstTokMatch[2] ?? firstTokMatch[3] ?? "", baseTok = pathBaseName(rawTok).replace(/\.(?:exe|cmd|bat)$/i, "").toLowerCase(), pluginId = registry.cliToPlugin.get(baseTok);
        if (pluginId)
          return makePluginHit(pluginId, "CLI", baseTok, "execution", null);
      }
    }
    return null;
  }
  return null;
}
function resolveToolPluginOrSkill(tc, registry) {
  let hit = resolveToolPluginAndChild(tc, registry);
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
  let registry = options.registry ?? discoverInstalledPlugins(), fallbackChatCount = options.fallbackChatCount ?? 1, orderedConvs = sortConversationsParentsFirst(conversations), scopeConvIds = new Set(orderedConvs.map((c) => c.conversationId)), childrenMap = /* @__PURE__ */ new Map(), parentById = /* @__PURE__ */ new Map();
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
      let hit = resolveToolPluginAndChild(tc, registry);
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
    return !fs3.existsSync(filePath) || !fs3.statSync(filePath).isFile() ? null : fs3.readFileSync(filePath, "utf8");
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
  let dotGit = path2.join(projectPath, ".git");
  try {
    if (!fs3.existsSync(dotGit)) return null;
    let st = fs3.statSync(dotGit), configCandidates = [];
    if (st.isDirectory())
      configCandidates.push(path2.join(dotGit, "config"));
    else if (st.isFile()) {
      let gitDirMatch = fs3.readFileSync(dotGit, "utf8").match(/^gitdir:\s*(.+)$/im);
      if (gitDirMatch) {
        let resolvedGitDir = path2.resolve(projectPath, gitDirMatch[1].trim());
        configCandidates.push(path2.join(resolvedGitDir, "config"));
        let commonDirText = readTextSafe2(path2.join(resolvedGitDir, "commondir"));
        if (commonDirText && commonDirText.trim()) {
          let commonDir = path2.resolve(resolvedGitDir, commonDirText.trim());
          configCandidates.push(path2.join(commonDir, "config"));
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
  let pluginText = readTextSafe2(path2.join(projectPath, "plugin.json"));
  if (pluginText)
    try {
      let parsed = JSON.parse(pluginText);
      if (typeof parsed.displayName == "string" && parsed.displayName.trim())
        return parsed.displayName.trim();
      if (typeof parsed.name == "string" && parsed.name.trim())
        return parsed.name.trim();
    } catch {
    }
  let pkgText = readTextSafe2(path2.join(projectPath, "package.json"));
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
  let pyText = readTextSafe2(path2.join(projectPath, "pyproject.toml"));
  if (pyText) {
    let pyName = extractTomlSectionName(pyText, ["project", "tool.poetry"]);
    if (pyName) return pyName;
  }
  let cargoText = readTextSafe2(path2.join(projectPath, "Cargo.toml"));
  if (cargoText) {
    let cargoName = extractTomlSectionName(cargoText, ["package"]);
    if (cargoName) return cargoName;
  }
  let goModText = readTextSafe2(path2.join(projectPath, "go.mod"));
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
  let now = Date.now(), cached = projectNameCache.get(projectPath);
  if (cached && cached.expiresAt > now)
    return cached.name;
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
  let cost = aggregateCosts(plannerSteps, pricingRules), modelBreakdown = aggregateModelUsage(plannerSteps, pricingRules, 1), denom = row.inputTokens + row.cacheReadTokens, subagentMs = subagents.reduce((sum, s) => sum + s.activeMs, 0), registry = discoverInstalledPlugins(), resolvedParents = /* @__PURE__ */ new Set();
  for (let tc of toolCalls) {
    let hit = resolveToolPluginOrSkill(tc, registry);
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
  ), modelMs = summaries.reduce((s, c) => s + c.time.modelMs, 0), toolWallMs = summaries.reduce((s, c) => s + c.time.toolWallMs, 0), toolSumMs = summaries.reduce((s, c) => s + c.time.toolSumMs, 0), subagentMs = subagents.reduce((s, c) => s + c.time.activeMs, 0), userIdleMs = topTimeSource.reduce((s, c) => s + c.time.userIdleMs, 0), wallClockMs = lastActivityMs > firstActivityMs ? lastActivityMs - firstActivityMs : activeMs, time = {
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
    time,
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

// src/server/scanner.ts
import fs5 from "node:fs";
import os2 from "node:os";
import path3 from "node:path";

// src/server/hookIngestor.ts
import crypto from "node:crypto";
import fs4 from "node:fs";
var DEFAULT_MAX_CHUNK_BYTES = 16 * 1024 * 1024;
function ingestHookEvents(db, eventsPath, options = {}) {
  if (!fs4.existsSync(eventsPath))
    return { ingestedCount: 0, touchedConversationIds: [] };
  if (process.platform !== "win32")
    try {
      fs4.chmodSync(eventsPath, 384);
    } catch {
    }
  let stat = fs4.statSync(eventsPath);
  if (stat.size === 0)
    return { ingestedCount: 0, touchedConversationIds: [] };
  let startOffset = db.getIndexedFile(eventsPath)?.lastOffset ?? 0;
  if (startOffset > stat.size && (startOffset = 0), startOffset === stat.size)
    return { ingestedCount: 0, touchedConversationIds: [] };
  let maxChunkBytes = Math.max(
    64,
    options.maxChunkBytes ?? DEFAULT_MAX_CHUNK_BYTES
  ), hardCapBytes = 64 * 1024 * 1024, windowBytes = Math.min(stat.size - startOffset, maxChunkBytes), fd = fs4.openSync(eventsPath, "r"), chunkBuf = Buffer.alloc(0), lastNewlineIdx = -1;
  try {
    for (; ; ) {
      let buf = Buffer.alloc(windowBytes), bytesRead = fs4.readSync(fd, buf, 0, windowBytes, startOffset);
      if (bytesRead <= 0)
        return { ingestedCount: 0, touchedConversationIds: [] };
      if (chunkBuf = buf.subarray(0, bytesRead), lastNewlineIdx = chunkBuf.lastIndexOf(10), lastNewlineIdx >= 0 || startOffset + bytesRead >= stat.size || windowBytes >= hardCapBytes)
        break;
      windowBytes = Math.min(stat.size - startOffset, windowBytes * 2, hardCapBytes);
    }
  } finally {
    fs4.closeSync(fd);
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
  let home = os2.homedir();
  return [
    { surface: "antigravity", dir: path3.join(home, ".gemini", "antigravity", "brain") },
    { surface: "cli", dir: path3.join(home, ".gemini", "antigravity-cli", "brain") },
    { surface: "ide", dir: path3.join(home, ".gemini", "antigravity-ide", "brain") }
  ];
}
function inferSurfaceFromPath(filePath) {
  let norm = filePath.replace(/\\/g, "/");
  return norm.includes("/antigravity-cli/") ? "cli" : norm.includes("/antigravity-ide/") ? "ide" : norm.includes("/antigravity/") ? "antigravity" : "unknown";
}
function isIgnoredSystemPath(p, homeOverride) {
  let norm = p.replace(/\\/g, "/"), lower = norm.toLowerCase(), homeLower = (homeOverride || os2.homedir()).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase(), geminiLower = `${homeLower}/.gemini`;
  if (lower === geminiLower || lower.startsWith(`${geminiLower}/`) || norm === "/tmp" || lower === homeLower) return !0;
  let tmpDirNorm = os2.tmpdir().replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  return tmpDirNorm && (lower === tmpDirNorm || lower.startsWith(`${tmpDirNorm}/`)) || /^[a-z]:\/(?:windows|program files|program files \(x86\)|programdata|perflogs|\$recycle\.bin)(?:\/|$)/i.test(
    norm
  ) || lower.includes("/appdata/local/temp/") || lower.endsWith("/appdata/local/temp") ? !0 : IGNORED_PATH_PREFIXES.some((prefix) => norm.startsWith(prefix));
}
var UUID_EXACT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function resolveWorktreeMainRoot(repoDir, options = {}) {
  if (!(!!options.readFileFn || !options.existsFn && !options.isFileFn)) return repoDir;
  let isFileFn = options.isFileFn ?? ((p) => {
    try {
      return fs5.existsSync(p) && fs5.statSync(p).isFile();
    } catch {
      return !1;
    }
  }), readFileFn = options.readFileFn ?? ((p) => {
    try {
      return fs5.existsSync(p) && fs5.statSync(p).isFile() ? fs5.readFileSync(p, "utf8") : null;
    } catch {
      return null;
    }
  }), dotGit = pathJoin(repoDir, ".git");
  if (!isFileFn(dotGit)) return repoDir;
  let pointer = readFileFn(dotGit);
  if (!pointer) return repoDir;
  let gitDirMatch = pointer.match(/^gitdir:\s*(.+)$/im);
  if (!gitDirMatch || !gitDirMatch[1].trim()) return repoDir;
  let rawTarget = gitDirMatch[1].trim(), resolveLocal = (baseDir, relTarget) => isAbsoluteLocalPath(relTarget) ? relTarget : isWindowsPath(baseDir) ? path3.win32.resolve(baseDir, relTarget) : path3.posix.resolve(baseDir, relTarget), resolvedGitDir = resolveLocal(repoDir, rawTarget), commonDirText = readFileFn(pathJoin(resolvedGitDir, "commondir"));
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
  let home = options.homeDir ?? os2.homedir();
  if (isIgnoredSystemPath(candidatePath, home)) return null;
  let existsFn = options.existsFn ?? ((p) => fs5.existsSync(p)), isFileFn = options.isFileFn ?? ((p) => {
    try {
      return fs5.existsSync(p) && fs5.statSync(p).isFile();
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
    let hasGit = fs5.existsSync(path3.join(root, ".git"));
    votes.set(root, (votes.get(root) ?? 0) + (hasGit ? 3 : 1));
  }
  if (votes.size === 0) return null;
  let bestRoot = null, bestScore = -1;
  for (let [root, score] of votes.entries())
    score > bestScore && (bestScore = score, bestRoot = root);
  return bestRoot;
}
function getSwarmMetaMtimeMs(convDir) {
  let swarmDir = path3.join(convDir, ".system_generated", "swarm");
  try {
    if (!fs5.existsSync(swarmDir) || !fs5.statSync(swarmDir).isDirectory()) return 0;
    let maxMtime = 0;
    for (let entry of fs5.readdirSync(swarmDir, { withFileTypes: !0 })) {
      if (!entry.isFile() || !/\.(?:json|jsonl)$/i.test(entry.name)) continue;
      let st = fs5.statSync(path3.join(swarmDir, entry.name));
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
  let swarmDir = path3.join(convDir, ".system_generated", "swarm");
  try {
    if (!fs5.existsSync(swarmDir) || !fs5.statSync(swarmDir).isDirectory())
      return null;
  } catch {
    return null;
  }
  let hasPlan = !1, planTitle = null, tasks = {}, rosterMap = /* @__PURE__ */ new Map(), latestMtimeMs = 0, entries;
  try {
    entries = fs5.readdirSync(swarmDir, { withFileTypes: !0 });
  } catch {
    return null;
  }
  let MAX_META_BYTES = 1024 * 1024, extraFilesScanned = 0;
  for (let entry of entries) {
    if (!entry.isFile()) continue;
    let fullPath = path3.join(swarmDir, entry.name), st;
    try {
      st = fs5.statSync(fullPath);
    } catch {
      continue;
    }
    if (st.mtimeMs > latestMtimeMs && (latestMtimeMs = st.mtimeMs), !(st.size === 0 || st.size > MAX_META_BYTES)) {
      if (entry.name.toLowerCase() === "plan.json") {
        try {
          let parsed = JSON.parse(fs5.readFileSync(fullPath, "utf8"));
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
          let text = fs5.readFileSync(fullPath, "utf8");
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
  return idx > 0 ? transcriptPath.slice(0, idx) : path3.dirname(transcriptPath);
}
function discoverTranscripts(roots, db) {
  let byConv = /* @__PURE__ */ new Map();
  for (let root of roots) {
    if (!fs5.existsSync(root.dir)) continue;
    let entries;
    try {
      entries = fs5.readdirSync(root.dir, { withFileTypes: !0 });
    } catch {
      continue;
    }
    for (let entry of entries) {
      if (!entry.isDirectory()) continue;
      let convId = entry.name, convDir = path3.join(root.dir, convId), candidates = [
        path3.join(convDir, ".system_generated", "logs", "transcript_full.jsonl"),
        path3.join(convDir, ".system_generated", "logs", "transcript.jsonl"),
        path3.join(convDir, "transcript_full.jsonl"),
        path3.join(convDir, "transcript.jsonl")
      ];
      for (let candidate of candidates)
        try {
          if (!fs5.existsSync(candidate)) continue;
          let st = fs5.statSync(candidate);
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
      sep && fs5.existsSync(fullVariant) && (candidate = fullVariant);
    }
    try {
      if (!fs5.existsSync(candidate)) continue;
      let st = fs5.statSync(candidate);
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
  let { db, dataDir } = options, eventsPath = options.eventsPath ?? path3.join(dataDir, "events.jsonl"), brainRoots = options.brainRoots ?? defaultBrainRoots(), hookResult = ingestHookEvents(db, eventsPath), touchedByHooks = new Set(hookResult.touchedConversationIds), discovered = discoverTranscripts(brainRoots, db), toProcess = [], skipped = 0;
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

// src/server/updateCheck.ts
import fs6 from "node:fs";
import path4 from "node:path";

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
var FALLBACK_PLUGIN_VERSION = "0.5.0", REPO_URL = "https://github.com/fmedery/antigravity-plugin-flight-recorder", REMOTE_RELEASE_URL = "https://api.github.com/repos/fmedery/antigravity-plugin-flight-recorder/releases/latest", REMOTE_MANIFEST_URL = "https://raw.githubusercontent.com/fmedery/antigravity-plugin-flight-recorder/main/plugin.json", MAX_RESPONSE_BYTES = 131072, DEFAULT_TIMEOUT_MS = 5e3, DEFAULT_CACHE_TTL_MS = 3e4, checkCache = /* @__PURE__ */ new Map();
function readInstalledVersion(pluginRoot) {
  if (!pluginRoot) return FALLBACK_PLUGIN_VERSION;
  try {
    let manifestPath = path4.join(pluginRoot, "plugin.json");
    if (!fs6.existsSync(manifestPath)) return FALLBACK_PLUGIN_VERSION;
    let raw = JSON.parse(fs6.readFileSync(manifestPath, "utf8"));
    if (typeof raw.version == "string" && parseSemver(raw.version))
      return raw.version.trim().replace(/^v/i, "");
  } catch {
  }
  return FALLBACK_PLUGIN_VERSION;
}
function detectInstallMethod(pluginRoot) {
  if (!pluginRoot) return "zip";
  try {
    if (fs6.existsSync(path4.join(pluginRoot, ".git")))
      return "git";
    let dirName = path4.basename(pluginRoot);
    if (/^-?\d{10,}$/.test(dirName))
      return "marketplace";
    for (let marker of [
      ".marketplace",
      ".antigravity-marketplace",
      "install_metadata.json"
    ])
      if (fs6.existsSync(path4.join(pluginRoot, marker)))
        return "marketplace";
    let manifestPath = path4.join(pluginRoot, "plugin.json");
    if (fs6.existsSync(manifestPath)) {
      let raw = JSON.parse(fs6.readFileSync(manifestPath, "utf8"));
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
    let cached = checkCache.get(cacheKey);
    if (cached && nowMs < cached.expiresAtMs)
      return cached.result;
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
var timeRangeSchema = external_exports.enum(["today", "7d", "30d", "all"]).optional(), sinceMsSchema = external_exports.number().finite().positive().nullable().optional(), pricingRuleSchema = external_exports.object({
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
function readUiHtml(uiHtmlPath) {
  let overridePath = process.env.FLIGHT_RECORDER_APP_HTML, target = overridePath && overridePath.trim() ? overridePath.trim() : uiHtmlPath;
  if (fs7.existsSync(target)) {
    let html = fs7.readFileSync(target, "utf8");
    if (html.trim().length > 0) return html;
  }
  return `<!doctype html><html><body style="font-family:system-ui;padding:16px"><h3>Flight Recorder</h3><p>UI bundle not found at ${target}. Run <code>npm run build</code>.</p></body></html>`;
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

// src/server/dataDir.ts
import fs8 from "node:fs";
import os3 from "node:os";
import path5 from "node:path";
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
    let filePath = path5.join(dirPath, filename);
    try {
      if (!fs8.existsSync(filePath)) continue;
      let st = fs8.statSync(filePath);
      st.isFile() && st.mtimeMs > newest && (newest = st.mtimeMs);
    } catch {
    }
  }
  return newest;
}
function directoryExists(dirPath) {
  try {
    return fs8.existsSync(dirPath) && fs8.statSync(dirPath).isDirectory();
  } catch {
    return !1;
  }
}
function discoverSharedPluginDataDir(opts) {
  let pluginDirNames = /* @__PURE__ */ new Set(["flight-recorder"]);
  if (opts.pluginRoot) {
    let base = path5.basename(opts.pluginRoot).trim();
    base && pluginDirNames.add(base);
  }
  let pluginDataCandidates = [], sidecarExecDir = opts.env.ANTIGRAVITY_EXECUTABLE_DATA_DIR;
  if (isValidExpandedPath(sidecarExecDir)) {
    let appDataRoot = deriveAppDataRootFromSidecarDir(sidecarExecDir);
    if (appDataRoot)
      for (let name of pluginDirNames)
        pluginDataCandidates.push(path5.join(appDataRoot, "plugin_data", name));
  }
  for (let name of pluginDirNames)
    pluginDataCandidates.push(
      path5.join(opts.homeDir, ".gemini", "antigravity", "plugin_data", name)
    );
  let fallbackSharedDir = path5.join(opts.homeDir, ".gemini", "flight-recorder-data"), allCandidates = Array.from(
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
  let argv = options.argv ?? [], env = options.env ?? process.env, homeDir = options.homeDir ?? os3.homedir(), cliDir = parseCliDataDir(argv);
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
  return path5.join(homeDir, ".gemini", "flight-recorder-data");
}

// src/server/db.ts
import fs9 from "node:fs";
import { createRequire } from "node:module";
import path6 from "node:path";
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
    if (fs9.mkdirSync(dataDir, { recursive: !0, mode: 448 }), this.dbPath = path6.join(dataDir, "tracker.sqlite"), this.db = new DatabaseSync(this.dbPath), this.db.exec("PRAGMA journal_mode = WAL;"), this.db.exec("PRAGMA foreign_keys = ON;"), this.db.exec("PRAGMA busy_timeout = 5000;"), process.platform !== "win32")
      for (let [target, mode] of [
        [dataDir, 448],
        [this.dbPath, 384],
        [`${this.dbPath}-wal`, 384],
        [`${this.dbPath}-shm`, 384]
      ])
        try {
          fs9.existsSync(target) && fs9.chmodSync(target, mode);
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

// src/server/hostTheme.ts
import fs10 from "node:fs";
import os4 from "node:os";
import path7 from "node:path";
var BUILT_IN_THEMES = {
  light: {
    "Default Light": { background: "#F9F9F9", foreground: "#101010", primary: "#007acc" },
    "Legacy Light": { background: "#F9F9F9", foreground: "#101010", primary: "#007acc" },
    "Onyx Light": { background: "#FFFFFF", foreground: "#0A0A0C", primary: "#2F75C3" },
    Catppuccin: { background: "#EAECF0", foreground: "#4C4F69", primary: "#8839EF" },
    "Catppuccin Latte": { background: "#EFF1F5", foreground: "#4C4F69", primary: "#8839EF" },
    "Gruvbox Material": { background: "#f9f5d7", foreground: "#4f3829", primary: "#c35e0a" },
    "One Light": { background: "#F5F5F5", foreground: "#383A42", primary: "#4078F2" },
    "Solarized Light": { background: "#FAF4E5", foreground: "#435155", primary: "#CB4B16" }
  },
  dark: {
    "Default Dark": { background: "#101010", foreground: "#cccccc", primary: "#007acc" },
    "Legacy Dark": { background: "#101010", foreground: "#cccccc", primary: "#007acc" },
    "Onyx Dark": { background: "#070708", foreground: "#FFFFFF", primary: "#2F71E3" },
    Catppuccin: { background: "#24273A", foreground: "#CAD3F5", primary: "#C6A0F6" },
    "Catppuccin Macchiato": { background: "#24273A", foreground: "#CAD3F5", primary: "#C6A0F6" },
    "Catppuccin Mocha": { background: "#1E1E2E", foreground: "#CDD6F4", primary: "#CBA6F7" },
    Dracula: { background: "#282A36", foreground: "#F8F8F2", primary: "#BD93F9" },
    "Gruvbox Material": { background: "#141617", foreground: "#d4be98", primary: "#e78a4e" },
    Monokai: { background: "#272822", foreground: "#F8F8F2", primary: "#F92672" },
    Nord: { background: "#2E3440", foreground: "#D8DEE9", primary: "#88C0D0" },
    "One Dark Pro": { background: "#282C34", foreground: "#ABB2BF", primary: "#61AFEF" },
    "Tokyo Night": { background: "#1A1B26", foreground: "#A9B1D6", primary: "#7AA2F7" },
    "Solarized Dark": { background: "#002B36", foreground: "#93A1A1", primary: "#268BD2" },
    Vesper: { background: "#101010", foreground: "#FFFFFF", primary: "#FFC799" }
  }
};
function defaultAppStoragePath(platform = process.platform, homeDir = os4.homedir(), env = process.env) {
  if (platform === "darwin")
    return path7.join(
      homeDir,
      "Library",
      "Application Support",
      "Antigravity",
      "app_storage.json"
    );
  if (platform === "win32") {
    let appData = env.APPDATA || path7.join(homeDir, "AppData", "Roaming");
    return path7.join(appData, "Antigravity", "app_storage.json");
  }
  let xdg = env.XDG_CONFIG_HOME || path7.join(homeDir, ".config");
  return path7.join(xdg, "Antigravity", "app_storage.json");
}
function readJsonFileSafe(filePath) {
  try {
    if (!fs10.existsSync(filePath)) return null;
    let raw = fs10.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""), parsed = JSON.parse(raw);
    if (parsed && typeof parsed == "object" && !Array.isArray(parsed))
      return parsed;
  } catch {
  }
  return null;
}
function isSafeCssColor(val) {
  if (typeof val != "string") return !1;
  let trimmed = val.trim();
  return !trimmed || trimmed.length > 64 ? !1 : /^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla|oklch)\([0-9a-z.,%/\s+-]+\))$/i.test(
    trimmed
  );
}
function findPluginThemeSeeds(themes, mode, presetName) {
  if (!Array.isArray(themes) || !presetName) return null;
  let targetLower = presetName.toLowerCase();
  for (let item of themes) {
    if (!item || typeof item != "object") continue;
    let obj = item;
    if ((obj.mode === "light" ? "light" : "dark") !== mode || String(obj.label || obj.id || "").trim().toLowerCase() !== targetLower) continue;
    let seeds = obj.seeds;
    if (seeds && isSafeCssColor(seeds.background)) {
      let fg = isSafeCssColor(seeds.foregroundOverride) && seeds.foregroundOverride || isSafeCssColor(seeds.foreground) && seeds.foreground || (mode === "dark" ? "#F3F4F6" : "#111827"), pri = isSafeCssColor(seeds.primary) && seeds.primary || (mode === "dark" ? "#60A5FA" : "#2563EB");
      return {
        background: seeds.background.trim(),
        foreground: fg.trim(),
        primary: pri.trim()
      };
    }
  }
  return null;
}
function lookupBuiltInSeeds(mode, presetName) {
  if (!presetName) return null;
  let table = BUILT_IN_THEMES[mode];
  if (table[presetName]) return table[presetName];
  let lower = presetName.toLowerCase();
  for (let [k, v] of Object.entries(table))
    if (k.toLowerCase() === lower) return v;
  return null;
}
function buildCssVariablesFromSeeds(mode, seeds, highContrast) {
  let isDark = mode === "dark", bg = seeds.background, fg = seeds.foreground, primary = seeds.primary, cardPct = isDark ? highContrast ? "7%" : "5%" : "0%", tertiaryPct = isDark ? highContrast ? "14%" : "10%" : highContrast ? "8%" : "6%", borderPrimaryPct = highContrast ? "24%" : "16%", borderSecondaryPct = highContrast ? "14%" : "10%", bgSecondary = isDark ? `color-mix(in srgb, ${fg} ${cardPct}, ${bg})` : `color-mix(in srgb, ${fg} 3%, ${bg})`, bgTertiary = `color-mix(in srgb, ${fg} ${tertiaryPct}, ${bg})`, txtSecondary = `color-mix(in srgb, ${fg} ${isDark ? "76%" : "72%"}, ${bg})`, txtTertiary = `color-mix(in srgb, ${fg} ${isDark ? "56%" : "54%"}, ${bg})`, bdrPrimary = `color-mix(in srgb, ${fg} ${borderPrimaryPct}, ${bg})`, bdrSecondary = `color-mix(in srgb, ${fg} ${borderSecondaryPct}, ${bg})`;
  return {
    "--color-background-primary": bg,
    "--color-background-secondary": bgSecondary,
    "--color-background-tertiary": bgTertiary,
    "--color-text-primary": fg,
    "--color-text-secondary": txtSecondary,
    "--color-text-tertiary": txtTertiary,
    "--color-border-primary": bdrPrimary,
    "--color-border-secondary": bdrSecondary,
    "--color-ring-primary": primary
  };
}
function resolvePaletteForMode(mode, userSettings, storage, highContrast) {
  let storageKey = mode === "light" ? "theme-preset-light" : "theme-preset-dark", storagePreset = typeof storage?.[storageKey] == "string" ? storage[storageKey].trim() : "", rawPreset = typeof userSettings.preset == "string" && userSettings.preset.trim() || (mode === "light" ? typeof userSettings.themePresetLight == "string" && userSettings.themePresetLight.trim() || typeof userSettings["theme-preset-light"] == "string" && userSettings["theme-preset-light"].trim() || storagePreset : typeof userSettings.themePresetDark == "string" && userSettings.themePresetDark.trim() || typeof userSettings["theme-preset-dark"] == "string" && userSettings["theme-preset-dark"].trim() || storagePreset) || "", presetName = rawPreset === "Default" ? mode === "light" ? "Default Light" : "Default Dark" : rawPreset === "Onyx" || rawPreset === "onyx" ? mode === "light" ? "Onyx Light" : "Onyx Dark" : rawPreset, builtIn = lookupBuiltInSeeds(mode, presetName), pluginSeeds = !builtIn && presetName ? findPluginThemeSeeds(userSettings.themes, mode, presetName) : null, customSeedsObj = mode === "light" ? userSettings.customThemeSeedsLight : userSettings.customThemeSeedsDark, mergedSeeds = builtIn ? { ...builtIn } : pluginSeeds ? { ...pluginSeeds } : null;
  if (customSeedsObj && typeof customSeedsObj == "object") {
    let cBg = isSafeCssColor(customSeedsObj.background) ? customSeedsObj.background.trim() : null, cFg = isSafeCssColor(customSeedsObj.foregroundOverride) ? customSeedsObj.foregroundOverride.trim() : isSafeCssColor(customSeedsObj.foreground) ? customSeedsObj.foreground.trim() : null, cPri = isSafeCssColor(customSeedsObj.primary) ? customSeedsObj.primary.trim() : null;
    if (cBg || cFg || cPri) {
      let fallbackSeeds = mergedSeeds ?? BUILT_IN_THEMES[mode][mode === "light" ? "Onyx Light" : "Onyx Dark"];
      mergedSeeds = {
        background: cBg ?? fallbackSeeds.background,
        foreground: cFg ?? fallbackSeeds.foreground,
        primary: cPri ?? fallbackSeeds.primary
      };
    }
  }
  return mergedSeeds ? {
    presetName: presetName || null,
    cssVariables: buildCssVariablesFromSeeds(mode, mergedSeeds, highContrast)
  } : { presetName: presetName || null, cssVariables: {} };
}
function resolveHostTheme(options = {}) {
  let homeDir = options.homeDir ?? os4.homedir(), configPath = options.configJsonPath ?? path7.join(homeDir, ".gemini", "config", "config.json"), storagePath = options.appStoragePath ?? defaultAppStoragePath(options.platform, homeDir, options.env), cfg = readJsonFileSafe(configPath), storage = readJsonFileSafe(storagePath), userSettings = cfg?.userSettings && typeof cfg.userSettings == "object" && !Array.isArray(cfg.userSettings) ? cfg.userSettings : cfg ?? {}, rawMode = userSettings.themeMode, mode = "system";
  rawMode === 1 || rawMode === "1" || rawMode === "THEME_MODE_LIGHT" || rawMode === "light" || rawMode === "hcLight" ? mode = "light" : (rawMode === 2 || rawMode === "2" || rawMode === "THEME_MODE_DARK" || rawMode === "dark" || rawMode === "hcDark") && (mode = "dark");
  let rawContrast = userSettings.contrast ?? storage?.["jetski.contrast"], highContrast = rawContrast === 2 || rawContrast === "2" || rawContrast === "CONTRAST_HIGH" || rawMode === "hcDark" || rawMode === "hcLight", darkPalette = resolvePaletteForMode("dark", userSettings, storage, highContrast), lightPalette = resolvePaletteForMode("light", userSettings, storage, highContrast);
  return mode === "dark" ? {
    mode,
    presetName: darkPalette.presetName,
    cssVariables: darkPalette.cssVariables,
    darkVariables: darkPalette.cssVariables,
    lightVariables: lightPalette.cssVariables
  } : mode === "light" ? {
    mode,
    presetName: lightPalette.presetName,
    cssVariables: lightPalette.cssVariables,
    darkVariables: darkPalette.cssVariables,
    lightVariables: lightPalette.cssVariables
  } : {
    mode: "system",
    presetName: darkPalette.presetName ?? lightPalette.presetName,
    cssVariables: {},
    darkVariables: darkPalette.cssVariables,
    lightVariables: lightPalette.cssVariables
  };
}

// src/server/sidecar.ts
var MAX_JSON_BODY_BYTES = 1024 * 1024, LS_WATCH_INTERVAL_MS = 5e3, LS_WATCH_MAX_FAILURES = 3, SidecarResponse = class {
  body;
  contentType;
  status;
  headers;
  constructor(body, init = {}) {
    this.body = body, this.contentType = init.contentType ?? "text/plain; charset=utf-8", this.status = init.status ?? 200, this.headers = init.headers;
  }
}, FALLBACK_PRELOAD_JS = `(function () {
  var params = new URLSearchParams(window.location.search);
  var token = params.get("token") || "";
  var conversationId = params.get("conversationId") || "";
  var postToHost = function (msg) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, "*");
    }
  };
  var sidecarFetch = function (url, options) {
    var opts = options || {};
    var headers = new Headers(opts.headers || {});
    if (!headers.has("Content-Type") && opts.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("X-Sidecar-Token", token);
    }
    return fetch(url, Object.assign({}, opts, { headers: headers }));
  };
  window.sidecar = {
    conversationId: conversationId || null,
    fetch: sidecarFetch,
    getWorkspaceUris: function () {
      return Promise.resolve([]);
    },
    onWorkspaceChange: function () {
      return function () {};
    },
    agent: {
      sendMessage: function (message, convId) {
        return sidecarFetch("/_sidecar/send-message", {
          method: "POST",
          body: JSON.stringify({
            conversationId: convId || conversationId,
            message: message
          })
        }).then(function (r) {
          if (!r.ok) throw new Error("Failed to send message (HTTP " + r.status + ")");
          return r.json();
        });
      }
    },
    ui: {
      toggleAuxPane: function (request) {
        postToHost({ type: "toggle-aux-pane", payload: request });
      },
      toggleConversation: function (convId, options) {
        var payload =
          options && typeof options === "object"
            ? Object.assign({ conversationId: convId }, options)
            : { conversationId: convId };
        postToHost({ type: "toggle-conversation", payload: payload });
      }
    }
  };
})();
`;
function isAllowedLoopbackOrigin(origin) {
  if (!origin || origin === "null" || /^plugin:\/\/[a-z0-9._-]+$/i.test(origin)) return !0;
  try {
    let parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return !1;
    let host = parsed.hostname.toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]";
  } catch {
    return !1;
  }
}
function verifySidecarToken(provided, expected) {
  if (!expected) return !0;
  if (!provided) return !1;
  let a = Buffer.from(provided, "utf8"), b = Buffer.from(expected, "utf8");
  return a.length !== b.length ? !1 : crypto2.timingSafeEqual(a, b);
}
function resolveInitialHostTheme(configJsonPath = path8.join(os5.homedir(), ".gemini", "config", "config.json"), appStoragePath) {
  return resolveHostTheme({ configJsonPath, appStoragePath }).mode;
}
function serializeCssVars(vars) {
  return Object.entries(vars ?? {}).filter(
    ([k, v]) => /^--[a-z0-9-]+$/i.test(k) && typeof v == "string" && v.trim().length > 0 && !/[;<>{}]/.test(v)
  ).map(([k, v]) => `${k}:${v.trim()};`).join("");
}
function injectSidecarBootstrap(html, options = {}) {
  let tokenParam = options.uiToken ? `?token=${encodeURIComponent(options.uiToken)}` : "", themeMode = options.initialTheme ?? "system", themeBootstrap = themeMode === "dark" || themeMode === "light" ? `document.documentElement.setAttribute("data-theme",${JSON.stringify(themeMode)});` : 'document.documentElement.setAttribute("data-theme",window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");', cssRules = [], rootCss = serializeCssVars(options.themeVariables), darkCss = serializeCssVars(options.darkVariables), lightCss = serializeCssVars(options.lightVariables);
  rootCss && cssRules.push(`:root{${rootCss}}`), darkCss && cssRules.push(`:root[data-theme="dark"]{${darkCss}}`), lightCss && cssRules.push(`:root[data-theme="light"]{${lightCss}}`);
  let themeStyleTag = cssRules.length > 0 ? `    <style id="fr-host-theme">${cssRules.join("")}</style>` : "", snippet = [
    '    <meta name="flight-recorder-transport" content="sidecar" />',
    ...themeStyleTag ? [themeStyleTag] : [],
    `    <script>${themeBootstrap}</script>`,
    `    <script src="/preload.js${tokenParam}"></script>`
  ].join(`
`);
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${snippet}
  </head>`) : `${snippet}
${html}`;
}
function isSafeParamKey(key) {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
function readBoundedJsonBody(req, res, limitBytes) {
  return new Promise((resolvePromise) => {
    let chunks = [], byteLength = 0, settled = !1;
    req.on("data", (chunk) => {
      if (settled) {
        byteLength + chunk.length > limitBytes + 65536 && req.destroy();
        return;
      }
      if (byteLength += chunk.length, byteLength > limitBytes) {
        settled = !0, chunks.length = 0, res.headersSent || (res.writeHead(413, {
          "Content-Type": "application/json; charset=utf-8",
          Connection: "close"
        }), res.end(JSON.stringify({ error: "Payload Too Large" }), () => req.destroy())), resolvePromise({ aborted: !0 });
        return;
      }
      chunks.push(chunk);
    }), req.on("end", () => {
      if (settled) return;
      settled = !0;
      let raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolvePromise({ ok: !0, body: null });
        return;
      }
      try {
        let parsed = JSON.parse(raw);
        if (typeof parsed != "object" || parsed === null || Array.isArray(parsed)) {
          resolvePromise({
            ok: !1,
            status: 400,
            error: "JSON body must be an object"
          });
          return;
        }
        resolvePromise({ ok: !0, body: parsed });
      } catch {
        resolvePromise({ ok: !1, status: 400, error: "Invalid JSON" });
      }
    }), req.on("error", (err) => {
      settled || (settled = !0, resolvePromise({
        ok: !1,
        status: 400,
        error: err?.message || "Request stream error"
      }));
    });
  });
}
function isResponseLike(val) {
  return typeof val == "object" && val !== null && "body" in val && "contentType" in val && typeof val.contentType == "string";
}
var StandaloneLoopbackSidecar = class {
  pages = /* @__PURE__ */ new Map();
  apis = /* @__PURE__ */ new Map();
  server = null;
  port;
  host;
  uiToken;
  bodyLimitBytes;
  constructor(options = {}) {
    let rawPort = options.port !== void 0 ? Number(options.port) : Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || 0);
    this.port = Number.isInteger(rawPort) && rawPort >= 0 ? rawPort : 0, this.host = options.host || "127.0.0.1", this.uiToken = options.uiToken !== void 0 ? options.uiToken : process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN || "", this.bodyLimitBytes = options.bodyLimitBytes ?? MAX_JSON_BODY_BYTES;
  }
  page(routePath, handler) {
    return this.pages.set(routePath, handler), this;
  }
  api(routePath, handler, method = "POST") {
    let methodMap = this.apis.get(routePath);
    return methodMap || (methodMap = /* @__PURE__ */ new Map(), this.apis.set(routePath, methodMap)), methodMap.set(method.toUpperCase(), handler), this;
  }
  getHttpServer() {
    return this.server;
  }
  run() {
    if (this.server) return Promise.resolve(this.server);
    this.pages.has("/preload.js") || this.pages.set(
      "/preload.js",
      () => new SidecarResponse(FALLBACK_PRELOAD_JS, {
        contentType: "text/javascript; charset=utf-8",
        headers: { "Cache-Control": "no-store" }
      })
    );
    let server = http.createServer(async (req, res) => {
      let method = String(req.method || "GET").toUpperCase(), parsedUrl;
      try {
        parsedUrl = new URL(req.url || "/", "http://127.0.0.1");
      } catch {
        parsedUrl = new URL("/", "http://127.0.0.1");
      }
      let pathname = parsedUrl.pathname, originHeader = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
      if (!isAllowedLoopbackOrigin(originHeader)) {
        res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" }), res.end(
          method === "HEAD" ? void 0 : JSON.stringify({ error: "Forbidden origin" })
        );
        return;
      }
      if (originHeader && originHeader !== "null" && (res.setHeader("Access-Control-Allow-Origin", originHeader), res.setHeader("Vary", "Origin")), method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Sidecar-Token"
        }), res.end();
        return;
      }
      if ((method === "GET" || method === "HEAD") && pathname === "/_sidecar/health") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }), res.end(
          method === "HEAD" ? void 0 : JSON.stringify({ ok: !0, status: "ok", pid: process.pid })
        );
        return;
      }
      let rawHeaderTok = req.headers["x-sidecar-token"], headerTok = Array.isArray(rawHeaderTok) ? rawHeaderTok[0] : rawHeaderTok, urlTok = parsedUrl.searchParams.get("token") || "", providedTok = String(headerTok || urlTok || ""), cleanQueryEntries = [];
      for (let [k, v] of parsedUrl.searchParams.entries())
        !isSafeParamKey(k) || k.toLowerCase() === "token" || cleanQueryEntries.push([k, v]);
      if ((method === "GET" || method === "HEAD") && this.pages.has(pathname)) {
        if (this.uiToken && !verifySidecarToken(providedTok, this.uiToken)) {
          res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8" }), res.end(method === "HEAD" ? void 0 : "Unauthorized");
          return;
        }
        try {
          let out = await this.pages.get(pathname)(Object.fromEntries(cleanQueryEntries));
          if (res.headersSent || res.writableEnded) return;
          if (isResponseLike(out)) {
            res.writeHead(out.status ?? 200, {
              "Content-Type": out.contentType,
              ...out.headers
            }), res.end(method === "HEAD" ? void 0 : out.body);
            return;
          }
          res.writeHead(200, {
            "Content-Type": pathname.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8"
          }), res.end(method === "HEAD" ? void 0 : String(out ?? ""));
        } catch (err) {
          process.stderr.write(
            `[flight-recorder-sidecar] page error on ${pathname}: ${err instanceof Error ? err.message : String(err)}
`
          ), res.headersSent || (res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }), res.end(method === "HEAD" ? void 0 : "Internal Server Error"));
        }
        return;
      }
      if (this.apis.has(pathname)) {
        if (this.uiToken && !verifySidecarToken(providedTok, this.uiToken)) {
          res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" }), res.end(
            method === "HEAD" ? void 0 : JSON.stringify({ error: "Unauthorized" })
          );
          return;
        }
        let methodMap = this.apis.get(pathname), handler = methodMap.get(method) || (method === "HEAD" ? methodMap.get("GET") : void 0);
        if (!handler) {
          res.writeHead(405, {
            "Content-Type": "application/json; charset=utf-8",
            Allow: Array.from(methodMap.keys()).join(", ")
          }), res.end(
            method === "HEAD" ? void 0 : JSON.stringify({ error: "Method Not Allowed" })
          );
          return;
        }
        let bodyObj = null;
        if (method !== "GET" && method !== "HEAD") {
          let parsedBody = await readBoundedJsonBody(req, res, this.bodyLimitBytes);
          if ("aborted" in parsedBody) return;
          if (!parsedBody.ok) {
            res.writeHead(parsedBody.status, {
              "Content-Type": "application/json; charset=utf-8"
            }), res.end(JSON.stringify({ error: parsedBody.error }));
            return;
          }
          bodyObj = parsedBody.body;
        }
        let bodyEntries = bodyObj ? Object.entries(bodyObj).filter(([k]) => isSafeParamKey(k)) : [], data = Object.fromEntries([...cleanQueryEntries, ...bodyEntries]);
        try {
          let out = await handler(data);
          if (res.headersSent || res.writableEnded) return;
          if (isResponseLike(out)) {
            res.writeHead(out.status ?? 200, {
              "Content-Type": out.contentType,
              ...out.headers
            }), res.end(method === "HEAD" ? void 0 : out.body);
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }), res.end(method === "HEAD" ? void 0 : JSON.stringify(out ?? null));
        } catch (err) {
          process.stderr.write(
            `[flight-recorder-sidecar] api error on ${pathname}: ${err instanceof Error ? err.message : String(err)}
`
          ), res.headersSent || (res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" }), res.end(
            method === "HEAD" ? void 0 : JSON.stringify({ error: "Internal Server Error" })
          ));
        }
        return;
      }
      if (this.pages.has(pathname)) {
        res.writeHead(405, {
          "Content-Type": "application/json; charset=utf-8",
          Allow: "GET, HEAD"
        }), res.end(JSON.stringify({ error: "Method Not Allowed" }));
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }), res.end(method === "HEAD" ? void 0 : "Not Found");
    });
    return new Promise((resolvePromise, rejectPromise) => {
      server.once("error", rejectPromise), server.listen(this.port, this.host, () => {
        server.removeListener("error", rejectPromise), this.server = server;
        let addr = server.address();
        addr && typeof addr == "object" && (this.port = addr.port), resolvePromise(server);
      });
    });
  }
  close() {
    if (!this.server) return Promise.resolve();
    let srv = this.server;
    return this.server = null, new Promise((resolvePromise) => {
      srv.close(() => resolvePromise()), srv.closeAllConnections?.();
    });
  }
};
async function tryLoadSidecarSdk() {
  try {
    let sdk = await import("sidecar_sdk");
    if (typeof sdk?.SidecarApp == "function" && typeof sdk?.Response == "function")
      return {
        SidecarApp: sdk.SidecarApp,
        Response: sdk.Response
      };
  } catch {
  }
  return null;
}
function createApiHandler(schema, fn, ResponseClass) {
  return async (rawData = {}) => {
    try {
      let parsed = schema ? schema.parse(rawData ?? {}) : {}, payload = await fn(parsed);
      return new ResponseClass(JSON.stringify(payload ?? null), {
        contentType: "application/json; charset=utf-8",
        status: 200,
        headers: { "Cache-Control": "no-store" }
      });
    } catch (err) {
      if (err instanceof ZodError) {
        let msg = err.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
        return new ResponseClass(JSON.stringify({ error: `Invalid request: ${msg}` }), {
          contentType: "application/json; charset=utf-8",
          status: 400
        });
      }
      return err instanceof AppServiceError ? new ResponseClass(JSON.stringify({ error: err.message }), {
        contentType: "application/json; charset=utf-8",
        status: err.statusCode
      }) : (process.stderr.write(
        `[flight-recorder-sidecar] handler failure: ${err instanceof Error ? err.message : String(err)}
`
      ), new ResponseClass(JSON.stringify({ error: "Internal Server Error" }), {
        contentType: "application/json; charset=utf-8",
        status: 500
      }));
    }
  };
}
async function createTrackerSidecarServer(options) {
  let sdk = options.forceStandalone ? null : await tryLoadSidecarSdk(), mode = sdk ? "sidecar_sdk" : "standalone", ResponseClass = sdk ? sdk.Response : SidecarResponse, app = sdk ? new sdk.SidecarApp() : new StandaloneLoopbackSidecar({
    port: options.port,
    host: options.host,
    uiToken: options.uiToken
  }), appService = createTrackerAppService(options), version = readInstalledVersion(options.pluginRoot), serveDashboardHtml = () => {
    let rawHtml = readUiHtml(options.uiHtmlPath), uiToken = options.uiToken !== void 0 ? options.uiToken : process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN || "", resolvedTheme = resolveHostTheme({
      configJsonPath: options.configJsonPath,
      appStoragePath: options.appStoragePath
    }), html = injectSidecarBootstrap(rawHtml, {
      uiToken,
      initialTheme: resolvedTheme.mode,
      themeVariables: resolvedTheme.cssVariables,
      darkVariables: resolvedTheme.darkVariables,
      lightVariables: resolvedTheme.lightVariables
    });
    return new ResponseClass(html, {
      contentType: "text/html; charset=utf-8",
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  };
  return app.page("/", serveDashboardHtml), app.page("/index.html", serveDashboardHtml), app.api(
    "/api/health",
    () => new ResponseClass(
      JSON.stringify({
        ok: !0,
        status: "ok",
        version,
        mode,
        pid: process.pid
      }),
      {
        contentType: "application/json; charset=utf-8",
        status: 200,
        headers: { "Cache-Control": "no-store" }
      }
    ),
    "GET"
  ), app.api(
    "/api/dashboard",
    createApiHandler(
      DashboardQuerySchema,
      (input) => appService.getDashboardData(input),
      ResponseClass
    ),
    "POST"
  ), app.api(
    "/api/project",
    createApiHandler(
      ProjectDetailQuerySchema,
      (input) => appService.getProjectDetail(input),
      ResponseClass
    ),
    "POST"
  ), app.api(
    "/api/chat",
    createApiHandler(
      ChatDetailQuerySchema,
      (input) => appService.getChatDetail(input),
      ResponseClass
    ),
    "POST"
  ), app.api(
    "/api/rescan",
    createApiHandler(
      RescanQuerySchema,
      (input) => appService.rescanAll(input),
      ResponseClass
    ),
    "POST"
  ), app.api(
    "/api/pricing",
    createApiHandler(
      UpdatePricingSchema,
      (input) => appService.updatePricing(input),
      ResponseClass
    ),
    "POST"
  ), app.api(
    "/api/assign-project",
    createApiHandler(
      AssignProjectSchema,
      (input) => appService.assignProject(input),
      ResponseClass
    ),
    "POST"
  ), app.api(
    "/api/check-update",
    createApiHandler(null, () => appService.checkUpdate(), ResponseClass),
    "POST"
  ), {
    app,
    mode,
    async start() {
      let serverOrVoid = await app.run(), boundPort = null;
      if (app instanceof StandaloneLoopbackSidecar)
        boundPort = app.port;
      else if (serverOrVoid && typeof serverOrVoid.address == "function") {
        let addr = serverOrVoid.address();
        addr && typeof addr == "object" && (boundPort = addr.port);
      } else if (process.env.ANTIGRAVITY_SIDECAR_WEB_PORT) {
        let envPort = Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT);
        Number.isInteger(envPort) && envPort > 0 && (boundPort = envPort);
      }
      let close = async () => {
        typeof app.close == "function" ? await app.close() : serverOrVoid && typeof serverOrVoid.close == "function" && await new Promise((resolvePromise) => {
          serverOrVoid.close(() => resolvePromise());
        });
      };
      return {
        app,
        mode,
        port: boundPort,
        url: boundPort ? `http://127.0.0.1:${boundPort}` : null,
        close
      };
    }
  };
}
function parseHostPort(address) {
  let trimmed = address.trim();
  if (!trimmed) return null;
  let bracketMatch = /^\[([^\]]+)\]:(\d+)$/.exec(trimmed);
  if (bracketMatch) {
    let port2 = Number(bracketMatch[2]);
    return Number.isInteger(port2) && port2 > 0 && port2 <= 65535 ? { host: bracketMatch[1], port: port2 } : null;
  }
  let idx = trimmed.lastIndexOf(":");
  if (idx <= 0) return null;
  let host = trimmed.slice(0, idx), port = Number(trimmed.slice(idx + 1));
  return !host || !Number.isInteger(port) || port <= 0 || port > 65535 ? null : { host, port };
}
function watchLanguageServerLifecycle(onLost, options = {}) {
  let addr = options.lsAddress ?? process.env.ANTIGRAVITY_LS_ADDRESS ?? "", target = parseHostPort(addr);
  if (!target)
    return { active: !1, stop: () => {
    } };
  let intervalMs = options.intervalMs ?? LS_WATCH_INTERVAL_MS, maxFailures = options.maxFailures ?? LS_WATCH_MAX_FAILURES, consecutiveFailures = 0, stopped = !1, timer = setInterval(() => {
    if (stopped) return;
    let sock = net.createConnection({ host: target.host, port: target.port }), handled = !1, finish = (ok) => {
      handled || (handled = !0, sock.destroy(), !stopped && (ok ? consecutiveFailures = 0 : (consecutiveFailures += 1, consecutiveFailures >= maxFailures && (stop(), onLost()))));
    };
    sock.setTimeout(1500), sock.once("connect", () => finish(!0)), sock.once("timeout", () => finish(!1)), sock.once("error", () => finish(!1));
  }, intervalMs);
  timer.unref();
  let stop = () => {
    stopped || (stopped = !0, clearInterval(timer));
  };
  return { active: !0, stop };
}
async function startSidecarMain(argv = process.argv.slice(2)) {
  let uiHtmlPath = path8.resolve(import.meta.dirname, "..", "ui", "index.html"), pluginRoot = path8.resolve(import.meta.dirname, "..", ".."), dataDir = resolveDataDir({
    argv,
    pluginRoot,
    preferSharedPluginData: !0
  }), db = new TrackerDatabase(dataDir), handle = await (await createTrackerSidecarServer({
    db,
    dataDir,
    uiHtmlPath,
    pluginRoot
  })).start();
  createTrackerAppService({ db, dataDir, uiHtmlPath, pluginRoot }).scanNow().catch((err) => {
    process.stderr.write(
      `[flight-recorder-sidecar] initial scan warning: ${err instanceof Error ? err.message : String(err)}
`
    );
  });
  let shuttingDown = !1, lsWatcher = {
    active: !1,
    stop: () => {
    }
  }, shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = !0, lsWatcher.stop(), setTimeout(() => process.exit(0), 1500).unref(), Promise.resolve(handle.close()).catch(() => {
    }).finally(() => {
      try {
        db.close();
      } catch {
      }
      process.exit(0);
    });
  };
  return lsWatcher = watchLanguageServerLifecycle(shutdown), process.on("SIGINT", shutdown), process.on("SIGTERM", shutdown), handle;
}
var isDirectEntry = !!process.argv[1] && pathToFileURL(path8.resolve(process.argv[1])).href === import.meta.url;
isDirectEntry && process.env.NODE_ENV !== "test" && startSidecarMain().catch((err) => {
  process.stderr.write(
    `[flight-recorder-sidecar] fatal error: ${err instanceof Error ? err.stack ?? err.message : String(err)}
`
  ), process.exit(1);
});
export {
  SidecarResponse,
  StandaloneLoopbackSidecar,
  createTrackerSidecarServer,
  injectSidecarBootstrap,
  isAllowedLoopbackOrigin,
  resolveInitialHostTheme,
  startSidecarMain,
  verifySidecarToken,
  watchLanguageServerLifecycle
};
