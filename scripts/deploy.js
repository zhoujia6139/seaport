async function main() {
  // We get the contract to deploy
  const ConduitController = await ethers.getContractFactory("ConduitController");
  const conduitcontroller = await ConduitController.deploy({maxFeePerGas: 0xffffffffff});

  await conduitcontroller.deployed();

  console.log("ConduitController deployed to:", conduitcontroller.address);

  // We get the contract to deploy
  const Seaport = await ethers.getContractFactory("Seaport");
  const seaport = await Seaport.deploy(conduitcontroller.address, {maxFeePerGas: 0xffffffffff});

  await seaport.deployed();

  console.log("Seaport deployed to:", seaport.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });