/// <reference path="./typings/tsd.d.ts" />
"use strict";
var Onebus = require("./onebus");
// Add your own trips here
var trips = {
    "redmond": [{ stopId: "1_682", bus: "545E" }]
};
var alexa = require('alexa-app');
var appName = 'Lily';
var app = new alexa.app(appName);
app.intent('GetMyBusIntent', {
    "slots": { "destination": "AMAZON.LITERAL" },
    "utterances": Object.keys(trips).map(function (destination) { return ("where is my bus to {" + destination + "|destination}"); })
}, function (request, response) {
    var destination = (request.slot('destination') || "").toLowerCase();
    var buses = trips[destination];
    var promise = buses ? Onebus.getBusArrivalMessage(destination, buses) : Q("The destination " + destination + " is unknown.");
    promise
        .then(function (message) {
        response.say(message);
        response.card(appName, message);
        response.send();
    });
    return false;
});
exports.handler = app.lambda();
if ((process.argv.length === 3) && (process.argv[2] === 'schema')) {
    console.log(app.schema());
    console.log(app.utterances());
}
