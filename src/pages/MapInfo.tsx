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
    IonItem,
    IonInput,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    useIonViewWillEnter, 
} from "@ionic/react";
import { Plugins } from "@capacitor/core";
import { enterOutline } from "ionicons/icons";
import MapInterface from "../components/MapInterface";

const { Network } = Plugins;

const MapInfo: React.FC = () => {

  const [ error, setError ] = useState<string>();
  const [ address, setAddress ] = useState<string>("");
  const [ newCenter, setNewCenter ] = useState<string>("");
  const [ showValue, setShowValue ] = useState< "scRSSI" | "scRSRP" | "scSINR" | "scRSRQ" >("scRSSI");
  const [ networkStatus, setNetworkStatus ] = useState<boolean>( false );

  useIonViewWillEnter( () => {
    getNetworkStatus();
  });

  const getNetworkStatus = async () => {
    const s = await Network.getStatus();
    setNetworkStatus( s.connected );
  };

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
        <IonGrid>
          <IonRow>
            <IonCol size="10">
              <IonItem>
                <IonInput debounce={ 500 } onIonChange={ e => setAddress( e.detail.value! ) } clearInput />
              </IonItem>
            </IonCol>
            <IonCol size="2">
              <IonButton onClick={ () => { setNewCenter( address ) }} >
                <IonIcon slot="icon-only" icon={ enterOutline } />
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
        {/* <MapInterface showValue={showValue} address={ newCenter } />: */}
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
      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Okay", handler: clearError}]} />
    </IonPage>
  );
};

export default MapInfo;