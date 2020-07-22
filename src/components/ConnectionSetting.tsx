import React, { useState, useEffect } from "react";
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonButton,
  IonAlert,
  IonLoading,
} from "@ionic/react";
import { Plugins } from "@capacitor/core";
import { AppSettings } from "../AppSettings"

const { Storage } = Plugins;

const ConnectionSetting: React.FC<{
  onChangeIsConnect: (imei: string, imsi: string,  mode: string, rpiDestination: string) => void;
}> = (props) => {
  const [rpiIP, setRPiIP] = useState<string>(AppSettings.RPI_IP);
  const [rpiPort, setRPiPort] = useState<number>(AppSettings.RPI_PORT);
  const [mode, setMode] = useState<string>(AppSettings.MODE);
  const [band, setBand] = useState<string>(AppSettings.BAND);
  const [errorConnection, setErrorConnection] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect( () => {
    loadSetting();
  }, []);

  const loadSetting = async () => {
    const mode = await Storage.get({ key: 'mode' });
    if( mode.value ){
      const band = await Storage.get({ key: 'band' });
      const ip = await Storage.get({ key: 'rpiIP' });
      const port = await Storage.get({ key: 'rpiPort' });
      setMode( mode.value );
      setBand( band.value! );
      setRPiIP( ip.value! );
      setRPiPort( +port.value! );
    }
  };

  const ipPortInput = () => {
    if (
      !rpiIP ||
      !rpiPort ||
      !validateIPAddress(rpiIP) ||
      +rpiPort <= 0 ||
      +rpiPort >= 65535
    ) {
      setErrorConnection("Invalid IP or Port");
      return true;
    }

    return false;
  };

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
    if ( ipPortInput() ) return ;
    const uri = ("http://" + rpiIP + ":" + rpiPort + "/connectBase?mode=" + mode + "&band=" + band )
    setLoading(true);
    const result = await fetch(uri)
      .then( (response) => response.json() )
      .then( (data) => { return data; })
    setLoading(false);
    if( result[0] === "F" ) { setErrorConnection("Cannot connect to Base!"); return ; }
    props.onChangeIsConnect( result[0], result[1], result[2], rpiIP + ":" + rpiPort );
  };

  const saveSetting = async () => {
    await Storage.set({ key: 'mode', value: mode });
    await Storage.set({ key: 'band', value: band });
    await Storage.set({ key: 'rpiIP', value: rpiIP });
    await Storage.set({ key: 'rpiPort', value: rpiPort.toString() });
    rpiConnect();
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
            <IonSegment value={mode} onIonChange={(e) => setMode(e.detail.value!)}>
              <IonSegmentButton value="0">
                <IonLabel>Auto</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="3">
                <IonLabel>NB-IoT</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="2">
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
            <IonSegment value={band} onIonChange={(e) => setBand(e.detail.value!)}>
              <IonSegmentButton value="F">
                <IonLabel>Auto</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="1">
                <IonLabel>900MHz</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="2">
                <IonLabel>1800MHz</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonItem>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="8" className="ion-margin-top">
          <IonLabel>Rasspberry Pi IP</IonLabel>
          <IonItem>
            <IonInput value={rpiIP} onIonChange={(e) => setRPiIP(e.detail.value!)} color={validateIPAddress(rpiIP) ? "success" : "danger"} debounce={500} />
          </IonItem>
        </IonCol>
        <IonCol size="4" className="ion-margin-top">
          <IonLabel>Port</IonLabel>
          <IonItem>
            <IonInput type="number" value={rpiPort} onIonChange={(e) => setRPiPort(+e.detail.value!)} debounce={500} />
          </IonItem>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol className="ion-margin-top">
          <IonButton onClick={rpiConnect} expand="full" size="large">Connect</IonButton>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol className="ion-margin-top">
          <IonButton onClick={saveSetting} expand="full" size="large">Save & Connect</IonButton>
        </IonCol>
      </IonRow>
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
      <IonLoading isOpen={loading} message={'Please Wait...'} backdropDismiss={true}/>
    </IonGrid>
  );
};
export default ConnectionSetting;
