import React, { useState } from "react";
import { 
    IonPage, 
    IonHeader, 
    IonToolbar, 
    IonTitle,
    IonContent,
    IonAlert,
    IonSelect,
    IonSelectOption,
    IonCard, 
} from "@ionic/react";
import MapInterface from "../components/MapInterface";

const MapInfo: React.FC = () => {

  const [ error, setError ] = useState<string>();
  const [ showValue, setShowValue ] = useState< "scRSSI" | "scRSRP" | "scSINR" | "scRSRQ" >("scRSSI");

  const clearError = () => {
    setError("")
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <MapInterface showValue={showValue} />
        <IonCard>
          <IonSelect value={showValue} interface="action-sheet" onIonChange={ e => setShowValue(e.detail.value) }>
            <IonSelectOption value="scRSSI">RSSI</IonSelectOption>
            <IonSelectOption value="scRSRP">RSRP</IonSelectOption>
            <IonSelectOption value="scSINR">SINR</IonSelectOption>
            <IonSelectOption value="scRSRQ">RSRQ</IonSelectOption>
          </IonSelect>
        </IonCard>
      </IonContent>
      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Okay", handler: clearError}]} />
    </IonPage>
  );
};

export default MapInfo;