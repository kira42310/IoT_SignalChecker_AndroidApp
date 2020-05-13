import React, { useState, useEffect } from "react";
import {
  IonApp,
  IonHeader,
  IonContent,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonButton,
  IonAlert,
} from "@ionic/react";
import { useCurrentPosition, } from '@ionic/react-hooks/geolocation'
import ConnectionSetting from "./components/ConnectionSetting";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";

const App: React.FC = () => {
  const defaultRPiIP: string = "192.168.1.11";
  const defaultPort: number = 32123;
  const defaultCellular: "NB-IoT" | "Cat-M1" = "NB-IoT";
  const defaultGSM: "900MHz" | "1800MHz" = "900MHz";
  const defaultLTE: string = "B8";
  // const defaultGPSHighAccuracy: boolean = false;
  const dbLocation = "http://158.108.38.94:32124";

  const [errorConnection, setErrorConnection] = useState<string>();
  const [isConnect, setIsConnect] = useState<boolean>(false);
  const [connectionText, setConnectionText] = useState<"Connect" | "Not Connect">("Not Connect");
  const [rpiDestination, setRPiDestination] = useState<string>();
  const { currentPosition, getPosition } = useCurrentPosition();
  const [immi, setIMMI] = useState<string>();
  const [rssi, setRSSI] = useState<string>();
  const [rsrp, setRSRP] = useState<string>();
  const [sinq, setSINQ] = useState<string>();
  const [rsrq, setRSRQ] = useState<string>();

  const signalStrength = async () => {
    const signalStrength = await fetch("http://" + rpiDestination + "/")
      .then((response) => response.json())
      .then((data) => { return data });
    getPosition({ timeout: 30000 });
    setIMMI(signalStrength[0]);
    setRSSI(signalStrength[1]);
    setRSRP(signalStrength[2]);
    setSINQ(signalStrength[3]);
    setRSRQ(signalStrength[4]);
    const dbOption = {
      method: "POST",
      headers: { 'Accept': 'application/json, text/plain, */*', "Content-Type": "application/json" },
      body: JSON.stringify({
        immi: signalStrength[0],
        rssi: signalStrength[1],
        rsrp: signalStrength[2],
        sinq: signalStrength[3],
        rsrq: signalStrength[4],
        pci: "xxx",
        cellular: "NB-IoT",
        gsm: "900MHz",
        lte: "B8",
        latitude: currentPosition?.coords.latitude,
        longitude: currentPosition?.coords.longitude,
      })
    };


    const result = await fetch(dbLocation + "/insertdata", dbOption)
      .then((response) => response.json())
      .then((result) => { return result })
      .catch(error => console.log(error));
    console.log(result);
  };

  const changeIsConnect = (connection: boolean, desination: string) => {
    setIsConnect(connection);
    setRPiDestination(desination);
  };

  useEffect(() => {
    if (isConnect) setConnectionText("Connect")
    else setConnectionText("Not Connect")
  }, [isConnect]);

  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  return (
    <React.Fragment>
      <IonApp>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>TrueIoT</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <ConnectionSetting
            defaultIP={defaultRPiIP}
            defaultPort={defaultPort}
            defaultCellular={defaultCellular}
            defaultGSM={defaultGSM}
            defaultLTE={defaultLTE}
            onChangeIsConnect={changeIsConnect}
          />
          <IonGrid>
            <IonRow>
              <IonCol size="2">
                <IonLabel>Status:</IonLabel>
              </IonCol>
              <IonCol>
                <IonLabel color={isConnect ? 'success' : 'danger'}>{connectionText}</IonLabel>
                {/* {", " + isConnect} */}
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
              <IonCol size="2"><IonLabel>SINQ:</IonLabel></IonCol>
              <IonCol><IonLabel>{sinq}</IonLabel></IonCol>
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
      </IonApp>
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]}
      />
    </React.Fragment>
  );
};

export default App;
