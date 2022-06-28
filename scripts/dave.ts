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

	// // get USDC
	// {
	// 	const usdcWhale = "0x725efdc61c6a10b3b2cbef14371532c5a45f62b7";
	// 	const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
	// 	const ERC20ABI = require("./ERC20ABI.json");
	// 	const signer = provider.getSigner(usdcWhale);
	// 	const USDC = new ethers.Contract(USDC_ADDRESS, ERC20ABI, signer);
	// 	await USDC.transfer(alice, 1000);
	// 	let bal = await USDC.balanceOf(alice);
	// 	console.log(bal);
	// }

	let order = {
		parameters: {
			offerer: "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b",
			zone: "0x0000000000000000000000000000000000000000",
			offer: [
				{
					itemType: 2,
					token: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
					identifierOrCriteria: BigNumber.from("0x05e9"),
					startAmount: BigNumber.from("0x01"),
					endAmount: BigNumber.from("0x01"),
				},
			],
			consideration: [
				{
					itemType: 0,
					token: "0x0000000000000000000000000000000000000000",
					identifierOrCriteria: BigNumber.from("0x00"),
					startAmount: BigNumber.from("0x0de0b6b3a7640000"),
					endAmount: BigNumber.from("0x0de0b6b3a7640000"),
					recipient: "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b",
				},
			],
			totalOriginalConsiderationItems: 1,
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
			"0x35a7c6de95a29ef73f21f2fc73afe2b3dc2b9a42183bb09e754470c8a6c0782561d1e4ac20e4ce16689cc7e0ed0422e611a4f75e8bd2fd44caa7a542609bc259",
		numerator: 1,
		denominator: 1,
		extraData: "0x",
	};

	console.dir(order, {depth: null})

	// THIS KEY IS A DEFAULT KEY FROM GANACHE
	const priv_key =
		"0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913";
	const endpoint = "http://localhost:8545";
	const dave = "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d"

	const provider = new ethers.providers.JsonRpcProvider(endpoint);
	let signer = new ethers.Wallet(priv_key);
	signer = signer.connect(provider);

	const conduitController = "0x00000000F9490004C11Cef243f5400493c00Ad63";
	const seaport = "0x00000000006c3852cbEf3e08E8dF289169EdE581";

	const SEAPORTABI =
		require("../artifacts/contracts/Seaport.sol/Seaport.json").abi;
	const marketplaceContract = new ethers.Contract(seaport, SEAPORTABI, signer);

	const value = utils.parseEther("1")

	console.log(value)

	const tx = marketplaceContract
	  .connect(signer)
	  .fulfillOrder(order, toKey(false), {
	    value,
	    gasLimit: 200_000,
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