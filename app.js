var express = require('express');
var connect = require('connect');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
const crypto = require('crypto');

/* Express*/
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// app.use(express.static(path.join(__dirname, 'public')));

/* --- connect-rest */
var Rest = require('connect-rest');
// initial configuration of connect-rest. all-of-them are optional.
// default context is /api, all services are off by default
var options = {
    context: '/api'
};

var rest = Rest.create(options);
app.use(rest.processRequest());
app.disable('x-powered-by');

/* --- Variables: */
var apiKey = process.env.APIKEY;

/* --- web3.js: */
Web3 = require('web3');
// see: https://github.com/ethereum/wiki/wiki/JavaScript-API#adding-web3
// To make sure you don't overwrite the already set provider , check first if the web3 is available:
var web3;
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// create contract instance:
var abi = [{
    "constant": true,
    "inputs": [],
    "name": "created",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
}, {
    "constant": true,
    "inputs": [{"name": "", "type": "bytes32"}],
    "name": "sha3Docs",
    "outputs": [{"name": "docIndex", "type": "uint256"}, {
        "name": "publisher",
        "type": "string"
    }, {"name": "publishedOnUnixTime", "type": "uint256"}, {
        "name": "publishedInBlockNumber",
        "type": "uint256"
    }, {"name": "docText", "type": "string"}, {"name": "sha256Hash", "type": "bytes32"}, {
        "name": "sha3Hash",
        "type": "bytes32"
    }],
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "docIndex",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "manager",
    "outputs": [{"name": "", "type": "address"}],
    "type": "function"
}, {
    "constant": true,
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "indexedDocs",
    "outputs": [{"name": "docIndex", "type": "uint256"}, {
        "name": "publisher",
        "type": "string"
    }, {"name": "publishedOnUnixTime", "type": "uint256"}, {
        "name": "publishedInBlockNumber",
        "type": "uint256"
    }, {"name": "docText", "type": "string"}, {"name": "sha256Hash", "type": "bytes32"}, {
        "name": "sha3Hash",
        "type": "bytes32"
    }],
    "type": "function"
}, {
    "constant": true,
    "inputs": [{"name": "", "type": "bytes32"}],
    "name": "sha256Docs",
    "outputs": [{"name": "docIndex", "type": "uint256"}, {
        "name": "publisher",
        "type": "string"
    }, {"name": "publishedOnUnixTime", "type": "uint256"}, {
        "name": "publishedInBlockNumber",
        "type": "uint256"
    }, {"name": "docText", "type": "string"}, {"name": "sha256Hash", "type": "bytes32"}, {
        "name": "sha3Hash",
        "type": "bytes32"
    }],
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"name": "_publisher", "type": "string"}, {"name": "_docText", "type": "string"}],
    "name": "addDoc",
    "outputs": [{"name": "", "type": "bytes32"}],
    "type": "function"
}, {"inputs": [], "type": "constructor"}, {
    "anonymous": false,
    "inputs": [{"indexed": false, "name": "docIndex", "type": "uint256"}, {
        "indexed": false,
        "name": "publisher",
        "type": "string"
    }, {"indexed": false, "name": "publishedOnUnixTime", "type": "uint256"}],
    "name": "DocumentAdded",
    "type": "event"
}];

var contractAddress = "0x80f84866d4872f1ea412ddf10e2ed7af0b8ca8fb";
var contractManagerAddress = "0x4412041c61EF9a1783Eb3F8bC526aE5d05588cDa";

var ProofOfExistence = web3.eth.contract(abi).at(contractAddress);

console.log("contract at address: " + contractAddress);
console.log(JSON.stringify(ProofOfExistence));

/* --- API routes: */

// 1) --- add document
rest.post("/proofofexistence-add", function (request, content, callback) {

    console.log("request.body: " + JSON.stringify(request.body));
    console.log('content: ' + JSON.stringify(content));
    console.log("request.headers: " + JSON.stringify(request.headers));
    console.log("request.headers.apikey: " + request.headers.apikey);

    var resObj = {}; // obj to return

    if (request.headers.apikey === apiKey || content.apikey === apiKey) {

        var transactionObject = {
            from: contractManagerAddress, // or web3.eth.accounts[0] //
            // to: ProofOfExistence.address,
            gas: 4000000
            // nonce: web3.eth.getTransactionCount(contractManagerAddress)
        };

        resObj.txHash =
            ProofOfExistence.addDoc.sendTransaction( // <<< -- sendTransaction
                content.publisher,
                content.text,
                transactionObject
            );

        console.log("resObj.txHash: " + resObj.txHash);

        resObj.tx = web3.eth.getTransaction(resObj.txHash);

        console.log("resObj.tx: " + JSON.stringify(resObj.tx));

        resObj.storedText = content.text;
        resObj.storedTextSha256 = crypto.createHash('sha256').update(content.text).digest('hex');

        callback(null, resObj); // <<< ----------- this is success response

    } else {
        resObj.error = "not authorized to call API";
        callback(null, resObj);
    }
});

// 2) --- get document by sha256 hash
rest.post("/proofofexistence-get", function (request, content, callback) {

    console.log('Received JSON object:' + JSON.stringify(content));

    var resObj = {}; // obj to return

    if (request.headers.apikey === apiKey || content.apikey === apiKey) {

        if (!content.sha256 || content.sha256.length < 64) {
            resObj.error = "hash invalid or empty";
            callback(null, resObj);
        } else {

            var txObjForCall = {
                // from: contractManagerAddress,
                // to: ProofOfExistence.address
                // ,
                // gas: 1000000,
                // nonce: web3.eth.getTransactionCount(contractManagerAddress)
            };

            console.log("GET transactionObject: " + JSON.stringify(txObjForCall));

            resObj.storedDoc = // array (struct Doc)
                ProofOfExistence.sha256Docs.call(
                    // ProofOfExistence.sha256Docs(
                    content.sha256
                    // ,
                    // txObjForCall
                );

            resObj.receivedSha256 = content.sha256;

            console.log("resObj: " + JSON.stringify(resObj));

            callback(null, resObj);
        }

    } else {
        resObj.error = "not authorized to call API";
        callback(null, resObj);
    }

});

/* --- Express routes */
// app.use('/', routes);
// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function (err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
