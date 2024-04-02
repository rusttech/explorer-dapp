import React, { useEffect, useState } from "react";
import { DataNft } from "@itheum/sdk-mx-data-nft";
import { useGetLoginInfo } from "@multiversx/sdk-dapp/hooks";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import { confetti } from "@tsparticles/confetti";
import { Container } from "@tsparticles/engine";
import { fireworks } from "@tsparticles/fireworks";
import axios, { AxiosError } from "axios";
import { motion } from "framer-motion";
import { MousePointerClick } from "lucide-react";
import Countdown from "react-countdown";
import { Link } from "react-router-dom";
import { GET_BITZ_TOKEN } from "appsConfig";
import { Loader } from "components";
import { CopyAddress } from "components/CopyAddress";
import { MARKETPLACE_DETAILS_PAGE } from "config";
import { useGetAccount, useGetPendingTransactions } from "hooks";
import { HoverBorderGradient } from "libComponents/Animated/HoverBorderGradient";
import { BlobDataType, ExtendedViewDataReturnType } from "libs/types";
import { decodeNativeAuthToken, toastError, sleep, getApiWeb2Apps, createNftId } from "libs/utils";
import { routeNames } from "routes";
import { BurningImage } from "./BurningImage";
import { useAccountStore } from "../../../store/account";
import "./GetBitz.css";

// Image Layers
import ImgLogin from "assets/img/getbitz/getbitz-login.gif";
import ImgGetDataNFT from "assets/img/getbitz/getbitz-get-datanft.gif";
import ImgPlayGame from "assets/img/getbitz/getbitz-play.gif";
import FingerPoint from "assets/img/getbitz/finger-point.gif";
import ImgGameCanvas from "assets/img/getbitz/getbitz-game-canvas.png";
import aladinRugg from "assets/img/getbitz/aladin.png";
import resultLoading from "assets/img/getbitz/pixel-loading.gif";

// Memes
import Meme1 from "assets/img/getbitz/memes/1.jpg";
import Meme2 from "assets/img/getbitz/memes/2.jpg";
import Meme3 from "assets/img/getbitz/memes/3.jpg";
import Meme4 from "assets/img/getbitz/memes/4.jpg";
import Meme5 from "assets/img/getbitz/memes/5.jpg";
import Meme6 from "assets/img/getbitz/memes/6.jpg";
import Meme7 from "assets/img/getbitz/memes/7.jpg";
import Meme8 from "assets/img/getbitz/memes/8.jpg";
import Meme9 from "assets/img/getbitz/memes/9.jpg";
import Meme10 from "assets/img/getbitz/memes/10.jpg";
import Torch from "./Torch";
import Faq from "./Faq";

interface LeaderBoardItemType {
  playerAddr: string;
  bits: number;
}

export const BIT_GAME_WINDOW_HOURS = "3"; // how often we can play the game, need to match logic inside Data NFT
export const BIT_GAME_TOP_LEADER_BOARD_GROUP = "20"; // top X leaderboard winners for the monthly price

const MEME_IMGS = [Meme1, Meme2, Meme3, Meme4, Meme5, Meme6, Meme7, Meme8, Meme9, Meme10];

export const GetBitz = () => {
  const { address } = useGetAccount();
  const { tokenLogin } = useGetLoginInfo();
  const { chainID } = useGetNetworkConfig();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const [gameDataNFT, setGameDataNFT] = useState<DataNft>();
  const [hasGameDataNFT, setHasGameDataNFT] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const bitzBalance = useAccountStore((state: any) => state.bitzBalance);
  const updateBitzBalance = useAccountStore((state) => state.updateBitzBalance);

  // a single game-play related (so we have to reset these if the user wants to "replay")
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(false);
  const [isMemeBurnHappening, setIsMemeBurnHappening] = useState<boolean>(false);
  const [gameDataFetched, setGameDataFetched] = useState<boolean>(false);
  const [viewDataRes, setViewDataRes] = useState<ExtendedViewDataReturnType>();
  const [burnFireScale, setBurnFireScale] = useState<string>("scale(0) translate(-13px, -15px)");
  const [burnFireGlow, setBurnFireGlow] = useState<number>(0);
  const [burnProgress, setBurnProgress] = useState(0);
  const [randomMeme, setRandomMeme] = useState<any>(Meme1);
  const tweetText = `url=https://explorer.itheum.io/getbitz?v=1&text=${viewDataRes?.data.gamePlayResult.bitsWon > 0 ? "I just played the Get <BiTz> XP Game on %23itheum and won " + viewDataRes?.data.gamePlayResult.bitsWon + " <BiTz> points! Play now and get your own <BiTz>! %23GetBiTz" : "Oh no, I got rugged getting BiTz points this time. Maybe you will have better luck? Try here to %23GetBiTz %23itheum"} `;

  // Game canvas related
  const [loadBlankGameCanvas, setLoadBlankGameCanvas] = useState<boolean>(false);

  // LeaderBoard related
  const [leaderBoardAllTime, setLeaderBoardAllTime] = useState<LeaderBoardItemType[]>([]);
  const [leaderBoardMonthly, setLeaderBoardMonthly] = useState<LeaderBoardItemType[]>([]);
  const [leaderBoardMonthString, setLeaderBoardMonthString] = useState<string>("");
  const [leaderBoardIsLoading, setLeaderBoardIsLoading] = useState<boolean>(false);

  // Debug / Tests
  const [inDateStringDebugMode, setInDateStringDebugMode] = useState<boolean>(false);
  // const [bypassDebug, setBypassDebug] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  useEffect(() => {
    if (!chainID) {
      return;
    }

    // Load the LeaderBoards regardless on if the user has does not have the data nft in to entice them
    fetchAndLoadLeaderBoards();
  }, [chainID]);

  // first, we get the Data NFT details needed for this game (but not if the current user has it)
  async function fetchDataNfts() {
    setIsLoading(true);

    const _gameDataNFT = await DataNft.createFromApi(GET_BITZ_TOKEN);
    setGameDataNFT(_gameDataNFT);

    setIsLoading(false);
  }

  // secondly, we get the user's Data NFTs and flag if the user has the required Data NFT for the game in their wallet
  async function fetchMyNfts() {
    if (gameDataNFT) {
      const _dataNfts = await DataNft.ownedByAddress(address);
      const hasRequiredDataNFT = _dataNfts.find((dNft) => gameDataNFT.nonce === dNft.nonce);
      setHasGameDataNFT(hasRequiredDataNFT ? true : false);

      setRandomMeme(MEME_IMGS[Math.floor(Math.random() * MEME_IMGS.length)]); // set a random meme as well
    }
  }

  // have to reset all "single game-play related" (see above)
  function resetToStartGame() {
    setIsFetchingDataMarshal(false);
    setIsMemeBurnHappening(false);
    setGameDataFetched(false);
    setBurnProgress(0);
    setViewDataRes(undefined);
    setBurnFireScale("scale(0) translate(-13px, -15px)");
    setBurnFireGlow(0);
    setRandomMeme(MEME_IMGS[Math.floor(Math.random() * MEME_IMGS.length)]); // set a random meme as well
  }

  useEffect(() => {
    setBurnFireScale(`scale(${burnProgress}) translate(-13px, -15px)`);
    setBurnFireGlow(burnProgress * 0.1);
    if (burnProgress === 10) {
      setIsMemeBurnHappening(false);
      playGame();
    }
  }, [burnProgress]);

  async function playGame() {
    if (!(tokenLogin && tokenLogin.nativeAuthToken)) {
      throw Error("No Native Auth token");
    }

    if (!gameDataNFT) {
      toastError("ER6: Game NFT Data is not loaded");
      return;
    }

    setIsFetchingDataMarshal(true);

    await sleep(5);

    const viewDataArgs: Record<string, any> = {
      mvxNativeAuthOrigins: [decodeNativeAuthToken(tokenLogin.nativeAuthToken).origin],
      mvxNativeAuthMaxExpirySeconds: 3600,
      fwdHeaderMapLookup: {
        "authorization": `Bearer ${tokenLogin.nativeAuthToken}`,
      },
      fwdHeaderKeys: "authorization",
    };

    // if we are testing future month leaderboards, then send this custom param to the origin
    if (inDateStringDebugMode) {
      viewDataArgs.fwdHeaderMapLookup["x-test-custom-mmyy-string"] = leaderBoardMonthString;
      viewDataArgs.fwdHeaderKeys = "authorization,x-test-custom-mmyy-string";
    }

    const viewDataPayload: ExtendedViewDataReturnType | undefined = await viewData(viewDataArgs, gameDataNFT);

    if (viewDataPayload) {
      let animation;
      if (viewDataPayload.data.gamePlayResult.bitsWon > 0) {
        if (viewDataPayload.data.gamePlayResult.userWonMaxBits === 1) {
          animation = await fireworks({ background: "transparent", sounds: true });
        } else {
          animation = await confetti({
            spread: 360,
            ticks: 100,
            gravity: 0,
            decay: 0.94,
            startVelocity: 30,
            particleCount: 200,
            scalar: 2,
            shapes: ["emoji"],
            shapeOptions: {
              emoji: {
                value: ["🤲🏼", "💎", "🤲🏼", "💎", "🎊", "🐸", "🐸", "🐸", "🐸", "🐹", "🐹"],
              },
            },
          });
        }

        // if the user won something, then we should reload the LeaderBoards
        fetchAndLoadLeaderBoards();
      }

      setGameDataFetched(true);
      setIsFetchingDataMarshal(false);
      setViewDataRes(viewDataPayload);

      if (viewDataPayload.data.gamePlayResult.bitsScoreAfterPlay > -1) {
        updateBitzBalance(viewDataPayload.data.gamePlayResult.bitsScoreAfterPlay);
      }

      if (animation) {
        await sleep(6);
        animation.stop();
        // if its confetti, then we have to destroy it
        if ((animation as unknown as Container).destroy) {
          (animation as unknown as Container).destroy();
        }
      }
    } else {
      toastError("ER2: Did not get a response from the game server");
      setIsFetchingDataMarshal(false);
    }
  }

  async function viewData(viewDataArgs: any, requiredDataNFT: DataNft) {
    try {
      if (!gameDataNFT) {
        toastError("ER3: Game NFT Data is not loaded");
        return;
      }

      return viewDataJSONCore(viewDataArgs, requiredDataNFT);
    } catch (err) {
      console.error(err);
      toastError((err as Error).message);
      setIsFetchingDataMarshal(false);

      return undefined;
    }
  }

  function goToMarketplace(tokenIdentifier: string) {
    window.open(`${MARKETPLACE_DETAILS_PAGE}${tokenIdentifier}`)?.focus();
  }

  function gamePlayImageSprites() {
    let _viewDataRes = viewDataRes;

    let _loadBlankGameCanvas = loadBlankGameCanvas;
    let _gameDataFetched = gameDataFetched;
    let _isFetchingDataMarshal = isFetchingDataMarshal;
    let _isMemeBurnHappening = isMemeBurnHappening;

    // if (!viewDataRes && !bypassDebug) {
    //   // for local UI debugging
    //   _loadBlankGameCanvas = true;
    //   _gameDataFetched = false;
    //   _isFetchingDataMarshal = true;
    //   _isMemeBurnHappening = false;

    //   _viewDataRes = {
    //     contentType: "string",
    //     data: {
    //       gamePlayResult: {
    //         bitzScoreBeforePlay: -1, // points before current play
    //         bitzScoreAfterPlay: -1, // points after current play
    //         bitzWon: -1, // can be 0 for no win, no 5-50. -1 means they tried to paly to soon
    //         userWonMaxBitz: -1, // the user just won the maximum bitz? 1 for yes, -1 for no
    //         lastPlayedBeforeThisPlay: -1, // the timestampbefore current play
    //         lastPlayedAndCommitted: -1, // the latest timestamp of current play
    //         configCanPlayEveryMSecs: -1, // how many Mili seconds interval before being able to play again
    //         // triedTooSoonTryAgainInMs: -1, // played too soon before allowed, so they have to wait this many Mili seconds to play (use for countdown timer to next play)
    //         triedTooSoonTryAgainInMs: 6000, // played too soon before allowed, so they have to wait this many Mili seconds to play (use for countdown timer to next play)
    //       },
    //     },
    //   };
    // }

    // user is note logged in, ask them to connect wallet
    if (!address) {
      return (
        <Link to={routeNames.unlock} state={{ from: location.pathname }}>
          <img className="rounded-[3rem] w-full cursor-pointer" src={ImgLogin} alt={"Connect your wallet to play"} />
        </Link>
      );
    }

    // user is logged in does not have the data nft, so take them to the marketplace
    if (address && !hasGameDataNFT) {
      return (
        <div
          onClick={() => {
            if (gameDataNFT) {
              goToMarketplace(gameDataNFT.tokenIdentifier);
            }
          }}>
          <img className="rounded-[3rem] w-full cursor-pointer" src={ImgGetDataNFT} alt={"Get <BiTz> Data NFT from Data NFT Marketplace"} />
        </div>
      );
    }

    // user has data nft, so load the "start game" view
    if (!_loadBlankGameCanvas && !_isFetchingDataMarshal) {
      return (
        <div
          onClick={() => {
            setLoadBlankGameCanvas(true);
          }}>
          <img className="rounded-[3rem] w-full cursor-pointer" src={ImgPlayGame} alt={"Start Game"} />
        </div>
      );
    }

    const CountDownComplete = () => (
      <div
        className="cursor-pointer relative inline-flex h-12 overflow-hidden rounded-full p-[1px] "
        onClick={() => {
          resetToStartGame();
        }}>
        <span className="absolute hover:bg-sky-300 inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF03,#45d4ff_50%,#111111_50%)]" />
        <span className="text-primary inline-flex h-full hover:bg-gradient-to-tl from-background to-sky-300 w-full cursor-pointer items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium   backdrop-blur-3xl">
          RIGHT NOW! Try again <MousePointerClick className="ml-2 text-sky-300" />
        </span>
      </div>
    );

    // Renderer callback with condition
    const countdownRenderer = (props: { hours: number; minutes: number; seconds: number; completed: boolean }) => {
      if (props.completed) {
        // Render a complete state
        return <CountDownComplete />;
      } else {
        // Render a countdown
        return (
          <span>
            {props.hours}H:{props.minutes}M:{props.seconds}S
          </span>
        );
      }
    };

    // user clicked on the start game view, so load the empty blank game canvas
    if (_loadBlankGameCanvas && !_gameDataFetched) {
      return (
        <div className="relative  overflow-hidden  ">
          <img className="rounded-[3rem] w-full" src={ImgGameCanvas} alt={"Play Game"} />

          <div
            className="select-none flex justify-center items-center mt-[10px] w-[100%] h-[350px] rounded-[3rem] bg-slate-50 text-gray-950 p-[1rem] border border-primary/50 static
                        md:absolute md:p-[2rem] md:pb-[.5rem] md:w-[500px] md:h-[400px] md:mt-0 md:top-[40%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2">
            {(!_isFetchingDataMarshal && !_isMemeBurnHappening && (
              <>
                <div
                  className="text-center text-xl text-gray-950 text-foreground cursor-pointer"
                  onClick={() => {
                    setIsMemeBurnHappening(true);
                  }}>
                  <p className="md:text-md">We love our Itheum OGs! So get ready to grab yourself some of them sWeet sWeet {`<BiTz>`} points?</p>
                  <p className="font-bold md:text-2xl mt-5">But the {`<BiTz>`} Generator God will need a Meme Sacrifice from you to proceed!</p>
                  <p className="font-bold mt-5">Click here when you are ready...</p>
                  <img className="w-[40px] m-auto" src={FingerPoint} alt={"Click to Start"} />{" "}
                </div>
              </>
            )) ||
              null}

            {_isMemeBurnHappening && (
              <div
                className="z-10 relative cursor-none select-none"
                onClick={() => {
                  setBurnProgress((prev) => prev + 1);
                }}>
                <Torch />
                <p className="text-center text-md text-gray-950 text-foreground md:text-xl ">Light up this meme sacrifice!</p>
                <p className="text-gray-950 text-sm text-center mb-[1rem]">Click to burn </p>
                <BurningImage src={randomMeme} burnProgress={burnProgress} />
                <div className="glow" style={{ opacity: burnFireGlow }}></div>
                <div className="flame !top-[125px] md:!top-[90px]" style={{ transform: burnFireScale }}></div>
              </div>
            )}

            {_isFetchingDataMarshal && (
              <div>
                <p className="text-center text-md text-gray-950 text-foreground  md:text-xl mb-[1rem]">
                  Did the {`<BiTz>`} Generator God like that Meme Sacrifice? Only time will tell...
                </p>
                <img className="w-[250px] m-auto" src={resultLoading} alt={"Result loading"} />{" "}
              </div>
            )}
          </div>

          {spritLayerPointsCloud()}
        </div>
      );
    }

    // we got the response from the game play
    if (_loadBlankGameCanvas && !_isFetchingDataMarshal && _gameDataFetched) {
      return (
        <div className="relative overflow-hidden">
          <img className="rounded-[3rem] w-full cursor-pointer" src={ImgGameCanvas} alt={"Get <BiTz> Points"} />
          <div
            className="flex justify-center items-center mt-[10px] w-[100%] h-[350px] rounded-[3rem] bg-slate-50 text-gray-950 p-[1rem] border border-primary/50 static
                        md:absolute md:p-[2rem] md:pb-[.5rem] md:w-[500px] md:h-[400px] md:mt-0 md:top-[40%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2">
            {_viewDataRes && !_viewDataRes.error && (
              <>
                {_viewDataRes.data.gamePlayResult.triedTooSoonTryAgainInMs > 0 && (
                  <div>
                    <p className="text-2xl text-center">You FOMOed in too fast, try again in:</p>
                    <div className="text-2xl text-center mt-[2rem]">
                      <Countdown date={Date.now() + _viewDataRes.data.gamePlayResult.triedTooSoonTryAgainInMs} renderer={countdownRenderer} />
                    </div>
                  </div>
                )}

                {_viewDataRes.data.gamePlayResult.triedTooSoonTryAgainInMs === -1 && (
                  <div className="flex flex-col justify-around h-[100%] items-center text-center">
                    {_viewDataRes.data.gamePlayResult.bitsWon === 0 && (
                      <>
                        <div className="z-[25]">
                          <p className="text-2xl">OPPS! Aladdin Rugged You! 0 Points this Time...</p>
                          <motion.img
                            className="w-[150px] lg:w-full absolute z-[25]"
                            src={aladinRugg}
                            initial={{ x: -750, y: 0 }}
                            animate={{
                              scale: [0.5, 1, 1, 0.5],
                              rotate: [0, 0, -360, -360, -360, -360],
                              opacity: [0.8, 1, 1, 1, 1, 1, 1, 0],
                              x: [-750, 0, 200, 1000],
                            }}
                            transition={{ duration: 8 }}
                          />
                        </div>
                        <div className="bg-black rounded-full p-[1px] -z-1 ">
                          <HoverBorderGradient className="-z-1">
                            <a
                              className="z-1 bg-black text-white  rounded-3xl gap-2 flex flex-row justify-center items-center"
                              href={"https://twitter.com/intent/tweet?" + tweetText}
                              data-size="large"
                              target="_blank">
                              <span className=" [&>svg]:h-4 [&>svg]:w-4 z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                                </svg>
                              </span>
                              <p className="z-10">Tweet</p>
                            </a>
                          </HoverBorderGradient>
                        </div>
                      </>
                    )}

                    {(_viewDataRes.data.gamePlayResult.bitsWon > 0 && (
                      <>
                        <p className="text-2xl text-gray-950">w👀t! w👀t! You have won:</p>
                        <p className="text-4xl mt-[2rem] text-gray-950">
                          {_viewDataRes.data.gamePlayResult.bitsWon} {` <BiTz>`}
                        </p>
                        <div className="bg-black rounded-full p-[1px]">
                          <HoverBorderGradient>
                            <a
                              className=" bg-black text-white  rounded-3xl gap-2 flex flex-row justify-center items-center"
                              href={"https://twitter.com/intent/tweet?" + tweetText}
                              data-size="large"
                              target="_blank">
                              <span className="[&>svg]:h-4 [&>svg]:w-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                                </svg>
                              </span>
                              Tweet
                            </a>
                          </HoverBorderGradient>
                        </div>
                      </>
                    )) ||
                      null}

                    <div className="text-center mt-[2rem]">
                      <p className="text-xl">You can try again in:</p>
                      <div className="text-2xl mt-[1rem]">
                        <Countdown date={Date.now() + _viewDataRes.data.gamePlayResult.configCanPlayEveryMSecs} renderer={countdownRenderer} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {spritLayerPointsCloud()}
        </div>
      );
    }
  }

  function spritLayerPointsCloud() {
    return (
      <div className="flex flex-col justify-center items-center w-[200px] h-[100px] absolute top-[2%] left-[2%] rounded-[3rem] bg-slate-50 text-gray-950 p-[2rem] border border-primary/50">
        <p className="text-sm">Your {`<BiTz>`} Points</p>
        <p className="text-[1.5rem] font-bold mt-[2px]">{bitzBalance === -2 ? `...` : <>{bitzBalance === -1 ? "0" : `${bitzBalance}`}</>}</p>
      </div>
    );
  }

  async function fetchAndLoadLeaderBoards() {
    setLeaderBoardIsLoading(true);

    const callConfig = {
      headers: {
        "fwd-tokenid": createNftId(GET_BITZ_TOKEN.tokenIdentifier, GET_BITZ_TOKEN.nonce),
      },
    };

    const nowDateObj = new Date();
    let UTCMonth = nowDateObj.getUTCMonth() + 1; // can returns vals 1 - 12
    let UTCMonthStr = UTCMonth.toString();

    if (UTCMonth < 10) {
      UTCMonthStr = "0" + UTCMonthStr; // make 1 = 01 ... 9 = 09 etc
    }

    const UTCYear = nowDateObj.getUTCFullYear().toString().slice(-2); // converts number 2024 to string 24
    let MMYYString = `${UTCMonthStr}_${UTCYear}`;

    // S: for TESTING monthly leaderboards, allow a param override!
    const searchParams = new URLSearchParams(window.location.search);
    const _overrideMMYYString = searchParams.get("x-test-custom-mmyy-string"); // should be like this 03_24

    if (_overrideMMYYString && _overrideMMYYString.length === 5 && _overrideMMYYString.indexOf("_") === 2) {
      MMYYString = _overrideMMYYString;
      setInDateStringDebugMode(true);
    }
    // E: for TESTING monthly leaderboards, allow a param override!

    setLeaderBoardMonthString(MMYYString);

    try {
      // S: ACTUAL LOGIC
      const { data } = await axios.get<LeaderBoardItemType[]>(`${getApiWeb2Apps(chainID)}/datadexapi/xpGamePrivate/leaderBoard`, callConfig);
      // const toJSONString = JSON.stringify(data);
      // const toBase64String = btoa(toJSONString); // @TODO: we should save this in some local cache and hydrate to prevent the API always hitting
      setLeaderBoardAllTime(data);
      // E: ACTUAL LOGIC

      // // S: UNCOMMENT BELOW BLOCK TO MOCK FOR LOCAL UI DEVELOPMENT (COMMENT THE ABOVE ACTUAL LOGIC)
      // const allTimePayload =
      //   "W3sicGxheWVyQWRkciI6ImVyZDF2eWVqdjUyZTQzZnhxOTZjc2NoeXlqOWc1N3FuOWtndHhyaGtnOTJleWhmdTVhMDIycGxxdGR4dmRtIiwiYml0cyI6MjkwLCJkYXRhTkZUSWQiOiJEQVRBTkZURlQtZTBiOTE3LWM2In0seyJwbGF5ZXJBZGRyIjoiZXJkMWV3ZXF5a3hjcmhoNW5wczRmemt0dTllZnRmN3J4cGE4eGRma3lwd3owazRodWhsMHMwNHNhNnRxeWQiLCJiaXRzIjoyNjAsImRhdGFORlRJZCI6IkRBVEFORlRGVC1lMGI5MTctYzYifSx7InBsYXllckFkZHIiOiJlcmQxdXdrZzlwcnh3cXZsY2xhemQ1OHR4MjJ6OWV6Y3JkYTh5bnJ2MDR6aGg4YW11bm44bDV2cTQ1dnRtMCIsImJpdHMiOjE3NSwiZGF0YU5GVElkIjoiREFUQU5GVEZULWUwYjkxNy1jNiJ9LHsicGxheWVyQWRkciI6ImVyZDF4ZHE0ZDd1ZXdwdHg5ajlrMjNhdWZyYWtsZGE5bGV1bXFjN2V1M3VlenQya2Y0ZnF4ejJzZXgycnhsIiwiYml0cyI6OTUsImRhdGFORlRJZCI6IkRBVEFORlRGVC1lMGI5MTctYzYifSx7InBsYXllckFkZHIiOiJlcmQxNnZqaHJnYTR5anB5ODhsd251NjR3bHhsYXB3eHR2amw5M2pheDRyZzN5cTNoenh0bmF1c2RtaGNqZiIsImJpdHMiOjcwLCJkYXRhTkZUSWQiOiJEQVRBTkZURlQtZTBiOTE3LWM2In0seyJwbGF5ZXJBZGRyIjoiZXJkMXI1M2R2ZDBoOWo2dTBnenp5ZXR4czVzajMyaHM3a256cHJzbHk3cng5eXgyM2RjbHdsenM4MzM1enciLCJiaXRzIjo3MCwiZGF0YU5GVElkIjoiREFUQU5GVEZULWUwYjkxNy1jNiJ9LHsicGxheWVyQWRkciI6ImVyZDFxbXNxNmVqMzQ0a3BuOG1jOXhmbmdqaHlsYTN6ZDZscWRtNHp4eDY2NTNqZWU2cmZxM25zM2ZrY2M3IiwiYml0cyI6NTAsImRhdGFORlRJZCI6IkRBVEFORlRGVC1lMGI5MTctYzYifSx7InBsYXllckFkZHIiOiJlcmQxNnU4eTQ1dTM5N201YWR1eXo5Zm5jNWdwdjNlcmF4cWh0dWVkMnF2dnJza2QzMmZmamtnc3BkNGxjbSIsImJpdHMiOjMwLCJkYXRhTkZUSWQiOiJEQVRBTkZURlQtZTBiOTE3LWM2In0seyJwbGF5ZXJBZGRyIjoiZXJkMXV0aHY4bmFqZGM0Mmg1N2w4cDk3NXRkNnI4OHgzczQ4cGZ5dXNsczQ3ZXY1Nnhjczh0eXMwM3llczUiLCJiaXRzIjoyMCwiZGF0YU5GVElkIjoiREFUQU5GVEZULWUwYjkxNy1jNiJ9LHsicGxheWVyQWRkciI6ImVyZDFseWh0OHh1eW4zaHlrdjNlcnFrd3ljZWFqeXRzNXV3cnpyNWNudTlrNHV1MzRnODc4bDNxa25kanc4IiwiYml0cyI6MjAsImRhdGFORlRJZCI6IkRBVEFORlRGVC1lMGI5MTctYzYifV0=";

      // const base64ToString = atob(allTimePayload);
      // const stringToJSON = JSON.parse(base64ToString);

      // setLeaderBoardAllTime(stringToJSON);
      // // E: UNCOMMENT BELOW BLOCK TO MOCK FOR LOCAL UI DEVELOPMENT (COMMENT THE ABOVE ACTUAL LOGIC)
    } catch (err) {
      const message = "Leaderboard fetching failed:" + (err as AxiosError).message;
      console.error(message);
    }

    try {
      // S: ACTUAL LOGIC
      const { data } = await axios.get<LeaderBoardItemType[]>(
        `${getApiWeb2Apps(chainID)}/datadexapi/xpGamePrivate/monthLeaderBoard?MMYYString=${MMYYString}`,
        callConfig
      );

      // const toJSONString = JSON.stringify(data);
      // const toBase64String = btoa(toJSONString); // @TODO: we should save this in some local cache and hydrate to prevent the API always hitting

      setLeaderBoardMonthly(data);
      // E: ACTUAL LOGIC

      // // S: UNCOMMENT BELOW BLOCK TO MOCK FOR LOCAL UI DEVELOPMENT (COMMENT THE ABOVE ACTUAL LOGIC)
      // const monthlyPayload =
      //   "W3siTU1ZWURhdGFORlRJZCI6IjAzXzI0X0RBVEFORlRGVC1lMGI5MTctYzYiLCJwbGF5ZXJBZGRyIjoiZXJkMXZ5ZWp2NTJlNDNmeHE5NmNzY2h5eWo5ZzU3cW45a2d0eHJoa2c5MmV5aGZ1NWEwMjJwbHF0ZHh2ZG0iLCJiaXRzIjoyOTB9LHsiTU1ZWURhdGFORlRJZCI6IjAzXzI0X0RBVEFORlRGVC1lMGI5MTctYzYiLCJwbGF5ZXJBZGRyIjoiZXJkMWV3ZXF5a3hjcmhoNW5wczRmemt0dTllZnRmN3J4cGE4eGRma3lwd3owazRodWhsMHMwNHNhNnRxeWQiLCJiaXRzIjoyNjB9LHsiTU1ZWURhdGFORlRJZCI6IjAzXzI0X0RBVEFORlRGVC1lMGI5MTctYzYiLCJwbGF5ZXJBZGRyIjoiZXJkMXV3a2c5cHJ4d3F2bGNsYXpkNTh0eDIyejllemNyZGE4eW5ydjA0emhoOGFtdW5uOGw1dnE0NXZ0bTAiLCJiaXRzIjoxNzV9LHsiTU1ZWURhdGFORlRJZCI6IjAzXzI0X0RBVEFORlRGVC1lMGI5MTctYzYiLCJwbGF5ZXJBZGRyIjoiZXJkMXhkcTRkN3Vld3B0eDlqOWsyM2F1ZnJha2xkYTlsZXVtcWM3ZXUzdWV6dDJrZjRmcXh6MnNleDJyeGwiLCJiaXRzIjo5NX0seyJNTVlZRGF0YU5GVElkIjoiMDNfMjRfREFUQU5GVEZULWUwYjkxNy1jNiIsInBsYXllckFkZHIiOiJlcmQxNnZqaHJnYTR5anB5ODhsd251NjR3bHhsYXB3eHR2amw5M2pheDRyZzN5cTNoenh0bmF1c2RtaGNqZiIsImJpdHMiOjcwfSx7Ik1NWVlEYXRhTkZUSWQiOiIwM18yNF9EQVRBTkZURlQtZTBiOTE3LWM2IiwicGxheWVyQWRkciI6ImVyZDFyNTNkdmQwaDlqNnUwZ3p6eWV0eHM1c2ozMmhzN2tuenByc2x5N3J4OXl4MjNkY2x3bHpzODMzNXp3IiwiYml0cyI6NzB9LHsiTU1ZWURhdGFORlRJZCI6IjAzXzI0X0RBVEFORlRGVC1lMGI5MTctYzYiLCJwbGF5ZXJBZGRyIjoiZXJkMXFtc3E2ZWozNDRrcG44bWM5eGZuZ2poeWxhM3pkNmxxZG00enh4NjY1M2plZTZyZnEzbnMzZmtjYzciLCJiaXRzIjo1MH0seyJNTVlZRGF0YU5GVElkIjoiMDNfMjRfREFUQU5GVEZULWUwYjkxNy1jNiIsInBsYXllckFkZHIiOiJlcmQxNnU4eTQ1dTM5N201YWR1eXo5Zm5jNWdwdjNlcmF4cWh0dWVkMnF2dnJza2QzMmZmamtnc3BkNGxjbSIsImJpdHMiOjMwfSx7Ik1NWVlEYXRhTkZUSWQiOiIwM18yNF9EQVRBTkZURlQtZTBiOTE3LWM2IiwicGxheWVyQWRkciI6ImVyZDF1dGh2OG5hamRjNDJoNTdsOHA5NzV0ZDZyODh4M3M0OHBmeXVzbHM0N2V2NTZ4Y3M4dHlzMDN5ZXM1IiwiYml0cyI6MjB9LHsiTU1ZWURhdGFORlRJZCI6IjAzXzI0X0RBVEFORlRGVC1lMGI5MTctYzYiLCJwbGF5ZXJBZGRyIjoiZXJkMWx5aHQ4eHV5bjNoeWt2M2VycWt3eWNlYWp5dHM1dXdyenI1Y251OWs0dXUzNGc4NzhsM3FrbmRqdzgiLCJiaXRzIjoyMH1d";
      // const base64ToString = atob(monthlyPayload);
      // const stringToJSON = JSON.parse(base64ToString);

      // setLeaderBoardMonthly(stringToJSON);
      // // E: UNCOMMENT BELOW BLOCK TO MOCK FOR LOCAL UI DEVELOPMENT (COMMENT THE ABOVE ACTUAL LOGIC)
    } catch (err) {
      const message = "Monthly Leaderboard fetching failed:" + (err as AxiosError).message;
      console.error(message);
    }
    setLeaderBoardIsLoading(false);
  }

  function leaderBoardTable(leaderBoardData: LeaderBoardItemType[]) {
    return (
      <>
        <table className="border border-primary/50 text-center m-auto w-[90%] max-w-[500px]">
          <thead>
            <tr className="border">
              <th className="p-2">Rank</th>
              <th className="p-2">User</th>
              <th className="p-2">{`<BiTz>`} Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderBoardData.map((item, rank) => (
              <tr key={rank} className="border">
                <td className="p-2">
                  #{rank + 1} {rank + 1 === 1 && <span> 🥇</span>} {rank + 1 === 2 && <span> 🥈</span>} {rank + 1 === 3 && <span> 🥉</span>}
                </td>
                <td className="p-2">{item.playerAddr === address ? "It's YOU! 🫵 🎊" : <CopyAddress address={item.playerAddr} precision={8} />}</td>
                <td className="p-2">{item.bits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  return (
    <>
      {gamePlayImageSprites()}

      <div className="p-5 text-lg font-bold border border-[#35d9fa] rounded-[1rem] my-[3rem]">
        <h2 className="text-center text-white mb-[1rem]">SPECIAL LAUNCH WINDOW PERKS</h2>
        To celebrate the launch of Itheum {`<BiTz>`} XP, the {`<BiTz>`} Generator God has got into a generous mood! For the first month only (April 1, 2024 -
        May 1, 2024), check out these special LAUNCH WINDOW perks:
        <ol className="mt-5">
          <li className="my-5">
            1. A special shorter Game Cooldown is in place. So instead of a usual 6 Hours Game Cooldown. You can play every {BIT_GAME_WINDOW_HOURS} hours!
          </li>
          <li className="my-5">
            2. The top {BIT_GAME_TOP_LEADER_BOARD_GROUP} LEADERBOARD movers in this month will get Airdropped Data NFTs from previous Data NFT Creators
          </li>
          <li className="my-5">3. Extra 3 bonus drops of Data NFTs sent randomly to users from top 100 "All Time" LEADERBOARD</li>
          <li className="my-5">
            {" "}
            4. Got Memes for burning? Join our{" "}
            <a className="!text-[#7a98df] hover:underline" href="https://discord.com/channels/869901313616527360/922340575594831872" target="blank">
              Discord Meme Channel
            </a>{" "}
            and submit it there. Top 3 memes per week get included into the Meme Burn Game and we will showcase it on Twitter.
          </li>
        </ol>
        <p>See the full list of {`<BiTz>`} XP perks listed in the FAQ section below...</p>
      </div>

      <div className="flex flex-col max-w-[100%] border border-[#35d9fa] p-[2rem] mb-[3rem] rounded-[1rem]">
        <div className="leaderBoard">
          <h2 className="text-center text-white mb-[1rem]">LEADERBOARD</h2>
          <div className="md:flex">
            <div className="my-[1rem] allTime md:flex-1">
              <h3 className="text-center text-white mb-[1rem]">All Time</h3>
              {leaderBoardIsLoading ? (
                <Loader />
              ) : (
                <>
                  {leaderBoardAllTime.length > 0 ? (
                    leaderBoardTable(leaderBoardAllTime)
                  ) : (
                    <div className="text-center">{!chainID ? "Connect Wallet to Check" : "No Data Yet"!}</div>
                  )}
                </>
              )}
            </div>

            <div className="my-[1rem] monthly md:flex-1">
              <h3 className="text-center text-white mb-[1rem]">
                Monthly ({leaderBoardMonthString.replace("_", "-20")}) {inDateStringDebugMode && <span className="text-red-100"> IN DEBUG MODE!</span>}
              </h3>
              {leaderBoardIsLoading ? (
                <Loader />
              ) : (
                <>
                  {leaderBoardMonthly.length > 0 ? (
                    leaderBoardTable(leaderBoardMonthly)
                  ) : (
                    <div className="text-center">{!chainID ? "Connect Wallet to Check" : "No Data Yet"!}</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Faq />
    </>
  );
};

/*
A utility method that we can use to get, parse and return data from the viewDataViaMVXNativeAuth method
*/
export async function viewDataJSONCore(viewDataArgs: any, requiredDataNFT: DataNft) {
  try {
    let res: any;
    res = await requiredDataNFT.viewDataViaMVXNativeAuth(viewDataArgs);

    let blobDataType = BlobDataType.TEXT;

    if (!res.error) {
      if (res.contentType.search("application/json") >= 0) {
        res.data = JSON.parse(await (res.data as Blob).text());
      }

      const viewDataJSONPayload: ExtendedViewDataReturnType = {
        ...res,
        blobDataType,
      };

      return viewDataJSONPayload;
    } else {
      console.log("viewDataJSONCore threw catch error");
      console.error(res.error);

      return undefined;
    }
  } catch (err) {
    console.log("viewDataJSONCore threw catch error");
    console.error(err);

    return undefined;
  }
}