/// <reference path="./typings/tsd.d.ts" />

import * as http from "http";
import * as Q from "q";

export const get = (url: string) => {
    const defer = Q.defer();
    
    http
        .get(url, (res) => {
            let body = '';
            res.on('data', (data) => {
                body += data;
            });
            res.on('end', () => {
                var result = JSON.parse(body);
                defer.resolve(result);
            });
        })
        .on('error', (error) => {
            console.log('Error: ' + error);
            defer.reject(error);
        });
    
    return defer.promise; 
};