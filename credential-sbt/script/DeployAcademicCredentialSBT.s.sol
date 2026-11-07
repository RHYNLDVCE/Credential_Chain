// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AcademicCredentialSBT} from "../src/AcademicCredentialSBT.sol";

/// @title DeployAcademicCredentialSBT
/// @notice Deployment script for AcademicCredentialSBT targeting EVM Layer-2 rollups (e.g. Base, Polygon PoS)
contract DeployAcademicCredentialSBT is Script {
    function run() external returns (AcademicCredentialSBT credentialContract) {
        address deployer = msg.sender;

        // Retrieve configurable parameters from environment or default to deployer
        address adminAddress = vm.envOr("ADMIN_ADDRESS", deployer);
        address registrarAddress = vm.envOr("REGISTRAR_ADDRESS", deployer);
        string memory baseURI = vm.envOr("METADATA_BASE_URI", string("ipfs://"));

        console2.log("Deploying AcademicCredentialSBT...");
        console2.log("Deployer:", deployer);
        console2.log("Admin Address:", adminAddress);
        console2.log("Registrar Address:", registrarAddress);
        console2.log("Base URI:", baseURI);

        vm.startBroadcast();

        credentialContract = new AcademicCredentialSBT(
            "MSU-TCTO Academic Credential SBT", "MSUTCTO-SBT", adminAddress, registrarAddress, baseURI
        );

        vm.stopBroadcast();

        console2.log("AcademicCredentialSBT deployed at:", address(credentialContract));
    }
}
