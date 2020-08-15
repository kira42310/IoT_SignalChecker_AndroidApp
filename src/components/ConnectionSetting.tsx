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
import { AppSettings } from "../AppSettings";
import { Plugins } from "@capacitor/core";

const { Storage } = Plugins;

const ConnectionSetting: React.FC<{
  onChangeIsConnect: (imei: string, imsi: string,  mode: string, band: string, ip: string, rpiDestination: string) => void;
}> = (props) => {
  const [rpiIP, setRPiIP] = useState<string>(AppSettings.RPI_IP);
  const [rpiPort, setRPiPort] = useState<number>(AppSettings.RPI_PORT);
  const [mode, setMode] = useState<string>(AppSettings.MODE);
  const [band, setBand] = useState<string>(AppSettings.BAND);
  const [ apn, setAPNValue ] = useState<string>( AppSettings.APN );
  const [ apnAlert, setAPNAlert ] = useState<boolean>( false );
  const [ dbToken, setDBToken ] = useState<string>();
  const [ tokenAlert, setTokenAlert ] = useState<boolean>( false );
  const [errorConnection, setErrorConnection] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect( () => {
    loadSetting();
  },[]);

  const loadSetting = async () => {
    if( sessionStorage.getItem( 'mode' )){
      setMode( sessionStorage.getItem( 'mode' )! );
      setBand( sessionStorage.getItem( 'band' )! );
      setRPiIP( sessionStorage.getItem( 'rpiIP' )! );
      setRPiPort( +sessionStorage.getItem( 'rpiPort' )! );
    }
    if( await Storage.get({ key: 'DBToken' }) ){
      setDBToken( await (await Storage.get({ key: 'DBToken' })).value! );
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
    const url = ("http://" + rpiIP + ":" + rpiPort + "/connectBase?mode=" + mode + "&band=" + band )
    setLoading(true);

    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => { controller.abort() }, AppSettings.CONNECT_TIMEOUT );
    const result = await fetch(url, { signal })
      .then( (response) => response.json() )
      .then( (data) => { return data; })
    setLoading(false);
    if( result[0] === "F" ) { setErrorConnection("Cannot connect to Base!"); return ; }
    props.onChangeIsConnect( result[0], result[1], result[2], result[3], result[4], rpiIP + ":" + rpiPort );
  };

  const resetModule = async () => {
    const url = ("http://" + rpiIP + ":" + rpiPort + "/repair")
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => { controller.abort() }, AppSettings.CONNECT_TIMEOUT );

    const result = await fetch( url, { signal })
      .then( response => response.json() )
      .then( d => { return d });
    if( result ) setErrorConnection( "Reset success" );
    else setErrorConnection( "Reset Fail" );
  };

  const defaultValue = () => {
    setMode( AppSettings.MODE );
    setBand( AppSettings.BAND );
    setRPiIP( AppSettings.RPI_IP );
    setRPiPort( AppSettings.RPI_PORT );
  };

  const setAPN = async ( apn: string) => {
    const ip = sessionStorage.getItem( "rpiIP" );
    const port = sessionStorage.getItem( "rpiPort" );
    if( !ip || !port ){
      const ip = AppSettings.RPI_IP;
      const port = AppSettings.RPI_PORT;
    }
    const url = ("http://" + ip + ":" + port + "/apnSetting?apn=" + apn );
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );

    const res = await fetch( url, { signal })
      .then( response => response.json() )
      .then( data => { return data })
      .catch( e => console.log(e) );
    if( res === "P" ){ 
      setAPNValue( apn );
      setErrorConnection( "Set APN success" );
    }
    else if( res === "F" ) setErrorConnection( "Set APN Failed!" );
    else setErrorConnection( "Connection to RPI Error" );
  };

  const saveSetting = () => {
    sessionStorage.setItem( 'mode', mode);
    sessionStorage.setItem( 'band', band );
    sessionStorage.setItem( 'rpiIP', rpiIP );
    sessionStorage.setItem( 'rpiPort', rpiPort.toString() );
    rpiConnect();
  };

  const saveToken = async ( token: string ) => {
    await Storage.set({ key: 'DBToken', value: token });
    setDBToken( token );
  };

  return (
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
          <IonButton onClick={ saveSetting } expand="full">Save & Connect</IonButton>
        </IonCol>
      </IonRow>
      <IonRow>
        {/* <IonCol className="ion-margin-top"> */}
        <IonCol>
          <IonButton onClick={ defaultValue } expand="full">Default Value</IonButton>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol>
          <IonButton onClick={ resetModule } expand="full">Reset Module</IonButton>
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
        buttons={[{ text: "Okey", handler: clearErrorConnection }]} 
      />
      <IonLoading 
        isOpen={loading} 
        message={'Please Wait...'} 
        backdropDismiss={true}
        onDidDismiss={ () => setLoading( false ) }
      />
    </IonGrid>
  );
};
export default ConnectionSetting;
