import React from "react";
import { 
    IonPage, 
    IonHeader, 
    IonToolbar, 
    IonTitle,
    IonContent, 
} from "@ionic/react";
import MapInterface from "../components/MapInterface";
import { AppSettings } from "../AppSettings";


const MapInfo: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
      {/* <script async defer src={"https://maps.google.com/maps/api/js?v=3.exp&key="+AppSettings.GOOGLE_MAP_API+"&callback=initMap"} type="text/javascript"/> */}
      {/* <script src={"https://maps.google.com/maps/api/js?key="+AppSettings.GOOGLE_MAP_API+"&callback=initMap"} type="text/javascript"/> */}
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