import React, { useState, } from "react";
import {
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonButton,
  IonAlert,
  IonLoading,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { Plugins } from "@capacitor/core";
import { AppSettings } from "../AppSettings"

const { Geolocation, Storage } = Plugins;

const StaticCheck: React.FC<{
  destination: string,
}> = (props) => {
  const [mode, setMode] = useState<string>(AppSettings.MODE);
  const [band, setBand] = useState<string>(AppSettings.BAND);
  const [ rssi, setRSSI ] = useState<string>();
  const [ rssiColor, setRSSIColor ] = useState<string>( "dark" );
  const [ rsrp, setRSRP ] = useState<string>();
  const [ rsrpColor, setRSRPColor ] = useState<string>( "dark" );
  const [ sinr, setSINR ] = useState<string>();
  const [ sinrColor, setSINRColor ] = useState<string>( "dark" );
  const [ rsrq, setRSRQ ] = useState<string>();
  const [ rsrqColor, setRSRQColor ] = useState<string>( "dark" );
  const [ intervalMin, setIntervalMin ] = useState<string>( AppSettings.CHECK_INTERVAL_MIN );
  const [errorConnection, setErrorConnection] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  const signalStrength = async () => {
    setLoading(true);
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );
    const signalStrength = await fetch("http://" + props.destination + "/signalStrength", { signal })
      .then((response) => response.json())
      .then((data) => { return data });
    setRSSI(signalStrength[0]);
    setRSSIColor( AppSettings.getColorRssiRsrp( signalStrength[0]  ) );
    setRSRP(signalStrength[1]);
    setRSRPColor( AppSettings.getColorRssiRsrp( signalStrength[1] ) );
    setSINR(signalStrength[2]);
    setSINRColor( AppSettings.getColorSinr( signalStrength[2] ) );
    setRSRQ(signalStrength[3]);
    setRSRQColor( AppSettings.getColorRsrq( signalStrength[3] ) );
    const position = await Geolocation.getCurrentPosition();
    const dbOption = {
      method: "POST",
      headers: { 'Accept': 'application/json, text/plain, */*', "Content-Type": "application/json" },
      body: JSON.stringify({
        // imei: imei,
        rssi: signalStrength[0],
        rsrp: signalStrength[1],
        sinr: signalStrength[2],
        rsrq: signalStrength[3],
        pcid: signalStrength[4],
        mode: mode,
        latitude: position?.coords.latitude,
        longitude: position?.coords.longitude,
      })
    };

    // const result = await fetch(AppSettings.DB_LOCATION + "/insertdata", dbOption)
    //   .then((response) => response.json())
    //   .then((result) => { return result })
    //   .catch(error => console.log(error));
    // console.log(result);
    
    setLoading(false);
  };

  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  return (
    <IonGrid fixed={ true }>
      <IonRow>
        <IonCol>
          <IonButton onClick={ signalStrength } expand="full">Start Test</IonButton>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol>
          <IonLabel>Interval (Minutes)</IonLabel>
          <IonItem>
            <IonInput type="number" value={ intervalMin } debounce={ 500 } onIonChange={ e => setIntervalMin( e.detail.value! ) } />
          </IonItem>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol>Serving Cell</IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="6">
          <IonCard color={ rssiColor }>
            <IonCardContent>RSSI:{ !rssi? "00": rssi }</IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6">
          <IonCard color={ rsrpColor }>
            <IonCardContent>RSRP:{ !rsrp? "00": rsrp }</IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="6">
          <IonCard color={ sinrColor }>
            <IonCardContent>SINR:{ !sinr? "00": sinr }</IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6">
          <IonCard color={ rsrqColor }>
            <IonCardContent>RSRQ:{ !rsrq? "00": rsrq }</IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol>Neighbor 1st Cell</IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="6">
          <IonCard color={ rssiColor }>
            <IonCardContent>RSSI:{ !rssi? "00": rssi }</IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6">
          <IonCard color={ rsrpColor }>
            <IonCardContent>RSRP:{ !rsrp? "00": rsrp }</IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="6">
          <IonCard color={ sinrColor }>
            <IonCardContent>SINR:{ !sinr? "00": sinr }</IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6">
          <IonCard color={ rsrqColor }>
            <IonCardContent>RSRQ:{ !rsrq? "00": rsrq }</IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol>Neighbor 2nd Cell</IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="6">
          <IonCard color={ rssiColor }>
            <IonCardContent>RSSI:{ !rssi? "00": rssi }</IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6">
          <IonCard color={ rsrpColor }>
            <IonCardContent>RSRP:{ !rsrp? "00": rsrp }</IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="6">
          <IonCard color={ sinrColor }>
            <IonCardContent>SINR:{ !sinr? "00": sinr }</IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6">
          <IonCard color={ rsrqColor }>
            <IonCardContent>RSRQ:{ !rsrq? "00": rsrq }</IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
      <IonLoading isOpen={loading} message={'Please Wait...'} backdropDismiss={true}/>
    </IonGrid>
  );
};
export default StaticCheck;
