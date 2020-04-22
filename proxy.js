const express = require('express'),
    httpProxy = require('http-proxy'),
    fs = require('fs'),
    proxy = new httpProxy.createProxyServer({
        secure: false
    });
proxy.on('error', function (err, req, res) {
  console.log("Error " + req.url);
});


const appRoute = {
    target: 'http://localhost:5000'
};
const routing = JSON.parse(fs.readFileSync('./odata.json'));

var allowCrossDomain = function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization, X-Mindflash-SessionID');
    // intercept OPTIONS method
    if ('OPTIONS' === req.method) {
        res.header(200);
    } else {
        var dirname = req.url.replace(/^\/([^\/]*).*$/, '$1');
        var route = routing[dirname] || appRoute;
        console.log(req.method + ': ' + route.target + req.url);
        proxy.web(req, res, route, (err, req, res) => {
            console.log(`Error: ${req.method} ${route.target}${req.url}`);
        });
    }
};

var app = express();
app.use("/resources", express.static("../sapui5-rt-1.56.7/resources"));
app.use(allowCrossDomain);
app.listen(8005);
console.log("Proxy started on http://localhost:8005");