const jsdom = require("jsdom");
const esprima = require("esprima");
const estraverse = require("estraverse");
const fs = require("fs");

function extractJavaScript(html) {
 const dom = new jsdom.JSDOM(html);
 const scripts = dom.window.document.querySelectorAll("script");
 let code = "";
 for (let i = 0; i < scripts.length; i++) {
 const script = scripts\[i\];
 if (script.src) {
 continue;
 }
 code += "\\n"
 code += script.textContent;
 }
 return code;
}

function extract\_id(code) {
 const ast = esprima.parseScript(code);
 let id = "";
 estraverse.traverse(ast, {
 enter: function (node) {
 if (node.type === "VariableDeclaration") {
 node.declarations.forEach((declaration) => {
 if (declaration.id.name === "arg1") {
 if (declaration.init && declaration.init.type === "Literal") {
 id = declaration.init.value;
 return declaration.init.value;
 }
 }
 });
 }
 },
 });
 return id;
}

function extract\_ciphers(code) {
 const ast = esprima.parseScript(code);
 let \_0x4818 = \[\];
 estraverse.traverse(ast, {
 enter: function (node) {
 if (node.type === "VariableDeclaration") {
 node.declarations.forEach((declaration) => {
 if (declaration.id.name === "\_0x4818") {
 if (
 declaration.init &&
 declaration.init.type === "ArrayExpression"
 ) {
 declaration.init.elements.map((element) => {
 if (element.type === "Literal") {
 \_0x4818.push(element.value);
 return element.value;
 }
 return null;
 });
 }
 }
 });
 }
 },
 });
 return \_0x4818;
}

function get\_num\_shifts(code) {
 const ast = esprima.parseScript(code);
 let found = false;
 let num\_shifts = 0;
 estraverse.traverse(ast, {
 enter: function (node) {
 if (!found && node.type === "CallExpression") {
 const callee = node.callee;
 if (
 callee.type === "FunctionExpression" \|\|
 callee.type === "ArrowFunctionExpression"
 ) {
 found = true;
 let args = node.arguments.map((arg) => {
 if (arg.type === "Literal") {
 return arg.value;
 }
 });
 num\_shifts = args\[1\];
 this.break();
 }
 }
 },
 });
 return num\_shifts;
}

function extract\_keys(code) {
 const ast = esprima.parseScript(code);
 let keys = {};
 estraverse.traverse(ast, {
 enter: function (node) {
 if (
 node.type === "CallExpression" &&
 node.callee &&
 node.callee.name === "\_0x55f3"
 ) {
 let args = node.arguments.map((arg) => {
 if (arg.type === "Literal") {
 return arg.value;
 }
 return esprima
 .tokenize(arg)
 .map((token) => token.value)
 .join("");
 });
 let index = parseInt(args\[0\]);
 keys\[index\] = args\[1\];
 }
 },
 });
 return keys;
}

function extract\_shuffles(code) {
 const ast = esprima.parseScript(code);
 let shuffles = \[\];
 estraverse.traverse(ast, {
 enter: function (node, parent) {
 if (node.type === "VariableDeclaration") {
 node.declarations.forEach((declaration) => {
 if (declaration.init && declaration.init.type === "ArrayExpression") {
 if (declaration.init.elements.length == 40) {
 declaration.init.elements.map((element) => {
 if (element.type === "Literal") {
 shuffles.push(element.value);
 return element.value;
 }
 return null;
 });
 }
 }
 });
 }
 },
 });
 return shuffles;
}

var rc4 = function (data, key) {
 var s = \[\],
 j = 0,
 temp,
 output = "";
 for (var i = 0; i < 256; i++) {
 s\[i\] = i;
 }
 for (var i = 0; i < 256; i++) {
 j = (j + s\[i\] + key.charCodeAt(i % key.length)) % 256;
 temp = s\[i\];
 s\[i\] = s\[j\];
 s\[j\] = temp;
 }
 i = 0;
 j = 0;
 for (var k = 0; k < data.length; k++) {
 i = (i + 1) % 256;
 j = (j + s\[i\]) % 256;
 temp = s\[i\];
 s\[i\] = s\[j\];
 s\[j\] = temp;
 output += String.fromCharCode(data.charCodeAt(k) ^ s\[(s\[i\] + s\[j\]) % 256\]);
 }
 return output;
};

function convert\_cipher(cipher) {
 let new\_cipher = atob(cipher);
 var encodedData = "";
 for (var i = 0; i < new\_cipher.length; i++) {
 encodedData +=
 "%" \+ ("00" + new\_cipher.charCodeAt(i).toString(16)).slice(-2);
 }
 return decodeURIComponent(encodedData);
}

function unhex(hexStr) {
 let str = "";
 for (let i = 0; i < hexStr.length; i += 2) {
 const hex = hexStr.substr(i, 2);
 str += String.fromCharCode(parseInt(hex, 16));
 }
 return str;
}

function hex(str) {
 let hexStr = "";
 for (let i = 0; i < str.length; i++) {
 const hex = str.charCodeAt(i).toString(16);
 hexStr += ("00" + hex).slice(-2);
 }
 return hexStr;
}

function xor(str1, str2) {
 let result = "";
 const length = Math.min(str1.length, str2.length);
 for (let i = 0; i < length; i++) {
 result += String.fromCharCode(str1.charCodeAt(i) ^ str2.charCodeAt(i));
 }
 return result;
}

function hexor(hexStr1, hexStr2) {
 return hex(xor(unhex(hexStr1), unhex(hexStr2)));
}

function unbox(str, shuffles) {
 let unboxed = new Array(shuffles.length);
 for (let i = 0; i < shuffles.length; i++) {
 const v = shuffles\[i\];
 if (v - 1 < str.length) {
 unboxed\[i\] = str\[v - 1\];
 }
 }
 return unboxed.join("");
}

function generate(id, key, shuffles) {
 return hexor(key, unbox(id, shuffles));
}

function acw\_sc\_\_v2(html) {
 let code = extractJavaScript(html);
 console.log(code);
 let ciphers = extract\_ciphers(code);
 console.log(ciphers);
 let num\_shifts = get\_num\_shifts(code);
 console.log(num\_shifts);
 while (num\_shifts > 0) {
 ciphers.push(ciphers.shift());
 num\_shifts--;
 }
 console.log(ciphers);
 let keys = extract\_keys(code);
 console.log(keys);
 let key = rc4(convert\_cipher(ciphers\[3\]), keys\[3\]);
 console.log(key);
 let shuffles = extract\_shuffles(code);
 console.log(shuffles);
 let origin\_id = extract\_id(code);
 console.log(origin\_id);
 let plain = generate(origin\_id, key, shuffles);
 console.log(plain);
 return plain
}

function main() {
 console.log("acw\_sc\_\_v2=" + acw\_sc\_\_v2(fs.readFileSync("assets/index.html", "utf8")));
}

exports.acw\_sc\_\_v2 = acw\_sc\_\_v2;
exports.main = main;