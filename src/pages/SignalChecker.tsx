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
  IonChip,
  IonCard,
  IonCardContent,
  IonInput,
  IonItem,
  IonLoading,
  IonIcon,
  useIonViewDidEnter,
  useIonViewWillLeave,
  IonToast,
} from "@ionic/react";
import { settings, ellipse, refresh } from "ionicons/icons";
import { Plugins } from "@capacitor/core";
import ConnectionSetting from "../components/ConnectionSetting";
import PingSection from "../components/PingSection";
import StaticCheck from "../components/StaticCheck";
import MovingCheck from "../components/MovingCheck";
import { AppSettings } from "../AppSettings";

const { Geolocation, Storage } = Plugins;

const SignalChecker: React.FC = () => {

  const [ isConnect, setIsConnect ] = useState<boolean>(false);
  const [ colorStatus, setColorStatus ] = useState<'success' | 'danger' | 'warning'>( 'danger' );
  const [ rpiDestination, setRPiDestination ] = useState<string>();
  const [ error, setError ] = useState<string>();
  const [ imei, setIMEI ] = useState<string>( "0" );
  const [ imsi, setIMSI ] = useState<string>();
  const [ rssi, setRSSI ] = useState<string>();
  const [ rssiColor, setRSSIColor ] = useState<string>( 'dark' );
  const [ rsrp, setRSRP ] = useState<string>();
  const [ rsrpColor, setRSRPColor ] = useState<string>( 'dark' );
  const [ sinr, setSINR ] = useState<string>();
  const [ sinrColor, setSINRColor ] = useState<string>( 'dark' );
  const [ rsrq, setRSRQ ] = useState<string>();
  const [ rsrqColor, setRSRQColor ] = useState<string>( 'dark' );
  const [ mode, setMode ] = useState<string>();
  const [ band, setBand ] = useState<string>();
  const [ ip, setIP ] = useState<string>();
  const [ connectionWindow, setConnectionWindow ] = useState<boolean>(false);
  const [ pingWindow, setPingWindow ] = useState<boolean>(false);
  const [ staticWindow, setStaticWindow ] = useState<boolean>(false);
  const [ movingWindow, setMovingWindow ] = useState<boolean>(false);
  const [ isTrack, setIsTrack ] = useState<boolean>(false);
  // const [ trackHandler, setTrackHandler ] = useState<any>();
  const [ enableBTN, setEnableBTN ] = useState<boolean>(false);
  const [ enableTrackBTN, setEnableTrackBTN ] = useState<boolean>(false);
  const [ delay, setDelayTracking ] = useState<number>(AppSettings.TRACKING_DELAY);
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ summitCheck, setSummitCheck ] = useState<boolean>(false);
  const [ toastRecon, setToastRecon ] = useState<boolean>(true);
  const [ location, setLocation ] = useState<google.maps.LatLng>();
  let timerId: any;

  useIonViewDidEnter( () => {
    setIntervalCheckConnect();
    if( sessionStorage.getItem( 'rssi' ) ){
      const rssi = sessionStorage.getItem( 'rssi' );
      const rsrp = sessionStorage.getItem( 'rsrp' );
      const sinr = sessionStorage.getItem( 'sinr' );
      const rsrq = sessionStorage.getItem( 'rsrq' );
      setRSSI( rssi! );
      setRSSIColor( AppSettings.getColorRssiRsrp( +rssi! ));
      setRSRP( rsrp! );
      setRSRPColor( AppSettings.getColorRssiRsrp( +rsrp! ));
      setSINR( sinr! );
      setSINRColor( AppSettings.getColorSinr( +sinr! ));
      setRSRQ( rsrq! );
      setRSRQColor( AppSettings.getColorRsrq( +rsrq! ));
    }
  });

  useIonViewWillLeave( () => {
    clearInterval( timerId );
    setToastRecon( false );
  });

  const getURL = () => {
    let url;
    const ip = sessionStorage.getItem( "rpiIP" );
    const port = sessionStorage.getItem( "rpiPort" );
    if( ip && port ) { url = ip + ":" + port; }
    else{ url = AppSettings.RPI_IP + ":" + AppSettings.RPI_PORT };
    console.log( url );
    setRPiDestination( url );
    return url;
  };

  const getLocation = async () => {
    const tmp = await Geolocation.getCurrentPosition();
    setLocation( new google.maps.LatLng( tmp.coords.latitude, tmp.coords.longitude ));
  };

  const setIntervalCheckConnect = () => {
    clearInterval( timerId );
    checkConnect();
    timerId = setInterval( () => checkConnect(), AppSettings.CONNECTION_INTERVAL );
  };

  const checkConnect = async () => {
    const url = await getURL();

    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), 10000 );
    const result = await fetch( "http://" + url + "/status", { signal } )
      .then(( response ) => response.json() )
      .then(( data ) => { return data; })
      .catch(( error ) => { console.log( error ); });
    if( result === true ){
      setIsConnect( true );
      setColorStatus( 'success' );
      setToastRecon( false );
      const data = await fetch( "http://" + url + "/info" )
        .then(( response ) => response.json() )
        .then(( data ) => { return data })
        .catch( e => console.log( e ));
      setIMEI( data[0] );
      setIMSI( data[1] );
      setMode( data[2] );
      setBand( data[3] );
      setIP( data[4] );
    }
    else if( result === false ){
      clearInterval( timerId );
      setIsConnect( false );
      setColorStatus( 'warning' );
      setToastRecon( true );
    }
    else if( result === undefined ){
      clearInterval( timerId );
      setIsConnect( false );
      setColorStatus( 'danger' );
      setToastRecon( true );
    }
  };

  const reconnect = async () => {
    setLoading( true );
    clearInterval( timerId );
    const url = await getURL();
    const m = sessionStorage.getItem( "mode" );
    const b = sessionStorage.getItem( "band" );
    if( !m && !b ){
      const m = AppSettings.MODE;
      const b = AppSettings.BAND;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => { controller.abort() }, AppSettings.CONNECT_TIMEOUT );
    const res = await fetch( "http://" + url + "/connectBase?mode=" + m + "&band=" + b, { signal } )
      .then( response => response.json() )
      .then( data => { return data })
      .catch( e => console.log( e ) );
    if( res && res !== "F" ){
      setIsConnect( true );
      setColorStatus( 'success' );
      setToastRecon( false );
      setIMEI( res[0] );
      setIMSI( res[1] );
      setMode( res[2] );
      setBand( res[3] );
      setIP( res[4] );
      setIntervalCheckConnect();
    }
    else if( res === "F" ){
      setIsConnect( false );
      setColorStatus( 'warning' );
      setToastRecon( true );
    }
    else{
      setIsConnect( false );
      setColorStatus( 'danger' );
      setToastRecon( true );
    }
    setLoading( false );
  };

  const signalStrength = async () => {
    setLoading(true);
    clearInterval( timerId );
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );
    const res = await fetch("http://" + rpiDestination + "/signalStrength", { signal })
      .then((response) => response.json())
      .then((data) => { return data })
      .catch( e => { console.log(e) } );
    if( res === "F" ){
      setIsConnect( false );
      setColorStatus( 'warning' );
      setToastRecon( true );
      setError( "Cannot Connect to Serving Cell" );
      return;
    }
    else if( !res ){
      setIsConnect( false );
      setColorStatus( 'danger' );
      setToastRecon( true );
      setError( "Cannot Connect to RPi Device" );
      return;
    }
    setRSSI(res[0]);
    sessionStorage.setItem( "rssi", res[0])
    setRSSIColor( AppSettings.getColorRssiRsrp( res[0]  ) );
    setRSRP(res[1]);
    sessionStorage.setItem( "rsrp", res[1])
    setRSRPColor( AppSettings.getColorRssiRsrp( res[1] ) );
    setSINR(res[2]);
    sessionStorage.setItem( "sinr", res[2])
    setSINRColor( AppSettings.getColorSinr( res[2] ) );
    setRSRQ(res[3]);
    sessionStorage.setItem( "rsrq", res[3])
    setRSRQColor( AppSettings.getColorRsrq( res[3] ) );
    const position = await Geolocation.getCurrentPosition();
    const dbOption = {
      method: "POST",
      headers: { 'Accept': 'application/json, text/plain, */*', "Content-Type": "application/json" },
      body: JSON.stringify({
        imei: imei,
        rssi: res[0],
        rsrp: res[1],
        sinr: res[2],
        rsrq: res[3],
        pcid: res[4],
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
    
    setIntervalCheckConnect();
    setLoading(false);
  };

  const signalTracker = () => {
    let trackerHandler;
    console.log( trackerHandler );
    if(isTrack) {
      setIsTrack(false);
      setEnableBTN(true);
      clearInterval(trackerHandler);
    }
    else{
      setIsTrack(true);
      setEnableBTN(false);
      trackerHandler = setInterval( () => {signalStrength()}, delay*1000);
      // setTrackHandler(trackerHandler);
    }
  };

  const changeIsConnect = ( imei: string, imsi: string, mode: string, band: string, ip: string, destination: string ) => {
    setIsConnect(true);
    setColorStatus( 'success' );
    setIMEI(imei);
    setIMSI(imsi);
    setMode(mode);
    setBand(band);
    setIP(ip);
    setRPiDestination(destination);
    setConnectionWindow(false);
    setEnableBTN(true);
    setEnableTrackBTN(true);
    setIntervalCheckConnect();
  };

  const clearError = () => {
    setError("");
  };

  const clearSummitCheck = () => {
    setSummitCheck( false );
  };

  const tmpRecon = () => {
    reconnect();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>App Name</IonTitle>
          <IonIcon color={ colorStatus } slot="secondary" size="large" icon={ ellipse } />
          <IonButtons slot="end">
            <IonButton onClick={ () => setConnectionWindow(true) }>
              <IonIcon slot="icon-only" icon={ settings } />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          <IonCard>
            <IonCardContent>
              <IonRow>
                <IonCol class="ion-align-self-center"><IonLabel>IMEI:</IonLabel></IonCol>
                <IonCol>
                  { isConnect? <IonChip color="primary">{imei}</IonChip>:<IonChip color="danger">X</IonChip> }
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol class="ion-align-self-center"><IonLabel>IMSI:</IonLabel></IonCol>
                <IonCol>
                  { isConnect? <IonChip color="primary">{imsi}</IonChip>:<IonChip color="danger">X</IonChip> }
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol class="ion-align-self-center"><IonLabel>Mode:</IonLabel></IonCol>
                <IonCol class="ion-align-self-center">
                  { isConnect? <IonChip color="primary" >{mode}</IonChip>:<IonChip color="danger">X</IonChip> }
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol class="ion-align-self-center"><IonLabel>Band:</IonLabel></IonCol>
                <IonCol class="ion-align-self-center">
                  { isConnect? <IonChip color="primary">{band}</IonChip>:<IonChip color="danger">X</IonChip> }
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol class="ion-align-self-center"><IonLabel>IP:</IonLabel></IonCol>
                <IonCol class="ion-align-self-center">
                  { isConnect? <IonChip color="primary">{ip}</IonChip>:<IonChip color="danger">X</IonChip> }
                </IonCol>
              </IonRow>
            </IonCardContent>
          </IonCard>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setPingWindow(true) } disabled={ !isConnect }  expand="full">Ping</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              {/* <IonButton onClick={ () => setStaticWindow( true ) } disabled={ !isConnect } expand="full">Static Test</IonButton> */}
              <IonButton onClick={ () => setStaticWindow( true ) } expand="full">Auto Static Test</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              {/* <IonButton onClick={ () => setMovingWindow( true ) } disabled={ !isConnect } expand="full">Moving Test</IonButton> */}
              <IonButton onClick={ () => { getLocation(); setMovingWindow( true ); }} expand="full">Auto Moving Test</IonButton>
            </IonCol>
            {/* <IonCol>
              <IonItem>
                <IonInput type="number" value={delay} disabled={!enableTrackBTN} placeholder="Delay" onIonChange={e => setDelayTracking(+e.detail.value!)} debounce={500} />
              </IonItem>
            </IonCol> */}
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ signalStrength } disabled={ !isConnect } expand="full">Manual Test</IonButton>
            </IonCol>
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
      <IonModal isOpen={ staticWindow }>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Static Test</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={ () => setStaticWindow(false) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <StaticCheck destination={rpiDestination!} />
      </IonModal>
      <IonModal isOpen={ movingWindow }>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Moving Test</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={ () => setMovingWindow(false) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <MovingCheck destination={rpiDestination!} imei={ imei }/>
      </IonModal>
      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Okay", handler: clearError }]} />
      <IonAlert 
        isOpen={ summitCheck } 
        message="Do you want to Summit Data?"
        buttons={[
          { text: "Yes", handler: clearSummitCheck },
          { text: "No", handler: clearSummitCheck }
        ]}
      />
      <IonToast 
        isOpen={ toastRecon } 
        cssClass="tabs-bottom"
        buttons={[{ icon: refresh, handler: () => { setToastRecon( false ); tmpRecon(); }}]}
        message="Reconnect" />
      <IonLoading isOpen={ loading } message={ "Please Wait..." } backdropDismiss={ true } />
    </IonPage>
  );
};

export default SignalChecker;