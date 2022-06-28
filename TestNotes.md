
## 1
https://github.com/trufflesuite/ganache
sudo npm install ganache --global
sudo npm install --save-dev hardhat -g
npx hardhat --help


## 2
https://book.getfoundry.sh/cast/index.html
curl -L https://foundry.paradigm.xyz | bash
foundryup
cast -h

## 3 Alice and Bob: ERC721 to ETH
// initial network
make fork2
// setup
make setup
// make an ERC721 order
make alice
// take alice's order with 1 ETH
make bob