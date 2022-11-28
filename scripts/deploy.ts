import { ethers } from "hardhat";

async function main() {
  const auctionFactory = await ethers.getContractFactory("Auction");
  const auction = await auctionFactory.deploy();

  console.log(auction.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
