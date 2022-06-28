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

import {
	getItemETH,
    getItem721,
	convertSignatureToEIP2098,
	getOfferOrConsiderationItem,
} from "../test/utils/encoding";
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
		"0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743";
	const endpoint = "http://localhost:8545";

	const provider = new ethers.providers.JsonRpcProvider(endpoint);
	let signer = new ethers.Wallet(priv_key);
	signer = signer.connect(provider);
	const eve = "0xd03ea8624C8C5987235048901fB614fDcA89b117";

	const conduitController = "0x00000000F9490004C11Cef243f5400493c00Ad63";
	const seaport = "0x00000000006c3852cbEf3e08E8dF289169EdE581";

	// get NFT
	{
		const BAYC_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
		const baycWhale = "0x8ad272ac86c6c88683d9a60eb8ed57e6c304bb0c";
		const ERC721ABI = require("./ERC721ABI.json");
		const signer = provider.getSigner(baycWhale);
		const BAYC = new ethers.Contract(BAYC_ADDRESS, ERC721ABI, signer);
		await BAYC.transferFrom(baycWhale, eve, 2885);
		let bal = await BAYC.balanceOf(eve);
		console.log(bal);
	}

	const BAYC_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
	const ERC721ABI = require("./ERC721ABI.json");
	const BAYC = new ethers.Contract(BAYC_ADDRESS, ERC721ABI, signer);
	await BAYC.connect(signer).setApprovalForAll(seaport, true)

	let token = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
	let identifierOrCriteria = toBN(2885)
	let startAmount = toBN(1)
	let endAmount = toBN(1)
	let offer: OfferItem[] = [
		getOfferOrConsiderationItem(
			2,
			token,
			identifierOrCriteria,
			startAmount,
			endAmount,
			// recipient
		),
	];

    const consideration = [
		getItem721(token, toBN(1388), 1, 1, eve),
        getItemETH(utils.parseEther("1"), utils.parseEther("1"), eve),
	];

	const SEAPORTABI =
		require("../artifacts/contracts/Seaport.sol/Seaport.json").abi;
	const marketplaceContract = new ethers.Contract(seaport, SEAPORTABI, signer);
	const counter = await marketplaceContract.getCounter(eve);

	const salt = constants.HashZero;
	const startTime = 0;
	const endTime = toBN("0xff00000000000000000000000000");

	const orderParameters = {
		offerer: eve, // offerer.address,
		zone: constants.AddressZero,
		offer: offer,
		consideration,
		totalOriginalConsiderationItems: consideration.length,
		orderType: 0, // FULL_OPEN
		zoneHash: constants.HashZero,
		salt,
		conduitKey: constants.HashZero,
		startTime,
		endTime,
	};

	const orderComponents = {
		...orderParameters,
		counter,
	};

	// Required for EIP712 signing
	const domainData = {
		name: "Seaport",
		version: "1.1",
		chainId: 522,
		verifyingContract: marketplaceContract.address,
	};

	const { orderType } = require("../eip-712-types/order");

	const signature = await signer._signTypedData(
		domainData,
		orderType,
		orderComponents
	);

	const order = {
		parameters: orderParameters,
		signature: convertSignatureToEIP2098(signature),
		numerator: 1, // only used for advanced orders
		denominator: 1, // only used for advanced orders
		extraData: "0x", // only used for advanced orders
	};

	console.dir(order, { depth: null });
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});