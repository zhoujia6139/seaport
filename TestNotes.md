

## 1 prerequisite
// reques a rpc link from here, 
// will be used as `RPC_URL` in Makefile

https://infura.io/dashboard


https://github.com/trufflesuite/ganache
```
sudo npm install ganache --global
sudo npm install --save-dev hardhat -g
npx hardhat --help
```

## 2 install
https://book.getfoundry.sh/cast/index.html
```
curl -L https://foundry.paradigm.xyz | bash
foundryup
cast -h
```

## 3 Alice and Bob: ERC721 to ETH
```
// initial network
make fork2
// setup
make setup
// make an ERC721 order
make alice
// take alice's order with 1 ETH
make bob
```

## 4 Charlie and Dave: ERC721 to ERC721
```
// initial network
make fork3
// make an ERC721 order
make charlie
// take charlie's order with ERC721
make dave
```

## 5 Eve and Ferdie: ERC721 to ERC20+ERC721
```
// initial network
make fork4
// make an ERC721 order
make eve
// take eve's order with ERC721
make ferdie
```
