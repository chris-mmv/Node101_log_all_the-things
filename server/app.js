const express = require('express');
const fs = require('fs');
const app = express();

app.use((req, res, next) => {
// write your logging code here
//    Agent,Time,Method,Resource,Version,Status
console.log(`${req.headers['user-agent']},${new Date().toISOString()},${req.method},${req.path},HTTP/${req.httpVersion},${res.statusCode}`);
next();
});

app.get('/', (req, res) => {
    res.status(200).send('ok');
// write your code to respond "ok" here

});

app.get('/logs', (req, res) => {
// write your code to return a json object containing the log data here

});

module.exports = app;
