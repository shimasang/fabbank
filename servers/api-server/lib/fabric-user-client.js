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
const logger = log4js.getLogger('FabricUserClient');
logger.level = log4js.levels.DEBUG;
var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');
var fs = require('fs-extra');

var FabricUserClient = function() {
	var _fabricClient = null;
	var _fabricCaClient = null;

	this.init = function (storePath, caUrl, enrollmentID, enrollmentSecret, mspId) {
		_fabricClient = new Fabric_Client();

		return Fabric_Client.newDefaultKeyValueStore({ path: storePath
		}).then((stateStore) => {
			var cryptoSuite;
			var cryptoStore;
			var	tlsOptions = {
				trustedRoots: [],
				verify: false
			};

			_fabricClient.setStateStore(stateStore);
			
			cryptoSuite = Fabric_Client.newCryptoSuite();
			cryptoStore = Fabric_Client.newCryptoKeyStore({path: storePath});
			cryptoSuite.setCryptoKeyStore(cryptoStore);
			_fabricClient.setCryptoSuite(cryptoSuite);

			_fabricCaClient = new Fabric_CA_Client(caUrl, null , '', cryptoSuite);
			
			return _fabricCaClient.enroll({'enrollmentID': enrollmentID, 'enrollmentSecret': enrollmentSecret});
		
		}).then((enrollment) => {
			console.log('Successfully enrolled member user "user1" ');
			return _fabricClient.createUser(
			   {username: enrollmentID,
			   mspid: mspId,
			   cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
			   });

		}).then((user) => {
			var member_user = user;
			return _fabricClient.setUserContext(member_user);

		}).then(()=>{
			console.log('Successfully enrolled and is ready to intreact with the fabric network');

		}).catch((err) => {
			console.error('Failed to register: ' + err);
			if(err.toString().indexOf('Authorization') > -1) {
				console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
				'Try again after deleting the contents of the store directory '+storePath);
			}
		});
	}

	this.newOrderer = function(url, hostName, caRootsPath) {
		let data = fs.readFileSync(caRootsPath);
		let caroots = Buffer.from(data).toString();
		let orderer = _fabricClient.newOrderer(url, {
			'pem': caroots,
			'ssl-target-name-override': hostName
		});

		return orderer;
	}

	this.newPeer = function(peerName, requestUrl, hostName, peerCaCertPath) {

		let data = fs.readFileSync(peerCaCertPath);
		let peer = _fabricClient.newPeer(
			requestUrl,
			{
				pem: Buffer.from(data).toString(),
				'ssl-target-name-override': hostName
			}
		);
		peer.setName(peerName);

		return peer;
	}

	this.getClient = function() {
		return _fabricClient;
	}
}
exports.FabricUserClient = FabricUserClient;
