/**
	Copyright (C) 2017 Yoshihide Shimada <yoshihide.shimada@ieee.org>

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
 */
'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('SETUP');
logger.setLevel('DEBUG');

require('./config.js')
var path = require('path');
const helper = require('./helper.js')
const hfc = require('fabric-client');

const channel = require('./create-channel');
const joinChannel = require('./join-channel');
const installChaincode = require('./install-chaincode');
const instantiateChaincode = require('./instantiate-chaincode');
const tx = require('./invoke-transaction.js');

var channelName = 'public1channel';
var channelConfigPath = '../artifacts/channel-artifacts/public-1-channel.tx';
var organization = 'org1';
var peers = ['peer0','peer1','peer2'];
var ccName = 'accountcc';
var ccPath = 'github.com/hyperledger/fabric/chaincode/account';

logger.info("= = = = = = = Set up public 1 channel = = = = = = =\n");
channel.createChannel(
	channelName, 
	channelConfigPath,
	'admin',
	organization
).then(() => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			joinChannel.joinChannel(
					channelName,
					peers,
					'admin',
					organization).then((response) => {
						resolve(response);
					}).catch((error) => {
						reject(error);
					});
		}, 5000);	
	});

}).then(() => {
		return installChaincode.installChaincode(
			peers,
			ccName,
			ccPath,
			'1.0',
			'admin',
			organization);

}).then(() => {
		return instantiateChaincode.instantiateChaincode(
			peers,
			channelName,
			ccName,
			'1.0',
			'Init',
			['INIT'],
			'admin',
			organization);

}).then(() => {
	logger.info("= = = = = = = Set up public 2 channel = = = = = = =\n");

	channelName = 'public2channel';
	channelConfigPath = '../artifacts/channel-artifacts/public-2-channel.tx';
	organization = 'org1';
	peers = ['peer3','peer4','peer5'];
	ccName = 'accountcc';
	ccPath = 'github.com/hyperledger/fabric/chaincode/account';
	hfc.addConfigFile(path.join(__dirname, 'config/public-2-config.json'));
	
	helper.initHelper();

	return channel.createChannel(
		channelName, 
		channelConfigPath,
		'admin',
		organization);

}).then(() => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			joinChannel.joinChannel(
					channelName,
					peers,
					'admin',
					organization).then((response) => {
						resolve(response);
					}).catch((error) => {
						reject(error);
					});
		}, 5000);	
	});

}).then(() => {
		return installChaincode.installChaincode(
			peers,
			ccName,
			ccPath,
			'1.0',
			'admin',
			organization);

}).then(() => {
		return instantiateChaincode.instantiateChaincode(
			peers,
			channelName,
			ccName,
			'1.0',
			'Init',
			['INIT'],
			'admin',
			organization);

}).then(() => {
	logger.info("= = = = = = = Set up interchange channel = = = = = = =\n");

	channelName = 'interchangechannel';
	channelConfigPath = '../artifacts/channel-artifacts/interchange-channel.tx';
	organization = 'org2';
	peers = ['peer0','peer1','peer2'];
	ccName = 'bankaccountcc';
	ccPath = 'github.com/hyperledger/fabric/chaincode/bankaccount';

	hfc.addConfigFile(path.join(__dirname, 'config/interchange-config.json'));
	
	helper.initHelper();

	return channel.createChannel(
		channelName, 
		channelConfigPath,
		'admin',
		organization);

}).then(() => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			joinChannel.joinChannel(
					channelName,
					peers,
					'admin',
					organization).then((response) => {
						resolve(response);
					}).catch((error) => {
						reject(error);
					});
		}, 5000);	
	});

}).then(() => {
		return installChaincode.installChaincode(
			peers,
			ccName,
			ccPath,
			'1.0',
			'admin',
			organization);

}).then(() => {
		return instantiateChaincode.instantiateChaincode(
			peers,
			channelName,
			ccName,
			'1.0',
			'Init',
			['INIT'],
			'admin',
			organization);
		
}).then(() => {
	
	organization = 'org1';
	peers = ['peer0','peer3'];

	return joinChannel.joinChannel(
				channelName,
				peers,
				'admin',
				organization);
	
}).then(() => {
	return installChaincode.installChaincode(
		peers,
		ccName,
		ccPath,
		'1.0',
		'admin',
		organization);

}).then(() => {

	return new Promise((resolve, reject) => {
		instantiateChaincode.instantiateChaincode(
	 			peers,
	 			channelName,
				ccName,
				'1.0',
				'Init',
				['INIT'],
				'admin',
				organization).then((response) => {
					resolve(response);

				}).catch((error) => {
					resolve(error);

				});
	})

}).then(() => {

	return  tx.invokeChaincode(
		['peer0','peer3'],
		'interchangechannel',
		'bankaccountcc',
		'init',
		[''],
		'admin',
		'org1'
	);

}).then(() => {
	logger.info("Network is ready.");

}).catch((e) => {
	logger.error(e);

});