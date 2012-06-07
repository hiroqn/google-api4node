var SpreadsheetService = require('./index.js').SpreadsheetService,
    util = require('util'),
    accessToken;
if(process.argv[2]){
  accessToken = process.argv[2];
} else {
  throw new Error('no access token');
}

var service = new SpreadsheetService(accessToken);
service.client().getEntry(function (err, entries){// entries is Array of Spreadsheet entry
  if(!entries.length){
    console.log(entries[0].title, entries[0].updated);
    console.log()
  }
});
