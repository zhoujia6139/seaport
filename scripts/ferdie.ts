import { ethers, BigNumber, constants, utils } from "ethers";

import {
	BasicOrderParameters,
	BigNumberish,
	ConsiderationItem,
	CriteriaResolver,
	FulfillmentComponent,
	OfferItem,
	Order,
	OrderComponents,
} from "../test/utils/types";

import { getItemETH, convertSignatureToEIP2098, toKey} from "../test/utils/encoding";
import { marketplaceFixture } from "../test/utils/fixtures/marketplace";

const hexRegex = /[A-Fa-fx]/g;

export const toHex = (n: BigNumberish, numBytes: number = 0) => {
	const asHexString = BigNumber.isBigNumber(n)
		? n.toHexString().slice(2)
		: typeof n === "string"
		? hexRegex.test(n)
			? n.replace(/0x/, "")
			: (+n).toString(16)
		: (+n).toString(16);
	return `0x${asHexString.padStart(numBytes * 2, "0")}`;
};

export const toBN = (n: BigNumberish) => BigNumber.from(toHex(n));

const main = async () => {
    // THIS KEY IS A DEFAULT KEY FROM GANACHE
	const priv_key =
    "0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd";
    const endpoint = "http://localhost:8545";
    const ferdie = "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC"

    const provider = new ethers.providers.JsonRpcProvider(endpoint);

    // get USDC
	{
		const usdcWhale = "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503";
		const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
		const ERC20ABI = require("./ERC20ABI.json");
		const signer = provider.getSigner(usdcWhale);
		const USDC = new ethers.Contract(USDC_ADDRESS, ERC20ABI, signer);
		await USDC.transfer(ferdie, 1000);
		let bal = await USDC.balanceOf(ferdie);
		console.log(bal);
	}

	// get NFT
	{
		const BAYC_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
		const baycWhale = "0x8ad272ac86c6c88683d9a60eb8ed57e6c304bb0c";
		const ERC721ABI = require("./ERC721ABI.json");
		const signer = provider.getSigner(baycWhale);
		const BAYC = new ethers.Contract(BAYC_ADDRESS, ERC721ABI, signer);
		await BAYC.transferFrom(baycWhale, ferdie, 1388);
		let bal = await BAYC.balanceOf(ferdie);
		console.log(bal);
	}

    let signer = new ethers.Wallet(priv_key);
    signer = signer.connect(provider);

    const conduitController = "0x00000000F9490004C11Cef243f5400493c00Ad63";
	const seaport = "0x00000000006c3852cbEf3e08E8dF289169EdE581";
    const BAYC_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
	const ERC721ABI = require("./ERC721ABI.json");
	const BAYC = new ethers.Contract(BAYC_ADDRESS, ERC721ABI, signer);
	await BAYC.connect(signer).setApprovalForAll(seaport, true)

	let order = {
		parameters: {
			offerer: "0xd03ea8624C8C5987235048901fB614fDcA89b117",
			zone: "0x0000000000000000000000000000000000000000",
			offer: [
				{
					itemType: 2,
					token: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
					identifierOrCriteria: BigNumber.from("0x0b45"),
					startAmount: BigNumber.from("0x01"),
					endAmount: BigNumber.from("0x01"),
				},
			],
			consideration: [
				{
					itemType: 2,
					token: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
					identifierOrCriteria: BigNumber.from("0x056c"),
					startAmount: BigNumber.from("0x01"),
					endAmount: BigNumber.from("0x01"),
					recipient: "0xd03ea8624C8C5987235048901fB614fDcA89b117",
				},
                {
					itemType: 0,
					token: "0x0000000000000000000000000000000000000000",
					identifierOrCriteria: BigNumber.from("0x00"),
					startAmount: BigNumber.from("0x0de0b6b3a7640000"),
					endAmount: BigNumber.from("0x0de0b6b3a7640000"),
					recipient: "0xd03ea8624C8C5987235048901fB614fDcA89b117",
				},
			],
			totalOriginalConsiderationItems: 2,
			orderType: 0,
			zoneHash:
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
			conduitKey:
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			startTime: 0,
			endTime: BigNumber.from("0xff00000000000000000000000000"),
		},
		signature:
			"0xf1eeed1a9ba423cd44c4eefa7cd998110b40ab92a20aaf1e569a273992a0e6cb21cc0932defec0ce72042ce1cfa4efe2d5a517306df32fb018a49688f1c66452",
		numerator: 1,
		denominator: 1,
		extraData: "0x",
	};

	console.dir(order, {depth: null})

	const SEAPORTABI =
		require("../artifacts/contracts/Seaport.sol/Seaport.json").abi;
	const marketplaceContract = new ethers.Contract(seaport, SEAPORTABI, signer);

	const value = utils.parseEther("1")

	console.log(value)
    
    const tx = marketplaceContract
	  .connect(signer)
	  .fulfillOrder(order, toKey(false), {
	    value,
	    gasLimit: 30_000_000,
	  });

	const receipt = await (await tx).wait();
	console.log(tx)

};
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});