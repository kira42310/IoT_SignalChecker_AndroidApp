import React from "react";
import { 
    IonPage, 
    IonHeader, 
    IonToolbar, 
    IonTitle,
    IonContent, 
} from "@ionic/react";
import MapInterface from "../components/MapInterface";


const MapInfo: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <MapInterface/>
      </IonContent>
    </IonPage>
  );
};

export default MapInfo;