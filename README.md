google-api4node
===============

this is google API(now Spreadsheet only) client for Node.


Install
========

use `git clone`

How to use
===========

    var SpreadsheetService = require('google-api4node').SpreadsheetService;
    var service = new SpreadsheetService(accessToken);
    service.client().getEntry(function (err, entries){// entries is Array of Spreadsheet entry
      if(!entries.length){
        console.log(entries[0].title, entries[0].updated);
        console.log()
      }
    });
