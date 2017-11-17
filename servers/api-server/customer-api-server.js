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
const log = log4js.getLogger('Customer API Server');
const path = require('path');

const configPath = process.argv[2];

/**
 * Configration
 */
log.level = log4js.levels.DEBUG;
log.info('config file path: ' + configPath);
let CONFIG = {};
if(configPath) {
	CONFIG = require(configPath);
}else{
	CONFIG = require('./fabric-jpbank-config.js');
}
const port = CONFIG.port;

const requestHandler = function(req, res) {}
const app = require('http').createServer(requestHandler)
const io = require('socket.io')(app);

// fablic library
const FabricUserClient = require('./lib/fabric-user-client.js');
const FabricOrderers = require('./lib/fabric-orderers.js');
const FabricChannels = require('./lib/fabric-channels.js');
const FabricPeers = require('./lib/fabric-peers.js');
const FabricEvent = require('./lib/fabric-event.js');
const FabricQuery = require('./lib/fabric-query.js');
const FabricTransaction = require('./lib/fabric-transaction.js');

log.debug("==================== API Server Start =======================\n");
let client = null;
let orderers = null;
let channels = null;
let peers = null;
let events = [];
let event = null;

const initFabricClient = function () {
	log.info("Initialize Fabric Client")
	client = new FabricUserClient.FabricUserClient();
	orderers = new FabricOrderers.FabricOrderers();
	channels = new FabricChannels.FabricChannels();
	peers = new FabricPeers.FabricPeers();

	return client.init(
		path.join(__dirname, CONFIG.storePath), CONFIG.caUrl, CONFIG.username, CONFIG.password, CONFIG.mspId)
	.then(() => {

		orderers.init(client);
		orderers.addOrderer(CONFIG.orderer.hostname, CONFIG.orderer.url, CONFIG.orderer.hostname, path.join(__dirname, CONFIG.orderer.tlsCert));

		channels.init(client);
		channels.addChannel(CONFIG.channelName, orderers.getOrderer(CONFIG.orderer.hostname));
		let channel = channels.getChannel(CONFIG.channelName);

		peers.init(client);
		for(let peerName in CONFIG.peers) {
			peers.addPeer(
				peerName, 
				CONFIG.peers[peerName].url, 
				CONFIG.peers[peerName].hostname, 
				path.join(__dirname, CONFIG.peers[peerName].tlsCert));
			
			channel.addPeer(peers.getPeer(peerName));
		}
	
	}).catch((err) => {
		log.error("Failed initializing Fabric Client", err);
	});
}
let subscribers = {};

const transferFundsEvent = function(e) {
	let data = e.data;

	let tx = null;
	let idx = data.findIndex((el) => el == 'transfer_funds');
	if(idx >= 0) {
		tx = data.slice(idx);
		let payload = {
			transactionId: e.transactionId,
			timestamp: e.timestamp,
			to: tx[2],
			from: tx[1],
			amount: tx[3]
		};
		let to = tx[2];
		let from = tx[1];
		// Ignore the genesis transaction
		if(from == 'GENESIS') {return;}
		// see if the account name is either to or from
		// if not, send the only block information
		if(subscribers[to]) {
			subscribers[to](payload);
		}
		if(subscribers[from]) {
			subscribers[from](payload);
		}
	}
}

const transferFundsToExternalEvent = function(e) {
	let data = e.data;

	let tx = null;
	let idx = data.findIndex((el) => el == 'transfer_funds_to_external');
	if(idx >= 0) {
		tx = data.slice(idx);
		let payload = {
			transactionId: e.transactionId,
			timestamp: e.timestamp,
			from: tx[1],
			to: tx[3],
			amount: tx[5]
		};
		let to = payload.to;
		let from = payload.from;
		// see if the account name is either to or from
		// if not, send the only block information
		if(subscribers[from]) {
			subscribers[from](payload);
		}
	}
}

const transferFundsFromExternalEvent = function(e) {
	let data = e.data;

	let tx = null;
	let idx = data.findIndex((el) => el == 'transfer_funds_from_external');
	if(idx >= 0) {
		tx = data.slice(idx);
		let payload = {
			transactionId: e.transactionId,
			timestamp: e.timestamp,
			to: tx[3],
			from: tx[2],
			amount: tx[5]
		};
		let to = payload.to;
		let from = payload.from;
		// see if the account name is either to or from
		// if not, send the only block information
		if(subscribers[to]) {
			subscribers[to](payload);
		}
		if(subscribers[from]) {
			subscribers[from](payload);
		}
	}
}

const eventLogger = function(e) {
	log.debug(e);
	let data = e.data;
	if(!Array.isArray(data)) {
		return;
	}

	// verify channel
	// see what type of transaction
	if (e.channelId != CONFIG.channelName) {
		return;
	}

	if(data.findIndex((el) => el == 'transfer_funds') >= 0) {
		transferFundsEvent(e);
	}else if(data.findIndex((el) => el == 'transfer_funds_from_external') >= 0) {
		transferFundsFromExternalEvent(e);
	}else if(data.findIndex((el) => el == 'transfer_funds_to_external') >=0) {
		transferFundsToExternalEvent(e);
	}
}

initFabricClient().then(() => {
	log.info("Fablic Client is ready");
	event = new FabricEvent.FabricEvent();
	event.init(client.getClient().newEventHub());

	let peer0Conf = CONFIG.peers['peer1'];
	let peer1Conf = CONFIG.peers['peer2'];
	event.addPeerAddr(peer0Conf.event, peer0Conf.hostname, path.join(__dirname, peer0Conf.tlsCert));
	event.subscribe('logger', eventLogger);
	event.connect();

	let peer0Event = new FabricEvent.FabricEvent();
	peer0Event.init(client.getClient().newEventHub());
	peer0Event.addPeerAddr(peer0Conf.event, peer0Conf.hostname, path.join(__dirname, peer0Conf.tlsCert));
	events.push(peer0Event.getEvent());
	let peer1Event = new FabricEvent.FabricEvent();
	peer1Event.init(client.getClient().newEventHub());
	peer1Event.addPeerAddr(peer1Conf.event, peer1Conf.hostname, path.join(__dirname, peer1Conf.tlsCert));
	events.push(peer1Event.getEvent());

	app.listen(port);
});

const getAccount = function(accountId) {
	log.debug('getAccount:' + accountId);

	return FabricQuery.queryChaincode(
		'accountcc',
		'get_account',
		[accountId],
		peers.getPeer('peer1'),
		channels.getChannel(CONFIG.channelName),
		client.getClient()
	).then((payload) => {
		log.debug( payload.length + " payloads");
		let account = null;
		for (let i = 0; i < payload.length; i++) {
			account = payload[i].toString('utf8');
		}

		return account;

	});
}

const getHistory = function(accountId) {
	return FabricQuery.queryChaincode(
		'accountcc',
		'transfer_history',
		[accountId],
		peers.getPeer('peer1'),
		channels.getChannel(CONFIG.channelName),
		client.getClient()
	).then((payload) => {
		log.debug( payload.length + " payloads");
		let history = null;
		if(payload.length > 0) {
			history = JSON.parse(payload[0].toString('utf8'));
		}

		return history;
	});
}

const getHistoryFrom = function(accountId, txId) {
	return FabricQuery.queryChaincode(
		'accountcc',
		'transfer_history_from',
		[accountId, txId],
		peers.getPeer('peer1'),
		channels.getChannel(CONFIG.channelName),
		client.getClient()
	).then((payload) => {
		log.debug( payload.length + " payloads");
		let history = null;
		if(payload.length > 0) {
			history = JSON.parse(payload[0].toString('utf8'));
		}

		return history;
	});
}

const createAccount = function(accountId, username) {
	let targets = [];
	for(const peerName in CONFIG.peers) {
		targets.push(peerName);
	}

	return FabricTransaction.invokeChaincode(
		'accountcc',
		'create_account',
		[accountId,username],
		[peers.getPeer('peer1'),peers.getPeer('peer2')],
		channels.getChannel(CONFIG.channelName),
		client.getClient(),
		events
	);
}

const transferFunds = function(from, to, amount) {
	let targets = [];
	for(const peerName in CONFIG.peers) {
		targets.push(peerName);
	}

	return FabricTransaction.invokeChaincode(
		'accountcc',
		'transfer_funds',
		[from,to,amount],
		[peers.getPeer('peer1'),peers.getPeer('peer2')],
		channels.getChannel(CONFIG.channelName),
		client.getClient(),
		events
	);
}

const transferFundsToExternal = function(
	from, toBank, to, toName, amount) {
	log.debug('transferFundsToExternal');

	return getAccount(from).then(
		(response) => {
		let account = JSON.parse(response);
		if(account.docType != 'account') {
			log.error(account);
			return new Promise((resolve,reject) => {
				resolve({'status': 'error',
				'message': {'payload': 'Account not found'}})
			});

		}else{
			let targets = [];
			for(const peerName in CONFIG.peers) {
				targets.push(peerName);
			}
		
			return FabricTransaction.invokeChaincode(
				'accountcc',
				'transfer_funds_to_external',
				[from,to,toName,toBank,amount],
				[peers.getPeer('peer1'),peers.getPeer('peer2')],
				channels.getChannel(CONFIG.channelName),
				client.getClient(),
				events
			);
		}

	});	
	
}

io.on('connection', (socket) => {
	log.debug("Connected with socket#" + socket.id);
	let accountId = null;
	let username = null;

	let emitTransaction = (data) => {
		log.info('emitTransaction: ' + accountId);
		socket.emit('transaction', data);
	}

	socket.on('login', (data, cb) => {
		log.debug('login ', data);
		let loginId = data.accountId;

		if(typeof cb != 'function') {
			log.error("callback is not a function.");

		} else if(!loginId) {
			cb({status: 'error', message: 'account id is empty.'});

		}else{
			try{
				getAccount(loginId)
				.then((response) => {
					if(response) {
						let account = JSON.parse(response);
						if(account.username) {
							accountId = loginId;
							subscribers[accountId] = emitTransaction;
							cb({status: 'success', message: account});

						}else{
							cb({status: 'success', message: null});

						}
						
					} else {
						cb({status: 'success', message: null});
					}

				}).catch((e) => {
					log.error("failed create account. ", e);
					cb({status: 'error', message: JSON.stringify(e)});

				});
			}catch(e) {
				log.error(e);
				cb({status: 'error', message: e});
			}
		}

	});

	socket.on('create', (data, cb) => {
		log.info('create');
		accountId = data.accountId;
		username = data.username;

		if(typeof cb != 'function') {
			log.error("callback is not a function.");

		}else if(!accountId || !username) {
			cb({status: 'error', message: 'account id or user name is empty.'});

		}else{
			try{
				createAccount(accountId, username)
				.then((response) => {

					if(response && response.status == 'SUCCESS') {
						subscribers[accountId] = emitTransaction;
						cb({status: 'success', message: {'transactionId': response.payload.transactionId}});
					}else{
						log.error("failed create account. ", response);
						cb({status: 'error', message: response.payload});
					}

				}).catch((e) => {
					log.error("failed create account. ", e);
					cb({status: 'error', message: JSON.stringify(e)});

				});

			}catch(e) {
				log.error(e);
				cb({status: 'error', message: e});
			}
		}
	});

	socket.on('history', (data, cb) => {
		log.debug('history');
		if(typeof cb != 'function') {
			log.error("callback is not a function.");

		}else	if(accountId) {
			try{
				getHistory(accountId)
				.then((response) => {
					cb({status: 'success', message: response});

				}).catch((e) => {
					cb({status: 'error', message: e});

				});

			}catch(e) {
				log.error(e);
				cb({status: 'error', message: e});
			}

		}else{
			cb({status: 'error', message: "Not Log In Yet"});
		}
	});

	socket.on('history_from', (data, cb) => {
		log.debug('historyFrom');
		let latestTxId = data.transactionId;
		if(typeof cb != 'function') {
			log.error("callback is not a function.");

		}else if(accountId) {
			try{
				getHistoryFrom(accountId, latestTxId)
				.then((response) => {
					cb({status: 'success', message: response});

				}).catch((e) => {
					cb({status: 'error', message: e});

				});
			}catch(e) {
				log.error(e);
				cb({status: 'error', message: e});
			}

		}else{
			cb({status: 'error', message: "Not Log In Yet"});
		}
	});

	socket.on('transfer', (data, cb) => {
		log.debug('transfer: ' + JSON.stringify(data));
		let to = data.to;
		let amount = '' + data.amount;
		
		if(typeof cb != 'function') {
			log.error("callback is not a function.");

		}else if(!to || !amount) {
			cb({status: 'error', message: 'to or amount is empty.'});

		}else	if(accountId) {
			try{
				transferFunds(accountId, to, amount)
				.then((response) => {
					log.debug(response);
					if(response && response.status == 'SUCCESS') {
						cb({status: 'success', message: {'transactionId': response.payload.transactionId}});

					}else{
						cb({status: 'error', message: response.payload});

					}

				}).catch((e) => {
					log.error("failed create account. ", e);
					cb({status: 'error', message: JSON.stringify(e)});

				});
			}catch(e) {
				log.error(e);
				cb({status: 'error', message: e});
			}

		}else{
			cb({status: 'error', message: "Not Log In Yet"});

		}
	});

	socket.on('transfer_to_external', (data, cb) => {
		log.debug('transfer_to_external: ' + JSON.stringify(data));
		let toBank = data.toBank;
		let to = data.to;
		let toName = data.toName;
		let amount = '' + data.amount;
		
		if(typeof cb != 'function') {
			log.error("callback is not a function.");

		}else if(!toBank || !to || !toName || !amount) {
			cb({status: 'error', message: 'invalid parameters.'});

		}else	if(accountId) {
			try{
				transferFundsToExternal(accountId, toBank, to, toName, amount)
				.then((response) => {
					if(response && response.status == 'SUCCESS') {
						cb({status: 'success', message: {'transactionId': response.payload.transactionId}});

					}else{
						cb({status: 'error', message: response.payload});

					}

				}).catch((e) => {
					log.error("failed create account. ", e);
					cb({status: 'error', message: JSON.stringify(e)});

				});
			}catch(e) {
				log.error(e);
				cb({status: 'error', message: e});
			}

		}else{
			cb({status: 'error', message: "Not Log In Yet"});

		}
	});

});