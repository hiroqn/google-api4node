var SpreadsheetService = require('./index.js').SpreadsheetService,
    util = require('util'),
    accessToken;
if (process.argv[2]) {
  accessToken = process.argv[2];
} else {
  throw new Error('no access token');
}

var service = new SpreadsheetService(accessToken);
service.client().getEntry(function (err, entries) {
  // entries is Array of Spreadsheet entry
  if (!entries.length) {
    entries.forEach(function (entry) {
      console.log('title: ' + entry.title, 'uploaded: ' + entry.updated);
      console.log('author.name: ' + entry.author.name);
      console.log('author.email: ' + entry.author.email);
    });
  } else {
    console.log('no entry');
  }
});
