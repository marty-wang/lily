"use strict";
var Q = require("q");
var Request = require("./request");
var config = require("config");
var busArrivalUrl = function (stopId) {
    var key = config.get("apiKeys.oneBusAway");
    return "http://api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/" + stopId + ".json?key=" + key;
};
var getBusArrival = function (stopId, busShortName, destination) {
    var requestUrl = busArrivalUrl(stopId);
    var calculateArrivalTime = function (arrivalTime) { return Math.floor((arrivalTime - Date.now()) / 1000 / 60); };
    var getArrivalTime = function (item) { return item.predictedArrivalTime || item.scheduledArrivalTime; };
    return Request.get(requestUrl)
        .then(function (result) {
        var arrivals = result.data.entry.arrivalsAndDepartures
            .filter(function (item) {
            var arrivalTime = getArrivalTime(item);
            return item.arrivalEnabled
                && item.departureEnabled
                && item.routeShortName.toLowerCase() === busShortName.toLowerCase()
                && arrivalTime
                && calculateArrivalTime(arrivalTime) >= 1;
        })
            .map(function (item) {
            var arrivalTime = getArrivalTime(item);
            return {
                arrivalTime: calculateArrivalTime(arrivalTime),
                predicted: item.predicted,
                busShortName: busShortName
            };
        })
            .slice(0, 3);
        return arrivals;
    });
};
exports.getBusArrivalMessage = function (destination, buses) {
    var busArray = Array.isArray(buses)
        ? buses
        : buses.buses.map(function (bus) { return { stopId: buses.stopId, bus: bus }; });
    var promises = busArray.map(function (bus) { return getBusArrival(bus.stopId, bus.bus, destination); });
    return Q.allSettled(promises)
        .then(function (results) {
        var arrivals = [];
        results.forEach(function (result) {
            if (result.state === "fulfilled") {
                arrivals = arrivals.concat(result.value);
            }
        });
        arrivals.sort(function (a, b) { return a.arrivalTime - b.arrivalTime; });
        if (arrivals.length) {
            var line1 = "There are " + arrivals.length + " buses coming up for " + destination + ".";
            var line2 = arrivals
                .map(function (arrival) {
                var suffix = arrival.predicted ? "as predicted" : "as scheduled";
                return "A Bus " + arrival.busShortName + " will arrive in " + arrival.arrivalTime + " minutes " + suffix + ".";
            })
                .join(" ");
            return line1 + " " + line2;
        }
        return "There is no bus coming up for " + destination + ".";
    });
};
