import { HeaderComponent } from "components/Layout/HeaderComponent";
import React, { useEffect, useState } from "react";
import headerImg from "assets/img/bober-game-room/BoberCover.png";
import { useGetAccount, useGetPendingTransactions } from "hooks";
import { useGetLoginInfo } from "@multiversx/sdk-dapp/hooks";
import { BOBER_GAME_ROOM_TOKENS } from "appsConfig";
import { decodeNativeAuthToken, toastError } from "libs/utils";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { DataNftCard } from "components";
import { BoberModal } from "./components/BoberModal";

export const BoberGameRoom: React.FC = () => {
  const { address } = useGetAccount();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const { tokenLogin } = useGetLoginInfo();

  const [itDataNfts, setItDataNfts] = useState<DataNft[]>([]);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(true);
  const [owned, setOwned] = useState<boolean>(false);
  const [data, setData] = useState<any>();

  useEffect(() => {
    if (!hasPendingTransactions) {
      fetchAppNfts();
    }
  }, [hasPendingTransactions]);

  useEffect(() => {
    if (!isLoading && address) {
      fetchMyNfts();
    }
  }, [isLoading, address]);

  async function fetchAppNfts() {
    setIsLoading(true);

    const _nfts: DataNft[] = await DataNft.createManyFromApi(BOBER_GAME_ROOM_TOKENS.map((v) => ({ nonce: v.nonce, tokenIdentifier: v.tokenIdentifier })));

    setItDataNfts(_nfts);
    setIsLoading(false);
  }

  async function fetchMyNfts() {
    const _dataNfts = await DataNft.ownedByAddress(address);
    const _flags = [];

    for (const cnft of itDataNfts) {
      const matches = _dataNfts.filter((mnft) => cnft.nonce === mnft.nonce);
      _flags.push(matches.length > 0);
    }

    setFlags(_flags);
  }

  async function viewData(index: number) {
    try {
      if (!(index >= 0 && index < itDataNfts.length)) {
        toastError("Data is not loaded");
        return;
      }

      const dataNft = itDataNfts[index];
      const _owned = flags[index];
      setOwned(_owned);

      if (_owned) {
        setIsFetchingDataMarshal(true);

        let res: any;
        if (!(tokenLogin && tokenLogin.nativeAuthToken)) {
          throw Error("No nativeAuth token");
        }

        const arg = {
          mvxNativeAuthOrigins: [decodeNativeAuthToken(tokenLogin.nativeAuthToken).origin],
          mvxNativeAuthMaxExpirySeconds: 3600,
          fwdHeaderMapLookup: {
            "authorization": `Bearer ${tokenLogin.nativeAuthToken}`,
          },
          nestedStream: true,
          nestedIdxToStream: 1,
        };

        res = await dataNft.viewDataViaMVXNativeAuth(arg);
        res.data = await (res.data as Blob);
        // console.log(res.data);

        setData(res.data);
        setIsFetchingDataMarshal(false);
      }
    } catch (err) {
      console.error(err);
      toastError((err as Error).message);
      setIsFetchingDataMarshal(false);
    }
  }

  // console.log(data);
  return (
    <HeaderComponent
      pageTitle={"Bober Game Room"}
      hasImage={true}
      imgSrc={headerImg}
      altImageAttribute={"itheumTrailblazer"}
      pageSubtitle={"Data NFTs that Unlock this Itheum Data Widget"}
      dataNftCount={itDataNfts.length}>
      {itDataNfts.length > 0 ? (
        itDataNfts.map((dataNft, index) => (
          <DataNftCard
            key={index}
            index={index}
            dataNft={dataNft}
            isLoading={isLoading}
            owned={flags[index]}
            modalStyles={"md:h-[95svh] sm:h-[100svh]"}
            viewData={viewData}
            modalContent={<BoberModal data={data} isFetchingDataMarshal={isFetchingDataMarshal} owned={owned} />}
            modalTitle={"Bober Game Room"}
            modalTitleStyle="md:p-5 pt-5 pb-5 px-2"
          />
        ))
      ) : (
        <h3 className="text-center text-white">No Data NFTs</h3>
      )}
    </HeaderComponent>
  );
};