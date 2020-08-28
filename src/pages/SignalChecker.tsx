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
import { Plugins, PermissionType, Geolocation, } from "@capacitor/core";
import ConnectionSetting from "../components/ConnectionSetting";
import PingSection from "../components/PingSection";
import StaticCheck from "../components/StaticCheck";
import MovingCheck from "../components/MovingCheck";
import ManualCheck from "../components/ManualCheck";
import { AppSettings } from "../AppSettings";
import { signalDataInterface } from "../AppFunction";

const { Storage, Network, } = Plugins;

const SignalChecker: React.FC = () => {

  const [ isConnect, setIsConnect ] = useState<boolean>(false);
  const [ colorStatus, setColorStatus ] = useState<'success' | 'danger' | 'warning'>( 'danger' );
  const [ rpiDestination, setRPiDestination ] = useState<string>();
  const [ error, setError ] = useState<string>();
  const [ imei, setIMEI ] = useState<string>( "0" );
  const [ imsi, setIMSI ] = useState<string>();
  const [ mode, setMode ] = useState<string>();
  const [ band, setBand ] = useState<string>();
  const [ apn, setAPN ] = useState<string>();
  const [ ip, setIP ] = useState<string>();
  const [ connectionWindow, setConnectionWindow ] = useState<boolean>(false);
  const [ pingWindow, setPingWindow ] = useState<boolean>(false);
  const [ staticWindow, setStaticWindow ] = useState<boolean>(false);
  const [ movingWindow, setMovingWindow ] = useState<boolean>(false);
  const [ staticWindowClose, setStaticWindowClose ] = useState<boolean>( false );
  const [ movingWindowClose, setMovingWindowClose ] = useState<boolean>( false );
  const [ manualWindow, setManualWindow ] = useState<boolean>( false );
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ info, setInfo ] = useState<string>('');
  const timerId = useRef<any>();
  const aController = useRef<AbortController>();

  useIonViewDidEnter( async () => {
    setIntervalCheckConnect();
  });

  useIonViewWillLeave( () => {
    aController.current!.abort();
    clearInterval( timerId.current );
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

    aController.current = new AbortController();
    const signal = aController.current.signal;
    setTimeout( () => aController.current!.abort(), 10000 );
    const result = await fetch( "http://" + url + "/status", { signal } )
      .then(( response ) => response.json() )
      .then(( data ) => { return data; })
      .catch(( error ) => { console.log( error ); });
    if( result === "P" ){
      setIsConnect( true );
      setColorStatus( 'success' );
      const data = await fetch( "http://" + url + "/info" )
        .then(( response ) => response.json() )
        .then(( data ) => { return data })
        .catch( e => console.log( e ));
      setIMEI( data[0] );
      setIMSI( data[1] );
      setMode( data[2] );
      setBand( data[3] );
      setIP( data[4] );
      setAPN( data[5] );
    }
    else if( result === "F" ){
      clearInterval( timerId.current );
      setIsConnect( false );
      setColorStatus( 'warning' );
    }
    else if( result === undefined ){
      clearInterval( timerId.current );
      setIsConnect( false );
      setColorStatus( 'danger' );
    }
  };

  const reconnect = async () => {
    setLoading( true );
    clearInterval( timerId.current );
    aController.current!.abort();
    const url = await getURL();
    let m,b;
    if( sessionStorage.getItem( 'mode' ) && sessionStorage.getItem( 'band' )){
      m = sessionStorage.getItem( "mode" );
      b = sessionStorage.getItem( "band" );
    }
    else {
      m = AppSettings.MODE;
      b = AppSettings.BAND;
    }

    aController.current = new AbortController();
    const signal = aController.current.signal;
    setTimeout(() => { aController.current!.abort() }, AppSettings.CONNECT_TIMEOUT );
    const res = await fetch( "http://" + url + "/connectBase?mode=" + m + "&band=" + b, { signal } )
      .then( response => response.json() )
      .then( data => { return data })
      .catch( e => console.log( e ) );
    if( res && res !== "F" ){
      setIsConnect( true );
      setColorStatus( 'success' );
      setIMEI( res[0] );
      setIMSI( res[1] );
      setMode( res[2] );
      setBand( res[3] );
      setIP( res[4] );
      const token = await Storage.get({ key: 'DBToken' });
      if( token ) {
        setInfo( 
          token.value + '_' +
          res[0] + '_' + 
          res[1] + '_' +
          res[2] + '_' +
          res[3] + '_'
        );
      }
      setIntervalCheckConnect();
    }
    else if( res === "F" ){
      setIsConnect( false );
      setColorStatus( 'warning' );
    }
    else{
      setIsConnect( false );
      setColorStatus( 'danger' );
    }
    setLoading( false );
  };

  const insertDB = async ( lat: number, lng: number, d: signalDataInterface) => {
    if( !(await Storage.get({ key: 'DBToken'} ))){
      setError( 'No database token' );
      return ;
    }
    const body = Object.assign({
      token: await (await Storage.get({ key: 'DBToken' })).value,
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
    // let url = await getURL();
    // url = 'http://' + url + '/mqtt&url=' + AppSettings.DB_LOCATION + '&data=' + data;
    // const res = await fetch( url );
    if( res ) setError('Insert database success');
    else setError('Failed to insert database');
  };

  const changeIsConnect = async ( imei: string, imsi: string, mode: string, band: string, ip: string, apn: string, destination: string ) => {
    setIsConnect(true);
    setColorStatus( 'success' );
    setIMEI(imei);
    setIMSI(imsi);
    setMode(mode);
    setBand(band);
    setIP(ip);
    setAPN( apn );
    setRPiDestination(destination);
    const token = await Storage.get({ key: 'DBToken' });
    if( token ) {
      setInfo( 
        token.value + '_' +
        imei + '_' + 
        imsi + '_' +
        mode + '_' +
        band + '_'
      );
    }
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
      setLoading( false );
      setError( "Cannot Connect to Serving Cell" );
      return;
    }
    else if( res === "D" ){
      setIsConnect( false );
      setColorStatus( 'danger' );
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

  const movingWindowCheckNetwork = async () => {
    const s = await Network.getStatus();
    if( s.connected ) setMovingWindow( false );
    else setError( 'No internet access!' );
  }

  const disableModule = async () => {
    aController.current = new AbortController();
    const signal = aController.current.signal;
    setTimeout( () => aController.current!.abort(), AppSettings.CONNECT_TIMEOUT );
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
              <IonButton onClick={ () => reconnect() } disabled={ isConnect }  expand="full">Reconnect</IonButton>
              {/* <IonButton onClick={ () => setPingWindow(true) }  expand="full">Ping</IonButton> */}
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setPingWindow(true) } disabled={ !isConnect }  expand="full">Ping</IonButton>
              {/* <IonButton onClick={ () => setPingWindow(true) }  expand="full">Ping</IonButton> */}
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setStaticWindow( true ) } disabled={ !isConnect } expand="full">Auto Static Test</IonButton>
              {/* <IonButton onClick={ () => setStaticWindow( true ) } expand="full">Static Test</IonButton> */}
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setMovingWindow( true ) } disabled={ !isConnect } expand="full">Auto Moving Test</IonButton>
              {/* <IonButton onClick={ () => setMovingWindow( true ) } expand="full">Moving Test</IonButton> */}
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => setManualWindow( true ) } disabled={ !isConnect } expand="full">Manual Test</IonButton>
              {/* <IonButton onClick={ () => setManualWindow( true ) } expand="full">Manual Test</IonButton> */}
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton onClick={ () => disableModule() } disabled={ !isConnect } expand="full" color="danger">Disable Module</IonButton>
              {/* <IonButton onClick={ () => disableModule() } expand="full" color="danger">Disable Module</IonButton> */}
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
              <IonButton disabled={ movingWindowClose } onClick={ () => movingWindowCheckNetwork() }>Close</IonButton>
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

      <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Okey", handler: clearError }]} />
      <IonLoading 
        isOpen={ loading } 
        message={ "Please Wait..." } 
        backdropDismiss={ true } 
        onDidDismiss={ () => {
          setLoading( false );
          aController.current?.abort();
        }}
      />
    </IonPage>
  );
};

export default SignalChecker;