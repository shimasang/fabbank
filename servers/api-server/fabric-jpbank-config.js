module.exports = {
	port: 11001,
	storePath: "data-store",
	caUrl: "https://localhost:7054",
	username: "jpbank",
	password: "peer1pw",
	mspId: "Org1MSP",
	bankCode: "JPBANK",
	channelName: "public1channel",
	orderer: {
		hostname: "orderer.bank.com",
		url: "grpcs://localhost:7050",
		tlsCert: "../../artifacts/crypto-config/ordererOrganizations/bank.com/orderers/orderer.bank.com/tls/ca.crt"
	},
	peers: {
		'peer1': {
			hostname: "peer1.member.bank.com",
			url: "grpcs://localhost:7151",
			event: "grpcs://localhost:7153",
			tlsCert: "../../artifacts/crypto-config/peerOrganizations/member.bank.com/peers/peer1.member.bank.com/tls/ca.crt"
		},
		'peer2': {
			hostname: "peer2.member.bank.com",
			url: "grpcs://localhost:7251",
			event: "grpcs://localhost:7253",
			tlsCert: "../../artifacts/crypto-config/peerOrganizations/member.bank.com/peers/peer2.member.bank.com/tls/ca.crt"
		}
	}
};