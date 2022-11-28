import { assert, expect } from "chai";
import { ethers } from "hardhat";
import { Auction } from "../typechain-types";

const DEFAULT_DECIMALS = ethers.BigNumber.from(10).pow(18);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Action", function() {

    let auction: Auction;

    beforeEach(async () => {
        const auctionFactory = await ethers.getContractFactory("Auction");
        auction = await auctionFactory.deploy();

        assert.isDefined(auction, "Auction not deployed");
    });

    it("Should create active", async () => {
        const [creator] = await ethers.getSigners();
        await auction.createActive();

        const createdActive = await auction.allActives(0);

        expect(createdActive.toLowerCase()).to.be.equal(creator.address.toLowerCase());
    });

    it("Should perform regular buy", async () => {
        const [seller, buyer] = await ethers.getSigners();
        const auctionSeller = await auction.connect(seller);
        const auctionBuyer = await auction.connect(buyer);
        
        await auctionSeller.createActive();
        await auctionSeller.createActive();

        const sellerActives = await auctionSeller.getAllActivesByOwner(seller.address);

        expect(sellerActives.length).to.be.equal(2);

        const price = ethers.BigNumber.from(3).mul(DEFAULT_DECIMALS);

        await auctionSeller.listActiveForSale(0, price);

        const lots = await auction.getAllLotsByOwner(seller.address);

        expect(lots.length).to.be.equal(1);

        const lotToBuy = lots[0];
        expect(lotToBuy.bestOfferPrice.toNumber()).to.be.equal(0);
        expect(lotToBuy.bestOfferInitiator).to.be.equal(ZERO_ADDRESS);
        expect(lotToBuy.price).to.be.equal(price);

        await expect(auctionBuyer.buyActive(0, { value: price })).to
            .changeEtherBalances(
                [seller.address, buyer.address],
                [price, price.mul(-1)]
            )
            .emit(auction, "ActiveSold")
            .withArgs(buyer.address, price);

        const buyerActives = await auction.getAllActivesByOwner(buyer.address);

        expect(buyerActives.length).to.be.equal(1);
    });

    it("Should perform offer buy", async () => {
        const [seller, buyer] = await ethers.getSigners();
        const auctionSeller = await auction.connect(seller);
        const auctionBuyer = await auction.connect(buyer);

        const initialPrice = ethers.BigNumber.from(1).mul(DEFAULT_DECIMALS);
        const offerPrice = ethers.BigNumber.from(5).mul(DEFAULT_DECIMALS);

        await auctionSeller.createActive();
        await auctionSeller.listActiveForSale(0, initialPrice);

        await expect(auctionBuyer.makeOffer(0, { value: offerPrice }))
            .to
            .changeEtherBalance(buyer.address, offerPrice.mul(-1));

        await auctionSeller.acceptOffer(0);

        const activeOwner = await auction.allActives(0);

        expect(activeOwner.toLowerCase()).to.be.equal(buyer.address.toLowerCase());
    });

    it("Should be enough for demo", async () => {

    });
})