import * as Config from "./config";
import * as Q from "q";
import * as Request from "./request";

const busArrivalUrl = (stopId) => {
    return `http://api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/${stopId}.json?key=${Config.ONE_BUS_AWAY_KEY}`;
}

interface BusArrival {
    busShortName: string;
    arrivalTime: number;
    predicted: boolean;
}

export interface BusAtStop {
    stopId: string;
    bus: string;
}

export interface BusesAtStop {
    stopId: string; 
    buses: string[];
}

const getBusArrival = (stopId: string, busShortName: string, destination: string) => {
    const requestUrl = busArrivalUrl(stopId);
    const calculateArrivalTime = (arrivalTime: number) => Math.floor((arrivalTime - Date.now()) / 1000 / 60);
    const getArrivalTime = (item: any) => item.predictedArrivalTime || item.scheduledArrivalTime;
    
    return Request.get(requestUrl)
        .then((result: any) => {
            const arrivals: BusArrival[] = result.data.entry.arrivalsAndDepartures
                .filter((item) => {
                    const arrivalTime = getArrivalTime(item);
                    return item.arrivalEnabled 
                        && item.departureEnabled 
                        && item.routeShortName.toLowerCase() === busShortName.toLowerCase() 
                        && arrivalTime 
                        && calculateArrivalTime(arrivalTime) >= 1
                })
                .map((item) => {
                    const arrivalTime = getArrivalTime(item);
                    return <BusArrival>{
                        arrivalTime: calculateArrivalTime(arrivalTime),
                        predicted: item.predicted,
                        busShortName: busShortName
                    };
                })
                .slice(0, 3);
                
            return arrivals;
        });
}

export const getBusArrivalMessage = (destination: string, buses: BusAtStop[] | BusesAtStop) => {
    const busArray = Array.isArray(buses)
        ? buses
        : buses.buses.map((bus) => <BusAtStop>{ stopId: buses.stopId, bus: bus });
    
    const promises = busArray.map((bus) => getBusArrival(bus.stopId, bus.bus, destination));
    
    return Q.allSettled(promises)
        .then((results) => {
            let arrivals: BusArrival[] = [];
            
            results.forEach((result) => {
                if (result.state === "fulfilled") {
                    arrivals = arrivals.concat(result.value);
                }
            });
            
            arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            if (arrivals.length) {
                const line1 = `There are ${arrivals.length} buses coming up for ${destination}.`;
                const line2 = arrivals
                    .map(function(arrival) {
                        var suffix = arrival.predicted ? "as predicted" : "as scheduled";
                        return `A Bus ${arrival.busShortName} will arrive in ${arrival.arrivalTime} minutes ${suffix}.`;
                    })
                    .join(" ");
                return `${line1} ${line2}`;
            }
            
            return `There is no bus coming up for ${destination}.`;
        });
}