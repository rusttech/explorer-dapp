import React, { useEffect, useMemo, useState } from "react";
import { DataNft, ViewDataReturnType } from "@itheum/sdk-mx-data-nft";
import { useGetLoginInfo } from "@multiversx/sdk-dapp/hooks";
import { NF_TUNES_TOKENS, FEATURED_NF_TUNES_TOKEN, IS_DEVNET } from "appsConfig";
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
import { MoveDown, MoveRight, Music, Music2, PlayCircle } from "lucide-react";
import { Button } from "libComponents/Button";
import zstorageDataVault from "../../../assets/img/zstorage/zstorage-data-vault.png";
import musicNote from "../../../assets/img/nf-tunes/music-note-white.png";
import musicNoteBlack from "../../../assets/img/nf-tunes/music-note-black.png";
import itheumLogo from "../../../assets/img/nf-tunes/platforms-logo/itheum.png";
import pulsarLogo from "../../../assets/img/nf-tunes/platforms-logo/pulsar-money.png";
import xoxnoLogo from "../../../assets/img/nf-tunes/platforms-logo/xoxno.png";
import frameItLogo from "../../../assets/img/nf-tunes/platforms-logo/frame-it.png";
import multiversxLogo from "../../../assets/img/nf-tunes/platforms-logo/multiversx.png";
import xPandLogo from "../../../assets/img/nf-tunes/platforms-logo/itheum.png";
import { scrollToSection } from "libs/utils";
import manuImage from "../../../assets/img/nf-tunes/manu.png";
import megaphone from "../../../assets/img/nf-tunes/megaphone.png";
import { Modal } from "components/Modal/Modal";
import { Link } from "react-router-dom";
import cubes from "../../../assets/img/zstorage/cubes.png";
import frontCube from "../../../assets/img/zstorage/front.png";
import backCube from "../../../assets/img/zstorage/back.png";

interface ExtendedViewDataReturnType extends ViewDataReturnType {
  blobDataType: BlobDataType;
}

const platforms = [
  { platform: "NFT Marketplaces", logo: "Url1" },
  { platform: "NFT Marketplaces", logo: "Url2" },
  { platform: "Pulsar Money", logo: "Url3" },
  { platform: "xPand DAO", logo: "Url4" },
  { platform: "MultiversX Ecosystem", logo: "Url5" },
  { platform: "MultiversX Ecosystem", logo: "Url6" },
];

export const NFTunes = () => {
  const { address } = useGetAccount();
  const { loginMethod } = useGetLoginInfo();

  ///native auth
  const { tokenLogin } = useGetLoginInfo();

  const { hasPendingTransactions } = useGetPendingTransactions();

  const [dataNfts, setDataNfts] = useState<DataNft[]>([]);
  const [featuredArtistDataNft, setFeaturedArtistDataNft] = useState<DataNft>();
  const [featuredDataNftIndex, setFeaturedDataNftIndex] = useState(-1);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(true);
  const [viewDataRes, setViewDataRes] = useState<ExtendedViewDataReturnType>();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [dataMarshalResponse, setDataMarshalResponse] = useState({ "data_stream": {}, "data": [] });

  // const imgAnimation = useMemo(
  //   () => (
  //     <div className="relative  top-[15%]">
  //       <img className="animate-spin-slow w-[20%] left-[40%] max-w-[300px] absolute" src={disk} alt="disk" />
  //       <img className="rotate-[20deg] absolute top-[-10px] md:top-[-15px] max-w-[200px] left-[52%] 3xl:left-[50%] w-[15%] " src={stick} alt="stick" />
  //     </div>
  //   ),
  //   []
  // );

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
    const _featuredNft: DataNft = await DataNft.createFromApi(FEATURED_NF_TUNES_TOKEN);
    setDataNfts(_nfts);
    setFeaturedArtistDataNft(_featuredNft);

    setIsLoading(false);
  }

  ///fetch the nfts owned by the logged in address and if the user has any of them set flag to true,
  //on those will be shown view data otherwise show market place explore button
  async function fetchMyNfts() {
    const _dataNfts = await DataNft.ownedByAddress(address);
    const _flags = [];

    for (const currentNft of dataNfts) {
      if (currentNft.nonce == FEATURED_NF_TUNES_TOKEN.nonce) {
        setFeaturedDataNftIndex(_flags.length);
      }
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
    <div className="flex flex-col justify-center items-center w-full">
      <div className="w-full h-[2px] bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]"></div>
      <div className="flex flex-col justify-center items-center  font-[Clash-Regular] w-full max-w-[100rem]  ">
        <div className="flex flex-col items-start h-screen w-[100%] pt-16 xl:pt-32  mb-16 xl:mb-32">
          <div className="flex flex-col w-full xl:w-[60%] gap-6">
            <div className="flex-row flex items-center ">
              <span className="text-5xl xl:text-[8rem] text-primary">NF-Tunes</span>
              <img className="max-h-[30%] mb-6" src={musicNote} />
            </div>
            <div className="flex flex-row justify-between">
              <span className="text-base md:text-2xl text-primary text-light w-[70%]">
                Empowering Indie musicians to engage with a fresh fan community and discover alternative avenues for music distribution.{" "}
              </span>
            </div>

            <button
              onClick={() => scrollToSection("featured-artist")}
              className=" text-sm md:text-xl p-2 md:p-4 rounded-lg  max-w-[50%] xl:max-w-[35%] text-primary
           bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-40% to-[#5D3899] to-100%  ">
              Visualize NF-tunes
            </button>
          </div>

          <div className="flex flex-col xl:flex-row  w-full justify-between items-center h-full">
            <div className="p-6 pl-32">
              <Music className="md:scale-[2] mb-8 ml-[14%] text-primary" />
            </div>

            <div className="relative h-full w-full xl:-mt-[15%]">
              <div className="absolute w-[60%] max-w-[500px]  -mt-[10%] left-[10%] xl:left-[35%] h-[150%] max-h-[500px] bg-gradient-to-br from-[#737373] from-20% via-[#A76262] via-40% to-[#5D3899] to-80% rounded-full   filter blur-2xl opacity-25   "></div>
              <img className="animate-spin-slow w-[60%] left-[20%] xl:left-[40%] max-w-[350px] absolute" src={disk} alt="disk" />
              <img className="absolute left-[60%] lg:left-[50%] xl:left-[70%] top-[-30px] xl:top-[-50px] w-[30%] max-w-[200px]      " src={stick} alt="stick" />
            </div>

            <div className="flex flex-col items-center h-full">
              <div className=" flex justify-start xl:justify-end w-full md:-mt-32 ">
                <img className="scale-50 md:scale-75 -ml-4 -mt-6" src={musicNote} />
                <Music className="md:scale-[2] text-primary" />
              </div>
              <span className="text-primary text-xl text-center xl:text-start p-8 pt-16 md:pt-32"> Driven by the innovation of Itheum's Music Data NFTs</span>
            </div>
          </div>
        </div>

        {/* Benefits of NF-Tunes */}
        <div className="flex flex-col justify-start items-center w-full gap-12 mb-12 xl:mb-24 ">
          <div className="flex flex-col mb-16 xl:mb-32 justify-center w-[100%] items-center xl:items-start">
            <div className="flex flex-row rounded-lg mb-12 px-8 xl:px-16 text-center gap-4 bg-foreground md:text-2xl xl:text-3xl  justify-center items-center ">
              <Music2 className="text-secondary" />
              <span className="text-secondary  ">Benefits of NF-Tunes</span>
              <Music2 className="text-secondary" />
            </div>
            <div className="flex flex-col xl:flex-row justify-start items-center gap-8 w-full">
              <div className="flex flex-col gap-4 p-8 pb-16 items-start w-[80%] xl:w-[30%] bg-background rounded-[3rem] border border-primary/50">
                <div className="flex justify-start w-full">
                  <div className="rounded-full h-24 w-24 bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-40% to-[#5D3899] to-100%    "> </div>
                </div>
                <span className="text-primary text-2xl">Transform your music streams into NFT Masterpieces</span>
                <span className="text-primary text-sm  font-[Clash-Light]">
                  Forge a direct connection with your fans, experiment with diverse royalty and distribution approaches, showcase the demand for your music.
                </span>
              </div>
              <div className="flex flex-col gap-4 p-8 pb-16 items-start  w-[80%] xl:w-[30%] bg-background rounded-[3rem] border border-primary/50">
                <div className="flex justify-start w-full">
                  <div className="rounded-full h-24 w-24 bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-40% to-[#5D3899] to-100%   "> </div>
                </div>
                <span className="text-primary text-2xl  ">Cultivate a DeGeN Fan Community for Your Music NFTs</span>
                <span className="text-primary text-sm  font-[Clash-Light]">
                  Explore the availability of Music Data NFTs across various NFT platforms, connecting you with "new fans" and fostering a direct relationship
                  with your audience.{" "}
                </span>
              </div>
              <div className="flex flex-col gap-4 p-8 pb-16 items-start w-[80%] xl:w-[30%] bg-background rounded-[3rem] border border-primary/50">
                <div className="flex justify-start w-full">
                  <div className="rounded-full h-24 w-24 bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-40% to-[#5D3899] to-100%  "> </div>
                </div>
                <span className="text-primary text-2xl  ">Take Command of Royalties and Distribution for Your Music NFTs</span>
                <span className="text-primary text-sm font-[Clash-Light] ">
                  Forge a direct connection with your fans, experiment with diverse royalty and distribution approaches, showcase the demand for your music.{" "}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Artist Section */}
        <div
          id="featured-artist"
          className=" bg-manu-image bg-cover bg-top flex flex-col xl:flex-row  justify-center items-center xl:items-start  w-full h-full gap-12  mb-16 xl:mb-32 ">
          <div className=" py-8 flex flex-col w-[100%] justify-center xl:items-start">
            <div className="flex flex-row rounded-lg mb-4 px-8 xl:px-16 text-center gap-4 bg-foreground md:text-2xl xl:text-3xl  justify-center items-center ">
              <Music className="text-secondary" />
              <span className="text-secondary">Featured Artist Sections</span>
              <Music className="text-secondary" />
            </div>
            <div className="flex flex-col xl:flex-row w-full h-full justify-center items-center xl:items-start p-8 gap-4">
              <div className="flex flex-col w-[30%] min-w-[20rem]   justify-center items-center">
                <span className="text-primary text-center text-2xl">Meet Manu YFGP</span>
                <img className="" src={manuImage} />
                <span className="text-primary font-[Clash-Light]   w-[80%]">
                  Empowering Indie musicians to engage with a fresh fan community and discover alternative avenues for music distribution. Empowering Indie
                  musicians to engage with a fresh fan community and discover alternative avenues for music distribution.{" "}
                </span>
              </div>
              <div className="flex flex-col w-[30%] min-w-[20rem]  justify-center items-center">
                <span className="text-primary text-center text-2xl">Preview Manu’s Music Stream</span>
                <img className="opacity-20" src={manuImage} />

                <Modal
                  openTrigger={
                    <button className="h-64  flex rounded-full justify-center w-full mt-[-11rem]">
                      <PlayCircle className="scale-[3] cursor-pointer text-primary" />
                    </button>
                  }
                  closeOnOverlayClick={false}
                  title={"Music Data Nft Preview"}
                  hasFilter={false}
                  filterData={[]}
                  titleClassName={"p-8"}>
                  {!featuredArtistDataNft ? (
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
                      {featuredArtistDataNft && (
                        <AudioPlayer
                          previewUrl={featuredArtistDataNft.dataPreview}
                          songs={[
                            {
                              "idx": 1,
                              // "date": featuredArtistDataNft.creationTime,
                              "category": "Preview",
                              // "artist": "YFGP",
                              "album": featuredArtistDataNft.description,
                              "cover_art_url": featuredArtistDataNft.nftImgUrl,
                              "title": featuredArtistDataNft.title,
                            },
                          ]}
                        />
                      )}
                    </>
                  )}
                </Modal>
              </div>
              <div className="flex flex-col w-[30%] min-w-[20rem]   justify-center items-center">
                <span className="text-primary text-center text-2xl">Own Manu’s Music Data NFT </span>
                <div className="scale-[0.9] -mt-6 pt-4 xl:pt-0">
                  {featuredArtistDataNft ? (
                    <DataNftCard
                      key={0}
                      index={0}
                      dataNft={featuredArtistDataNft}
                      isLoading={isLoading}
                      owned={flags[featuredDataNftIndex] ? flags[featuredDataNftIndex] : false}
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
                    <h3 className="text-center text-white">No DataNFT yet</h3>
                  )}
                </div>
              </div>
            </div>
            {IS_DEVNET && (
              <div className="flex flex-row w-full justify-center">
                <button
                  onClick={() => scrollToSection("data-nfts")}
                  className="hover:scale-125 transition flex flex-row gap-2 text-primary justify-center items-center  p-4 rounded-lg  bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-40% to-[#5D3899] to-100%  ">
                  See all
                  <MoveDown />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Storage Solution Zstorage  */}
        <div className="flex flex-col justify-center items-center  ">
          <div className=" py-8 flex flex-col w-[100%] justify-center items-start">
            <div className="flex flex-row rounded-lg mb-4 px-8 xl:px-16 text-center gap-4 bg-foreground md:text-2xl xl:text-3xl  justify-center items-center ">
              <Music2 className="text-secondary" />
              <span className="text-secondary ">Storage solution for your music data NFT</span>
              <Music2 className="text-secondary" />
            </div>
            <div className="flex flex-col xl:flex-row pt-12 w-full h-screen  ">
              <div className="flex flex-col gap-8 xl:w-[50%]">
                <div className="text-primary text-3xl xl:text-6xl">
                  Integrate with <br></br>
                  <span className="ml-2 font-bold bg-clip-text text-transparent bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]">
                    Zedge Storage
                  </span>
                </div>
                <div className="text-primary xl:text-xl xl:w-[50%]">
                  Empowering Indie musicians to engage with a fresh fan community and discover alternative avenues for music distribution.{" "}
                </div>
                {/* <button className=" text-sm md:text-xl p-2 md:p-4  rounded-lg  max-w-[50%] xl:max-w-[35%] text-primary font-extrabold  bg-[linear-gradient(to_right, #737373, #A76262 , #5D3899, #5D3899 , #A76262 , #737373 )] bg-[length:200%_auto] animate-gradient"> */}

                <Link
                  to={`https://www.zedgestorage.com/${tokenLogin && tokenLogin.nativeAuthToken ? "?accessToken=" + tokenLogin?.nativeAuthToken : ""}`}
                  target="_blank"
                  className="text-sm md:text-xl text-center p-2 md:p-4 bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-30%  to-[#5D3899] to-95% rounded-lg  max-w-[50%] xl:max-w-[35%] text-primary ">
                  Try zStorage today
                </Link>
              </div>
              <div className="relative xl:w-[50%] h-[20rem] my-auto xl:scale-125 overflow-hidden">
                <img src={zstorageDataVault} alt="zstorage data vault" className="absolute " />
                <img
                  src={cubes}
                  className="absolute ml-[100px] -mt-[100px] animate-cubes-down transform hover:translate-y-[50px] transition-transform duration-1000 ease-linear"
                />
                <img src={frontCube} className="absolute -ml-12 mt-32 transform hover:translate-x-[75px] transition-transform duration-1000 ease-linear" />
                <img
                  src={backCube}
                  className="absolute ml-[400px] mt-[-50px] transform hover:translate-x-[-100px] hover:translate-y-[50px] transition-transform duration-1000 ease-linear"
                />
                <div className="relative mx-auto my-auto mt-[300px] ml-[300px]  transform hover:translate-y-[-120px] transition-transform duration-1000 ease-linear">
                  <img src={cubes} className="absolute mt-[40px]" />
                  <img src={cubes} className="absolute" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center border-t border-muted-foreground pb-16">
              <div className="flex flex-col xl:flex-row justify-between w-full gap-2 xl:gap-16 xl:h-32 p-2 border-b border-muted-foreground">
                <div className="text-5xl flex justify-end items-end">
                  <span>01.</span>
                </div>
                <div className="flex  max-w-[80%] xl:max-w-[30%] justify-start xl:twext-center">
                  <span>Effortless Music Management</span>
                </div>
                <div className="text-sm text-muted-foreground w-full xl:max-w-[30%] flex justify-center items-center">
                  Effortlessly add, update, and manage your music files, art, and music metadata. Simplify your workflow with seamless control and organization.{" "}
                </div>
              </div>
              <div className="flex  flex-col xl:flex-row justify-between w-full gap-2 xl:gap-16 xl:h-32 p-2 border-b border-muted-foreground">
                <div className="text-5xl flex justify-end items-end">
                  <span>02.</span>
                </div>
                <div className="flex xl:max-w-[30%] justify-start xl:text-center">
                  <span>Eternal Resonance with zStorage</span>
                </div>
                <div className="text-sm text-muted-foreground w-full xl:max-w-[30%] flex justify-center items-center">
                  Safeguard your data on a resilient, censorship-resistant network or choose traditional web2-style storage for ultimate versatility and control{" "}
                </div>
              </div>

              <div className="flex  flex-col xl:flex-row justify-between w-full gap-2 xl:gap-16 xl:h-32 p-2 border-b border-muted-foreground">
                <div className="text-5xl flex justify-end  items-end">
                  <span>03.</span>
                </div>
                <div className="flex max-w-[80%] xl:max-w-[30%] justify-end xl:justify-start xl:text-center">
                  <span>Link zStorage Music Streams to Itheum Data NFTs</span>
                </div>
                <div className="text-sm text-muted-foreground w-full xl:max-w-[30%] flex justify-center items-center">
                  Easily mint, manage, and showcase your Data NFT collection on the marketplace.{" "}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calling musicians Section */}
        <div className="flex flex-col gap-4 justify-center items-center bg-primary xl:p-32 w-full h-screen text-center  mb-16 xl:mb-32">
          <span className="text-secondary font-[Clash-Bold] text-2xl xl:text-6xl"> Calling all Indie musicians!</span>
          <span className="xl:w-[50%] text-primary-foreground xl:text-2xl ">
            Explore the possibilities with NFTunes—we're here to assist you in onboarding and minting your Music Data NFTs.
          </span>
          <img src={megaphone} alt="megaphone" />
        </div>

        {/* Supported Platforms */}
        <div className="flex flex-col justify-center items-center w-full gap-12 mt-12">
          <div className=" py-8 flex flex-col w-[100%] justify-center items-start gap-12">
            <div className="flex flex-row rounded-lg mb-4 px-8 xl:px-16 text-center gap-4 bg-foreground md:text-2xl xl:text-3xl  justify-center items-center ">
              <Music className="text-secondary" />
              <span className="text-secondary ">
                Supported Platforms for
                <span className="ml-2 font-bold bg-clip-text text-transparent bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]">
                  Music Data NFTs
                </span>
              </span>
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
                Regular NFTs
              </span>
            </div>
            <div className="flex flex-col xl:flex-row gap-8 justify-center items-center w-full">
              <Link
                to={`https://${IS_DEVNET ? "test." : ""}datadex.itheum.io/datanfts/marketplace/market`}
                target="_blank"
                className="hover:scale-110 transition  flex flex-row items-center shadow-inner shadow-gray-600 justify-center bg-gradient-to-t  from-black from-20% to-background  to-70% brightness-125 rounded-full w-52 h-52  ">
                <img src={itheumLogo} alt="itheum logo" />
                <span className="w-[40%] text-center">Itheum Data DEX</span>
              </Link>
              <div className=" hover:scale-110 transition  flex flex-col gap-2 items-center shadow-inner shadow-gray-600 justify-center bg-gradient-to-t  from-black from-20% to-background  to-70% brightness-125 rounded-full w-52 h-52  ">
                <span className=" text-center">NFT Marketplaces</span>
                <Link to={"https://xoxno.com/"} target="_blank">
                  <img src={xoxnoLogo} alt="xoxno logo" />
                </Link>
                <Link to={"https://www.frameit.gg/"} target="_blank">
                  <img src={frameItLogo} alt="frame it logo" />
                </Link>
              </div>
              <Link
                to={"https://pulsar.money/"}
                target="_blank"
                className="hover:scale-110 transition  flex items-center shadow-inner shadow-gray-600 justify-center bg-gradient-to-t  from-black from-20% to-background  to-70% brightness-125 rounded-full w-52 h-52  ">
                <img src={pulsarLogo} alt="pulsar" />
              </Link>
              <Link
                to={"https://docs.itheum.io/product-docs/protocol/governance/itheum-xpand-dao/itheum-xpand-grants-program"}
                target="_blank"
                className=" hover:scale-110 transition  flex flex-col items-center shadow-inner shadow-gray-600 justify-center bg-gradient-to-t  from-black from-20% to-background  to-70% brightness-125 rounded-full w-52 h-52  ">
                <span className="w-[60%] text-center">xPand DAO</span>
                <img src={xPandLogo} alt="xPand logo" />
              </Link>
              <Link
                to={"https://multiversx.com/"}
                target="_blank"
                className="hover:scale-110 transition  flex flex-col gap-2 items-center shadow-inner shadow-gray-600 justify-center bg-gradient-to-t  from-black from-20% to-background  to-70% brightness-125 rounded-full w-52 h-52  ">
                <img src={multiversxLogo} alt="multiversx logo" />
                <span className="w-[60%] text-center"> Ecosystem</span>
              </Link>
            </div>
          </div>
        </div>
        <div id="data-nfts" className="flex justify-center items-center p-16 ">
          <HeaderComponent pageTitle={""} hasImage={false} pageSubtitle={"Music Data NFTs "} dataNftCount={dataNfts.length}>
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
              ))
            ) : (
              <h3 className="text-center text-white">No DataNFT</h3>
            )}
          </HeaderComponent>
        </div>
      </div>
      <div className="w-full h-[2px] bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]"></div>
    </div>
  );
};
