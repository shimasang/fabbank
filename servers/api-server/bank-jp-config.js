module.exports = {
	port: 12001,
	storePath: "data-store",
	caUrl: "https://localhost:7054",
	username: "jpadmin",
	password: "bank1pw",
	mspId: "Org1MSP",
	bankCode: "JPBANK",
	localChannelName: "public1channel",
	interchangeChannelName: "interchangechannel",
	orderer: {
		hostname: "orderer.bank.com",
		url: "grpcs://localhost:7050",
		tlsCert: "../../artifacts/crypto-config/ordererOrganizations/bank.com/orderers/orderer.bank.com/tls/ca.crt"
	},
	peers: {
		'peer0': {
			hostname: "peer0.member.bank.com",
			url: "grpcs://localhost:7051",
			event: "grpcs://localhost:7053",
			tlsCert: "../../artifacts/crypto-config/peerOrganizations/member.bank.com/peers/peer0.member.bank.com/tls/ca.crt"
		}
	}
};