import React, { useState, useEffect, useRef } from "react";
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
  IonContent,
} from "@ionic/react";
import { AppSettings } from "../AppSettings";
import { Plugins } from "@capacitor/core";

const { Storage } = Plugins;

const ConnectionSetting: React.FC<{
  checkConnect: () => void,
  prepareInfo: ( token: string ) => void,
  mode: string | undefined,
  band: string | undefined,
}> = (props) => {
  const [ rpiIP, setRPiIP ] = useState<string>( AppSettings.RPI_IP );
  const [ rpiPort, setRPiPort ] = useState<number>( AppSettings.RPI_PORT );
  const [ mode, setMode ] = useState<string>( AppSettings.MODE );
  const [ band, setBand ] = useState<string>( AppSettings.BAND );
  const [ apn, setAPNValue ] = useState<string>( AppSettings.APN );
  const [ apnAlert, setAPNAlert ] = useState<boolean>( false );
  const [ dbToken, setDBToken ] = useState<string>();
  const [ tokenAlert, setTokenAlert ] = useState<boolean>( false );
  const [ errorConnection, setErrorConnection ] = useState<string>();
  const [ loading, setLoading ] = useState<boolean>( false );
  const connectController = useRef<AbortController>();

  useEffect( () => {
    const loadSetting = async () => {
      if( await (await Storage.get({ key: 'mode'})).value ) {
        setMode( await (await Storage.get({ key: 'mode' })).value! );
        setBand( await (await Storage.get({ key: 'band' })).value! );
        setRPiIP( await (await Storage.get({ key: 'rpiIP' })).value! );
        setRPiPort( +await (await Storage.get({ key: 'rpiPort' })).value! );
      }
      if( !props.mode && !props.band ){

      }
      if( await Storage.get({ key: 'DBToken' }) ){
        setDBToken( await (await Storage.get({ key: 'DBToken' })).value! );
      }
    };
    loadSetting();
  },[ props ]);

  // const loadSetting = async () => {
  //   if( await (await Storage.get({ key: 'mode'})).value ) {
  //     setMode( await (await Storage.get({ key: 'mode' })).value! );
  //     setBand( await (await Storage.get({ key: 'band' })).value! );
  //     setRPiIP( await (await Storage.get({ key: 'rpiIP' })).value! );
  //     setRPiPort( +await (await Storage.get({ key: 'rpiPort' })).value! );
  //   }
  //   if( props.mode && props.band ){
  //     setMode( props.mode );
  //     setBand( props.band );
  //   }
  //   if( await Storage.get({ key: 'DBToken' }) ){
  //     setDBToken( await (await Storage.get({ key: 'DBToken' })).value! );
  //   }
  // };

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

  // const rpiConnect = async () => {
  //   if ( ipPortInput() ) return ;
  //   const url = ("http://" + rpiIP + ":" + rpiPort + "/connectBase?mode=" + mode + "&band=" + band )
  //   setLoading( true );

  //   connectController.current = new AbortController();
  //   const signal = connectController.current.signal;
  //   const id = setTimeout(() => { connectController.current!.abort() }, AppSettings.CONNECT_TIMEOUT );
  //   const res = await fetch(url, { signal })
  //     .then( (response) => response.json() )
  //     .then( (data) => { return data; })
  //     .catch( e => console.log(e) );
  //   clearTimeout( id );
  //   setLoading( false );
  //   if( res === "F" ) { setErrorConnection("Cannot connect to Cell!"); return ; }
  //   else if( signal.aborted ) { setErrorConnection("Cannt connect to RPi"); return ; }
  //   props.onChangeIsConnect( res[0], res[1], res[2], res[3], res[4], res[5], rpiIP + ":" + rpiPort );
  // };

  const resetModule = async () => {
    const url = ("http://" + rpiIP + ":" + rpiPort + "/repair")
    setLoading( true );
    connectController.current = new AbortController();
    const signal = connectController.current.signal;
    setTimeout(() => { connectController.current!.abort() }, AppSettings.CONNECT_TIMEOUT );

    const result = await fetch( url, { signal })
      .then( response => response.json() )
      .then( d => { return d });
    setLoading( false );
    if( result ) setErrorConnection( "Reset success" );
    else setErrorConnection( "Reset Fail" );
  };

  const defaultValue = () => {
    setMode( AppSettings.MODE );
    setBand( AppSettings.BAND );
    setRPiIP( AppSettings.RPI_IP );
    setRPiPort( AppSettings.RPI_PORT );
    setAPN( 'ciot' );
  };

  const setAPN = async ( apn: string) => {
    setLoading( true );
    let ip,port;
    if( sessionStorage.getItem( 'rpiIP' ) && sessionStorage.getItem( 'rpiPort' )){
      ip = sessionStorage.getItem( "rpiIP" );
      port = sessionStorage.getItem( "rpiPort" );
    }
    else{
      ip = AppSettings.RPI_IP;
      port = AppSettings.RPI_PORT;
    }
    const url = ("http://" + ip + ":" + port + "/apnSetting?apn=" + apn );
    connectController.current = new AbortController();
    const signal = connectController.current.signal;
    setTimeout( () => connectController.current!.abort(), AppSettings.CONNECT_TIMEOUT );

    const res = await fetch( url, { signal })
      .then( response => response.json() )
      .then( data => { return data })
      .catch( e => console.log(e) );
    setLoading( false );
    if( res !== "F" ){ 
      setAPNValue( res[0] );
      setErrorConnection( "Set APN success" );
    }
    else if( res === "F" ) setErrorConnection( "Set APN Failed!" );
    else setErrorConnection( "Connection to RPI Error" );
  };

  const saveSetting = async () => {
    if( ipPortInput() ){ 
      setErrorConnection( 'IP or Port is invalid' );
      return;
    }
    await Storage.set({ key: 'mode', value: mode });
    await Storage.set({ key: 'band', value: band });
    await Storage.set({ key: 'rpiIP', value: rpiIP });
    await Storage.set({ key: 'rpiPort', value: rpiPort.toString() });
    props.checkConnect();
  };

  const saveToken = async ( token: string ) => {
    await Storage.set({ key: 'DBToken', value: token });
    setDBToken( token );
    props.prepareInfo( token );
  };

  return (
    <IonContent>
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonLabel>Mode</IonLabel>
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
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonLabel>Band</IonLabel>
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
          <IonCol>
            <IonButton onClick={ () => saveSetting() } expand="full">Save</IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton onClick={ () => defaultValue() } expand="full">Default Value</IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton onClick={ () => resetModule() } expand="full">Reset Module</IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonItem button={ true } onClick={ () => setAPNAlert( true ) } >
              <IonLabel>APN</IonLabel>
              <p slot="end">{ apn }</p>
            </IonItem>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonItem button={ true } onClick={ () => setTokenAlert( true ) } >
              <IonLabel>Database Token</IonLabel>
              <p slot="end">{ dbToken }</p>
            </IonItem>
          </IonCol>
        </IonRow>

        <IonAlert 
          isOpen={ apnAlert }
          message="Set APN"
          inputs={[{ name: "apn", value: apn }]}
          buttons={[
            { text: "Set", handler: (data: any) => { setAPN( data.apn ); setAPNAlert( false ); } }, 
            { text: "Cancel", handler: () => { setAPNAlert( false ) } }
          ]}
          onDidDismiss={ () => setAPNAlert( false ) }
        />
        <IonAlert 
          isOpen={ tokenAlert }
          message="Set DB Token"
          inputs={[{ name: "token", value: dbToken }]}
          buttons={[
            { text: "Set", handler: (data: any) => { saveToken( data.token ); setTokenAlert( false ); } }, 
            { text: "Cancel", handler: () => { setTokenAlert( false ) } }
          ]}
          onDidDismiss={ () => setTokenAlert( false ) }
        />
        <IonAlert 
          isOpen={!!errorConnection} 
          message={errorConnection} 
          buttons={[{ text: "Ok", handler: clearErrorConnection }]} 
        />
        <IonLoading 
          isOpen={loading} 
          message={'Please Wait...'} 
          backdropDismiss={ true }
          onDidDismiss={ () => {
            setLoading( false );
            connectController.current!.abort();
          }}
        />
      </IonGrid>
    </IonContent>
  );
};
export default ConnectionSetting;
