/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * 
 * Modifications copyright (C) 2017 Yoshihide Shimada <yoshihide.shimada@ieee.org>
 */
'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('InvokeTransaction');
logger.level = log4js.levels.DEBUG;
var path = require('path');
var fs = require('fs');
var util = require('util');
//var hfc = require('fabric-client');
//var Peer = require('fabric-client/lib/Peer.js');
//var helper = require('./helper.js');
//var logger = helper.getLogger('invoke-chaincode');
//var EventHub = require('fabric-client/lib/EventHub.js');
//var ORGS = hfc.getConfigSetting('network-config');

var invokeChaincode = function(chaincodeName, fcn, args, peers, channel, client, events) {
	logger.debug(util.format('\n============ invoke transaction on ============\n'));
	var tx_id = null;

		tx_id = client.newTransactionID();
		logger.debug(util.format('Sending transaction "%j"', tx_id));
		// send proposal to endorser
		var request = {
			chaincodeId: chaincodeName,
			fcn: fcn,
			args: args,
			chainId: channel.getName(),
			txId: tx_id
		};

		if (peers)
			request.targets = peers;

	return channel.sendTransactionProposal(request
	).then((results) => {
		var proposalResponses = results[0];
		var proposal = results[1];
		var all_good = true;
		var errors = [];

		logger.debug('"%s" proposal response(s) are returned.', proposalResponses.length);
		for (var i in proposalResponses) {
			let one_good = false;
			if (proposalResponses && proposalResponses[i].response &&
				proposalResponses[i].response.status === 200) {
				one_good = true;
				logger.info('transaction proposal was good');
			} else {
				logger.error('transaction proposal was bad: ');
				errors.push(proposalResponses[i]);
			}
			all_good = all_good & one_good;
		}
		if (all_good) {
			logger.debug(util.format(
				'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
				proposalResponses[0].response.status, proposalResponses[0].response.message,
				proposalResponses[0].response.payload, proposalResponses[0].endorsement
				.signature));
			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal
			};
			// set the transaction listener and set a timeout of 30sec
			// if the transaction did not get committed within the timeout period,
			// fail the test
			var transactionID = tx_id.getTransactionID();
			var eventPromises = [];

			for(let eh of events) {
				eh.connect();

				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						eh.disconnect();
						reject();
					}, 30000);

					eh.registerTxEvent(transactionID, (tx, code) => {
						clearTimeout(handle);
						eh.unregisterTxEvent(transactionID);
						eh.disconnect();

						if (code !== 'VALID') {
							logger.error(
								'The balance transfer transaction was invalid, code = ' + code);
							reject();
						} else {
							logger.info(
								'The balance transfer transaction has been committed on peer ' +
								eh._ep._endpoint.addr);
							resolve();
						}
					});
				});
				eventPromises.push(txPromise);
			};
			var sendPromise = channel.sendTransaction(request);
			return Promise.all([sendPromise].concat(eventPromises)).then((results) => {
				logger.debug(' event promise all complete and testing complete');
				return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
			}).catch((err) => {
				logger.error(
					'Failed to send transaction and get notifications within the timeout period.'
				);
				return 'Failed to send transaction and get notifications within the timeout period.';
			});
		} else {
			logger.debug("payload: " + errors[0]);
			var payload = errors[0].toString('utf-8').match(/\((.*)\)/)[1].split(',');
			logger.debug("payload length: " + payload.length);
			var status = payload[0].split(':');
			payload.shift();
			logger.debug("payload length: " + payload.length);
			var messages;
			var message = "";
			if(payload.length == 1) {
				messages = payload[0].split(':');
				message = messages[1].trim();
			} else {
				messages = payload.join(",").split(':');
				logger.debug("joined message: " + messages);
				messages.shift();
				message = messages.join(":");
				logger.debug("joined message: " + message);
				message = JSON.parse(message);
			}
			logger.error(
				'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
			);
			return {'status': 'ERROR', 'payload': message};
		}
	}, (err) => {
		logger.error('Failed to send proposal due to error: ' + err.stack ? err.stack :
			err);
		return 'Failed to send proposal due to error: ' + err.stack ? err.stack :
			err;
	}).then((response) => {
		if (response.status === 'SUCCESS') {
			logger.info('Successfully sent transaction to the orderer.');
			return {status: 'SUCCESS', payload: {transactionId: tx_id.getTransactionID()}};
		} else {
			logger.error('Failed to order the transaction. Error code: ' + response.status);
			return {status: 'ERROR', payload: response};
		}
	}, (err) => {
		logger.error('Failed to send transaction due to error: ' + err.stack ? err
			.stack : err);
		return 'Failed to send transaction due to error: ' + err.stack ? err.stack :
			err;
	});
};

exports.invokeChaincode = invokeChaincode;
