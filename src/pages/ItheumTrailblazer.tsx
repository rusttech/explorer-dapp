import React, { useEffect, useState } from "react";
import { DataNft } from "@itheum/sdk-mx-data-nft";
import { SignableMessage } from "@multiversx/sdk-core/out";
import { signMessage } from "@multiversx/sdk-dapp/utils/account";
import { ModalBody } from "react-bootstrap";
import ModalHeader from "react-bootstrap/esm/ModalHeader";
import { FaCalendarCheck, FaHandshake, FaTrophy } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import Modal from "react-modal";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import imgBlurChart from "assets/img/blur-chart.png";
import { DataNftCard, ElrondAddressLink, Loader } from "components";
import { MARKETPLACE_DETAILS_PAGE, TRAILBLAZER_NONCES } from "config";
import {
  useGetAccount,
  useGetNetworkConfig,
  useGetPendingTransactions,
} from "hooks";
import { toastError } from "libs/utils";
import "react-vertical-timeline-component/style.min.css";

const customStyles = {
  overlay: {
    backgroundColor: "var(--light-20) !important",
    backdropFilter: "blur(10px)",
  },
  content: {
    width: "80%",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxHeight: "80vh",
    backgroundColor: "var(--light)",
  },
};

export const ItheumTrailblazer = () => {
  const {
    network: { explorerAddress },
  } = useGetNetworkConfig();
  const { address } = useGetAccount();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const [itDataNfts, setItDataNfts] = useState<DataNft[]>([]);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNftLoading, setIsNftLoading] = useState(false);
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] =
    useState<boolean>(true);
  const [owned, setOwned] = useState<boolean>(false);
  const [data, setData] = useState<any>();
  const [isModalOpened, setIsModalOpened] = useState<boolean>(false);

  function openModal() {
    setIsModalOpened(true);
  }
  function closeModal() {
    setIsModalOpened(false);
  }

  async function fetchAppNfts() {
    setIsLoading(true);

    const _nfts: DataNft[] = await DataNft.createManyFromApi(
      TRAILBLAZER_NONCES
    );

    setItDataNfts(_nfts);
    setIsLoading(false);
  }

  async function fetchMyNfts() {
    setIsNftLoading(true);

    const _dataNfts = await DataNft.ownedByAddress(address);
    const _flags = [];

    for (const cnft of itDataNfts) {
      const matches = _dataNfts.filter((mnft) => cnft.nonce === mnft.nonce);
      _flags.push(matches.length > 0);
    }

    setFlags(_flags);
    setIsNftLoading(false);
  }

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

  async function viewData(index: number) {
    if (!(index >= 0 && index < itDataNfts.length)) {
      toastError("Data is not loaded");
      return;
    }

    const _owned = flags[index];
    setOwned(_owned);

    if (_owned) {
      setIsFetchingDataMarshal(true);
      openModal();

      const dataNft = itDataNfts[index];

      const messageToBeSigned = await dataNft.getMessageToSign();
      console.log("messageToBeSigned", messageToBeSigned);

      const signedMessage = await signMessage({ message: messageToBeSigned });
      console.log("signedMessage", signedMessage);

      const res = await dataNft.viewData(
        messageToBeSigned,
        signedMessage as any as SignableMessage
      );
      res.data = await (res.data as Blob).text();
      res.data = JSON.parse(res.data);

      console.log("viewData", res);
      console.log(JSON.stringify(res.data, null, 4));

      setData(res.data.data.reverse());
      setIsFetchingDataMarshal(false);
    } else {
      openModal();
    }
  }

  function goToMarketplace(tokenIdentifier: string) {
    window.open(`${MARKETPLACE_DETAILS_PAGE}${tokenIdentifier}`);
  }

  if (isLoading) {
    return <Loader />;
  }

  const getIconForCategory = (category: string) => {
    if (category === "Partnership") {
      return <FaHandshake />;
    } else if (category === "Achievement") {
      return <FaTrophy />;
    } else {
      return <FaCalendarCheck />;
    }
  };

  return (
    <div className="d-flex flex-fill justify-content-center container py-4">
      <div className="row w-100">
        <div className="col-12 mx-auto">
          <h3 className="mt-5 text-center">Trailblazer</h3>
          <h4 className="mt-2 text-center">
            Data NFTs that Unlock this App: {itDataNfts.length}
          </h4>

          <div className="row mt-5">
            {itDataNfts.length > 0 ? (
              itDataNfts.map((dataNft, index) => <DataNftCard
                key={index}
                index={index}
                dataNft={dataNft}
                isLoading={isLoading}
                owned={flags[index]}
                viewData={viewData}
              />)
            ) : (
              <h3 className="text-center text-white">No Data NFTs</h3>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpened}
        onRequestClose={closeModal}
        style={customStyles}
        ariaHideApp={false}
      >
        <div style={{ height: "3rem" }}>
          <div
            style={{
              float: "right",
              cursor: "pointer",
              fontSize: "2rem",
            }}
            onClick={closeModal}
          >
            <IoClose />
          </div>
        </div>
        <ModalHeader>
          <h4 className="text-center font-title font-weight-bold">
            Itheum Trailblazer
          </h4>
        </ModalHeader>
        <ModalBody>
          {!owned ? (
            <div className="d-flex flex-column align-items-center justify-content-center">
              <img
                src={imgBlurChart}
                style={{ width: "90%", height: "auto" }}
              />
              <h4 className="mt-3 font-title">You do not own this Data NFT</h4>
              <h6>
                (Buy the Data NFT from marketplace if you want to see data)
              </h6>
            </div>
          ) : isFetchingDataMarshal || !data ? (
            <div
              className="d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: "24rem",
                maxWidth: "100%",
                minHeight: "40rem",
                maxHeight: "80vh",
              }}
            >
              <Loader />
            </div>
          ) : (
            <div>
              <VerticalTimeline>
                {data?.map((_dataItem: any, _index: any) => {
                  return (
                    <VerticalTimelineElement
                      key={_index}
                      icon={getIconForCategory(_dataItem.category)}
                    >
                      <h2>
                        {_dataItem.category} -{" "}
                        {new Date(_dataItem.date).toUTCString()}
                      </h2>
                      <h3>{_dataItem.title}</h3>
                      <a href={_dataItem.link} target="_blank">
                        <h6>See more...</h6>
                      </a>
                    </VerticalTimelineElement>
                  );
                })}
              </VerticalTimeline>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};
