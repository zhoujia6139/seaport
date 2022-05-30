// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import { Script } from "forge-std/Script.sol";
import { Test } from "forge-std/Test.sol";

import { ConduitController } from "../contracts/conduit/ConduitController.sol";
import { ConsiderationInterface } from "../contracts/interfaces/ConsiderationInterface.sol";
import { OrderType, BasicOrderType, ItemType, Side } from "../contracts/lib/ConsiderationEnums.sol";
import { OfferItem, ConsiderationItem, OrderComponents, BasicOrderParameters } from "../contracts/lib/ConsiderationStructs.sol";
import { ReferenceConduitController } from "../reference/conduit/ReferenceConduitController.sol";
import { ReferenceConsideration } from "../reference/ReferenceConsideration.sol";
import { Conduit } from "../contracts/conduit/Conduit.sol";
import { Consideration } from "../contracts/lib/Consideration.sol";

/// @dev Base deployment of Consideration and its dependencies
contract BaseConsiderationDeploy is Script, Test {
    ConsiderationInterface consideration;
    ConsiderationInterface referenceConsideration;
    bytes32 conduitKeyOne;
    ConduitController conduitController;
    ConduitController referenceConduitController;
    Conduit referenceConduit;
    Conduit conduit;

    function run() external {
        vm.startBroadcast();
        vm.label(address(msg.sender), "deployer");

        conduitKeyOne = bytes32(uint256(uint160(address(msg.sender))) << 96);
        _deployAndConfigurePrecompiledOptimizedConsideration(msg.sender);

        vm.stopBroadcast();
    }

    ///@dev deploy optimized consideration contracts from pre-compiled source (solc-0.8.13, IR pipeline enabled)
    function _deployAndConfigurePrecompiledOptimizedConsideration(
        address deployer
    ) public {
        conduitController = ConduitController(
            deployCode(
                "optimized-out/ConduitController.sol/ConduitController.json"
            )
        );
        consideration = ConsiderationInterface(
            deployCode(
                "optimized-out/Consideration.sol/Consideration.json",
                abi.encode(address(conduitController))
            )
        );

        //create conduit, update channel
        conduit = Conduit(
            conduitController.createConduit(conduitKeyOne, deployer)
        );
        conduitController.updateChannel(
            address(conduit),
            address(consideration),
            true
        );
    }

    ///@dev deploy reference consideration contracts from pre-compiled source (solc-0.8.7, IR pipeline disabled)
    function _deployAndConfigurePrecompiledReferenceConsideration(
        address deployer
    ) public {
        referenceConduitController = ConduitController(
            deployCode(
                "reference-out/ReferenceConduitController.sol/ReferenceConduitController.json"
            )
        );
        referenceConsideration = ConsiderationInterface(
            deployCode(
                "reference-out/ReferenceConsideration.sol/ReferenceConsideration.json",
                abi.encode(address(referenceConduitController))
            )
        );

        //create conduit, update channel
        referenceConduit = Conduit(
            referenceConduitController.createConduit(conduitKeyOne, deployer)
        );
        referenceConduitController.updateChannel(
            address(referenceConduit),
            address(referenceConsideration),
            true
        );
    }

    function _deployAndConfigureReferenceConsideration(address deployer)
        public
    {
        referenceConduitController = ConduitController(
            address(new ReferenceConduitController())
        );
        referenceConsideration = ConsiderationInterface(
            address(
                new ReferenceConsideration(address(referenceConduitController))
            )
        );
        referenceConduit = Conduit(
            referenceConduitController.createConduit(conduitKeyOne, deployer)
        );
        referenceConduitController.updateChannel(
            address(referenceConduit),
            address(referenceConsideration),
            true
        );
    }
}
