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
    convertSignatureToEIP2098,
    getOfferOrConsiderationItem, toKey, toFulfillment,
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

const BAYC_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
const ERC721ABI = require("./ERC721ABI.json");
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const ERC20ABI = require("./ERC20ABI.json");
// THIS KEY IS A DEFAULT KEY FROM GANACHE
const alice_priv_key =
    "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
const bob_priv_key =
    "0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1";
const charlie_priv_key =
    "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c";
const alice = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";
const bob = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0";
const charlie = "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b";

const endpoint = "http://localhost:8545";
const provider = new ethers.providers.JsonRpcProvider(endpoint);
const alice_signer = (new ethers.Wallet(alice_priv_key)).connect(provider);
const bob_signer = (new ethers.Wallet(bob_priv_key)).connect(provider);
const charlie_signer = (new ethers.Wallet(charlie_priv_key)).connect(provider);

const seaport = "0x00000000006c3852cbEf3e08E8dF289169EdE581";
const SEAPORTABI =
    require("../artifacts/contracts/Seaport.sol/Seaport.json").abi;

const ONE = toBN("1000000000000000000");

async function create_alice_order():Promise<Order> {
    // Alice get NFT
    {
        const baycWhale = "0x8ad272ac86c6c88683d9a60eb8ed57e6c304bb0c";
        const signer = provider.getSigner(baycWhale);
        const BAYC = new ethers.Contract(BAYC_ADDRESS, ERC721ABI, signer);
        await BAYC.transferFrom(baycWhale, alice, 5977);
    }

    const BAYC = new ethers.Contract(BAYC_ADDRESS, ERC721ABI, alice_signer);
    await BAYC.connect(alice_signer).setApprovalForAll(seaport, true)

    let token = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
    let identifierOrCriteria = toBN(5977)
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

    let consideration: ConsiderationItem[] = [
        getOfferOrConsiderationItem(
            1,
            WETH_ADDRESS,
            toBN(0),
            ONE,
            ONE,
            alice,
        ),
    ];

    const marketplaceContract = new ethers.Contract(seaport, SEAPORTABI, alice_signer);
    const counter = await marketplaceContract.getCounter(alice);

    const salt = constants.HashZero;
    const startTime = 0;
    const endTime = toBN("0xff00000000000000000000000000");

    const orderParameters = {
        offerer: alice, // offerer.address,
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

    const signature = await alice_signer._signTypedData(
        domainData,
        orderType,
        orderComponents
    );

    const alice_order = {
        parameters: orderParameters,
        signature: convertSignatureToEIP2098(signature),
        numerator: 1, // only used for advanced orders
        denominator: 1, // only used for advanced orders
        extraData: "0x", // only used for advanced orders
    };
    return alice_order;
}

async function create_bob_order():Promise<Order> {
    // BOB get WETH
    {
        const wethWhale = "0xe78388b4ce79068e89bf8aa7f218ef6b9ab0e9d0";
        const signer = provider.getSigner(wethWhale);
        const WETH = new ethers.Contract(WETH_ADDRESS, ERC20ABI, signer);
        await WETH.transfer(bob, ONE);
    }

    const WETH = new ethers.Contract(WETH_ADDRESS, ERC20ABI, bob_signer);
    await WETH.connect(bob_signer).approve(seaport, ONE)

    let offer: OfferItem[] = [
        getOfferOrConsiderationItem(
            1,
            WETH_ADDRESS,
            toBN(0),
            ONE,
            ONE,
            // recipient
        ),
    ];

    let consideration: ConsiderationItem[] = [
        getOfferOrConsiderationItem(
            2,
            BAYC_ADDRESS,
            toBN(5977),
            toBN(1),
            toBN(1),
            bob,
        ),
    ];

    const marketplaceContract = new ethers.Contract(seaport, SEAPORTABI, bob_signer);
    const counter = await marketplaceContract.getCounter(bob);

    const salt = constants.HashZero;
    const startTime = 0;
    const endTime = toBN("0xff00000000000000000000000000");

    const orderParameters = {
        offerer: bob,
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

    const signature = await bob_signer._signTypedData(
        domainData,
        orderType,
        orderComponents
    );

    const bob_order = {
        parameters: orderParameters,
        signature: convertSignatureToEIP2098(signature),
        numerator: 1, // only used for advanced orders
        denominator: 1, // only used for advanced orders
        extraData: "0x", // only used for advanced orders
    };
    return bob_order;
}

const main = async () => {
    const alice_order = await create_alice_order();
    console.dir(alice_order, { depth: null });

    const bob_order = await create_bob_order();
    console.dir(bob_order, { depth: null });


    const WETH = new ethers.Contract(WETH_ADDRESS, ERC20ABI, alice_signer);
    const BAYC = new ethers.Contract(BAYC_ADDRESS, ERC721ABI, alice_signer);

    //print balance before match
    {
        let baycBalance = await BAYC.balanceOf(alice);
        console.log("Alice BAYC balance:" + baycBalance);
        baycBalance = await BAYC.balanceOf(bob);
        console.log("BOB BAYC balance:" + baycBalance);
        let wethBalance = await WETH.balanceOf(alice);
        console.log("Alice WETH balance:" + wethBalance);
        wethBalance = await WETH.balanceOf(bob);
        console.log("BOB WETH balance:" + wethBalance);
    }


    //match order
    const fulfillment = [
        [[[0, 0]], [[1, 0]]],
        [[[1, 0]], [[0, 0]]],
    ].map(([offerArr, considerationArr]) =>
        toFulfillment(offerArr, considerationArr)
    );
    const marketplaceContract = new ethers.Contract(seaport, SEAPORTABI, charlie_signer);
    const tx = marketplaceContract
        .connect(charlie_signer)
        .matchOrders(
            [alice_order, bob_order],
            fulfillment,
            {
            gasLimit: 1_000_000,
        });
    const receipt = await (await tx).wait();
    //console.log(receipt)

    //print balance after match
    console.log("--------------------------------------------");
    {
        let baycBalance = await BAYC.balanceOf(alice);
        console.log("Alice BAYC balance:" + baycBalance);
        baycBalance = await BAYC.balanceOf(bob);
        console.log("BOB BAYC balance:" + baycBalance);
        let wethBalance = await WETH.balanceOf(alice);
        console.log("Alice WETH balance:" + wethBalance);
        wethBalance = await WETH.balanceOf(bob);
        console.log("BOB WETH balance:" + wethBalance);
    }

};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
