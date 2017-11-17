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
const logger = log4js.getLogger('FabricPeers');
logger.level = log4js.levels.DEBUG;

var FabricPeers = function() {
	var _peers = {};
	var _client = null;

	this.init = function(client) {
		_client = client;
	}

	this.addPeer = function(peerName, requestUrl, hostName, peerCaCertPath) {
		var peer = _client.newPeer(peerName, requestUrl, hostName, peerCaCertPath);
		if(!_peers[peer.getName()]) {
			_peers[peer.getName()] = peer;
		}
	}

	this.getPeer = function(peerName) {
		return _peers[peerName];
	}

	this.getPeers = function() {
		return _peers;
	}
}

exports.FabricPeers = FabricPeers;