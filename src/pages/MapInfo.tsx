import React, { useEffect, useState } from "react";
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
import { availableFeatures } from "@ionic/react-hooks/geolocation"
import MapInterface from "../components/MapInterface";

const MapInfo: React.FC = () => {

  const [ error, setError ] = useState<string>();
  const [ showValue, setShowValue ] = useState< "rssi" | "rsrp" | "sinr" | "rsrq" >("rssi");

  useEffect( () => {
    if(!availableFeatures.watchPosition){
      setError("Geolocation service is not available.")
    };
  },[]);

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
            <IonSelectOption value="rssi">RSSI</IonSelectOption>
            <IonSelectOption value="rsrp">RSRP</IonSelectOption>
            <IonSelectOption value="sinr">SINR</IonSelectOption>
            <IonSelectOption value="rsrq">RSRQ</IonSelectOption>
          </IonSelect>
        </IonCard>
      </IonContent>
      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Okay", handler: clearError}]} />
    </IonPage>
  );
};

export default MapInfo;