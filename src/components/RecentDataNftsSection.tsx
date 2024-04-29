import React, { useEffect, useState } from "react";
import { DataNft, Offer } from "@itheum/sdk-mx-data-nft/out";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import { getHealthCheckFromBackendApi, getRecentOffersFromBackendApi } from "../libs/backend-api";
import { ThreeDCard } from "./ThreeDCard";
import { IAddress } from "@multiversx/sdk-core/out";
import BigNumber from "bignumber.js";
import { Address } from "@multiversx/sdk-core/out";
import toast from "react-hot-toast";
import { convertWeiToEsdt } from "libs/utils";

export interface RecentDataNFTType {
  index: BigNumber.Value;
  owner: IAddress;
  tokenIdentifier: string;
  creator: IAddress;
  offeredTokenIdentifier: string;
  offeredTokenNonce: BigNumber.Value;
  offeredTokenAmount: BigNumber.Value;
  wantedTokenIdentifier: string;
  wantedTokenNonce: BigNumber.Value;
  wantedTokenAmount: BigNumber.Value;
  quantity: BigNumber.Value;
  tokenName?: string;
  title?: string;
  nftImgUrl?: string;
  royalties?: BigNumber.Value;
}

const RecentDataNFTsSection: React.FC = () => {
  const { chainID } = useGetNetworkConfig();
  const [latestOffers, setLatestOffers] = useState<RecentDataNFTType[]>();
  const [isApiUp, setIsApiUp] = useState(false);

  useEffect(() => {
    async function fetchApiHealthCheck() {
      try {
        const healthCheck = await getHealthCheckFromBackendApi(chainID);
        if (healthCheck) {
          setIsApiUp(true);
        }
      } catch (error) {
        setIsApiUp(false);
        toast.error("Backend API is down. Recent Data NFTs will not be available");
      }
    }
    fetchApiHealthCheck();
  }, []);

  useEffect(() => {
    if (isApiUp) apiWrapper();
  }, [isApiUp]);

  const apiWrapper = async () => {
    DataNft.setNetworkConfig(chainID === "1" ? "mainnet" : "devnet");

    try {
      const offers = await getRecentOffersFromBackendApi(chainID);
      const recentNonces = offers.map((nft: any) => ({ nonce: nft.offeredTokenNonce }));
      const dataNfts: DataNft[] = await DataNft.createManyFromApi(recentNonces);
      const _latestOffers: RecentDataNFTType[] = [];
      offers.forEach((offer: Offer) => {
        const matchingDataNft = dataNfts.find(
          (dataNft: DataNft) => dataNft.nonce === offer.offeredTokenNonce && dataNft.collection === offer.offeredTokenIdentifier
        );
        if (matchingDataNft) {
          _latestOffers.push({
            tokenIdentifier: matchingDataNft.tokenIdentifier,
            index: offer.index,
            owner: new Address(offer.owner),
            creator: new Address(matchingDataNft?.owner),
            offeredTokenIdentifier: offer.offeredTokenIdentifier,
            offeredTokenNonce: offer.offeredTokenNonce,
            offeredTokenAmount: offer.offeredTokenAmount,
            wantedTokenIdentifier: offer.wantedTokenIdentifier,
            wantedTokenNonce: offer.wantedTokenNonce,
            wantedTokenAmount: offer.wantedTokenAmount,
            quantity: offer.quantity,
            tokenName: matchingDataNft?.tokenName,
            title: matchingDataNft?.title,
            nftImgUrl: matchingDataNft?.nftImgUrl,
            royalties: matchingDataNft?.royalties,
          });
        }
      });
      setLatestOffers(_latestOffers);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {isApiUp ? (
        <div>
          <h2 className="mt-12 py-2 mb-0">Recent Data NFTs</h2>
          <div className="w-full flex flex-row flex-wrap items-center justify-center md:items-start md:justify-start">
            {latestOffers &&
              latestOffers
                .slice(0, 10)
                .map((nft, index) => (
                  <ThreeDCard
                    key={index}
                    chainID={chainID}
                    tokenIdentifier={nft.tokenIdentifier}
                    title={nft.title || ""}
                    nftImgUrl={nft.nftImgUrl || ""}
                    supply={Number(nft.quantity)}
                    wantedTokenAmount={Number(convertWeiToEsdt(nft.wantedTokenAmount))}
                    offerIndex={Number(nft.index)}
                  />
                ))}
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};
export default RecentDataNFTsSection;