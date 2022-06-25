fork:
	ganache \
	-d \
	--chain.chainId 522 \
	--fork ${RPC_URL} \
	--unlock \
		0x725efdc61c6a10b3b2cbef14371532c5a45f62b7 \
		0x8ad272ac86c6c88683d9a60eb8ed57e6c304bb0c

deploy:
	npx hardhat run --network localhost scripts/deploy.js

alice:
	npx ts-node scripts/alice.ts

bob:
	npx ts-node scripts/bob.ts

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

# notes
#
# prior to setup set `export RPC_URL=<YOUR MAINNET RPC>` 
# to setup the demo, run `make fork` in one terminal
# and run `make alice` in the second terminal. 
# The second command will move a BAYC into alices wallet
# we can check this with `make alicebal`