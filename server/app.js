const express = require('express');
const fs = require('fs');
const app = express();
const {logLogger} = require('./logger');
const {LOG_FILE} = require('./logger');


// //These were helpful: 
//  https://youtu.be/xHOBYsI5QjY?si=Ve62jZNOaZVkICPS
//  https://youtu.be/7FHrfo3iHZo?si=bWl3Pmm7GT08zQkP

// //worked, but moved to logger.js
// app.use((req, res, next) => {
// // write your logging code here
// //    Agent,Time,Method,Resource,Version,Status
// let logA = `${req.headers['user-agent']},${new Date().toISOString()},${req.method},${req.path},HTTP/${req.httpVersion},${res.statusCode}`;
// // let logB = `\n${req.headers['user-agent']},\n${new Date().toISOString()},\n${req.method},\n${req.path},\nHTTP/${req.httpVersion},\n${res.statusCode}`;
// console.log(logA);

// fs.appendFileSync('logs/log.csv','\n' + logA, (err) => {
//     if (err) {
//         console.error('Error writing to log file', err);
//     }
// });
// next();
// });



app.use(logLogger);
app.set('json spaces', 2);

app.get('/', (req, res) => {
    res.status(200).send('ok');
// write your code to respond "ok" here

});


app.get('/logs', (req, res) => {
  fs.readFile(LOG_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json([]);

    const lines = data.split('\n').filter(Boolean);
    if (lines.length <= 1) return res.json([]);

    const headers = lines[0].split(',');
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(',');
      const obj = {};
      headers.forEach((h, i) => (obj[h] = (parts[i] ?? '').trim()));
      return obj;
    });

    res.json(rows);
  });
});




module.exports = app;
