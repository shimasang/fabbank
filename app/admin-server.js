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
const log = log4js.getLogger('Admin Server');
log.setLevel('DEBUG');
const path = require('path');

require('./admin-server-config.js');
const hfc = require('fabric-client');
const helper = require('./helper.js')
const ORGS = hfc.getConfigSetting('network-config');

const channel = require('./create-channel');
const joinChannel = require('./join-channel');
const installChaincode = require('./install-chaincode');
const instantiateChaincode = require('./instantiate-chaincode');
const query = require('./query');
const transaction = require('./invoke-transaction.js');

const port = 10001;
const requestHandler = function(req, res) {}
const app = require('http').createServer(requestHandler)
const io = require('socket.io')(app);

log.info("==================== API Server Start =======================\n");
let users = [];
let peers = [];
let channels = []

const audit = function() {
	log.debug('audit start');
	query.queryChaincode(
		'peer0', 
		hfc.getConfigSetting('channelName'), 
		hfc.getConfigSetting('chainCode'), 
		['0', '100'], 'all_transfer_history', 'admin', 'org2'
	).then((response) => {
		let transactions = [];
		if(response.length > 0) {
			log.info(response[0].toString('utf8'));
			transactions = JSON.parse(response[0].toString('utf8'));	
		}

		return {'status': 'success', 'payload': transactions};

	}).catch((e) => {
		return {'status': 'error', 'payload': transactions};
	});
}

const getLatest = function(txId) {
	log.debug('getLatest start');
	query.queryChaincode(
		'peer0', 
		hfc.getConfigSetting('channelName'), 
		hfc.getConfigSetting('chainCode'), 
		[tx, '100'], 'all_transfer_history_from', 'admin', 'org2'
	).then((response) => {
		let transactions = [];
		if(response.length > 0) {
			log.info(response[0].toString('utf8'));
			transactions = JSON.parse(response[0].toString('utf8'));	
		}

		return {'status': 'success', 'payload': transactions};

	}).catch((e) => {
		return {'status': 'error', 'payload': transactions};

	});
}

const getBank = function(bankCode) {
	log.debug('getBank start');
	return query.queryChaincode(
		'peer0', 
		hfc.getConfigSetting('channelName'), 
		hfc.getConfigSetting('chainCode'), 
		[bankCode], 'get_bank', 'admin', 'org2'
	).then((response) => {
		let bank = "";
		if(response.length > 0) {
			log.info(response[0].toString('utf8'));
			bank = JSON.parse(response[0].toString('utf8'));	
		}

		return {'status': 'success', 'payload': bank};

	}).catch((e) => {
		return {'status': 'error', 'payload': bank};

	});
}

const getBanks = function() {
	log.debug('getBanks start');
	return query.queryChaincode(
		'peer0', 
		hfc.getConfigSetting('channelName'), 
		hfc.getConfigSetting('chainCode'), 
		[''], 'get_banks', 'admin', 'org2'
	).then((response) => {
		let banks = "";
		if(response.length > 0) {
			log.info(response[0].toString('utf8'));
			banks = JSON.parse(response[0].toString('utf8'));	
		}

		return {'status': 'success', 'payload': banks};

	}).catch((e) => {
		return {'status': 'error', 'payload': banks};

	});
}

const registerBank = function(bankcode, bankname) {
	return transaction.invokeChaincode(
		['peer0','peer1','peer2'],
		hfc.getConfigSetting('channelName'),
		hfc.getConfigSetting('chainCode'),
		'register_bank',
		[bankcode,bankname],
		'admin',
		'org2'
	).then((response) => {
		log.debug(response);
		if(response) {
			log.debug('success ' + response.toString('utf8'));
			return {status: 'success', payload: {'transactionId': response.toString('utf8')}};

		}else{
			log.error("failed create account. ", response);
			return {status: 'error', payload: response};

		}

	});
}

const addPeer = function(peerName) {
	log.debug('addPeer start');
	joinChannel.joinChannel(
		hfc.getConfigSetting('channelName'),
		[peerName],
		'admin',
		'org1'

	).then(() => {
		return installChaincode.installChaincode(
				[peerName],
				hfc.getConfigSetting('chainCode'),
				'github.com/hyperledger/fabric/chaincode/bankaccount',
				'2.0',
				'admin',
				'org1');

	}).then(() => {
		setTimeout(() =>{
			return instantiateChaincode.instantiateChaincode(
				peers,
				hfc.getConfigSetting('channelName'),
				hfc.getConfigSetting('chainCode'),
				'1.0',
				'Init',
				['INIT'],
				'admin',
				'org1');
		}, 30000);

	}).then((response) => {
		log.debug(response);
		channels[0].peers.add(peerName);
		return {'status': 'success', 'payload': response};

	}).catch((e) => {
		log.error(e);
		return {'status': 'error', 'payload': e};
	});
}

// init
channels.push({
	'name': hfc.getConfigSetting('channelName'), 
	'peers': ['peer0']
});

for (let key in ORGS['org1'].peers) {
	peers.push(key);
}

users.push({
	'username': 'jpadmin',
	'password': 'bank1pw',
	'attribute': 'hf.Revoker=true,member=jpbank:ecert,admin=true:ecert'
});
users.push({
	'username': 'jpbank',
	'password': 'peer1pw',
	'attribute': 'hf.Revoker=true,member=jpbank:ecert'
});
users.push({
	'username': 'usadmin',
	'password': 'bank1pw',
	'attribute': 'hf.Revoker=true,member=usbank:ecert,admin=true:ecert'
});
users.push({
	'username': 'usbank',
	'password': 'peer1pw',
	'attribute': 'hf.Revoker=true,member=usbank:ecert'
});

const getInfo = function() {
	log.debug('getInfo start');

	return {'status': 'success', 'payload': {
		'channels': channels,
		'peers': peers,
		'users': users
	}}
}

app.listen(port);

io.on('connection', (socket) => {
	log.debug("Connected with socket#" + socket.id);

	socket.on('get_info', (data, cb) => {
		log.debug('get_info:' + JSON.stringify(data));
		if(typeof cb != 'function') {
			log.error('callback is not a function.');
		}

		cb(getInfo());
		
	});

	socket.on('add_peer', (data, cb) => {
		log.debug('add_peer:' + JSON.stringify(data));
		if(typeof cb != 'function') {
			log.error('callback is not a function.');
		}

		try{
			let result = addPeer(data.peer);
			return result;

		}catch(e) {
			log.error(e);
			cb(e);
		}
	});

	socket.on('get_bank', (data, cb) => {
		log.debug('get_bank:' + JSON.stringify(data));
		if(typeof cb != 'function') {
			log.error('callback is not a function.');
		}

		try{
			getBank(data.bankcode).then((response) => {
				if(response) {
					if(response.status == 'success') {
						cb({status: 'success', payload: response.payload});

					}else{
						cb({status: 'success', payload: null});

					}
					
				} else {
					cb({status: 'success', payload: null});
				}

			}).catch((e) => {
				log.error("failed create account. ", e);
				cb({status: 'error', payload: JSON.stringify(e)});

			});
			
		}catch(e) {
			log.error(e);
			cb({status: 'error', payload: e});
		}
	});

	socket.on('get_banks', (data, cb) => {
		log.debug('get_banks:' + JSON.stringify(data));
		if(typeof cb != 'function') {
			log.error('callback is not a function.');
		}

		try{
			getBanks().then((response) => {
				if(response) {
					if(response.status == 'success') {
						cb({status: 'success', payload: response.payload});

					}else{
						cb({status: 'success', payload: null});

					}
					
				} else {
					cb({status: 'success', payload: null});
				}

			}).catch((e) => {
				log.error("failed create account. ", e);
				cb({status: 'error', payload: JSON.stringify(e)});

			});
			
		}catch(e) {
			log.error(e);
			cb({status: 'error', payload: e});
		}
	});

	socket.on('register_bank', (data, cb) => {
		log.debug('register_bank:' + JSON.stringify(data));
		if(typeof cb != 'function') {
			log.error('callback is not a function.');
		}

		try{
			registerBank(data.bankcode, data.bankname).then((result) => {
				log.debug('response: ' + result);
				cb(result);				

			}).catch((e) => {
				log.error(e);
				cb({'status': 'error', payload: e});

			});
			
		}catch(e) {
			log.error(e);
			cb(e);
		}
	});

	socket.on('audit', (data, cb) => {
		log.debug('audit:' + JSON.stringify(data));
		if(typeof cb != 'function') {
			log.error('callback is not a function.');
		}

		try{
			let result = audit();
			cb(result);			
			
		}catch(e) {
			log.error(e);
			cb(e);
		}
	});

	socket.on('get_latest', (data, cb) => {
		log.debug('get_latest:' + JSON.stringify(data));
		if(typeof cb != 'function') {
			log.error('callback is not a function.');
		}

		try{
			let result = getLatest(data.txId);
			cb(result);

		}catch(e) {
			log.error(e);
			cb(e);
		}
	});
});
