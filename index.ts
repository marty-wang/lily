/// <reference path="./typings/tsd.d.ts" />

import * as Onebus from "./onebus";

const config = require("config");
const trips: { [key: string]: Onebus.BusesAtStop | Onebus.BusAtStop[] } = config.get("trips");

const alexa = require('alexa-app');

const appName = 'Lily';
const app = new alexa.app(appName);

app.intent(
    'GetMyBusIntent',
    {
        "slots":{ "destination": "AMAZON.LITERAL" },
        "utterances": Object.keys(trips).map((destination) => `where is my bus to {${destination}|destination}`)
    },
    (request, response) => {
        const destination = (request.slot('destination') || "").toLowerCase();
        const buses = trips[destination];
        const promise = buses ? Onebus.getBusArrivalMessage(destination, buses) : Q(`The destination ${destination} is unknown.`);
        
        promise
            .then((message) => {
                response.say(message);
                response.card(appName, message);
                response.send();
            });
        
        return false;
    }
);

exports.handler = app.lambda();

if ((process.argv.length === 3) && (process.argv[2] === 'schema'))
{
    console.log (app.schema ());
    console.log (app.utterances ());
}