import React, { useState, useRef, } from "react";
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
  IonLoading,
  IonIcon,
  useIonViewDidEnter,
  useIonViewWillLeave,
  IonToast,
} from "@ionic/react";
import { settings, ellipse, refresh } from "ionicons/icons";
import { Plugins, } from "@capacitor/core";
import ConnectionSetting from "../components/ConnectionSetting";
import PingSection from "../components/PingSection";
import StaticCheck from "../components/StaticCheck";
import MovingCheck from "../components/MovingCheck";
import ManualCheck from "../components/ManualCheck";
import { AppSettings } from "../AppSettings";
import { AppFunction, signalDataInterface } from "../AppFunction";

const { Storage, App, BackgroundTask } = Plugins;

App.addListener( 'appStateChange', (state) => {
  if( !state.isActive ){
    let taskId = BackgroundTask.beforeExit( async () => {
      let url: string;
      const ip = sessionStorage.getItem( 'rpiIP' );
      const port = sessionStorage.getItem( 'rpiPort' );
      if( ip && port ) { url = ip + ":" + port }
      else { url = AppSettings.RPI_IP + ":" + AppSettings.RPI_PORT }
      AppFunction.disableModule( url );
      BackgroundTask.finish({ taskId });
    });
  }
});

const SignalChecker: React.FC = () => {

  const [ isConnect, setIsConnect ] = useState<boolean>(false);
  const [ colorStatus, setColorStatus ] = useState<'success' | 'danger' | 'warning'>( 'danger' );
  const [ rpiDestination, setRPiDestination ] = useState<string>();
  const [ error, setError ] = useState<string>();
  const [ imei, setIMEI ] = useState<string>( "0" );
  const [ imsi, setIMSI ] = useState<string>();
  const [ mode, setMode ] = useState<string>();
  const [ band, setBand ] = useState<string>();
  const [ ip, setIP ] = useState<string>();
  const [ connectionWindow, setConnectionWindow ] = useState<boolean>(false);
  const [ pingWindow, setPingWindow ] = useState<boolean>(false);
  const [ staticWindow, setStaticWindow ] = useState<boolean>(false);
  const [ movingWindow, setMovingWindow ] = useState<boolean>(false);
  const [ staticWindowClose, setStaticWindowClose ] = useState<boolean>( false );
  const [ movingWindowClose, setMovingWindowClose ] = useState<boolean>( false );
  const [ manualWindow, setManualWindow ] = useState<boolean>( false );
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ toastRecon, setToastRecon ] = useState<boolean>(true);
  // const [ location, setLocation ] = useState<google.maps.LatLng>();
  const timerId = useRef<any>();

  useIonViewDidEnter( () => {
    setIntervalCheckConnect();
  });

  useIonViewWillLeave( () => {
    clearInterval( timerId.current );
    setToastRecon( false );
  });

  const getURL = () => {
    let url: string;
    const ip = sessionStorage.getItem( "rpiIP" );
    const port = sessionStorage.getItem( "rpiPort" );
    if( ip && port ) { url = ip + ":" + port; }
    else{ url = AppSettings.RPI_IP + ":" + AppSettings.RPI_PORT };
    setRPiDestination( url );
    return url;
  };

  const setIntervalCheckConnect = () => {
    clearInterval( timerId.current );
    checkConnect();
    timerId.current = setInterval( () => checkConnect(), AppSettings.CONNECTION_INTERVAL );
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
    if( result === "P" ){
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
    else if( result === "F" ){
      clearInterval( timerId.current );
      setIsConnect( false );
      setColorStatus( 'warning' );
      setToastRecon( true );
    }
    else if( result === undefined ){
      clearInterval( timerId.current );
      setIsConnect( false );
      setColorStatus( 'danger' );
      setToastRecon( true );
    }
  };

  const reconnect = async () => {
    setLoading( true );
    clearInterval( timerId.current );
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
    console.log(signal.aborted);
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

  const insertDB = async ( lat: number, lng: number, d: signalDataInterface) => {
    const body = Object.assign({
      username: 'test',
      imei: imei,
      imsi: imsi,
      mode: mode,
      band: band,
      latitude: lat,
      longitude: lng,
    },d);
    const dbOption = {
      method: "POST",
      headers: { 'Accept': 'application/json, text/plain, */*', "Content-Type": "application/json" },
      body: JSON.stringify(body)
    };
    
    const res = await fetch(AppSettings.DB_LOCATION + "/insertdb", dbOption)
      .then((response) => response.json())
      .then((result) => { return result })
      .catch(error => console.log(error));
    if( res ) setError('Insert database success');
    else setError('Failed to insert database');
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
    setIntervalCheckConnect();
  };

  const clearError = () => {
    setError("");
  };

  const Disconnect = ( res: string ) => {
    clearInterval( timerId.current );
    setManualWindow( false );
    setStaticWindow( false );
    setMovingWindow( false );
    if( res === "F" ){
      setIsConnect( false );
      setColorStatus( 'warning' );
      setToastRecon( true );
      setLoading( false );
      setError( "Cannot Connect to Serving Cell" );
      return;
    }
    else if( res === "D" ){
      setIsConnect( false );
      setColorStatus( 'danger' );
      setToastRecon( true );
      setLoading( false );
      setError( "Cannot Connect to RPi Device" );
      return;
    }
  };

  const onAutoTest = ( tname: string ) => {
    clearInterval( timerId.current );
    if( tname === "moving" ){
      setMovingWindowClose( true );
    }
    else if( tname === "static" ){
      setStaticWindowClose( true );
    }
  };

  const offAutoTest = ( tname: string ) => {
    if( tname === "moving" ){
      setMovingWindowClose( false );
    }
    else if( tname === "static" ){
      setStaticWindowClose( false );
    }
    setIntervalCheckConnect();
  };

  const disableModule = () => {
    clearInterval( timerId.current );
    const res = AppFunction.disableModule( getURL() );
    if( res ) setError('Disable RPi Success');
    else setError('Disable RPi Failed');
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>IoT Signal Checker</IonTitle>
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
              <IonButton onClick={ () => setStaticWindow( true ) } disabled={ !isConnect } expand="full">Static Test</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setMovingWindow( true ) } disabled={ !isConnect } expand="full">Moving Test</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setManualWindow( true ) } disabled={ !isConnect } expand="full">Manual Test</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => disableModule() } disabled={ !isConnect } expand="full" color="danger">Disable Module</IonButton>
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
              <IonButton disabled={ staticWindowClose }onClick={ () => setStaticWindow(false) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <StaticCheck 
          Disconnect={ Disconnect }
          onAutoTest={ onAutoTest }
          offAutoTest={ offAutoTest }
          insertDB={ insertDB }
          url={ rpiDestination! } 
        />
      </IonModal>

      <IonModal isOpen={ movingWindow }>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Moving Test</IonTitle>
            <IonButtons slot="end">
              <IonButton disabled={ movingWindowClose } onClick={ () => setMovingWindow(false) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <MovingCheck
          Disconnect={ Disconnect }
          onAutoTest={ onAutoTest }
          offAutoTest={ offAutoTest }
          insertDB={ insertDB }
          url={ rpiDestination! } 
        />
      </IonModal>

      <IonModal isOpen={ manualWindow }>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Moving Test</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={ () => setManualWindow(false) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <ManualCheck
          Disconnect={ Disconnect }
          insertDB={ insertDB }
          url={ rpiDestination! } 
        />
      </IonModal>

      <IonToast 
        isOpen={ toastRecon } 
        cssClass="tabs-bottom"
        buttons={[{ icon: refresh, handler: () => { setToastRecon( false ); reconnect(); }}]}
        message="Reconnect" />
      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Okey", handler: clearError }]} />
      <IonLoading isOpen={ loading } message={ "Please Wait..." } backdropDismiss={ true } />
    </IonPage>
  );
};

export default SignalChecker;