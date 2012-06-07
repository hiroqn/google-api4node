google-api4node
===============

this is google API(now Spreadsheet only) client for Node.


Install
========

use `git clone`

How to use
===========
##official
[google spreadsheet](https://developers.google.com/google-apps/spreadsheets/)

##spreadsheet
###Retrieving a list of spreadsheets

    var SpreadsheetService = require('google-api4node').SpreadsheetService;
    var service = new SpreadsheetService(accessToken);
    service.client().getEntry(function (err, entries) {
      // entries is Array of Spreadsheet entry
      if(err){
        // error
      }
      if (!entries.length) {
        entries.forEach(function (entry) {
          console.log('title: ' + entry.title, 'updated: ' + entry.updated);
          console.log('author.name: ' + entry.author.name);
          console.log('author.email: ' + entry.author.email);
        });
      } else {
        console.log('no entry');
      }
    });

##Working with worksheets


    var client = entry.client(); //entry is got above

or

    var client = service.spreadsheet(spreadsheetKey);

and

###Retrieving information about worksheets

    client.getEntry(function (err, entries) {
      if(err){
        // error
      }
      // entries is Array of Spreadsheet entry
      if (!entries.length) {
        entries.forEach(function (entry) {
          console.log('title: ' + entry.title, 'updated: ' + entry.updated);
          console.log('row,col: ' + entry.row + ' , ' + entry.col);
        });
      } else {
        console.log('no worksheet');
      }
    });
###Adding a worksheet

###Modifying a worksheet's title and size
no
###Deleting a worksheet
no
##Working with list-based feeds

    var client = entry.client(); //entry is got above

or

    var client = service.worksheet(spreadsheetKey, worksheetId);

and

###Retrieving a list-based feed

###Adding a list row

###Updating a list row
no
###Deleting a list row
no

##Working with cell-based feeds

###Retrieving a cell-based feed

###Changing contents of a cell

###Updating multiple cells with a batch request
no
