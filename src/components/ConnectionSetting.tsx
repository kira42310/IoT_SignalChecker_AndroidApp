import React, { useState } from "react";
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  // IonSelect,
  // IonSelectOption,
  IonInput,
  IonButton,
  IonAlert,
} from "@ionic/react";
import { AppSettings } from "../AppSettings"

const ConnectionSetting: React.FC<{
  onChangeIsConnect: (isConnect: boolean, rpiDestination: string) => void;
}> = (props) => {
  const [rpiIP, setRPiIP] = useState<string>(AppSettings.RPI_IP);
  const [rpiPort, setRPiPort] = useState<number>(AppSettings.RPI_PORT);
  const [cellular, setCellular] = useState<string>(AppSettings.MODE);
  const [gsm, setGSM] = useState<string>(AppSettings.BAND);
  const [lte, setLTE] = useState(AppSettings.LTE);
  const [errorConnection, setErrorConnection] = useState<string>();
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false);

  // const ipPortInput = () => {
  //   const ip = ipInputRef.current!.value as string;
  //   const port = portInputRef.current!.value as number;

  //   if (
  //     !ip ||
  //     !port ||
  //     //!validateIPAddress(ip) ||
  //     +rpiPort <= 0 ||
  //     +rpiPort >= 65535
  //   ) {
  //     setErrorConnection("Invalid IP or Port");
  //     return true;
  //   }

  //   setRPiIP(ip);
  //   setRPiPort(port);
  //   return false;
  // };

  const validateIPAddress = (ip: string) => {
    if (
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ip
      )
    ) {
      return true;
    }
    return false;
  };

  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  const rpiConnect = async () => {
    //if (ipPortInput()) return;
    const uri = ("http://" + rpiIP + ":" + rpiPort + "/connectBase?cellular=" + cellular + "&gsm=" + gsm + "&lte=" + lte)
    fetch(uri)
      .then((response) => response.json())
      .then((data) => { setConnectionStatus(data); props.onChangeIsConnect(data, rpiIP + ":" + rpiPort); });
  };

  return (
    <IonGrid>
      <IonRow>
        <IonCol className="ion-margin-top">
          <IonLabel>Mode</IonLabel>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol>
          <IonItem>
            <IonSegment value={cellular} onIonChange={(e) => setCellular(e.detail.value!)}>
              <IonSegmentButton value="AUTO">
                <IonLabel>Auto</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="NB-IoT">
                <IonLabel>NB-IoT</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="Cat-M1">
                <IonLabel>Cat-M1</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonItem>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol className="ion-margin-top">
          <IonLabel>Band</IonLabel>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol>
          <IonItem>
            <IonSegment value={gsm} onIonChange={(e) => setGSM(e.detail.value!)}>
              <IonSegmentButton value="AUTO">
                <IonLabel>Auto</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="900MHz">
                <IonLabel>900MHz</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="1800MHz">
                <IonLabel>1800MHz</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonItem>
        </IonCol>
      </IonRow>
      {/* <IonRow>
        <IonCol>
          <IonItem>
            <IonLabel>LTE Band</IonLabel>
            <IonSelect interface="popover" value={lte} onIonChange={(e) => setLTE(e.detail.value!)}>
              <IonSelectOption value="B5">B5</IonSelectOption>
              <IonSelectOption value="B8">B8</IonSelectOption>
              <IonSelectOption value="B12">B12</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonCol>
      </IonRow> */}
      <IonRow>
        <IonCol size="8" className="ion-margin-top">
          <IonLabel>Rasspberry Pi IP</IonLabel>
          <IonItem>
            {/* <IonLabel position="floating">RPi IP:</IonLabel> */}
            <IonInput value={rpiIP} onIonChange={(e) => setRPiIP(e.detail.value!)} color={validateIPAddress(rpiIP) ? "success" : "danger"}></IonInput>
          </IonItem>
        </IonCol>
        <IonCol size="4" className="ion-margin-top">
          <IonLabel>Port</IonLabel>
          <IonItem>
            {/* <IonLabel position="floating">Port:</IonLabel> */}
            <IonInput type="number" value={rpiPort} onIonChange={(e) => setRPiPort(+e.detail.value!)}></IonInput>
          </IonItem>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol className="ion-margin-top">
          <IonButton onClick={rpiConnect} expand="full" size="large">Connect</IonButton>
        </IonCol>
        {/* <IonCol>{rpiIP + "," + connectionStatus}</IonCol> */}
      </IonRow>
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
    </IonGrid>
  );
};
export default ConnectionSetting;
