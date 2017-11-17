# Fab Bank #
Hyperledger fabric based funds transfer platform  
see ./LICENSE

## initialize crypto materials ##
`cd artifacts`  
`rm -rf crypto-config`  
`cryptogen generate --config=./crypto-config.yaml`  
Modify ca cert file path in artifacts/docker-compose-cli.yaml

## Generate Genesis Block & Channel Transaction ##

`cd artifacts`  
`configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./channel-artifacts/genesis.block`  
`configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/public-1-channel.tx -channelID public1channel`  
`configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/public-2-channel.tx -channelID public2channel`  
`configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/interchange-channel.tx -channelID interchangechannel`  
`configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/public-1-Org1MSPanchors.tx -channelID public1channel -asOrg Org1MSP`  
`configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/public-2-Org1MSPanchors.tx -channelID public2channel -asOrg Org1MSP`  
`configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/interchange-Org1MSPanchors.tx -channelID interchangechannel -asOrg Org1MSP`  
`configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/interchange-Org2MSPanchors.tx -channelID interchangechannel -asOrg Org2MSP`

## Up Network ##
`cd artifacts`  
`./fabbank-cli.sh -m up`

## Down Network ##
`cd artifacts`  
`./fabbank-cli.sh -m down`

## Register Users ##
The api servers need users in order to connect peers. Please, create following user accounts.

1. JP bank customer api user  
name: jpbank  
secret: peer1pw  
attribute: 'hf.Revoker=true,member=jpbank:ecert'

2. JP bank admin api user   
name: jpadmin  
secret: bank1pw  
attribute: 'hf.Revoker=true,member=jpbank:ecert,admin=true:ecert'

3. US bank customer api user  
name: usbank  
secret: peer1pw  
attribute: 'hf.Revoker=true,member=usbank:ecert'

4. US bank admin api user  
name: usadmin  
secret: bank1pw  
attribute: 'hf.Revoker=true,member=usbank:ecert,admin=true:ecert'


## Initialize network ##
`cd app`  
`node setup.js`

## API Servers ##

### JP bank customer api server ###
Project directory: servers/api-server  
node version: 6.11.3  
command: `node customer-api-server.js ./fabric-jp-bank-config.js`

### JP bank admin api server ###
Project directory: servers/api-server  
node version: 6.11.3  
command: `node bank-api-server.js ./bank-jp-config.js`

### US bank customer api server ###
Project directory: servers/api-server  
node version: 6.11.3  
command: `node customer-api-server.js ./fabric-us-bank-config.js`

### US bank admin api server ###
Project directory: servers/api-server  
node version: 6.11.3  
command: `node bank-api-server.js ./bank-us-config.js`

### Interchange admin api server ###
Project directory: app/  
node version: 6.11.3  
command: `node admin-server.js`

## Client Apps ##

### JP bank customer client app ###
Project directory: clients/customer-client-app  
node version: 7.10.1  
command: `ng serve -p 4200 -e jp`

### US bank customer client app ###
Project directory: clients/customer-client-app  
node version: 7.10.1  
command: `ng serve -p 4201 -e us`

### JP bank audit app ###
Project directory: clients/audit-app  
node version: 7.10.1  
command: `ng serve -p 4210 -e jp`

### US bank audit app ###
Project directory: clients/audit-app  
node version: 7.10.1  
command: `ng serve -p 4211 -e en`

### Admin app ###
Project directory: clients/interchange-admin-app  
node version: 7.10.1  
command: `ng serve -p 4220`

## Chaincode ##
artifacts/src/github.com/hyperledger/fabric/chaincode/