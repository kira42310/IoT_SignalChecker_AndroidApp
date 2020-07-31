import React, { useState, useEffect,} from "react";
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
  useIonViewWillEnter,
  IonDatetime,
} from "@ionic/react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Plugins } from "@capacitor/core";
import { AppSettings } from "../AppSettings"

const { Geolocation, Storage } = Plugins;

const MovingCheck: React.FC<{
  destination: string,
  imei: string,
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
  const [ intervalHour, setIntervalHour ] = useState<string>( AppSettings.CHECK_INTERVAL_HOUR );
  const [ intervalMin, setIntervalMin ] = useState<string>( AppSettings.CHECK_INTERVAL_MIN );
  const [ intervalSec, setIntervalSec ] = useState<string>( AppSettings.CHECK_INTERVAL_SEC );
  const [ mapCenter, setMapCenter ] = useState<google.maps.LatLng>( new google.maps.LatLng( 13.7625293, 100.5655906 ) ); // Default @ True Building
  const [errorConnection, setErrorConnection] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [ startStopBtn, setStartStopBtn ] = useState<boolean>(true);
  const [ markers, setMarkers ] = useState<{
    latitude: number, 
    longitude: number, 
    rssi: number, 
    rsrp: number,
    sinr: number,
    rsrq: number,
  }[]>([]);

  useEffect( () => {
    getLocation();
  },[]);

  const getLocation = async () => {
    const tmp = await Geolocation.getCurrentPosition();
    setMapCenter( new google.maps.LatLng( tmp.coords.latitude, tmp.coords.longitude ));
  };

  const signalTracker = () => {
    let trackerHandler;
    console.log( trackerHandler );
    // if(isTrack) {
      // setIsTrack(false);
      // setEnableBTN(true);
    //   clearInterval(trackerHandler);
    // }
    // else{
      // setIsTrack(true);
      // setEnableBTN(false);
      // trackerHandler = setInterval( () => {signalStrength()}, delay*1000);
      // setTrackHandler(trackerHandler);
    // }
  };

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
    // const dbOption = {
    //   method: "POST",
    //   headers: { 'Accept': 'application/json, text/plain, */*', "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     imei: props.imei,
    //     rssi: signalStrength[0],
    //     rsrp: signalStrength[1],
    //     sinr: signalStrength[2],
    //     rsrq: signalStrength[3],
    //     pcid: signalStrength[4],
    //     mode: mode,
    //     latitude: position?.coords.latitude,
    //     longitude: position?.coords.longitude,
    //   })
    // };
    const tmp = { 
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      rssi: signalStrength[0],
      };
    // setMarkers();
    
    // const result = await fetch(AppSettings.DB_LOCATION + "/insertdata", dbOption)
    //   .then((response) => response.json())
    //   .then((result) => { return result })
    //   .catch(error => console.log(error));
    // console.log(result);
    
    // setLoading(false);
  };

  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  const containerStyle = {
    width: '100%',
    height: '80%',
  }

  return (
    <IonGrid fixed={ true }>
      <IonRow>
        <IonCol>
          <IonButton disabled={ !startStopBtn } onClick={ signalStrength } expand="full">Start Test</IonButton>
        </IonCol>
        <IonCol>
          <IonButton disabled={ startStopBtn }onClick={ signalStrength } expand="full">Stop Test</IonButton>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol>
          <IonItem>
            <IonLabel>Interval [hh:mm:ss]</IonLabel>
            <IonDatetime 
              displayFormat="H:mm:ss" 
              pickerFormat="H:mm:ss" 
              value={ intervalHour + ":" + intervalMin + ":" + intervalSec + "Z" } 
              onIonChange={ e => { 
                // console.log(e.detail.value?.split(":")) 
                const tmp = e.detail.value?.split(":");
                setIntervalHour( tmp![0] );
                setIntervalMin( tmp![1] );
                setIntervalSec( tmp![2] );
              }} />
          </IonItem>
        </IonCol>
      </IonRow>
      <GoogleMap mapContainerStyle={ containerStyle } 
        center={ mapCenter }
        zoom={14}>
        {/* <Marker /> */}
      </GoogleMap>
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
      <IonLoading isOpen={loading} message={'Please Wait...'} backdropDismiss={true}/>
    </IonGrid>
  );
};
export default MovingCheck;
