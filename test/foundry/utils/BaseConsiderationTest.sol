// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import { ConduitController } from "../../../contracts/conduit/ConduitController.sol";
import { ConsiderationInterface } from "../../../contracts/interfaces/ConsiderationInterface.sol";
import { OrderType, BasicOrderType, ItemType, Side } from "../../../contracts/lib/ConsiderationEnums.sol";
import { OfferItem, ConsiderationItem, OrderComponents, BasicOrderParameters } from "../../../contracts/lib/ConsiderationStructs.sol";
import { Test } from "forge-std/Test.sol";
import { stdStorage, StdStorage } from "forge-std/Test.sol";
import { ReferenceConduitController } from "../../../reference/conduit/ReferenceConduitController.sol";
import { ReferenceConsideration } from "../../../reference/ReferenceConsideration.sol";
import { Conduit } from "../../../contracts/conduit/Conduit.sol";
import { Consideration } from "../../../contracts/lib/Consideration.sol";
import { BaseConsiderationDeploy } from "../../../script/deploy.sol";

/// @dev Base test case that deploys Consideration and its dependencies
contract BaseConsiderationTest is BaseConsiderationDeploy {
    using stdStorage for StdStorage;

    function setUp() public virtual {
        conduitKeyOne = bytes32(uint256(uint160(address(this))) << 96);
        vm.label(address(this), "testContract");
        _deployAndConfigurePrecompiledOptimizedConsideration(address(this));

        string[] memory args = new string[](2);
        args[0] = "echo";
        args[1] = "-n";
        // if ffi is enabled, this will not enter the catch block.
        // assume that the local foundry profile is specified, and deploy
        // reference normally, so stack traces and debugger have source map,
        // with the caveat that reference contracts will have been compiled
        // with 0.8.13
        try vm.ffi(args) {
            emit log("Deploying reference from import");
            _deployAndConfigureReferenceConsideration(address(this));
        } catch (bytes memory) {
            emit log("Deploying reference from precompiled source");
            _deployAndConfigurePrecompiledReferenceConsideration(address(this));
        }

        vm.label(address(conduitController), "conduitController");
        vm.label(address(consideration), "consideration");
        vm.label(address(conduit), "conduit");
        vm.label(
            address(referenceConduitController),
            "referenceConduitController"
        );
        vm.label(address(referenceConsideration), "referenceConsideration");
        vm.label(address(referenceConduit), "referenceConduit");
    }

    function singleOfferItem(
        ItemType _itemType,
        address _tokenAddress,
        uint256 _identifierOrCriteria,
        uint256 _startAmount,
        uint256 _endAmount
    ) internal pure returns (OfferItem[] memory offerItem) {
        offerItem = new OfferItem[](1);
        offerItem[0] = OfferItem(
            _itemType,
            _tokenAddress,
            _identifierOrCriteria,
            _startAmount,
            _endAmount
        );
    }

    function singleConsiderationItem(
        ItemType _itemType,
        address _tokenAddress,
        uint256 _identifierOrCriteria,
        uint256 _startAmount,
        uint256 _endAmount,
        address _recipient
    ) internal pure returns (ConsiderationItem[] memory considerationItem) {
        considerationItem = new ConsiderationItem[](1);
        considerationItem[0] = ConsiderationItem(
            _itemType,
            _tokenAddress,
            _identifierOrCriteria,
            _startAmount,
            _endAmount,
            payable(_recipient)
        );
    }

    function signOrder(
        ConsiderationInterface _consideration,
        uint256 _pkOfSigner,
        bytes32 _orderHash
    ) internal returns (bytes memory) {
        (bytes32 r, bytes32 s, uint8 v) = getSignatureComponents(
            _consideration,
            _pkOfSigner,
            _orderHash
        );
        return abi.encodePacked(r, s, v);
    }

    function signOrder2098(
        ConsiderationInterface _consideration,
        uint256 _pkOfSigner,
        bytes32 _orderHash
    ) internal returns (bytes memory) {
        (bytes32 r, bytes32 s, uint8 v) = getSignatureComponents(
            _consideration,
            _pkOfSigner,
            _orderHash
        );
        uint256 yParity;
        if (v == 27) {
            yParity = 0;
        } else {
            yParity = 1;
        }
        uint256 yParityAndS = (yParity << 255) | uint256(s);
        return abi.encodePacked(r, yParityAndS);
    }

    function getSignatureComponents(
        ConsiderationInterface _consideration,
        uint256 _pkOfSigner,
        bytes32 _orderHash
    )
        internal
        returns (
            bytes32,
            bytes32,
            uint8
        )
    {
        (, bytes32 domainSeparator, ) = _consideration.information();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            _pkOfSigner,
            keccak256(
                abi.encodePacked(bytes2(0x1901), domainSeparator, _orderHash)
            )
        );
        return (r, s, v);
    }

    /**
     * @dev reset all storage written at an address thus far to 0; will overwrite totalSupply()for ERC20s but that should be fine
     *      with the goal of resetting the balances and owners of tokens - but note: should be careful about approvals, etc
     *
     *      note: must be called in conjunction with vm.record()
     */
    function _resetStorage(address _addr) internal {
        (, bytes32[] memory writeSlots) = vm.accesses(_addr);
        for (uint256 i = 0; i < writeSlots.length; i++) {
            vm.store(_addr, writeSlots[i], bytes32(0));
        }
    }
}
