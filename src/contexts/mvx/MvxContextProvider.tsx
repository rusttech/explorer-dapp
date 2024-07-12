import { FC, ReactNode } from "react";
import { NotificationModal } from "@multiversx/sdk-dapp/UI/NotificationModal/NotificationModal";
import { SignTransactionsModals } from "@multiversx/sdk-dapp/UI/SignTransactionsModals/SignTransactionsModals";
import { TransactionsToastList } from "@multiversx/sdk-dapp/UI/TransactionsToastList/TransactionsToastList";
import { DappProvider } from "@multiversx/sdk-dapp/wrappers/DappProvider/DappProvider";
import { ELROND_NETWORK, apiTimeout, walletConnectV2ProjectId } from "config";

export const MvxContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <>
      <DappProvider
        environment={ELROND_NETWORK}
        customNetworkConfig={{
          name: "itheum-explorer",
          apiTimeout,
          walletConnectV2ProjectId,
        }}
        dappConfig={{
          shouldUseWebViewProvider: true,
        }}>
        <TransactionsToastList />
        <NotificationModal />
        <SignTransactionsModals className="custom-class-for-modals" />
        {children}
      </DappProvider>
    </>
  );
};
