var fs = require('fs'),
    ejs = require('ejs');

module.exports = function (object){
  var funcs =new Object();
  Object.keys(object).forEach(function (key){
    funcs[key] = ejs.compile(fs.readFileSync(object[key]).toString());
  });
  return funcs;
};