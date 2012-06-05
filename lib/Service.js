var ejs = require('ejs')
    , request = require('request')
    , util = require('util')
    , FeedMe = require('feedme');
/**
 * @param {String} accessToken
 * @constructor
 */
function Service(accessToken) {
  if (!accessToken && typeof accessToken !== 'string') {
    throw new Error('accessToken!!');
  }
  this.accessToken = accessToken;
  this.headers = {
    'GData-Version': '3.0',
    'Content-type': 'application/atom+xml',
    'Authorization': 'Bearer ' + accessToken//,
//    'If-Match': '*'
  };
}
Service.prototype.buildHeader = function(Etag){
  var header = {
    'GData-Version': '3.0',
    'Content-type': 'application/atom+xml',
    'Authorization': 'Bearer ' + this.accessToken
  };
  if(Etag){
    header['If-Match'] = Etag;
  }
  return header;
};

/**
 * @param {Object} options
 * @param {Function} callback
 * @private
 */
Service.prototype._request = function (options, callback) {
  if(!options.headers){
    options.headers = this.headers;
  }
  request(options,
      function (err, response, body) {
        if (!err && response.statusCode <= 201) {
          var parser = new FeedMe(true);
          parser.write(body);
          callback(err, parser.done());
        } else {
          callback(err || response.statusCode, {});
        }
      });
};

/**
 * @param {String} url
 * @param {String} body
 * @param {Function} callback
 * @private
 */
Service.prototype._post = function (url, body, callback) {
  console.log(body);
  this._request(
      {
        method: 'POST',
        url: url,
        body: body
      }, callback);
};
/**
 * @param {String} url
 * @param {Object} qs
 * @param {Function} callback
 * @private
 */
Service.prototype._get = function (url, qs, callback) {
  this._request(
      {
        method: 'GET',
        url: url,
        qs: qs
      }, callback);
};
/**
 * @param {String} url
 * @param {String} body
 * @param {Function} callback
 * @private
 */
Service.prototype._put = function (url, body, callback) {
  this._request(
      {
        method: 'PUT',
        url: url,
        body: body
      }, callback);
};
/**
 * @param callback
 */
Service.prototype.validateToken = function (callback) {
  request.get({
        url: 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' +
             this.accessToken
      },
      function (err, response, body) {
        if (err || response.statusCode > 201) {
          callback(err || response.statusCode, null);
        } else {
          callback(err, JSON.parse(body));
        }
      });
};
module.exports = Service;