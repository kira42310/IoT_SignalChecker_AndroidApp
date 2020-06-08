import React, { useEffect, useState } from "react";
import { 
    IonPage, 
    IonHeader, 
    IonToolbar, 
    IonTitle,
    IonContent,
    IonAlert, 
} from "@ionic/react";
import { availableFeatures } from "@ionic/react-hooks/geolocation"
import MapInterface from "../components/MapInterface";

const MapInfo: React.FC = () => {

  const [ error, setError ] = useState<string>();

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
        <MapInterface />
      </IonContent>
      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Okay", handler: clearError}]} />
    </IonPage>
  );
};

export default MapInfo;