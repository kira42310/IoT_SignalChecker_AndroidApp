import React, { useState, useEffect, useRef } from "react";
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
    useIonViewWillEnter,
    IonSearchbar, 
} from "@ionic/react";
import { Plugins } from "@capacitor/core";
import MapInterface from "../components/MapInterface";

const { Network } = Plugins;

const MapInfo: React.FC = () => {

  const [ error, setError ] = useState<string>();
  const address = useRef<string>();
  const [ newCenter, setNewCenter ] = useState<string>("");
  const [ showValue, setShowValue ] = useState< "scRSSI" | "scRSRP" | "scSINR" | "scRSRQ" >("scRSSI");
  const [ networkStatus, setNetworkStatus ] = useState<boolean>( false );

  // function for set event to enter key use with search bar.
  useEffect( () => {
    let searchbarInput = document.getElementById( 'searchlocation' );
    searchbarInput?.addEventListener( 'keyup', function(event) {
      if( event.keyCode === 13 ){
        event.preventDefault();
        setNewCenter( address.current! );
      }
    });
  },[]);

  // ion life cycle before load into page, check network available if not google map won't load properly.
  useIonViewWillEnter( () => {
    getNetworkStatus();
  });

  // function for check network available.
  const getNetworkStatus = async () => {
    const s = await Network.getStatus();
    setNetworkStatus( s.connected );
  };

  // function for clear alert message.
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
        <IonToolbar>
          <IonSearchbar id='searchlocation' 
            debounce={ 500 } 
            onIonChange={ e => address.current = e.detail.value! } 
          />
        </IonToolbar>
        { networkStatus?
          <MapInterface showValue={showValue} address={ newCenter } />:
          <p>No internet access!</p>
        }
        <IonCard>
          <IonSelect value={showValue} interface="action-sheet" onIonChange={ e => setShowValue(e.detail.value) }>
            <IonSelectOption value="scRSSI">RSSI</IonSelectOption>
            <IonSelectOption value="scRSRP">RSRP</IonSelectOption>
            <IonSelectOption value="scSINR">SINR</IonSelectOption>
            <IonSelectOption value="scRSRQ">RSRQ</IonSelectOption>
          </IonSelect>
        </IonCard>
      </IonContent>
      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Ok", handler: clearError}]} />
    </IonPage>
  );
};

export default MapInfo;