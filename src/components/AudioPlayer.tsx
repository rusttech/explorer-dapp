import { useEffect, useState } from "react";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { Loader2, Play, Pause, Library, RefreshCcwDot, Volume2, Volume1, VolumeX, SkipBack, SkipForward } from "lucide-react";

import DEFAULT_SONG_IMAGE from "assets/img/audio-player-image.png";
import DEFAULT_SONG_LIGHT_IMAGE from "assets/img/audio-player-light-image.png";
import { toastError } from "libs/utils";
import { DataNft, ViewDataReturnType } from "@itheum/sdk-mx-data-nft/out";

type AudioPlayerProps = {
  dataNftToOpen: DataNft;
  songs: any;
  tokenLogin: any;
};

export const AudioPlayer = (props: AudioPlayerProps) => {
  ///TODO https://developer.chrome.com/blog/play-request-was-interrupted/
  ///some problems with the audio player, sometimes it gets stuck bcs the auudio does not get loaded
  ///When fetching the urls use a try catch and show an error if not fetched - maybe as in the above link

  useEffect(() => {
    audio.onended = function () {
      setIsPlaying(false);
    };
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("canplaythrough", function () {
      // Audio is ready to be played
      setIsLoaded(true);
      updateProgress();
      if (audio.currentTime == 0) togglePlay();
    });
    updateProgress();
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("canplaythrough", function () {
        setIsLoaded(false);
        console.log("removed");
      });
    };
  }, []);

  let settings = {
    infinite: false,
    speed: 1000,
    slidesToShow: 4,
    slidesToScroll: 4,

    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1554,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
        },
      },
      {
        breakpoint: 980,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          initialSlide: 2,
        },
      },

      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
        },
      },
    ],
  };

  const theme = localStorage.getItem("explorer-ui-theme");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [displayPlaylist, setDisplayPlaylist] = useState(false);

  const [audio] = useState(new Audio());

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("00:00");
  const [isLoaded, setIsLoaded] = useState(false);

  // map to keep the already fetched songs
  const [songSource, setSongSource] = useState<{ [key: number]: string }>({});

  /// format time as minutes:seconds
  const formatTime = (_seconds: number) => {
    const minutes = Math.floor(_seconds / 60);
    const remainingSeconds = Math.floor(_seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, "0"); // Ensure two digits
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
  };
  console.log(songSource);

  /// fetch song from Marshal
  const fetchMarshalForSong = async (index: number) => {
    try {
      /// if not previously fetched, fetch now and save the url of the blob
      const res: ViewDataReturnType = await props.dataNftToOpen.viewDataViaMVXNativeAuth({
        mvxNativeAuthOrigins: [window.location.origin],
        mvxNativeAuthMaxExpirySeconds: 86400,
        fwdHeaderMapLookup: {
          "authorization": `Bearer ${props.tokenLogin?.nativeAuthToken}`,
        },
        stream: true,
        nestedIdxToStream: index, ///   get the song for the current index
      });

      if (!res.error) {
        const blobUrl = URL.createObjectURL(res.data);
        // audio.src = blobUrl;
        // audio.load();
        //_songSource[index] = blobUrl;
        setSongSource((prevState) => ({
          ...prevState, // keep all other key-value pairs
          [index]: blobUrl, // update the value of specific key
        }));
      } else {
        setSongSource((prevState) => ({
          ...prevState,
          [index]: "Error: " + res.error,
        }));
      }
    } catch (err) {
      setSongSource((prevState) => ({
        ...prevState, // keep all other key-value pairs
        [index]: "Error: " + (err as Error).message, // update the value of specific key
      }));
      console.error("error : ", err);
    }
  };

  const updateProgress = () => {
    setCurrentTime(audio.currentTime ? formatTime(audio.currentTime) : "00:00");
    setDuration(audio.duration ? formatTime(audio.duration) : "00:00");
    let _percentage = (audio.currentTime / audio.duration) * 100;
    if (isNaN(_percentage)) _percentage = 0;
    setProgress(_percentage);
  };

  useEffect(() => {
    updateProgress();
  }, [audio.src]);

  useEffect(() => {
    //if (displayPlaylist === false) swiper.init();
  }, [displayPlaylist]);

  const togglePlay = () => {
    if (isPlaying) {
      if (!audio.paused) {
        audio.pause();
      }
    } else {
      if (audio.readyState >= 2) {
        // Audio is loaded, play it.
        audio.play();
      } else {
        toastError("Audio not ready yet. Waiting for loading to complete...");
        return;
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const handlePrevButton = () => {
    if (currentTrackIndex <= 0) return;
    setCurrentTrackIndex((prevCurrentTrackIndex) => prevCurrentTrackIndex - 1);
  };

  const handleNextButton = () => {
    if (currentTrackIndex >= props.songs.length - 1) {
      setCurrentTrackIndex(0);
      return;
    }

    setCurrentTrackIndex((prevCurrentTrackIndex) => prevCurrentTrackIndex + 1);
  };

  const repeatTrack = () => {
    audio.currentTime = 0;
    if (isPlaying) audio.play();
  };

  const handleProgressChange = (newProgress: number) => {
    if (!audio.duration) return;
    const newTime = (newProgress / 100) * audio.duration;
    audio.currentTime = newTime;
    setCurrentTime(formatTime(audio.currentTime));
    setProgress(newProgress);
  };

  const handleChangeSong = () => {
    const index = props.songs[currentTrackIndex].idx;
    console.log("handle change... ");
    console.log("handel", songSource);
    if (songSource[index]) {
      console.log("We have something ");
      // if we previously fetched the song and it was an error, show again the exact error.
      if (songSource[index].includes("Error:")) {
        toastError(songSource[index]);
      } else if (!(songSource[index] === "Fetching")) {
        console.log(index, "changed ");
        audio.src = songSource[index];
        audio.load();
        updateProgress();
        audio.currentTime = 0;
      } else {
        return false;
      }
    } else {
      return false;
    }
    return true;
  };

  useEffect(() => {
    handleChangeSong();
  }, [songSource[props.songs[currentTrackIndex].idx]]);

  useEffect(() => {
    audio.pause();
    setIsPlaying(false);
    audio.src = "";
    setIsLoaded(false);
    const songIdx = props.songs[currentTrackIndex].idx;
    try {
      //if the song has not been previously fetched
      if (!handleChangeSong() && !(songSource[songIdx] === "Fetching")) {
        setSongSource((prevState) => ({
          ...prevState, // keep all other key-value pairs
          [songIdx]: "Fetching", // update the value of specific key
        }));
        (async () => {
          try {
            console.log("fetching from current track index effect..");
            await fetchMarshalForSong(songIdx);
          } catch (err) {
            ///should not get here because of error handling in fetchMarshalForSong
            console.log("Error occured when fetching songs");
          }
        })();
      }
    } catch (err) {
      console.log(err);
    }
  }, [currentTrackIndex]);

  const showPlaylist = () => {
    setDisplayPlaylist(true);
  };

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  //add light mode img default
  return (
    <div className="p-12 relative overflow-hidden">
      {displayPlaylist ? (
        <div className="w-full h-[500px] overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mx-4  mt-6 mb-20">
            {props.songs.map((song: any, index: number) => {
              return (
                <div
                  key={index}
                  onClick={() => {
                    setCurrentTrackIndex(index);
                    setDisplayPlaylist(false);
                  }}
                  className={`select-none flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25  p-2 gap-2 text-xs relative cursor-pointer transition-shadow duration-300 shadow-xl hover:shadow-sky-500/20  bg-[#27293d] rounded-2xl overflow-hidden text-white border-1 border-sky-700`}>
                  <div className="w-[60%] h-32 flex items-center justify-center">
                    <img
                      src={song.cover_art_url}
                      alt={"Not Loaded"}
                      className={`flex items-center justify-center w-24 h-24 rounded-md border border-grey-900 `}
                      onLoad={handleImageLoad}
                      onError={({ currentTarget }) => {
                        currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                      }}
                    />
                  </div>

                  <div className="w-8/12 flex flex-col items-center justify-center">
                    <h6 className=" truncate text-base text-gray-700 dark:text-slate-300">{song.title}</h6>

                    <p className="truncate text-sm text-center text-gray-700 dark:text-slate-300 ">{song.artist}</p>
                    <p className="text-xs text-center text-gray-400">{song.album}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden  w-full h-[60%] flex flex-col bg-bgWhite dark:bg-bgDark items-center justify-center">
          <div className=" select-none h-[30%] bg-[#FaFaFa]/25 dark:bg-[#0F0F0F]/25  border border-slate-300 dark:border-white relative md:w-[60%] flex flex-col rounded-xl">
            <div className="px-10 pt-10 pb-4 flex items-center">
              <img
                src={props.songs[currentTrackIndex].cover_art_url}
                alt="Album Cover"
                className=" select-none w-24 h-24 rounded-md mr-6 border border-grey-900"
                onLoad={handleImageLoad}
                onError={({ currentTarget }) => {
                  currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                }}
              />

              <div className="flex flex-col select-text">
                <div>
                  <span className="font-sans text-lg font-medium leading-7 text-slate-900 dark:text-white">{props.songs[currentTrackIndex].title}</span>{" "}
                  <span className="ml-2 font-sans text-base font-medium   text-gray-500 dark:text-gray-400">
                    {props.songs[currentTrackIndex].date.split("T")[0]}
                  </span>
                </div>

                <span className="font-sans text-base font-medium   text-gray-500 dark:text-gray-400">{props.songs[currentTrackIndex].category}</span>
                <span className="font-sans text-lg font-medium leading-6 text-slate-900 dark:text-white">{props.songs[currentTrackIndex].artist}</span>
                <span className="font-sans text-base font-medium leading-6 text-gray-500 dark:text-gray-400">{props.songs[currentTrackIndex].album}</span>
              </div>
            </div>

            <div className="gap-2 text-white select-none w-full flex flex-row justify-center items-center px-10 pb-6 ">
              <span className="w-12 p-2 text-xs font-sans font-medium  text-gray-500 ">{currentTime}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="0.01"
                value={progress}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                className="accent-black dark:accent-white w-full bg-white mx-auto  focus:outline-none cursor-pointer"
              />{" "}
              <span className="p-2 text-xs font-sans font-medium text-gray-500 ">{duration}</span>
            </div>

            <div className="select-none p-2 bg-[#0f0f0f]/10 dark:bg-[#0F0F0F]/50 rounded-b-xl   border-t border-gray-400 dark:border-gray-900  flex items-center justify-between z-10 ">
              <div className="ml-2 xl:pl-8 flex w-[20%]">
                {volume === 0 ? <VolumeX /> : volume >= 0.5 ? <Volume2 /> : <Volume1 />}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="accent-black dark:accent-white  w-[70%] cursor-pointer ml-2 "></input>
              </div>
              <button className="cursor-pointer" onClick={handlePrevButton}>
                <SkipBack />
              </button>
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-grey-300 shadow-xl flex items-center justify-center">
                <button onClick={togglePlay} className="focus:outline-none" disabled={!isLoaded}>
                  {!isLoaded ? (
                    <Loader2 className="animate-spin " />
                  ) : isPlaying ? ( // add a loading here until the song is fetched
                    <Pause />
                  ) : (
                    <Play className="ml-1" />
                  )}
                </button>
              </div>
              <button className="cursor-pointer" onClick={handleNextButton}>
                <SkipForward />
              </button>
              <button className="cursor-pointer   " onClick={repeatTrack}>
                <RefreshCcwDot />
              </button>
              <button className="mr-2  xl:pr-8" onClick={showPlaylist}>
                <Library />
              </button>
            </div>
          </div>
          <div className="w-[100%] 2xl:w-[80%] mt-8 mx-auto">
            <h4 className="ml-[10%] select-none flex justify-start font-semibold dark:text-white mt-4 mb-2   ">{`Tracklist ${props.songs.length} songs`} </h4>
            <Slider {...settings}>
              {props.songs.map((song: any, index: number) => {
                return (
                  <div>
                    <div
                      onClick={() => {
                        setCurrentTrackIndex(index);
                      }}
                      className={`ml-[15%] w-32 xl:w-64 select-none flex flex-col xl:flex-row items-center justify-center
                     bg-[#fafafa]/25 dark:bg-[#0f0f0f]/25
                     cursor-pointer transition-shadow duration-300 shadow-xl hover:shadow-inner hover:shadow-sky-200   rounded-2xl text dark:text-white border  border-white`}>
                      <div className="w-[80%] xl:w-[40%] justify-center">
                        <img
                          src={song.cover_art_url}
                          alt="Album Cover"
                          className="h-24 p-2 rounded-md"
                          onLoad={handleImageLoad}
                          onError={({ currentTarget }) => {
                            currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                          }}
                        />
                      </div>
                      <div className=" xl:w-[60%] flex flex-col justify-center">
                        <h6 className="font-semibold truncate text-left">{song.title}</h6>
                        <p className="aray-400 truncate text-left">{song.artist}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Slider>
            <style>
              {" "}
              {`
                /* CSS styles for Swiper navigation arrows  */

                .slick-prev:before,
                .slick-next:before {
                  color: black;
                    }`}
            </style>
          </div>
        </div>
      )}
      <div className="z-[-1]  ml-[-10%] dark:mt-[-20%] h-[50%] w-[60%] opacity-75 blur-[300px] absolute bg-[#00C797] rounded-full"> </div>
      <div className="z-[-1]  dark:mt-[-10%] ml-[40%] h-[50%] w-[60%] opacity-75 blur-[300px] absolute bg-[#3D00EA] rounded-full "> </div>
    </div>
  );
};
