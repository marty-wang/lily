/// <reference path="./typings/tsd.d.ts" />
"use strict";
var http = require("http");
var Q = require("q");
exports.get = function (url) {
    var defer = Q.defer();
    http
        .get(url, function (res) {
        var body = '';
        res.on('data', function (data) {
            body += data;
        });
        res.on('end', function () {
            var result = JSON.parse(body);
            defer.resolve(result);
        });
    })
        .on('error', function (error) {
        console.log('Error: ' + error);
        defer.reject(error);
    });
    return defer.promise;
};
