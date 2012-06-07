var Service = require('./../lib/Service.js'),
    util = require('util'),
    baseURL = 'https://spreadsheets.google.com/feeds/';
var templates = require('./../lib/templateReader.js')({
  insertWorksheets: __dirname + '/template/addWS.ejs',
  insertRow: __dirname + '/template/addListRow.ejs',
  updateCell: __dirname + '/template/updateCell.ejs'
});

/**
 * @param service
 * @param [entry]
 * @constructor
 */
function CellsClient(service, entry) {
  this.service = service;
  if (entry) {
    this.row = entry.row;
    this.col = entry.col;
    this.selfURL = baseURL + 'cells/' + entry.key + '/' + entry.id +
                   '/' + entry.visibility + '/' + entry.projection +
                   '/' + entry.cellId;
  }
}
/**
 *
 * @param wsClient
 * @param {Number} row
 * @param {Number} col
 * @return {CellsClient}
 */
CellsClient.create = function (wsClient, row, col) {
  var client = new CellsClient(wsClient.service);
  client.row = row;
  client.col = col;
  client.selfURL = baseURL + 'cells/' + wsClient.key + '/' + wsClient.id +
                   '/' +
                   wsClient.visibility + '/' + wsClient.projection +
                   '/R' + row + 'C' + col;
  return client;
};


CellsClient.prototype.update = function (value, callback) {
  this.service._request({
    method: 'PUT',
    url: this.selfURL,
    body: templates.updateCell({entry: this, inputValue: value}),
    headers: this.service.buildHeader('*')
  }, callback);
};
/**
 * @param feed
 * @return {Array}
 */
function ListEntryFactory(feed) {
  if (feed["opensearch:totalresults"] > 0) {
    var keys = Object.keys(feed.items[0]).filter(function (key) {
      return ~key.indexOf(':');
    });
    var result = feed.id.split('/');

    function Entry(item) {
      this.updated = item.updated;
      var r = item.id.split('/');
      this.rowId = r[7];
      //      this.version = r[10];
      var data = this.data = {};
      keys.forEach(function (key) {
        data[key.slice(4)] = item[key];
      });
      this.etag = item["gd:etag"];
    }

    Entry.prototype.key = result[5];
    Entry.prototype.id = result[6];
    Entry.prototype.visibility = result[7];
    Entry.prototype.projection = result[8];
    return feed.items.map(function (item) {return new Entry(item);});
  } else {
    return [];
  }
}
/**
 * TODO numericValue
 * @param feed
 * @return {Array}
 */
function CellEntryFactory(feed, service) {
  if (feed["opensearch:totalresults"] > 0) {
    function Entry(item) {
      this.title = item.title;
      this.updated = item.updated;
      //      var r = item.id.split('/');
      //      this.cellId = r[7];
      var cell = item["gs:cell"];
      this.row = cell.row;
      this.col = cell.col;
      this.cellId = 'R' + this.row + 'C' + this.col;
      this.inputValue = cell.inputValue;
      this.text = cell.text;
      this.etag = item["gd:etag"];
    }

    var r = feed.id.split('/');
    Entry.prototype.key = r[5];
    Entry.prototype.id = r[6];
    Entry.prototype.visibility = r[7];
    Entry.prototype.projection = r[8];
    Entry.prototype.client = function () {
      return new CellsClient(service, this);
    };
    return feed.items.map(function (item) {return new Entry(item);});
  } else {
    return [];
  }
}
/**
 * @param {Service} service
 * @param {Object} entry
 * @constructor
 */
function WorksheetClient(service, entry) {
  this.service = service;
  this.listURL = [
    baseURL, 'list', entry.key, entry.id, entry.visibility, entry.projection
  ].join('/');
  this.cellURL = [
    baseURL, 'cells', entry.key, entry.id, entry.visibility, entry.projection
  ].join('/');
}
/**
 * @param {Object} list
 * @param {Function} callback
 */
WorksheetClient.prototype.insert = function (list, callback) {
  this.service._post(this.listURL, templates.insertRow({list: list}), callback);
};
/**
 * @param callback
 */
WorksheetClient.prototype.getListFeed = function (callback) {
  this.service._get(this.listURL, null, callback);
};
/**
 * @param callback
 */
WorksheetClient.prototype.getCellFeed = function (callback) {
  this.service._get(this.cellURL, null, callback);
};
/**
 * @param query
 * @return {String}
 */
function andQuery(query) {
  var prop, and = [];
  Object.keys(query).forEach(function (field) {
    prop = query[field];
    switch (typeof prop) {
    case 'string':
    case 'number':
      and.push(field + '=' + prop);
      break;
    case 'object':
      if (prop && !Array.isArray(prop)) {
        Object.keys(prop || {}).forEach(function (operator) {
          var op;
          switch (operator) {
          case '$ne':
            op = '!=';
            break;
          case '$gt':
            op = '>';
            break;
          case '$lt':
            op = '<';
            break;
          case '$gte':
            op = '>=';
            break;
          case '$lte':
            op = '<=';
            break;
          case '$eq':
            op = '=';
            break;
          default :
            return;
          }
          return and.push(field + op + prop[operator]);
        });
      }
    }
  });
  return and.join(' and ');
}
/**
 * @param query
 * @return {String}
 */
function queryBuilder(query) {
  var prop, and = andQuery(query);
  if (query.$or && Array.isArray(query.$or)) {
    var or = query.$or.map(andQuery).filter(Boolean);
  }
  or.push(and);
  return or.join(' or ');
}

/**
 * @param query
 * @param {Function} callback
 */
WorksheetClient.prototype.getListEntry = function (query, callback) {
  var qs = null;
  if (query) {
    //orderby,reverse
    qs = {};
    if (query.orderby) {
      qs.orderby = query.orderby;
    }
    if (query.reverse) {
      qs.reverse = 'true';
    }
    if (query.query) {
      if (typeof query.query === 'object') {
        qs.sq = queryBuilder(query);
      } else {
        qs.sp = query.query;
      }
    }
  }
  this.service._get(this.listURL, qs,
      function (err, feed) {
        if (err) {
          return callback(err);
        }
        callback(err, ListEntryFactory(feed));
      });
}
;
/**
 * @param {Object|Function}scope
 * @param {String|Number} [scope.min-row]
 * @param {String|Number} [scope.max-row]
 * @param {String|Number} [scope.min-col]
 * @param {String|Number} [scope.max-col]
 * @param {Function} [callback]
 */
WorksheetClient.prototype.getCellEntry = function (scope, callback) {
  var service = this.service;
  if (typeof scope === "function") {
    this.service._get(this.cellURL, null,
        function (err, feed) {
          if (err) {
            return scope(err);
          }
          scope(err, CellEntryFactory(feed, service));
        });
  } else {
    this.service._get(this.cellURL, scope || null,
        function (err, feed) {
          if (err) {
            return callback(err);
          }
          callback(err, CellEntryFactory(feed, service));
        });
  }
};
/**
 *
 * @param row
 * @param col
 * @return {CellsClient}
 */
WorksheetClient.prototype.cellClient = function (row, col) {
  return CellsClient.create(this, row, col);
};
/**
 * @param feed
 * @param service
 * @return {Array}
 */
function WorksheetEntryFactory(feed, service) {
  if (feed["opensearch:totalresults"] > 0) {
    var result = feed.id.split('/');

    function Entry(item) {
      this.title = item.title;
      this.updated = item.updated;
      this.row = item['gs:rowcount'];
      this.col = item['gs:colcount'];
      var r = item.id('/');
      this.id = r[6];
      this.etag = item["gd:etag"];
    }

    Entry.prototype.key = result[5];
    Entry.prototype.visibility = result[6];
    Entry.prototype.projection = result[7];
    Entry.prototype.client = function () {
      return new WorksheetClient(service, this);
    };
    return feed.items.map(function (item) {return new Entry(item);});
  } else {
    return [];
  }
}

/**
 *
 * @param {Service} service
 * @param {Object} entry
 * @constructor
 */
function SpreadsheetClient(service, entry) {

  this.service = service;
  //  this.entry = entry;
  this.worksheetsURL = [
    baseURL, 'worksheets', entry.key, entry.visibility, entry.projection
  ].join('/');

}

/**
 * @param {Function} callback
 */
SpreadsheetClient.prototype.getFeed = function (callback) {
  this.service._get(this.worksheetsURL, null, callback);
};
/**
 * @param {Function} callback
 */
SpreadsheetClient.prototype.getEntry = function (callback) {
  var service = this.service;
  service._get(this.worksheetsURL, null,
      function (err, feed) {
        if (err) {
          return callback(err);
        }
        callback(err, WorksheetEntryFactory(feed, service));
      });
};
/**
 * @param worksheet
 * @param {String} worksheet.title
 * @param {String|Number} worksheet.row
 * @param {String|Number} worksheet.col
 * @param {Function} callback
 */
SpreadsheetClient.prototype.insert = function (worksheet, callback) {
  var body = templates.insertWorksheets(worksheet || {});
  this.service._post(this.url, body, callback);
};

/**
 *
 * @param feed
 * @param service
 * @return {Array}
 */
function SpreadsheetEntryFactory(feed, service){
  if (feed["opensearch:totalresults"] > 0) {
    var result = feed.id.split('/');
    function Entry(item) {
      this.title = item.title;
      this.updated = item.updated;
      this.author = item.author;
      var r = item.id('/');
      this.key = r[5];
      this.etag = item["gd:etag"];
    }
    Entry.prototype.visibility = result[5];
    Entry.prototype.projection = result[6];
    Entry.prototype.client = function () {
      return new SpreadsheetClient(service, this);
    };
    return feed.items.map(function (item) {return new Entry(item);});
  } else {
    return [];
  }
}
/**
 * @param {String} accessToken
 * @constructor
 */
function SpreadsheetService(accessToken) {
  Service.call(this, accessToken);
}
/**
 * inherit
 */
util.inherits(SpreadsheetService, Service);
/**
 * @param service
 * @param visibility
 * @param projection
 * @constructor
 */
function PseudoClient(service, visibility, projection) {
  this.ssURL = baseURL + 'spreadsheets/' + visibility + '/' + projection;
  this.service = service;
}
/**
 * @param callback
 */
PseudoClient.prototype.getEntry = function (callback) {
  var service = this.service;
  service._get(this.ssURL, null, function (err, feed) {
    if (err) {
      return callback(err);
    }

    var entries = feed["opensearch:totalresults"] ?
                  feed.items.map(function (item) {
                    return new SpreadsheetEntry(item);
                  }) : [];
    callback(err, entries);
  });
};
/**
 * @param callback
 */
PseudoClient.prototype.getFeed = function (callback) {
  this.service._get(this.ssURL, null, callback);
};
/**
 *
 * @param {String} [visibility]
 * @param {String} [projection]
 */
SpreadsheetService.prototype.client = function (visibility, projection) {
  return new PseudoClient(this, visibility || 'private', projection || 'full')
};
/**
 *
 * @param ssEntry
 * @param [visibility]
 * @param [projection]
 * @return {SpreadsheetClient}
 */
SpreadsheetService.prototype.spreadsheet = function (ssEntry/* || key */,
    visibility, projection) {
  var entry;
  if (typeof ssEntry === 'string') {
    entry = {
      key: ssEntry,
      visibility: visibility || 'private',
      projection: projection || 'full'
    };
  } else {
    ssEntry.visibility = ssEntry.visibility || 'private';
    ssEntry.projection = ssEntry.projection || 'full';
    entry = ssEntry;
  }
  if (!entry.key) {
    throw new Error('No key')
  }
  return new SpreadsheetClient(this, entry);
};
/**
 * @param wsEntry
 * @param wsId
 * @param [visibility]
 * @param [projection]
 * @return {WorksheetClient}
 */
SpreadsheetService.prototype.worksheet = function (wsEntry/* || key */, wsId,
    visibility, projection) {
  var entry;
  if (typeof wsEntry === 'string') {
    entry = {
      key: wsEntry,
      id: wsId,
      visibility: visibility,
      projection: projection
    };
  } else {
    entry = wsEntry;
  }
  entry.visibility = entry.visibility || 'private';
  entry.projection = entry.projection || 'full';
  if (!entry.key || !entry.id) {
    throw new Error('No key || id')
  }
  return new WorksheetClient(this, entry);
};

module.exports = SpreadsheetService;
SpreadsheetService.queryBuilder = queryBuilder;

/**
 * obsolete
 */
/**
 * @param entry
 * @constructor
 * @augments Service
 */
function SpreadsheetEntry(entry) {
  this.title = entry.title;
  this.updated = entry.updated;
  var r = entry.content.src.split('/');
  this.key = r[5];
  this.visibility = r[6];
  this.projection = r[7];
}
/**
 * @param {Function} callback
 */
SpreadsheetService.prototype.getFeed = function (callback) {
  this._get(this.spreadsheetsURL, null, callback);
};

/**
 * @param {Function} callback
 */
SpreadsheetService.prototype.getEntry = function (callback) {
  var service = this;
  service._get(this.spreadsheetsURL, null, function (err, feed) {
    if (err) {
      return callback(err);
    }

    var entries = feed["opensearch:totalresults"] ?
                  feed.items.map(function (item) {
                    return new SpreadsheetEntry(item);
                  }) : [];
    callback(err, entries);
  });
};
