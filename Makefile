fork:
	ganache \
	-d \
	--chain.chainId 522 \
	--fork ${RPC_URL} \
	--unlock \
		0x725efdc61c6a10b3b2cbef14371532c5a45f62b7 \
		0x8ad272ac86c6c88683d9a60eb8ed57e6c304bb0c

fork2:
	ganache \
	-d \
	--chain.chainId 522 \
	--fork ${RPC_URL} \
	--unlock \
		0xbEA02fB6351351bc25Dddf296920e90a4a6D6319 \
		0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 \
		0x8ad272ac86c6c88683d9a60eb8ed57e6c304bb0c

fork3:
	ganache \
	-d \
	--chain.chainId 522 \
	--fork ${RPC_URL} \
	--unlock \
		0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b \
		0x8ad272ac86c6c88683d9a60eb8ed57e6c304bb0c

fork4:
	ganache \
	-d \
	--chain.chainId 522 \
	--fork ${RPC_URL} \
	--unlock \
		0xd03ea8624C8C5987235048901fB614fDcA89b117 \
		0x8ad272ac86c6c88683d9a60eb8ed57e6c304bb0c \
		0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503

fork5:
	ganache \
	-d \
	--chain.chainId 522 \
	--fork ${RPC_URL} \
	--unlock \
		0x8ad272ac86c6c88683d9a60eb8ed57e6c304bb0c \
		0xe78388b4ce79068e89bf8aa7f218ef6b9ab0e9d0

setup:
	make faucet
	make approve

faucet:
	cast send 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d \
		"transferFrom(address,address,uint256)" \
		--legacy \
		--gas 0xfffff \
		--gas-price 245905827660 \
		--rpc-url http://127.0.0.1:8545 \
		--from 0xbEA02fB6351351bc25Dddf296920e90a4a6D6319 \
		0xbEA02fB6351351bc25Dddf296920e90a4a6D6319 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 5007

approve:
	cast send 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d \
		"setApprovalForAll(address,bool)" \
		--legacy \
		--gas 0xfffff \
		--gas-price 245905827660 \
		--rpc-url http://127.0.0.1:8545 \
		--from 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 \
		0x00000000006c3852cbEf3e08E8dF289169EdE581 true

deploy:
	npx hardhat run --network localhost scripts/deploy.js

alice:
	npx ts-node scripts/alice.ts

bob:
	npx ts-node scripts/bob.ts

charlie:
	npx ts-node scripts/charlie.ts

dave:
	npx ts-node scripts/dave.ts

eve:
	npx ts-node scripts/eve.ts

ferdie:
	npx ts-node scripts/ferdie.ts

match:
	npx ts-node scripts/match_order.ts

testseaportjs:
	npx ts-node scripts/test_seaport-js.ts

# check user bal
# we are using a bored ape in this example
alicebal:
	cast call 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d \
		"balanceOf(address)" \
		--rpc-url http://127.0.0.1:8545 \
		0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1

bobbal:
	cast call 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d \
		"balanceOf(address)" \
		--rpc-url http://127.0.0.1:8545 \
		0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0

charliebal:
	cast call 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d \
		"tokenOfOwnerByIndex(address,uint256)" \
		--rpc-url http://127.0.0.1:8545 \
		0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b 0

davebal:
	cast call 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d \
		"tokenOfOwnerByIndex(address,uint256)" \
		--rpc-url http://127.0.0.1:8545 \
		0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d 0

# notes
#
# prior to setup set `export RPC_URL=<YOUR MAINNET RPC>`
# to setup the demo, run `make fork` in one terminal
# and run `make alice` in the second terminal.
# The second command will move a BAYC into alices wallet
# we can check this with `make alicebal`
