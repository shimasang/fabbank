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
'use strict'
const log4js = require('log4js');
const logger = log4js.getLogger('FabricEvent');
logger.level = log4js.levels.DEBUG;
const path = require('path');
const fs = require('fs');

var FabricEvent = function() {
	var _subscribers = {}
	var _event = null;

	this.init = function(event) {
		_event = event;
	}

	this.addPeerAddr = function(eventAddress, hostName, peerCaCertPath) {
		let data = fs.readFileSync(peerCaCertPath);
		let grpcOpts = {
			pem: Buffer.from(data).toString(),
			'ssl-target-name-override': hostName
		};
		_event.setPeerAddr(eventAddress, grpcOpts);
	}

	this.next = function(transaction) {
		logger.debug(transaction);
		for(const name in _subscribers) {
			_subscribers[name](transaction)
		}
	}
	
	this.connect = function() {
		_event.connect();
		_event.registerBlockEvent(
			(block) => this.blockEvent(block),
			(err) => this.errorHandler(err));
	}

	this.blockEvent = function(block) {
		console.log("New event incoming");
		var blockDataContainer = block.data.data;
		if(blockDataContainer && blockDataContainer.length > 0) {
			for(let data of blockDataContainer) {
				let channelName = data.payload.header.channel_header.channel_id;
				let txId = data.payload.header.channel_header.tx_id;
				let timestamp = data.payload.header.channel_header.timestamp;
				if(!data.payload) { continue; }
				for(let action of data.payload.data.actions) {
					let payload = action.payload.chaincode_proposal_payload.input.toString('utf8');
					let args = payload.match(/([_a-zA-Z0-9]+)/g)
					this.next({
						'channelId': channelName,
						'transactionId': txId,
						'timestamp': timestamp,
						'data': args});
				}
			}
		}
	}

	this.errorHandler = function(e) {
		console.log('Oh snap!');
	}

	this.subscribe = function(name, callback) {
		_subscribers[name] = callback;
	}
	this.unsubscribe = function(name) {
		delete _subscribers[name];
	}

	this.getEvent = function() {
		return _event;
	}
}

exports.FabricEvent = FabricEvent;