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
const log = log4js.getLogger('API Server');
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
	CONFIG = require('./bank-jp-config.js');
}
const port = CONFIG.port;

const requestHandler = function (req, res) { }
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
let channel = null;
let peers = null;
let events = [];
let event = null;
let subscribers = {};

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

			// init local channel
			channels.init(client);
			channels.addChannel(CONFIG.localChannelName, orderers.getOrderer(CONFIG.orderer.hostname));
			let localchannel = channels.getChannel(CONFIG.localChannelName);

			peers.init(client);
			for (let peerName in CONFIG.peers) {
				peers.addPeer(
					peerName,
					CONFIG.peers[peerName].url,
					CONFIG.peers[peerName].hostname,
					path.join(__dirname, CONFIG.peers[peerName].tlsCert));

				localchannel.addPeer(peers.getPeer(peerName));
			}

			// init interchange channel
			channels.addChannel(CONFIG.interchangeChannelName, orderers.getOrderer(CONFIG.orderer.hostname));
			let interchangechannel = channels.getChannel(CONFIG.interchangeChannelName);

			for(let peerName in CONFIG.peers) {
				peers.addPeer(
					peerName, 
					CONFIG.peers[peerName].url, 
					CONFIG.peers[peerName].hostname, 
					path.join(__dirname, CONFIG.peers[peerName].tlsCert));

				interchangechannel.addPeer(peers.getPeer(peerName));
			}

		}).catch((err) => {
			log.error("Failed initializing Fabric Client", err);
		});
}

const getAccount = function (accountId) {
	log.debug('getAccount: ' + accountId);

	return FabricQuery.queryChaincode(
		'accountcc',
		'get_account',
		[accountId],
		peers.getPeer('peer0'),
		channels.getChannel(CONFIG.localChannelName),
		client.getClient()
	).then((payload) => {
		log.debug(payload.length + " payloads");
		let account = null;
		for (let i = 0; i < payload.length; i++) {
			account = payload[i].toString('utf8');
		}

		return account;

	});
}

const getBank = function (bankCode) {
	log.debug('getBank: ' + bankCode);

	return FabricQuery.queryChaincode(
		'bankaccountcc',
		'get_bank',
		[bankCode],
		peers.getPeer('peer0'),
		channels.getChannel(CONFIG.interchangeChannelName),
		client.getClient()
	).then((payload) => {
		log.debug(payload.length + " payloads");
		let bank = null;
		for (let i = 0; i < payload.length; i++) {
			bank = payload[i].toString('utf8');
		}

		return bank;

	});
}

const transferFundsFromExternal = function (
	fromBank, from, fromName, to, amount) {
	log.debug('transferFundsFromExternal:' + 
		' fromBank: ' + fromBank + ' from: ' + from + 
		' to: ' + to + ' fromName: ' + fromName);
	let targets = [];
	for (const peerName in CONFIG.peers) {
		targets.push(peerName);
	}

	return FabricTransaction.invokeChaincode(
		'accountcc',
		'transfer_funds_from_external',
		[from, fromName, to, fromBank, amount],
		[peers.getPeer('peer0')],
		channels.getChannel(CONFIG.localChannelName),
		client.getClient(),
		events
	);
}

const transferFunds = function (
	fromBank, from, fromName,
	toBank, to, toName,
	amount) {

	let targets = [];
	for (const peerName in CONFIG.peers) {
		targets.push(peerName);
	}

	return FabricTransaction.invokeChaincode(
		'bankaccountcc',
		'transfer_funds',
		[fromBank, from, fromName,
			toBank, to, toName, amount],
		[peers.getPeer('peer0')],
		channels.getChannel(CONFIG.interchangeChannelName),
		client.getClient(),
		events
	);
}

const transferFundsEvent = function(data) {
	let tx = null;
	let idx = data.findIndex((el) => el == 'transfer_funds');
	tx = data.slice(idx);
	for(let key of Object.keys(subscribers)) {
		subscribers[key](tx);
	}
}

const transferFundsToExternalEvent = function(data) {
	let tx = null;
	let idx = data.findIndex((el) => el == 'transfer_funds_to_external');
	tx = data.slice(idx);
	let fromName = "";
	let fromBank = CONFIG.bankCode;
	let from = tx[1];
	let to = tx[2];
	let toName = tx[3];
	let toBank = tx[4];
	let amount = tx[5];

	if(toBank == CONFIG.bankCode) { return; }

	Promise.all([
		getAccount(from),
		getBank(toBank)
	]).then((results) => {
		let account = JSON.parse(results[0]);
		let bank = JSON.parse(results[1]);

		if (account.docType != 'account') {
			log.error('From Account Not Found.' + account);
		} else if (bank.bankcode != toBank) {
			log.error('Destination Bank Not Found.' + JSON.stringify(bank));

			return transferFundsFromExternal(
				toBank, to, toName, from, amount);

		} else {
			fromName = account.username;
			log.debug('transfer_funds_to_external' + ' ' +
				fromBank + ' ' + from + ' ' + fromName + ' ' +
				toBank + ' ' + to + ' ' + toName + ' ' +
				amount);

			return transferFunds(
				fromBank, from, fromName,
				toBank, to, toName,
				amount
			);
		}

	}).then((response) => log.info(response)
	).catch((e) => { log.error(e); });
	
}

const publicChannelEvent = function (ev) {
	log.debug('publicChannelEvent');
	let data = ev.data;
	let tx = null;

	if(data.findIndex((el) => el == 'transfer_funds_to_external') > 0) {
		transferFundsToExternalEvent(data);
	}else if(data.findIndex((el) => el == 'transfer_funds') > 0) {
		transferFundsEvent(data);
	}
}

const interchangeChannelEvent = function (ev) {
	log.debug('interchangeChannelEvent');
	let data = ev.data;
	let tx = null;
	let idx = data.findIndex((el) => el == 'transfer_funds');
	if (idx >= 0) {
		tx = data.slice(idx);
		let fromBank = tx[1];
		let from = tx[2];
		let fromName = tx[3];
		let toBank = tx[4];
		let to = tx[5];
		let toName = tx[6];
		let amount = tx[7];

		if (toBank != CONFIG.bankCode) { return; }

		getAccount(to).then((response) => {
			let account = JSON.parse(response);
			if (account.docType == 'account') {
				log.debug('Account Found');
				log.debug('tx: ' + from + ',' + fromName + ',' + to + ',' + fromBank + ',' + amount);
				transferFundsFromExternal(
					fromBank, from, fromName,
					to, amount, 
					amount
				).then((response) => {
					for(let key of Object.keys(subscribers)) {
						subscribers[key](tx);
					}

				}).catch((e) => {
					log.error('interchangeChannelEvent', e);

				});

			} else {
				// reverse funds
				log.debug('Account Not Found');
				transferFunds(
					toBank, to, toName,
					fromBank, from, fromName,
					amount
				).then((response) => {

				}).catch((e) => {
					log.error('interchangeChannelEvent', e);
				});

			}
		}).catch((e) => {
			log.error('interchangeChannelEvent', e);
		});
	}
}

const eventLogger = function (e) {
	log.debug(e);
	if (!Array.isArray(e.data)) {
		return;
	}
	if (e.channelId == CONFIG.localChannelName) {
		publicChannelEvent(e);

	} else if (e.channelId == CONFIG.interchangeChannelName) {
		interchangeChannelEvent(e);

	}
}

initFabricClient().then(() => {
	log.info("Fablic Client is ready");
	event = new FabricEvent.FabricEvent();
	event.init(client.getClient().newEventHub());

	let peer2Conf = CONFIG.peers['peer0'];
	event.addPeerAddr(peer2Conf.event, peer2Conf.hostname, path.join(__dirname, peer2Conf.tlsCert));
	event.subscribe('logger', eventLogger);
	event.connect();

	app.listen(port);
});

const getHistory = function() {
	return FabricQuery.queryChaincode(
		'accountcc',
		'all_transfer_history',
		['0','100'],
		peers.getPeer('peer0'),
		channels.getChannel(CONFIG.localChannelName),
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

const getHistoryFrom = function(txId) {
	return FabricQuery.queryChaincode(
		'accountcc',
		'all_transfer_history_from',
		[txId, '100'],
		peers.getPeer('peer0'),
		channels.getChannel(CONFIG.localChannelName),
		client.getClient()
	).then((payload) => {
		log.debug( payload.length + " payloads");
		let history = null;
		if(payload.length > 0) {
			history = JSON.parse(payload[0].toString('utf8'));
			log.debug(history);
		}

		return history;
	});
}

io.on('connection', (socket) => {
	log.debug("Connected with socket#" + socket.id);
	let bankCode = null;
	let socketId = socket.id;

	let emitTransaction = (data) => {
		log.info('emitTransaction: ' + socket.id);
		socket.emit('transaction', data);
	}

	subscribers[socketId] = emitTransaction;

	socket.on('disconnect', (reason) => {
		delete subscribers[socketId];
	});

	socket.on('all_transfer_history', (data, cb) => {
		log.debug('all_transfer_history');
		if(typeof cb != 'function') {
			log.error("callback is not a function.");

		}else{
			try{
				getHistory()
				.then((response) => {
					cb({status: 'success', message: response});

				}).catch((e) => {
					cb({status: 'error', message: e});

				});

			}catch(e) {
				log.error(e);
				cb({status: 'error', message: e});
			}

		}
	});

	socket.on('all_transfer_history_from', (data, cb) => {
		log.debug('all_transfer_history_from:' + JSON.stringify(data));
		let latestTxId = data.txId;
		if(typeof cb != 'function') {
			log.error("callback is not a function.");

		}else{
			try{
				getHistoryFrom(latestTxId)
				.then((response) => {
					cb({status: 'success', message: response});

				}).catch((e) => {
					cb({status: 'error', message: e});

				});
			}catch(e) {
				log.error(e);
				cb({status: 'error', message: e});
			}

		}
	});

});