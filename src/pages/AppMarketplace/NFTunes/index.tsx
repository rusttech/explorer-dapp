import React, { useEffect, useMemo, useState } from "react";
import { DataNft, ViewDataReturnType } from "@itheum/sdk-mx-data-nft";
import { useGetLoginInfo } from "@multiversx/sdk-dapp/hooks";
import { NF_TUNES_TOKENS } from "appsConfig";
import nfTunesBanner from "assets/img/nf-tunes-banner.png";
import disk from "assets/img/nf-tunes-logo-disk.png";
import { DataNftCard, Loader } from "components";
import { AudioPlayer } from "components/AudioPlayer";
import { HeaderComponent } from "components/Layout/HeaderComponent";
import { useGetAccount, useGetPendingTransactions } from "hooks";
import { BlobDataType } from "libs/types";
import { decodeNativeAuthToken, toastError } from "libs/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import stick from "../../../assets/img/nf-tunes-logo-stick.png";
import { Music, Music2 } from "lucide-react";
import { Button } from "libComponents/Button";
import zstorageDataVault from "../../../assets/img/zstorage/zstorage-data-vault.png";
import musicNote from "../../../assets/img/music-note.png";
import manuImage from "../../../assets/img/nf-tunes/manu.png";
import manuBackground from "../../../assets/img/nf-tunes/bg-manu.jpg";
import megaphone from "../../../assets/img/nf-tunes/megaphone.png";

interface ExtendedViewDataReturnType extends ViewDataReturnType {
  blobDataType: BlobDataType;
}

export const NFTunes = () => {
  const { address } = useGetAccount();
  const { loginMethod } = useGetLoginInfo();

  ///native auth
  const { tokenLogin } = useGetLoginInfo();

  const { hasPendingTransactions } = useGetPendingTransactions();

  const [dataNfts, setDataNfts] = useState<DataNft[]>([]);
  const [featuredArtistDataNft, setFeaturedArtistDataNft] = useState<DataNft>();
  const [flags, setFlags] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(true);
  const [viewDataRes, setViewDataRes] = useState<ExtendedViewDataReturnType>();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [dataMarshalResponse, setDataMarshalResponse] = useState({ "data_stream": {}, "data": [] });

  const imgAnimation = useMemo(
    () => (
      <div className="relative  top-[15%]">
        <img className="animate-spin-slow w-[20%] left-[40%] max-w-[300px] absolute" src={disk} alt="disk" />
        <img className="rotate-[20deg] absolute top-[-10px] md:top-[-15px] max-w-[200px] left-[52%] 3xl:left-[50%] w-[15%] " src={stick} alt="stick" />
      </div>
    ),
    []
  );

  useEffect(() => {
    if (!hasPendingTransactions) {
      fetchDataNfts();
    }
  }, [hasPendingTransactions]);

  useEffect(() => {
    if (!isLoading && address) {
      fetchMyNfts();
    }
  }, [isLoading, address]);

  ///get the nfts that are able to open nfTunes app
  async function fetchDataNfts() {
    setIsLoading(true);

    const _nfts: DataNft[] = await DataNft.createManyFromApi(NF_TUNES_TOKENS.map((v) => ({ nonce: v.nonce, tokenIdentifier: v.tokenIdentifier })));
    setDataNfts(_nfts);
    console.log("_nfts", _nfts);
    setIsLoading(false);
  }

  ///fetch the nfts owned by the logged in address and if the user has any of them set flag to true,
  //on those will be shown view data otherwise show market place explore button
  async function fetchMyNfts() {
    const _dataNfts = await DataNft.ownedByAddress(address);
    const _flags = [];

    for (const currentNft of dataNfts) {
      const matches = _dataNfts.filter((ownedNft) => currentNft.nonce === ownedNft.nonce);
      _flags.push(matches.length > 0);
    }

    setFlags(_flags);
  }

  /// after pressing the button to view data open modal
  async function viewData(index: number) {
    try {
      if (!(index >= 0 && index < dataNfts.length)) {
        toastError("Data is not loaded");
        return;
      }

      const _owned = flags[index];

      if (_owned) {
        setIsFetchingDataMarshal(true);

        const dataNft = dataNfts[index];
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
          stream: true,
        };
        setCurrentIndex(index);

        res = await dataNft.viewDataViaMVXNativeAuth(arg);
        let blobDataType = BlobDataType.TEXT;

        if (!res.error) {
          if (res.contentType.search("application/json") >= 0) {
            res.data = await (res.data as Blob).text();
            res.data = JSON.stringify(JSON.parse(res.data), null, 4);
          }
        } else {
          console.error(res.error);
          toastError(res.error);
        }
        const viewDataPayload: ExtendedViewDataReturnType = {
          ...res,
          blobDataType,
        };
        setDataMarshalResponse(JSON.parse(res.data));

        setViewDataRes(viewDataPayload);
        setIsFetchingDataMarshal(false);
      }
    } catch (err) {
      console.error(err);
      toastError((err as Error).message);
      setIsFetchingDataMarshal(false);
    }
  }

  return (
    <div className="flex flex-col justify-center items-center gap-8  ">
      <div className="flex flex-col items-start h-screen mt-[5%]">
        <div className="flex flex-col w-full xl:w-[60%] gap-6">
          <div className="flex-row flex items-center ">
            <span
              className="text-5xl xl:text-[8rem]  
             bg-clip-text text-transparent bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]
            ">
              NF-Tunes
            </span>
            <img className="max-h-[30%] mb-6" src={musicNote} />
          </div>
          <div className="flex flex-row justify-between">
            <span className="text-base md:text-2xl text-primary text-light w-[70%]">
              Empowering Indie musicians to engage with a fresh fan community and discover alternative avenues for music distribution.{" "}
            </span>
            <Music className="md:scale-[2] text-primary mr-8" />
          </div>

          <button className=" text-sm md:text-xl p-2 md:p-4 bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-40% to-[#5D3899] to-100% rounded-lg  max-w-[50%] xl:max-w-[35%] text-primary ">
            Visualize NF-tunes
          </button>
        </div>

        <div className="flex flex-col xl:flex-row  w-full justify-between items-center h-full">
          <div className="p-6">
            <Music className="md:scale-[2] mb-8 ml-[14%] text-primary" />
          </div>
          <div className="relative h-full w-full xl:-mt-[15%]">
            <img className="animate-spin-slow w-[60%] left-[20%] xl:left-[40%] max-w-[350px] absolute" src={disk} alt="disk" />
            <img className="absolute rotate-[10deg] left-[70%] top-[-30px] w-[30%] max-w-[250px]  md:w-[40%]  md:-top-[30%]    " src={stick} alt="stick" />
          </div>

          <div className="flex flex-col items-center h-full">
            <div className="opacity-0 xl: opacity-100 flex justify-start w-full ">
              <img className="scale-50 -ml-4 mt-8" src={musicNote} />
              <Music className=" md:scale-[2] text-primary" />
            </div>

            <div className=" flex justify-end w-full md:-mt-32 ">
              <img className="-ml-4 " src={musicNote} />
              <Music className="md:scale-[2] text-primary" />
            </div>
            <span className="text-primary text-xl p-8 pt-16 md:pt-32"> Driven by the innovation of Itheum's Music Data NFTs</span>
          </div>
        </div>
      </div>
      {/* Benefits of NF-Tunes */}
      <div className="flex flex-col justify-start items-center xl:items-start w-full gap-12  ">
        <div className="flex flex-row rounded-lg  px-8 xl:px-16 text-center gap-3 bg-foreground md:text-2xl xl:text-3xl  justify-start items-center ">
          <Music2 className="text-secondary" />
          <span className="text-secondary">Benefits of NF-Tunes</span>
          <Music2 className="text-secondary" />
        </div>
        <div className="flex flex-col xl:flex-row justify-start items-center gap-8 w-full">
          <div className="flex flex-col gap-4 p-8 pb-16 items-start w-[80%] xl:w-[30%] bg-background rounded-[3rem] border boder-background-foreground">
            <div className="flex justify-start w-full">
              <div className="rounded-full h-24 w-24 bg-accent   "> </div>
            </div>
            <span className="text-primary text-2xl  ">Transform your music streams into NFT Masterpieces</span>
            <span className="text-muted-foreground text-sm  ">
              Forge a direct connection with your fans, experiment with diverse royalty and distribution approaches, showcase the demand for your music.
            </span>
          </div>
          <div className="flex flex-col gap-4 p-8 pb-16 items-start  w-[80%] xl:w-[30%] bg-background rounded-[3rem] border boder-background-foreground">
            <div className="flex justify-start w-full">
              <div className="rounded-full h-24 w-24 bg-accent   "> </div>
            </div>
            <span className="text-primary text-2xl  ">Cultivate a DeGeN Fan Community for Your Music NFTs</span>
            <span className="text-muted-foreground text-sm  ">
              Explore the availability of Music Data NFTs across various NFT platforms, connecting you with "new fans" and fostering a direct relationship with
              your audience.{" "}
            </span>
          </div>
          <div className="flex flex-col gap-4 p-8 pb-16 items-start w-[80%] xl:w-[30%] bg-background rounded-[3rem] border boder-background-foreground">
            <div className="flex justify-start w-full">
              <div className="rounded-full h-24 w-24 bg-accent   "> </div>
            </div>
            <span className="text-primary text-2xl  ">Take Command of Royalties and Distribution for Your Music NFTs</span>
            <span className="text-muted-foreground text-sm  ">
              Forge a direct connection with your fans, experiment with diverse royalty and distribution approaches, showcase the demand for your music.{" "}
            </span>
          </div>
        </div>
      </div>

      {/* Featured Artist Section */}
      <div className=" bg-manu-image bg-cover	bg-top flex flex-col xl:flex-row  justify-center items-center xl:items-start  w-screen h-full xl:h-screen gap-12  ">
        <div className=" py-8 flex flex-col w-[80%] justify-center items-start">
          <div className="flex flex-row  rounded-lg px-8 xl:px-16 text-center gap-3 bg-foreground md:text-2xl xl:text-3xl  justify-start items-center ">
            <Music className="text-secondary" />
            <span className="text-secondary">Featured Artist Sections</span>
            <Music className="text-secondary" />
          </div>

          <div className="flex flex-col xl:flex-row w-full h-full justify-center items-center xl:items-start p-8 gap-4">
            <div className="flex flex-col w-[30%] min-w-[20rem]   justify-center items-center">
              <span className="text-primary text-center text-2xl">Meet Manu YFGP</span>
              <img className="" src={manuImage} />
              <span className="text-primary text-light text-xs w-[80%]">
                Empowering Indie musicians to engage with a fresh fan community and discover alternative avenues for music distribution. Empowering Indie
                musicians to engage with a fresh fan community and discover alternative avenues for music distribution.{" "}
              </span>
            </div>
            <div className="flex flex-col w-[30%] min-w-[20rem]  justify-start items-start">
              <span className="text-primary text-center text-2xl">Preview Manu’s Music Stream</span>
              <img className=" " src={manuImage} />

              {/* <audio src={"https://preview.yfgpmusic.com/musicpreview/mashup.mp3"}></audio> */}
            </div>
            <div className="flex flex-col  w-[30%] min-w-[20rem]   justify-center items-center">
              <span className="text-primary text-center text-2xl">Own Manu’s Music Data NFT </span>
              <div className="scale-[0.7] -mt-24 pt-4 xl:pt-0">
                {dataNfts.length > 0 ? ( //show the first nft in the NF_TUNES_TOKENS array
                  <DataNftCard
                    key={0}
                    index={0}
                    dataNft={dataNfts[0]}
                    isLoading={isLoading}
                    owned={flags[0]}
                    viewData={viewData}
                    modalContent={
                      isFetchingDataMarshal ? (
                        <div
                          className="flex flex-col items-center justify-center"
                          style={{
                            minHeight: "40rem",
                          }}>
                          <div>
                            <Loader noText />
                            <p className="text-center text-foreground">Loading...</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {viewDataRes && !viewDataRes.error && tokenLogin && currentIndex > -1 && (
                            <AudioPlayer
                              dataNftToOpen={dataNfts[currentIndex]}
                              songs={dataMarshalResponse ? dataMarshalResponse.data : []}
                              tokenLogin={tokenLogin}
                            />
                          )}
                        </>
                      )
                    }
                    modalTitle={"NF-Tunes"}
                    modalTitleStyle="p-4"
                  />
                ) : (
                  <h3 className="text-center text-white">No DataNFT</h3>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Solution Zstorage  */}
      <div className="flex flex-col justify-center items-center xl:items-start">
        <div className="flex flex-row rounded-lg w-[80%] px-2 text-center gap-3 bg-foreground xl:text-2xl xl:w-[60%] justify-center items-center ">
          <Music2 className="text-secondary" />
          <span className="text-secondary text-">Storage solution for your music data NFT</span>
          <Music2 className="text-secondary" />
        </div>
        <div className="flex flex-col xl:flex-row pt-12">
          <div className="flex flex-col gap-8">
            <div className="text-primary text-3xl xl:text-6xl">
              Integrate with
              <span className="ml-2 font-bold bg-clip-text text-transparent bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]">
                zStorage
              </span>
            </div>
            <div className="text-muted-foreground xl:text-xl xl:w-[60%]">
              Empowering Indie musicians to engage with a fresh fan community and discover alternative avenues for music distribution.{" "}
            </div>
            {/* <button className=" text-sm md:text-xl p-2 md:p-4  rounded-lg  max-w-[50%] xl:max-w-[35%] text-primary font-extrabold  bg-[linear-gradient(to_right, #737373, #A76262 , #5D3899, #5D3899 , #A76262 , #737373 )] bg-[length:200%_auto] animate-gradient"> */}

            <button className=" text-sm md:text-xl p-2 md:p-4 bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-30%  to-[#5D3899] to-95% rounded-lg  max-w-[50%] xl:max-w-[35%] text-primary ">
              Try zStorage today
            </button>
          </div>
          <div className="my-8 xl:my-16 xl:scale-150">
            <img src={zstorageDataVault} alt="zstorage data vault" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center border-t border-muted-foreground ">
        <div className="flex flex-row justify-between gap-2 xl:gap-16 xl:max-h-32 p-2 border-b border-muted-foreground">
          <div className="text-5xl flex justify-end items-end">
            <span>01.</span>
          </div>
          <div className="flex max-w-[30%] justify-start">
            <span>Effortless Music Management</span>
          </div>
          <div className="text-sm text-muted-foreground w-full xl:max-w-[30%] flex justify-center items-center">
            Effortlessly add, update, and manage your music files, art, and music metadata. Simplify your workflow with seamless control and organization.{" "}
          </div>
        </div>
        <div className="flex flex-row justify-between gap-2 xl:gap-16 xl:max-h-32 p-2 border-b border-muted-foreground">
          <div className="text-5xl flex justify-end items-end">
            <span>02.</span>
          </div>
          <div className="flex max-w-[30%] justify-start">
            <span>Eternal Resonance with zStorage</span>
          </div>
          <div className="text-sm text-muted-foreground w-full xl:max-w-[30%] flex justify-center items-center">
            Safeguard your data on a resilient, censorship-resistant network or choose traditional web2-style storage for ultimate versatility and control{" "}
          </div>
        </div>

        <div className="flex flex-row justify-between gap-2 xl:gap-16 xl:max-h-32 p-2 border-b border-muted-foreground">
          <div className="text-5xl flex justify-end items-end">
            <span>03.</span>
          </div>
          <div className="flex max-w-[30%] justify-start text-center">
            <span>Link zStorage Music Streams to Itheum Data NFTs</span>
          </div>
          <div className="text-sm text-muted-foreground w-full xl:max-w-[30%] flex justify-center items-center">
            Easily mint, manage, and showcase your Data NFT collection on the marketplace.{" "}
          </div>
        </div>
      </div>

      {/* Calling musicians Section */}
      <div className="flex flex-col gap-4 justify-center items-center bg-primary xl:p-32 w-screen h-screen text-center">
        <span className="text-secondary text-2xl xl:text-6xl"> Calling all Indie musicians!</span>
        <span className="xl:w-[50%] text-primary-foreground xl:text-2xl ">
          Explore the possibilities with NFTunes—we're here to assist you in onboarding and minting your Music Data NFTs.
        </span>
        <img src={megaphone} alt="megaphone" />
      </div>
      <div className="flex flex-col justify-center items-center xl:items-start w-full gap-12">
        <div className="flex flex-row rounded-lg w-[80%] px-2 text-center gap-3 bg-foreground xl:text-2xl xl:w-[60%] justify-center items-center ">
          <Music className="text-secondary" />
          <span className="text-secondary text-">Storage solution for your music data NFT</span>
          <Music className="text-secondary" />
        </div>
        <div className="text-2xl xl:text-5xl xl:w-[60%]  ">
          Music Data NFTs:<br></br> Universally
          <span className="ml-2 font-bold bg-clip-text text-transparent bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]">
            Accessible
          </span>
          ,<br></br>
          <span className="text-muted-foreground "> Just Like</span>
          <span className="ml-2 font-bold bg-clip-text text-transparent bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]">
            Regular NFTs{" "}
          </span>
        </div>
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 text-center xl:text-2xl ">
          <div className="flex items-center justify-center bg-background rounded-full w-52 h-52 border border-background-foreground">
            <span className="w-[60%]">Itheum Data DEX</span>
          </div>
          <div className="flex items-center justify-center bg-background rounded-full w-52 h-52 border border-background-foreground">
            <span className="w-[60%]">NFT Marketplaces</span>
          </div>
          <div className="flex items-center justify-center bg-background rounded-full w-52 h-52 border border-background-foreground">
            <span className="w-[60%]">Itheum Data DEX</span>
          </div>
        </div>
      </div>
      {/*
        add this for multiple data music nfts 
      <HeaderComponent
        pageTitle={"NF-Tunes"}
        isAnimated
        hasImage={true}
        imgSrc={nfTunesBanner}
        animation={imgAnimation}
        altImageAttribute={"NF-Tunes application"}
        pageSubtitle={"Data NFTs that Unlock this Itheum Data Widget"}
        dataNftCount={dataNfts.length}>
        {dataNfts.length > 0 ? (
          dataNfts.map((dataNft, index) => (
            <DataNftCard
              key={index}
              index={index}
              dataNft={dataNft}
              isLoading={isLoading}
              owned={flags[index]}
              viewData={viewData}
              modalContent={
                isFetchingDataMarshal ? (
                  <div
                    className="flex flex-col items-center justify-center"
                    style={{
                      minHeight: "40rem",
                    }}>
                    <div>
                      <Loader noText />
                      <p className="text-center text-foreground">Loading...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {viewDataRes && !viewDataRes.error && tokenLogin && currentIndex > -1 && (
                      <AudioPlayer dataNftToOpen={dataNfts[currentIndex]} songs={dataMarshalResponse ? dataMarshalResponse.data : []} tokenLogin={tokenLogin} />
                    )}
                  </>
                )
              }
              modalTitle={"NF-Tunes"}
              modalTitleStyle="p-4"
            />
          ))
        ) : (
          <h3 className="text-center text-white">No DataNFT</h3>
        )}
      </HeaderComponent> */}
    </div>
  );
};
