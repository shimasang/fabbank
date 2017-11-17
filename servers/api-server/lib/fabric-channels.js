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
const logger = log4js.getLogger('FabricChannels');
logger.level = log4js.levels.DEBUG;

var FabricChannels = function() {
	var _channels = {};
	var _client = null;
	
	this.init = function(client) {
		_client = client;
	}

	this.addChannel = function(channelName, orderer) {
		var channel = _client.getClient().newChannel(channelName);
		channel.addOrderer(orderer);
		_channels[channelName] = channel;
	} 

	this.getChannel = function(channelName) {
		return _channels[channelName];
	}

	this.getChannelName = function() {
		return _name;
	}
}

exports.FabricChannels = FabricChannels;