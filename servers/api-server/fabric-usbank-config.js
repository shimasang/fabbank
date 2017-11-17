module.exports = {
	port: 11002,
	storePath: "data-store",
	caUrl: "https://localhost:7054",
	username: "usbank",
	password: "peer1pw",
	mspId: "Org1MSP",
	bankCode: "USBANK",
	channelName: "public2channel",
	orderer: {
		hostname: "orderer.bank.com",
		url: "grpcs://localhost:7050",
		tlsCert: "../../artifacts/crypto-config/ordererOrganizations/bank.com/orderers/orderer.bank.com/tls/ca.crt"
	},
	peers: {
		'peer1': {
			hostname: "peer4.member.bank.com",
			url: "grpcs://localhost:7451",
			event: "grpcs://localhost:7453",
			tlsCert: "../../artifacts/crypto-config/peerOrganizations/member.bank.com/peers/peer4.member.bank.com/tls/ca.crt"
		},
		'peer2': {
			hostname: "peer5.member.bank.com",
			url: "grpcs://localhost:7551",
			event: "grpcs://localhost:7553",
			tlsCert: "../../artifacts/crypto-config/peerOrganizations/member.bank.com/peers/peer5.member.bank.com/tls/ca.crt"
		}
	}
};