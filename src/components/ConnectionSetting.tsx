import React, { useState } from "react";
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonButton,
  IonAlert,
} from "@ionic/react";

const ConnectionSetting: React.FC<{
  defaultIP: string;
  defaultPort: number;
  defaultCellular: "NB-IoT" | "Cat-M1";
  defaultGSM: "900MHz" | "1800MHz";
  defaultLTE: string;
  onChangeIsConnect: (isConnect: boolean, rpiDestination: string) => void;
}> = (props) => {
  const [rpiIP, setRPiIP] = useState<string>(props.defaultIP);
  const [rpiPort, setRPiPort] = useState<number>(props.defaultPort);
  const [cellular, setCellular] = useState<string>(props.defaultCellular);
  const [gsm, setGSM] = useState<string>(props.defaultGSM);
  const [lte, setLTE] = useState(props.defaultLTE);
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
        <IonCol>
          <IonItem>
            <IonLabel position="fixed">Cellular mode</IonLabel>
            <IonSegment value={cellular} onIonChange={(e) => setCellular(e.detail.value!)}>
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
        <IonCol>
          <IonItem>
            <IonLabel position="fixed">GSM Band</IonLabel>
            <IonSegment value={gsm} onIonChange={(e) => setGSM(e.detail.value!)}>
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
      <IonRow>
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
      </IonRow>
      <IonRow>
        <IonCol size="8">
          <IonItem>
            <IonLabel position="floating">RPi IP:</IonLabel>
            <IonInput value={rpiIP} onIonChange={(e) => setRPiIP(e.detail.value!)} color={validateIPAddress(rpiIP) ? "success" : "danger"}></IonInput>
          </IonItem>
        </IonCol>
        <IonCol size="4">
          <IonItem>
            <IonLabel position="floating">Port:</IonLabel>
            <IonInput type="number" value={rpiPort} onIonChange={(e) => setRPiPort(+e.detail.value!)}></IonInput>
          </IonItem>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol>
          <IonButton onClick={rpiConnect}>Connect</IonButton>
        </IonCol>
        {/* <IonCol>{rpiIP + "," + connectionStatus}</IonCol> */}
      </IonRow>
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
    </IonGrid>
  );
};
export default ConnectionSetting;
