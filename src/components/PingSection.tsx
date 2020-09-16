import React, { useState, useEffect, useRef } from "react";
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
  IonContent,
} from "@ionic/react";
import { AppSettings } from "../AppSettings"

const PingSection: React.FC<{
  Disconnect: ( res: string ) => void,
  onAutoTest: ( tname: string ) => void,
  offAutoTest: ( tname: string ) => void,
  url: string,
}> = (props) => {
  const [ loading, setLoading ] = useState<boolean>( false );
  const [ site, setSite ] = useState<string>(AppSettings.DEFAULT_PING_SITE);
  const [ retry, setRetry ] = useState<number>(AppSettings.DEFAULT_PING_RETRY);
  const [ errorConnection, setErrorConnection ] = useState<string>();
  const [ enableBtn, setEnableBtn ] = useState<boolean>( true );
  const [ avgResponse, setAvgResponse ] = useState<number>( 0 );
  const [ send, setSend ] = useState<number>( 0 );
  const [ recv, setRecv ] = useState<number>( 0 );
  const [ loss, setLoss ] = useState<number>( 0 );
  const [ ip, setIP ] = useState<string>();
  const pingResponse = useRef<number[]>([]);

    // function use before components load, will check static test status and reflect to UI or button.
    useEffect( () => {
    const checkRPiState = async () => {
      let url = 'http://' + props.url + '/staticStatus';

      const controller = new AbortController();
      const signal = controller.signal;
      setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );
      const res = await fetch( url, { signal })
        .then( response => response.json() )
        .then( d => { return d; });
      if( res === 'P' ){
        setErrorConnection( 'Static test is still in use' );
        setEnableBtn( false );
      }
      if( res === 'F' ){
        setEnableBtn( true );
      }
      else if( signal.aborted ){
        props.Disconnect( 'D' );
        setErrorConnection( 'Cannot connect to RPi' );
      }
    };
    checkRPiState();
  }, [ props ]);

  // function for clear alert message.
  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  // function for send url or site to RPi board to ping.
  const pingSite = async () => {
    props.onAutoTest( 'ping' );
    setLoading( true );
    setSend( 0 );
    setRecv( 0 );
    setLoss( 0 );
    pingResponse.current = [];
    for( let i = 0; i < retry; i++ ){
      await new Promise(( resolve ) => setTimeout( async () => {
        await ping();
        resolve();
      }, 1000));
    }
    setLoading( false );
    props.offAutoTest( 'ping' );
  };

  const ping = async () => {
    const url = ("http://" + props.url + "/ping?site=" + site )
    const res = await fetch( url )
      .then( (response) => response.json() )
      .then( (data) => { return data; });
    if( res === 'F' ){ 
      setLoss( loss => loss + 1 );
      setSend( send => send + 1 );
    }
    else{ 
      setRecv( recv => recv + 1 );
      setSend( send => send + 1 );
      setIP( res[0] );
      pingResponse.current.push( res[1] );
    }
    getAvgResponse();
  };

  const getAvgResponse = () => {
    let total = 0;
    for( let i in pingResponse.current )
      total += +pingResponse.current[i];
    const avg = total / pingResponse.current.length;
    setAvgResponse( isNaN(avg)? 0: avg );
  };

  return (
    <IonContent>
      <IonGrid>
        <IonRow>
          <IonCol size="10" class="ion-margin-top">
            <IonLabel>Site</IonLabel>
            <IonItem>
              <IonInput value={site} onIonChange={ e => setSite(e.detail.value!) } debounce={500} disabled={ !enableBtn }/>
            </IonItem>
          </IonCol>
          <IonCol size="2" class="ion-margin-top">
            <IonLabel>Retry</IonLabel>
            <IonItem>
              <IonInput value={retry} onIonChange={ e => setRetry(+e.detail.value!) } debounce={500} type="number" disabled={ !enableBtn }/>
            </IonItem>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol className="ion-margin-top">
            <IonButton onClick={ () => pingSite() } expand="full" disabled={ !enableBtn }>Ping</IonButton>
          </IonCol>
        </IonRow>
        <IonCard>
          <IonCardContent>
            <IonRow>
              <IonCol><IonLabel>IP:</IonLabel>{ ip }</IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="4"><IonLabel>Send:</IonLabel>{ send }</IonCol>
              <IonCol size="4"><IonLabel>Receive:</IonLabel>{ recv }</IonCol>
              <IonCol size="4"><IonLabel>Loss:</IonLabel>{ loss }</IonCol>
            </IonRow>
            <IonRow>
              <IonCol><IonLabel>Avg Response:</IonLabel>{ avgResponse.toPrecision(3) } <IonLabel>ms</IonLabel></IonCol>
            </IonRow>
          </IonCardContent>
        </IonCard>
        <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Ok", handler: clearErrorConnection }]} />
        <IonLoading 
          isOpen={ loading } 
          message={ "Please Wait..." } 
          backdropDismiss={ false } 
          cssClass='loading-bottom'
        />
      </IonGrid>
    </IonContent>
  );
};
export default PingSection;
