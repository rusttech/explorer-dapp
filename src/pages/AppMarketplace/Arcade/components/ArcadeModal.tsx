import React, { useMemo, useRef } from "react";
import { Loader } from "../../../../components";
import { useGetLoginInfo } from "@multiversx/sdk-dapp/hooks";

type ArcadeModalProps = {
  data: any;
  owned: boolean;
  isFetchingDataMarshal: boolean;
};

export const ArcadeModal: React.FC<ArcadeModalProps> = (props) => {
  const { data, owned, isFetchingDataMarshal } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // const [isFullscreen, setIsFullscreen] = React.useState(false);
  const htmlCached = useMemo(() => data, [data]);
  const { tokenLogin } = useGetLoginInfo();

  // Fullscreen logic if i cant handle from game itself
  // const handleFullscreen = () => {
  //   const iframeElement = iframeRef.current;
  //   if (!isFullscreen) {
  //     iframeElement?.requestFullscreen();
  //   }
  // };

  return (
    <>
      {!owned ? (
        <div className="flex flex-col items-center justify-center">
          <h4 className="mt-3 font-title">You do not own this Data NFT</h4>
          <h6>(Buy the Data NFT from the marketplace to unlock the data)</h6>
        </div>
      ) : isFetchingDataMarshal || !data ? (
        <div className="flex flex-col items-center justify-center min-w-[24rem] max-w-[100%] min-h-[40rem] max-h-[80svh]">
          <div>
            <Loader noText />
            <p className="text-center font-weight-bold">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          {/*<Button className="absolute bottom-4 left-4" onClick={handleFullscreen}>*/}
          {/*  Fullscreen*/}
          {/*</Button>*/}
          <iframe
            ref={iframeRef}
            id="gameiframe"
            src={URL.createObjectURL(htmlCached) + "#tokenLogin?" + tokenLogin?.nativeAuthToken}
            height="800"
            className="w-full rounded-bl-xl"
            allow="fullscreen"
          />
        </>
      )}
    </>
  );
};
