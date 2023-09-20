import React, { useState } from "react";
import { FaCalendarCheck, FaChartBar, FaChessKnight, FaFlagCheckered, FaHandshake, FaMoneyBillAlt, FaShopify, FaShoppingCart, FaTrophy } from "react-icons/fa";
import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import { Loader } from "components";
import { Button } from "../libComponents/Button";
import { Modal } from "./Modal/Modal";

const customStyles = {
  overlay: {
    backgroundColor: "var(--light-20) !important",
    backdropFilter: "blur(10px)",
  },
};

export const TrailBlazerModal = ({ owned, isFetchingDataMarshal, data }: { owned: boolean; isFetchingDataMarshal?: boolean; data: any }) => {
  const getIconForCategory = (dataItem: any) => {
    switch (dataItem.category) {
      case "Partnership":
        return <FaHandshake />;
        break;
      case "Achievement":
        return <FaTrophy />;
        break;
      case "Offer":
        return <FaMoneyBillAlt />;
        break;
      case "Quest":
        return <FaChessKnight />;
        break;
      case "Leaderboard":
        return <FaChartBar />;
        break;
      default:
        return <FaCalendarCheck />;
        break;
    }
  };

  const getTileForCategory = (dataItem: any) => {
    let tileCode: any = null;

    switch (dataItem.category) {
      case "Offer":
        tileCode = (
          <div className="base-tile offer">
            <div className="header">
              <div className="title">Congratulations! You've unlocked a special offer.</div>
            </div>
            <div className="body">
              <div className="icon">
                <FaShoppingCart />
              </div>
              <div className="item">{dataItem.title}</div>
              <a className="bg-yellow-300 px-1.5 py-2 rounded-lg" href={dataItem.link} target="_blank">
                <div>Grab your offer now!</div>
              </a>
            </div>
            <div className="footer">
              <div className="added">Added on: {new Date(dataItem.date).toDateString()}</div>
              <div className="platform">
                Claimable On:{" "}
                <span className="icon">
                  <FaShopify />
                </span>
              </div>
            </div>
          </div>
        );
        break;
      case "Quest":
        tileCode = (
          <div className="base-tile quest">
            <div className="header">
              <div className="title">Psst! A secret quest is underway.</div>
            </div>
            <div className="body">
              <div className="icon">
                <FaFlagCheckered />
              </div>
              <div className="item">{dataItem.title}</div>
              <Modal openTrigger={<Button className="bg-[#ff7201] rounded-lg">Launch Quest</Button>}>
                <div className="bg-background p-5 rounded shadow-lg">
                  <iframe title="Modal Content" src={dataItem.link} className="w-full h-[85dvh]" />
                </div>
              </Modal>
            </div>
            <div className="footer">
              <div className="added">Added on: {new Date(dataItem.date).toDateString()}</div>
            </div>
          </div>
        );
        break;
      case "Leaderboard":
        tileCode = (
          <div className="base-tile leaderboard">
            <div className="header">
              <div className="title">Secret Leaderboard</div>
              <div className="sub-title">{dataItem.title}</div>
            </div>
            <div className="body">
              {(normalizeLeaderboardData(dataItem.link).processedSuccess === false && (
                <div className="process-error">{normalizeLeaderboardData(dataItem.link).processMsg}</div>
              )) || (
                <table className="table">
                  <thead className="!text-black">
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Address</th>
                      <th scope="col">Points</th>
                    </tr>
                  </thead>
                  <tbody className="!text-black">
                    {normalizeLeaderboardData(dataItem.link).tableData.map((rowData: any, idx: number) => {
                      return (
                        <tr>
                          <th scope="row">{++idx}</th>
                          <td>{rowData.leaderAddress}</td>
                          <td>{rowData.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="footer">
              <div className="added">Added on: {new Date(dataItem.date).toDateString()}</div>
            </div>
          </div>
        );
        break;
      default:
        tileCode = (
          <div className="news-tile">
            <h2>
              {dataItem.category} - {new Date(dataItem.date).toDateString()}
            </h2>
            <h3>{dataItem.title}</h3>
            <a href={dataItem.link} target="_blank" className="!text-blue-500">
              See more...
            </a>
          </div>
        );
        break;
    }

    return tileCode;
  };

  function normalizeLeaderboardData(rawData: string) {
    const leaderBoard: {
      processedSuccess: boolean;
      tableData: any;
      processMsg: string;
    } = {
      processedSuccess: false,
      tableData: [],
      processMsg: "",
    };

    try {
      const addressPointAry = rawData
        .split(":")
        .map((i: string) => {
          const [leaderAddress, points] = i.split("_");
          return { leaderAddress, points: parseInt(points, 10) };
        })
        .sort(function (x, y) {
          return y.points - x.points; // sort in descending order of points
        });

      leaderBoard.processedSuccess = true;
      leaderBoard.tableData = addressPointAry;
    } catch (e) {
      leaderBoard.processMsg = `ERROR processing leaderBoard. Check console for error details.`;
      console.log("----------- ERROR (S) -----------");
      console.log("Processing leaderBoard data =", rawData);
      console.log("Error =");
      console.error(e);
      console.log("----------- ERROR (E) -----------");
    }

    return leaderBoard;
  }

  return (
    <>
      {!owned ? (
        <div className="flex flex-col items-center justify-center">
          <h4 className="mt-3 font-title">You do not own this Data NFT</h4>
          <h6>(Buy the Data NFT from the marketplace to unlock the data)</h6>
        </div>
      ) : isFetchingDataMarshal || !data ? (
        <div
          className="flex flex-col items-center justify-center"
          style={{
            minWidth: "24rem",
            maxWidth: "100%",
            minHeight: "40rem",
            maxHeight: "80vh",
          }}>
          <div>
            <Loader noText />
            <p className="text-center font-weight-bold">{"Loading..."}</p>
          </div>
        </div>
      ) : (
        <div className="trailblazer-view text-black">
          <VerticalTimeline>
            {data?.map((_dataItem: any, _index: any) => {
              return (
                <VerticalTimelineElement key={_index} icon={getIconForCategory(_dataItem)}>
                  {getTileForCategory(_dataItem)}
                </VerticalTimelineElement>
              );
            })}
          </VerticalTimeline>
        </div>
      )}
    </>
  );
};
