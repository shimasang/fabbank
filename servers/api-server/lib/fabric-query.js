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
const logger = log4js.getLogger('FabricQuery');
logger.level = log4js.levels.DEBUG;

var queryChaincode = function(chaincodeName, func, args, peer, channel, client) {
	logger.debug("queryChaincode")

	let tx_id = client.newTransactionID();
	// send query
	var request = {
		chaincodeId: chaincodeName,
		txId: tx_id,
		fcn: func,
		args: args
	};

	return channel.queryByChaincode(request, peer
	).then((response_payloads) => {
		if (response_payloads) {
			return response_payloads;
		} else {
			logger.error('response_payloads is null');
			return 'response_payloads is null';
		}
	}, (err) => {
		logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
			err);
		return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
	}).catch((err) => {
		logger.error('Failed to end to end test with error:' + err.stack ? err.stack :
			err);
		return 'Failed to end to end test with error:' + err.stack ? err.stack :
			err;
	});
};



exports.queryChaincode = queryChaincode;