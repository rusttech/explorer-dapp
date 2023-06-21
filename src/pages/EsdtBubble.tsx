import React, { useEffect, useRef, useState } from "react";
import { DataNft } from "@itheum/sdk-mx-data-nft";
import { SignableMessage } from "@multiversx/sdk-core/out";
import { signMessage } from "@multiversx/sdk-dapp/utils/account";
import BigNumber from "bignumber.js";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { pointRadial } from "d3";
import { ModalBody, Table } from "react-bootstrap";
import ModalHeader from "react-bootstrap/esm/ModalHeader";
import { Bubble, getDatasetAtEvent } from "react-chartjs-2";
import { IoClose } from "react-icons/io5";
import Modal from "react-modal";
import imgBlurChart from "assets/img/blur-chart.png";
import { DataNftCard, ElrondAddressLink, Loader } from "components";
import { EB_SHOW_SIZE, ESDT_BUBBLE_NONCES, MAINNET_EXPLORER_ADDRESS } from "config";
import {
  useGetAccount,
  useGetNetworkConfig,
  useGetPendingTransactions,
} from "hooks";
import { modalStyles } from "libs/ui";
import { convertToLocalString, convertWeiToEsdt, shortenAddress, toastError } from "libs/utils";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const maxScaleSize = 800;
const chartOptions = {
  aspectRatio: 1,
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          console.log(ctx);
          return `${shortenAddress(
            ctx.dataset.label
          )} (${ctx.dataset.percent.toFixed(4)}%)`;
        },
      },
    },
  },
  scales: {
    x: {
      max: maxScaleSize,
      min: -maxScaleSize,
      display: false,
    },
    y: {
      max: maxScaleSize,
      min: -maxScaleSize,
      display: false,
    },
  },
};

export const EsdtBubble = () => {
  const {
    network: { explorerAddress },
  } = useGetNetworkConfig();
  const { address } = useGetAccount();
  const { hasPendingTransactions } = useGetPendingTransactions();

  const [dataNfts, setDataNfts] = useState<DataNft[]>([]);
  const [selectedDataNft, setSelectedDataNft] = useState<DataNft>();
  const [flags, setFlags] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFetchingDataMarshal, setIsFetchingDataMarshal] =
    useState<boolean>(true);
  const [owned, setOwned] = useState<boolean>(false);

  const [data, setData] = useState<any>();
  const [dataItems, setDataItems] = useState<any[]>([]);

  const [isModalOpened, setIsModalOpenend] = useState<boolean>(false);
  function openModal() {
    setIsModalOpenend(true);
  }
  function closeModal() {
    setIsModalOpenend(false);
  }

  async function fetchDataNfts() {
    setIsLoading(true);

    const _nfts: DataNft[] = await DataNft.createManyFromApi(
      ESDT_BUBBLE_NONCES
    );
    console.log("ESDT Bubbles NFTs:", _nfts);
    setDataNfts(_nfts);

    setIsLoading(false);
  }

  async function fetchMyNfts() {
    const _dataNfts = await DataNft.ownedByAddress(address);
    console.log("myDataNfts", _dataNfts);

    const _flags = [];
    for (const cnft of dataNfts) {
      const matches = _dataNfts.filter((mnft) => cnft.nonce === mnft.nonce);
      _flags.push(matches.length > 0);
    }
    console.log("_flags", _flags);
    setFlags(_flags);
  }

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

  async function viewData(index: number) {
    if (!(index >= 0 && index < dataNfts.length)) {
      toastError("Data is not loaded");
      return;
    }

    const _owned = flags[index];
    setOwned(_owned);

    if (_owned) {
      setIsFetchingDataMarshal(true);
      openModal();

      const dataNft = dataNfts[index];
      setSelectedDataNft(dataNft);
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

      processData(res.data);

      setIsFetchingDataMarshal(false);
    } else {
      openModal();
    }
  }

  function processData(rawData: any[]) {
    let sum = new BigNumber(0);
    rawData.forEach((row) => (sum = sum.plus(row["balance"])));

    const accounts = rawData.map((row) => {
      const percent = new BigNumber(row["balance"]).div(sum).toNumber() * 100;
      let backgroundColor = "#f0f";
      if (percent > 1) {
        backgroundColor = "#f00";
      } else if (percent > 0.1) {
        backgroundColor = "#0f0";
      } else if (percent > 0.01) {
        backgroundColor = "#00f";
      }

      return {
        address: row["address"],
        percent,
        backgroundColor,
        balance: row["balance"],
      };
    });

    setDataItems(accounts);

    const _data = {
      datasets: accounts.map((acc, i) => {
        // const angle = i < 10 ? 0.5 * i : 0.4 * i;
        const angle = 0.4 * i;
        // const distance = (60 + Math.pow(i * 500, 0.45) * 2);
        const distance =
          100 + Math.pow(i * 2000, 0.45) + Math.pow(1.01, i) * 20;
        const pos = pointRadial(angle, distance);
        return {
          label: acc.address,
          data: [
            {
              x: pos[0],
              y: pos[1],
              r: Math.pow(acc.percent * 1500, 0.16) * 2,
            },
          ],
          backgroundColor: acc.backgroundColor,
          percent: acc.percent,
        };
      }),
    };
    setData(_data);
  }

  const chartRef = useRef<ChartJS<"bubble">>();
  function onChartClick(event: any) {
    if (!chartRef.current) return;
    const datasetIndex = getDatasetAtEvent(chartRef.current, event)[0].datasetIndex;
    window.open(`${MAINNET_EXPLORER_ADDRESS}/accounts/${dataItems[datasetIndex].address}/tokens`, '_blank')?.focus();
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="d-flex flex-fill justify-content-center container py-4">
      <div className="row w-100">
        <div className="col-12 mx-auto">
          <h4 className="mt-5 text-center">
            ESDT Bubbles NFTs: {dataNfts.length}
          </h4>

          <div className="row mt-5">
            {dataNfts.length > 0 ? (
              dataNfts.map((dataNft, index) => <DataNftCard
                key={index}
                index={index}
                dataNft={dataNft}
                isLoading={isLoading}
                owned={flags[index]}
                viewData={viewData}
              />)
            ) : (
              <h3 className="text-center text-white">No DataNFT</h3>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpened}
        onRequestClose={closeModal}
        style={modalStyles}
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
          <h4 className="text-center font-title font-weight-bold">View Data</h4>
        </ModalHeader>
        <ModalBody
          style={{
            minWidth: "26rem",
            minHeight: "36rem",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          {!owned ? (
            <div
              className="d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: "24rem",
                maxWidth: "50vw",
                minHeight: "40rem",
                maxHeight: "80vh",
              }}
            >
              <img
                src={imgBlurChart}
                style={{ width: "24rem", height: "auto" }}
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
                minHeight: "40rem",
              }}
            >
              <Loader />
            </div>
          ) : (
            <>
              <h5 className="mt-3 mb-4 text-center font-title font-weight-bold">
                {selectedDataNft?.title}
              </h5>
              <div className="text-center font-title font-weight-bold">
                (TOP {data.datasets.length} Accounts)
              </div>

              <div>
                <Bubble
                  options={chartOptions}
                  data={data}
                  // style={{ marginLeft: 'auto', marginRight: 'auto' }}
                  ref={chartRef}
                  onClick={onChartClick}
                />
              </div>
              <div className="d-flex justify-content-center">
                <div className="d-flex flex-row align-items-center">
                  <div className="d-flex justify-content-center align-items-center p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.25rem",
                      }}
                    >
                      <circle cx=".5rem" cy=".5rem" r=".5rem" fill="#f00" />
                    </svg>
                    <span>{"> 1%"}</span>
                  </div>
                  <div className="d-flex justify-content-center align-items-center p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.25rem",
                      }}
                    >
                      <circle cx=".5rem" cy=".5rem" r=".5rem" fill="#0f0" />
                    </svg>
                    <span>{"> 0.1%"}</span>
                  </div>
                  <div className="d-flex justify-content-center align-items-center p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.25rem",
                      }}
                    >
                      <circle cx=".5rem" cy=".5rem" r=".5rem" fill="#00f" />
                    </svg>
                    <span>{"> 0.01%"}</span>
                  </div>
                  <div className="d-flex justify-content-center align-items-center p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.25rem",
                      }}
                    >
                      <circle cx=".5rem" cy=".5rem" r=".5rem" fill="#f0f" />
                    </svg>
                    <span>{"< 0.01%"}</span>
                  </div>
                </div>
              </div>

              <Table striped responsive className="mt-3">
                <thead>
                  <tr className="">
                    <th>#</th>
                    <th>Address</th>
                    <th>Balance</th>
                    <th>Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {dataItems
                    .slice(0, EB_SHOW_SIZE)
                    .map((row: any, index: number) => (
                      <tr key={`e-b-p-${index}`}>
                        <td>{index + 1}</td>
                        <td>
                          <ElrondAddressLink
                            explorerAddress={explorerAddress}
                            address={row.address}
                            precision={9}
                          />
                        </td>
                        <td>{convertToLocalString(convertWeiToEsdt(row.balance))} EGLD</td>
                        <td>{row.percent.toFixed(4)}%</td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};
