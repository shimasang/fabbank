var util = require('util');
var path = require('path');
var hfc = require('fabric-client');

hfc.addConfigFile(path.join(__dirname, 'config/network-config.json'));
hfc.addConfigFile(path.join(__dirname, 'config/public-1-config.json'));