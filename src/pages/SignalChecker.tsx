import React, { useState, useEffect } from "react";
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
  IonChip,
  IonCard,
  IonCardContent,
  IonInput,
  IonItem,
  IonLoading,
} from "@ionic/react";
import { useCurrentPosition, availableFeatures } from "@ionic/react-hooks/geolocation";
import ConnectionSetting from "../components/ConnectionSetting";
import PingSection from "../components/PingSection";
import { AppSettings } from "../AppSettings";

const SignalChecker: React.FC = () => {

  const [ isConnect, setIsConnect ] = useState<boolean>(false);
  const [ rpiDestination, setRPiDestination ] = useState<string>();
  const [ error, setError ] = useState<string>();
  const [ imei, setIMEI ] = useState<string>();
  const [ rssi, setRSSI ] = useState<string>();
  const [ rsrp, setRSRP ] = useState<string>();
  const [ sinr, setSINR ] = useState<string>();
  const [ rsrq, setRSRQ ] = useState<string>();
  const [ mode, setMode ] = useState<string>();
  const { currentPosition, getPosition } = useCurrentPosition();
  const [ connectionWindow, setConnectionWindow ] = useState<boolean>(false);
  const [ pingWindow, setPingWindow ] = useState<boolean>(false);
  const [ isTrack, setIsTrack ] = useState<boolean>(false);
  const [ trackHandler, setTrackHandler ] = useState<any>();
  const [ enableBTN, setEnableBTN ] = useState<boolean>(false);
  const [ enableTrackBTN, setEnableTrackBTN ] = useState<boolean>(false);
  const [ delay, setDelayTracking ] = useState<number>(AppSettings.TRACKING_DELAY);
  const [ loading, setLoading ] = useState<boolean>(false);

  useEffect(() => {
    if(!availableFeatures.watchPosition){
      setError("Geolocation service is not available.")
    }
  },[]);

  const signalStrength = async () => {
    setLoading(true);
    const signalStrength = await fetch("http://" + rpiDestination + "/signalStrength")
      .then((response) => response.json())
      .then((data) => { return data });
    setRSSI(signalStrength[0]);
    setRSRP(signalStrength[1]);
    setSINR(signalStrength[2]);
    setRSRQ(signalStrength[3]);
    if(availableFeatures.watchPosition){
      getPosition({ timeout: 30000 });
      const dbOption = {
        method: "POST",
        headers: { 'Accept': 'application/json, text/plain, */*', "Content-Type": "application/json" },
        body: JSON.stringify({
          imei: imei,
          rssi: signalStrength[0],
          rsrp: signalStrength[1],
          sinr: signalStrength[2],
          rsrq: signalStrength[3],
          pcid: signalStrength[4],
          mode: mode,
          latitude: currentPosition?.coords.latitude,
          longitude: currentPosition?.coords.longitude,
        })
      };

      const result = await fetch(AppSettings.DB_LOCATION + "/insertdata", dbOption)
        .then((response) => response.json())
        .then((result) => { return result })
        .catch(error => console.log(error));
      console.log(result);
    }
    setLoading(false);
  };

  const signalTracker = () => {
    if(isTrack) {
      setIsTrack(false);
      setEnableBTN(true);
      clearInterval(trackHandler);
    }
    else{
      setIsTrack(true);
      setEnableBTN(false);
      const trackerHandler = setInterval( () => {signalStrength()}, delay*1000);
      setTrackHandler(trackerHandler);
    }
  };

  const changeIsConnect = ( imei: string, mode: string , destination: string ) => {
    setIsConnect(true);
    setIMEI(imei);
    setMode(mode);
    setRPiDestination(destination);
    setConnectionWindow(false);
    setEnableBTN(true);
    setEnableTrackBTN(true);
  };

  const clearError = () => {
    setError("");
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
          <IonCard>
            <IonCardContent>
              <IonRow>
                <IonCol class="ion-align-self-center"><IonLabel>Raspberry Pi Status:</IonLabel></IonCol>
                <IonCol>
                  { isConnect? <IonChip color="success">Connected</IonChip>:<IonChip color="danger">Connected</IonChip> }
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol class="ion-align-self-center"><IonLabel>IMMI:</IonLabel></IonCol>
                <IonCol>
                  { isConnect? <IonChip color="primary">{imei}</IonChip>:<IonChip color="danger">X</IonChip> }
                </IonCol>
              </IonRow>
            </IonCardContent>
          </IonCard>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setPingWindow(true) } disabled={!enableBTN}  expand="full">Ping</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={signalStrength} disabled={!enableBTN} expand="full">Signal Check</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={signalTracker} disabled={!enableTrackBTN} expand="full">Signal Check Tracking Mode</IonButton>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput type="number" value={delay} disabled={!enableTrackBTN} placeholder="Delay" onIonChange={e => setDelayTracking(+e.detail.value!)} debounce={500} />
              </IonItem>
            </IonCol>
          </IonRow>
          <IonCard>
            <IonCardContent>
              <IonRow>
                <IonCol size="3"><IonLabel>RSSI:</IonLabel>{rssi}</IonCol>
                <IonCol size="3"><IonLabel>RSRP:</IonLabel>{rsrp}</IonCol>
                <IonCol size="3"><IonLabel>SINR:</IonLabel>{sinr}</IonCol>
                <IonCol size="3"><IonLabel>RSRQ:</IonLabel>{rsrq}</IonCol>
              </IonRow>
            </IonCardContent>
          </IonCard>
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
      <IonModal isOpen={pingWindow}>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Ping</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={ () => setPingWindow(false) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <PingSection destination={rpiDestination!} />
      </IonModal>
      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Okay", handler: clearError }]} />
      <IonLoading isOpen={loading} message={'Please Wait...'} backdropDismiss={true}/>
    </IonPage>
  );
};

export default SignalChecker;