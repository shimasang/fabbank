module.exports = {
	port: 12002,
	storePath: "data-store",
	caUrl: "https://localhost:7054",
	username: "usadmin",
	password: "bank1pw",
	mspId: "Org1MSP",
	bankCode: "USBANK",
	localChannelName: "public2channel",
	interchangeChannelName: "interchangechannel",
	orderer: {
		hostname: "orderer.bank.com",
		url: "grpcs://localhost:7050",
		tlsCert: "../../artifacts/crypto-config/ordererOrganizations/bank.com/orderers/orderer.bank.com/tls/ca.crt"
	},
	peers: {
		'peer0': {
			hostname: "peer3.member.bank.com",
			url: "grpcs://localhost:7351",
			event: "grpcs://localhost:7353",
			tlsCert: "../../artifacts/crypto-config/peerOrganizations/member.bank.com/peers/peer3.member.bank.com/tls/ca.crt"
		}
	}
};