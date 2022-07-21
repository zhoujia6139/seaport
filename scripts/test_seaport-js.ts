import { ethers, BigNumber, constants, utils } from "ethers";
import { Seaport } from "@opensea/seaport-js"
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

const BAYC_ADDRESS = "0x86cfc340988f3e46c451824740c0d8b627210bab";
const BAYC_ID = "381";
const ERC721ABI = require("./ERC721ABI.json");
const WETH_ADDRESS = "0xc778417e063141139fce010982780140aa0cd5ab";
const ERC20ABI = require("./ERC20ABI.json");

const alice = "0xc8747e914cDFCB722ce995a8953e7cf5692dBDc0";
const alice_priv_key =
    "c6436222aa0cf38b0b6811d8a883eb5f2d67bfbe5a1c3701b242bfdc679fd8ce";

const bob = "0x2c628f2269f4533F74D5155056A57318CeF0fc39";
const bob_priv_key =
    "0f1de22db58fd180badd4f9a10c9aaa2ed4b703edbe9195202eb75087659039a";


const endpoint = "https://rinkeby.infura.io/v3/4416f70f7de745deb9076bf22ddc4f2a";
const provider = new ethers.providers.JsonRpcProvider(endpoint);
const alice_signer = (new ethers.Wallet(alice_priv_key)).connect(provider);
const bob_signer = (new ethers.Wallet(bob_priv_key)).connect(provider);

const seaportAddr = "0x00000000006c3852cbEf3e08E8dF289169EdE581";
const SEAPORTABI =
  require("../artifacts/contracts/Seaport.sol/Seaport.json").abi;
const zoneAddr = "0x00000000E88FE2628EbC5DA81d2b3CeaD633E89e";

const ONE = toBN("1000000000000000000");

const seaportAPI = new Seaport(bob_signer, {
  balanceAndApprovalChecksOnOrderCreation: true,
  overrides: {
    contractAddress: seaportAddr,
  },
});

async function prepare_nft_for_alice():Promise<void> {
  const BAYC = new ethers.Contract(BAYC_ADDRESS, ERC721ABI, bob_signer);
  const owner = await BAYC.ownerOf(BAYC_ID);
  if (owner === bob) {
    console.log("transfer nft to alice");
    //await BAYC.connect(bob_signer).setApprovalForAll(seaportAddr, true);
    let transferTx = await BAYC.connect(bob_signer).transferFrom(bob, alice, BAYC_ID);
    await transferTx.wait();
  }
}

async function create_bob_order():Promise<any> {
    const { executeAllActions } = await seaportAPI.createOrder(
        {
            offer: [
                {
                    amount: ethers.utils.parseEther("0.001").toString(),
                    token: WETH_ADDRESS
                }
            ],
            consideration: [
                {
                    itemType: 2,
                    token: BAYC_ADDRESS,
                    identifier: BAYC_ID,
                    recipient: bob
                }
            ],
            zone: zoneAddr,
            fees: [
                {
                    recipient: "0x8De9C5A032463C561423387a9648c5C7BCC5BC90",
                    basisPoints: 250
                }
            ],
            allowPartialFills: false,
            restrictedByZone: true
        },
        bob
    )

    return await executeAllActions()
}

const main = async () => {
    await prepare_nft_for_alice();
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


    //fulfill order
    const marketplaceContract = new ethers.Contract(seaportAddr, SEAPORTABI, alice_signer);
    const tx = marketplaceContract
        .connect(alice_signer)
        .fulfillBasicOrder(
            {
                considerationToken: bob_order.parameters.consideration[0].token,
                considerationIdentifier:
                bob_order.parameters.consideration[0].identifierOrCriteria,
                considerationAmount: 1,
                offerer: bob,
                zone: zoneAddr,
                offerToken: bob_order.parameters.offer[0].token,
                offerIdentifier: bob_order.parameters.offer[0].identifierOrCriteria,
                offerAmount: bob_order.parameters.offer[0].startAmount,
                basicOrderType: 18,
                startTime: bob_order.parameters.startTime,
                endTime: bob_order.parameters.endTime,
                zoneHash: bob_order.parameters.zoneHash,
                salt: bob_order.parameters.salt,
                offererConduitKey: bob_order.parameters.conduitKey,
                fulfillerConduitKey: bob_order.parameters.conduitKey,
                totalOriginalAdditionalRecipients: 1,
                additionalRecipients: [
                    {
                        amount: bob_order.parameters.consideration[1].startAmount,
                        recipient: bob_order.parameters.consideration[1].recipient
                    }
                ],
                signature: bob_order.signature
            },
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
