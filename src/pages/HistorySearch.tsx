import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent, 
} from "@ionic/react";
import HistoryCard from "../components/HistoryCard";

const HistorySearch: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>History</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <HistoryCard />
      </IonContent>
    </IonPage>
  );
};

export default HistorySearch;