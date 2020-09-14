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
} from "@ionic/react";
import { settings, ellipse, } from "ionicons/icons";
import { Plugins } from "@capacitor/core";
import ConnectionSetting from "../components/ConnectionSetting";
import PingSection from "../components/PingSection";
import StaticCheck from "../components/StaticCheck";
import MovingCheck from "../components/MovingCheck";
import ManualCheck from "../components/ManualCheck";
import { AppSettings } from "../AppSettings";
import { disconnect } from "process";

const { Storage, Network, } = Plugins;

const SignalChecker: React.FC = () => {

  const [ isConnect, setIsConnect ] = useState<boolean>( false );
  const [ colorStatus, setColorStatus ] = useState<'success' | 'danger' | 'warning'>( 'danger' );
  const [ rpiDestination, setRPiDestination ] = useState<string>();
  const [ error, setError ] = useState<string>();
  const [ imei, setIMEI ] = useState<string>( "-" );
  const [ imsi, setIMSI ] = useState<string>( "-" );
  const [ mode, setMode ] = useState<string>( "-" );
  const [ band, setBand ] = useState<string>( "-" );
  const [ apn, setAPN ] = useState<string>();
  const [ ip, setIP ] = useState<string>();
  const [ connectionWindow, setConnectionWindow ] = useState<boolean>(false);
  const [ pingWindow, setPingWindow ] = useState<boolean>(false);
  const [ staticWindow, setStaticWindow ] = useState<boolean>(false);
  const [ movingWindow, setMovingWindow ] = useState<boolean>(false);
  const [ movingWindowClose, setMovingWindowClose ] = useState<boolean>( false );
  const [ manualWindow, setManualWindow ] = useState<boolean>( false );
  const [ disableBtn, setDisableBtn ] = useState<boolean>( false );
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ info, setInfo ] = useState<string>('');
  const timerId = useRef<any>();
  const aController = useRef<AbortController>();

  // Ion life cycle before load into the page, it will start check RPi available.
  useIonViewDidEnter( async () => {
    setIntervalCheckConnect();
  });

  // Ion life cycle before leave tab to clear interval and unfinish fetch to RPi.
  useIonViewWillLeave( () => {
    aController.current!.abort();
    clearInterval( timerId.current );
  });

  // function for prepare url use to connect to RPi.
  const getURL = async () => {
    let url: string;
    const ip = await (await Storage.get({ key: "rpiIP" })).value;
    const port = await (await Storage.get({ key: "rpiPort" })).value;
    if( ip && port ) { url = ip + ":" + port; }
    else{ url = AppSettings.RPI_IP + ":" + AppSettings.RPI_PORT };
    setRPiDestination( url );
    return url;
  };

  // function for set checkConnect interval.
  const setIntervalCheckConnect = () => {
    clearInterval( timerId.current );
    checkConnect();
    timerId.current = setInterval( () => checkConnect(), AppSettings.CONNECTION_INTERVAL );
  };

  // function for check connecting between RPi board and App.
  const checkConnect = async () => {
    const url = await getURL();

    const controller = new AbortController();
    aController.current = controller;
    const signal = controller.signal;
    setTimeout( () => controller.abort(), 10000 );
    const result = await fetch( "http://" + url + "/status", { signal } )
      .then(( response ) => response.json() )
      .then(( data ) => { return data; })
      .catch(( error ) => { console.log( error ); });
    if( result === "P" ){
      setIsConnect( true );
      setDisableBtn( true );
      setColorStatus( 'success' );
      const res = await fetch( "http://" + url + "/info" )
        .then(( response ) => response.json() )
        .then(( data ) => { return data })
        .catch( e => console.log( e ));
      setIMEI( res[0] );
      setIMSI( res[1] );
      setMode( res[2] );
      setBand( res[3] );
      setIP( res[4] );
      setAPN( res[5] );
      const token = await Storage.get({ key: 'DBToken' });
      if( token && token.value !== null && token.value !== '' ) {
        prepareInfo( token.value, res[0], res[1], res[2], res[3] )
      }
    }
    else if( result === "F" ){
      // clearInterval( timerId.current );
      setIsConnect( false );
      setDisableBtn( true );
      setColorStatus( 'warning' );
    }
    else if( result === undefined ){
      clearInterval( timerId.current );
      setIsConnect( false );
      setDisableBtn( false );
      setColorStatus( 'danger' );
    }
  };

  // function for connect to serving cell.
  const reconnect = async () => {
    setLoading( true );
    clearInterval( timerId.current );
    aController.current!.abort();
    const url = await getURL();
    let m = await (await Storage.get({ key: 'mode' })).value;
    let b = await (await Storage.get({ key: 'band' })).value;
    if( !m && !b ){
      m = AppSettings.MODE;
      b = AppSettings.BAND;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => { controller.abort() }, AppSettings.CONNECT_TIMEOUT );
    const res = await fetch( "http://" + url + "/connectBase?mode=" + m + "&band=" + b, { signal } )
      .then( response => response.json() )
      .then( data => { return data })
      .catch( e => console.log( e ) );
    if( res === "staticon" ){
      setError( 'Auto static test is running' );
      setIntervalCheckConnect();
    }
    else if( res && res !== "F" ){
      setIsConnect( true );
      setDisableBtn( true );
      setColorStatus( 'success' );
      setIMEI( res[0] );
      setIMSI( res[1] );
      setMode( res[2] );
      setBand( res[3] );
      setIP( res[4] );
      setAPN( res[5] );
      const token = await Storage.get({ key: 'DBToken' });
      if( token && token.value !== null && token.value !== '' ) {
        prepareInfo( token.value, res[0], res[1], res[2], res[3] )
      }
      setIntervalCheckConnect();
    }
    else if( res === "F" ){
      setIsConnect( false );
      setDisableBtn( true );
      setColorStatus( 'warning' );
    }
    else{
      setIsConnect( false );
      setDisableBtn( false );
      setColorStatus( 'danger' );
    }
    setLoading( false );
  };

  // function for create message for insert database by mqtt protocol.
  const prepareInfo = ( token: string, imei0: string = imei, imsi0: string = imsi, mode0: string = mode, band0: string = band ) => {
    if( imei0 !== '-' && imsi0 !== '-' && mode0 !== '-' && band0 !== '-' ){
      setInfo( 
        token + ',' +
        imei0 + ',' + 
        imsi0 + ',' +
        mode0 + ',' +
        band0
      );
    }
  };

  // function use to clear alert message.
  const clearError = () => {
    setError("");
  };

  // function use to change status when disconnect from the cell or board.
  const Disconnect = ( res: string ) => {
    clearInterval( timerId.current );
    setManualWindow( false );
    setStaticWindow( false );
    setMovingWindow( false );
    if( res === "F" ){
      setIsConnect( false );
      setDisableBtn( true );
      setColorStatus( 'warning' );
      setLoading( false );
      setError( "Cannot Connect to Serving Cell" );
    }
    else if( res === "D" ){
      setIsConnect( false );
      setDisableBtn( false );
      setColorStatus( 'danger' );
      setLoading( false );
      setError( "Cannot Connect to RPi Device" );
    }
  };

  // function use to disable close button of auto moving test.
  const onAutoTest = ( tname: string ) => {
    clearInterval( timerId.current );
    if( tname === "moving" ){
      setMovingWindowClose( true );
    }
  };

  // function use to enable close button of auto moving test.
  const offAutoTest = ( tname: string ) => {
    if( tname === "moving" ){
      setMovingWindowClose( false );
    }
    setIntervalCheckConnect();
  };

  // function use to check if network is available, because google map need internet to load map components.
  const movingWindowCheckNetwork = async () => {
    const s = await Network.getStatus();
    if( s.connected ) setMovingWindow( true );
    else setError( 'No internet access!' );
  }

  // function use to clear interval check RPi available and open ping page.
  const pingWindowClearInterval = () => {
    clearInterval( timerId.current );
    setPingWindow( true );
  };

  // function use to enable check connection after close ping page.
  const pingWindowSetInterval = () => {
    setIntervalCheckConnect();
    setPingWindow( false );
  };

  // Function use to disable RPi IoT board not the RPi itself.
  const disableModule = async () => {
    aController.current!.abort();
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );
    setLoading( true );
    const res = await fetch( 'http://'+rpiDestination+'/disable', { signal })
      .then( response => response.json() )
      .then( d => { return d } )
      .catch( e => console.log( e ) );
    setLoading( false );
    checkConnect();
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
              <IonRow>
                <IonCol class="ion-align-self-center"><IonLabel>APN:</IonLabel></IonCol>
                <IonCol class="ion-align-self-center">
                  { isConnect? <IonChip color="primary">{apn}</IonChip>:<IonChip color="danger">X</IonChip> }
                </IonCol>
              </IonRow>
            </IonCardContent>
          </IonCard>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => reconnect() } disabled={ isConnect }  expand="full">Connect Cell</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setIntervalCheckConnect() } disabled={ isConnect }  expand="full">Reconnect RPi</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => pingWindowClearInterval() } disabled={ !isConnect }  expand="full">Ping</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setStaticWindow( true ) } disabled={ !isConnect } expand="full">Auto Static Test</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => movingWindowCheckNetwork() } disabled={ !isConnect } expand="full">Auto Moving Test</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setManualWindow( true ) } disabled={ !isConnect } expand="full">Manual Test</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => disableModule() } disabled={ !disableBtn } expand="full" color="danger">Disable Module</IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>

      <IonModal isOpen={ connectionWindow }>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Signal and RPi Settings</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={ () => setConnectionWindow(false) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <ConnectionSetting 
          checkConnect={ setIntervalCheckConnect }
          prepareInfo={ prepareInfo }
          mode={ mode }
          band={ band }
        />
      </IonModal>

      <IonModal isOpen={pingWindow}>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Ping</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={ () => pingWindowSetInterval() }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <PingSection 
          Disconnect={ disconnect }
          url={ rpiDestination! } />
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
        <StaticCheck 
          Disconnect={ Disconnect }
          url={ rpiDestination! } 
          info={ info }
        />
      </IonModal>

      <IonModal isOpen={ movingWindow }>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Moving Test</IonTitle>
            <IonButtons slot="end">
              <IonButton disabled={ movingWindowClose } onClick={ () => setMovingWindow( false ) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <MovingCheck
          Disconnect={ Disconnect }
          onAutoTest={ onAutoTest }
          offAutoTest={ offAutoTest }
          info={ info }
          url={ rpiDestination! } 
        />
      </IonModal>

      <IonModal isOpen={ manualWindow }>
        <IonHeader translucent>
          <IonToolbar>
            <IonTitle>Manual Test</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={ () => setManualWindow(false) }>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <ManualCheck
          Disconnect={ Disconnect }
          info={ info }
          url={ rpiDestination! } 
        />
      </IonModal>

      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Ok", handler: clearError }]} />
      <IonLoading 
        isOpen={ loading } 
        message={ "Please Wait..." } 
        backdropDismiss={ false } 
      />
    </IonPage>
  );
};

export default SignalChecker;