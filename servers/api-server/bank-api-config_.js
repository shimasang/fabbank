module.exports = {
	storePath: "data-store",
	caUrl: "https://localhost:7054",
	username: "bank1",
	password: "bank1pw",
	mspId: "Org1MSP",
	bankCode: "JPBANK",
	localChannelName: "publicchannel",
	interchangeChannelName: "interchangechannel",
	orderer: {
		hostname: "orderer.bank.com",
		url: "grpcs://localhost:7050",
		tlsCert: "crypto-config/ordererOrganizations/bank.com/orderers/orderer.bank.com/tls/ca.crt"
	},
	peers: {
		'peer2': {
			hostname: "peer0.org1.bank.com",
			url: "grpcs://localhost:7051",
			event: "grpcs://localhost:7053",
			tlsCert: "crypto-config/peerOrganizations/org1.bank.com/peers/peer0.org1.bank.com/tls/ca.crt"
		}
	}
};