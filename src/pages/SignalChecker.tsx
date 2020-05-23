import React, { useState, } from "react";
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonAlert,
  IonButton,
  IonModal,
  IonButtons,
} from "@ionic/react";
import { useCurrentPosition } from "@ionic/react-hooks/geolocation";
import ConnectionSetting from "../components/ConnectionSetting";
import { AppSettings } from "../AppSettings";

const SignalChecker: React.FC = () => {

  const [ isConnect, setIsConnect ] = useState<boolean>(false);
  const [ rpiDestination, setRPiDestination ] = useState<string>();
  const [ errorConnection, setErrorConnection ] = useState<string>();
  const [ immi, setIMMI ] = useState<string>();
  const [ rssi, setRSSI ] = useState<string>();
  const [ rsrp, setRSRP ] = useState<string>();
  const [ sinr, setSINR ] = useState<string>();
  const [ rsrq, setRSRQ ] = useState<string>();
  const { currentPosition, getPosition } = useCurrentPosition();
  const [ connectionWindow, setConnectionWindow ] = useState<boolean>(false);

  const signalStrength = async () => {
    const signalStrength = await fetch("http://" + rpiDestination + "/")
      .then((response) => response.json())
      .then((data) => { return data });
    getPosition({ enableHighAccuracy:AppSettings.GPS_HIGH_ACCURACY, timeout: 30000 });
    setIMMI(signalStrength[0]);
    setRSSI(signalStrength[1]);
    setRSRP(signalStrength[2]);
    setSINR(signalStrength[3]);
    setRSRQ(signalStrength[4]);
    const dbOption = {
      method: "POST",
      headers: { 'Accept': 'application/json, text/plain, */*', "Content-Type": "application/json" },
      body: JSON.stringify({
        immi: signalStrength[0],
        rssi: signalStrength[1],
        rsrp: signalStrength[2],
        sinr: signalStrength[3],
        rsrq: signalStrength[4],
        pcid: signalStrength[5],
        cellular: "NB-IoT",
        gsm: "900MHz",
        lte: "B8",
        latitude: currentPosition?.coords.latitude,
        longitude: currentPosition?.coords.longitude,
      })
    };

    const result = await fetch(AppSettings.DB_LOCATION + "/insertdata", dbOption)
      .then((response) => response.json())
      .then((result) => { return result })
      .catch(error => console.log(error));
    console.log(result);
  };

  const changeIsConnect = ( connection: boolean, destination: string ) => {
    setIsConnect(connection);
    setRPiDestination(destination);
  };

  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Signal Checker</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setConnectionWindow(true) } expand="full">Signal and RPi Settings</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="2">
              <IonLabel>Status:</IonLabel>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="2"><IonLabel>IMMI:</IonLabel></IonCol>
            <IonCol><IonLabel>{immi}</IonLabel></IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={signalStrength} disabled={isConnect ? false : true}>test</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="2"><IonLabel>RSSI:</IonLabel></IonCol>
            <IonCol><IonLabel>{rssi}</IonLabel></IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="2"><IonLabel>RSRP:</IonLabel></IonCol>
            <IonCol><IonLabel>{rsrp}</IonLabel></IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="2"><IonLabel>SINR:</IonLabel></IonCol>
            <IonCol><IonLabel>{sinr}</IonLabel></IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="2"><IonLabel>RSRQ:</IonLabel></IonCol>
            <IonCol><IonLabel>{rsrq}</IonLabel></IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="6">
              Latitude:
              <IonLabel>{isConnect && currentPosition?.coords.latitude}</IonLabel>
            </IonCol>
            <IonCol size="6">
              Longtitude:
              <IonLabel>{isConnect && currentPosition?.coords.longitude}</IonLabel>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
      <IonModal isOpen={connectionWindow}>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Sigal and RPi Settings</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={ () => setConnectionWindow(false) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <ConnectionSetting onChangeIsConnect={changeIsConnect}/>
      </IonModal>
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
    </IonPage>
  );
};

export default SignalChecker;