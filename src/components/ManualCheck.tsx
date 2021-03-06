import React, { useState, useEffect, } from "react";
import {
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonAlert,
  IonLoading,
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonCardHeader,
  IonChip,
  IonContent,
} from "@ionic/react";
import { Plugins } from "@capacitor/core";
import { AppSettings } from "../AppSettings";
import { signalDataInterface, signalColorInterface } from "../AppFunction";

const { Geolocation, } = Plugins;

const ManualCheck: React.FC<{
  Disconnect: ( res: string ) => void,
  url: string,
  info: string,
}> = (props) => {
  const [ data, setData ] = useState<signalDataInterface | null>( null );
  const [ signalColor, setSignalColor ] = useState<signalColorInterface>();
  const [ startTestAlert, setStartTestAlert ] = useState<boolean>( false );
  const [ errorConnection, setErrorConnection ] = useState<string>();
  const [ loading, setLoading ] = useState<boolean>( false );
  const [ enableBtn, setEnableBtn ] = useState<boolean>( true );

  // function for load previous data before components load.
  useEffect( () => {
    if( sessionStorage.getItem( 'manualTestData' )){
      const tmp = JSON.parse( sessionStorage.getItem( 'manualTestData' )! );
      setSignalColor( convertSignalToColor( tmp ));
      setData( tmp );
    }
  }, []);

  // function for check auto static test is running or not if auto static test is running, disable test button.
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

  // function for send command to RPi board to get signal stregth and for on UI and if insert database is yes, it will prepare info message for RPi to insert database by mqtt protocol.
  const signalStrength = async ( insertDB: boolean = false ) => {
    setLoading(true);

    let data = '';
    if( insertDB ){
      const location = await Geolocation.getCurrentPosition().catch( e => { return e; });

      if( location.code ){
        setErrorConnection( 'No location service, insert DB failed' );
        insertDB = false;
      }
      else if( props.info === '' ){
        setErrorConnection( 'No database token, insert database failed');
        insertDB = false;
      }
      else data = props.info + ',' + location.coords.latitude.toString() + ',' + location.coords.longitude.toString();
    }

    let url = 'http://' + props.url + '/signalStrength?insert=';
    if( insertDB ) url = url + 'y&dblocation=' + AppSettings.MQT_LOCATION + '&data=' + data;
    else url = url + 'n';

    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );
    const res = await fetch( url, { signal })
      .then((response) => response.json())
      .then((data) => { return data });
    if( res === "F" ){
      setErrorConnection('Cannot connect to serving Cell');
      props.Disconnect("F");
      return;
    }
    else if( signal.aborted ){
      setErrorConnection('Cannot connect to RPi');
      props.Disconnect("D");
      return;
    }
    setData( res );
    setSignalColor( convertSignalToColor( res ));
      
    saveSession( res );
    setLoading(false);
  };

  // function for start test.
  const startTest = ( insertDB: boolean = false ) => {
    setStartTestAlert( false );
    clearMeasure();
    signalStrength( insertDB )
  };

  // function for convert UI color to match the signal strength values.
  const convertSignalToColor = ( d: any ): signalColorInterface => {
    return {
      "scRSSI": AppSettings.getColorRssiRsrp( d[ 'scRSSI' ] ),
      "scRSRP": AppSettings.getColorRssiRsrp( d[ 'scRSRP' ] ),
      "scSINR": AppSettings.getColorSinr( d[ 'scSINR' ] ),
      "scRSRQ": AppSettings.getColorRsrq( d[ 'scRSRQ' ] ),
      "n1RSSI": AppSettings.getColorRssiRsrp( d[ 'n1RSSI' ] ),
      "n1RSRP": AppSettings.getColorRssiRsrp( d[ 'n1RSRP' ] ),
      "n1SINR": AppSettings.getColorSinr( d[ 'n1SINR' ] ),
      "n1RSRQ": AppSettings.getColorRsrq( d[ 'n1RSRQ' ] ),
      "n2RSSI": AppSettings.getColorRssiRsrp( d[ 'n2RSSI' ] ),
      "n2RSRP": AppSettings.getColorRssiRsrp( d[ 'n2RSRP' ] ),
      "n2SINR": AppSettings.getColorSinr( d[ 'n2SINR' ] ),
      "n2RSRQ": AppSettings.getColorRsrq( d[ 'n2RSRQ' ] ),
      "n3RSSI": AppSettings.getColorRssiRsrp( d[ 'n3RSSI' ] ),
      "n3RSRP": AppSettings.getColorRssiRsrp( d[ 'n3RSRP' ] ),
      "n3SINR": AppSettings.getColorSinr( d[ 'n3SINR' ] ),
      "n3RSRQ": AppSettings.getColorRsrq( d[ 'n3RSRQ' ] ),
    };
  };

  // function for save data to session storage.
  const saveSession = ( res: any ) => {
    sessionStorage.setItem( 'manualTestData', JSON.stringify(res) );
  };

  // function for clear alert message.
  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  // function for clear value info.
  const clearMeasure = () => {
    setData( null );
    sessionStorage.removeItem( 'manualTestData' );
  };

  return (
    <IonContent>
      <IonGrid fixed={ true }>
        <IonRow>
          <IonCol>
            <IonButton onClick={ () => setStartTestAlert( true ) } disabled={ !enableBtn } expand="full">Test</IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>Serving Cell ID: { !data? "X": data.scPCID }</IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6" class="ion-text-center">
            <IonCard color={ !data? "black": signalColor?.scRSSI }>
              <IonCardContent>RSSI: { !data? "00": data.scRSSI }</IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6" class="ion-text-center">
            <IonCard color={ !data? "black": signalColor?.scRSRP }>
              <IonCardContent>RSRP: { !data? "00": data.scRSRP }</IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6" class="ion-text-center">
            <IonCard color={ !data? "black": signalColor?.scSINR }>
              <IonCardContent>SINR: { !data? "00": data.scSINR }</IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6" class="ion-text-center">
            <IonCard color={ !data? "black": signalColor?.scRSRQ }>
              <IonCardContent>RSRQ: { !data? "00": data.scRSRQ }</IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>Neighbor Cell</IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="4">
            <IonCard color="light" class="ion-text-center">
              <IonCardHeader>
                <IonCardSubtitle>
                  1st Cell<br/><IonChip>{ !data? "X": data.n1PCID }</IonChip>
                </IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                <IonChip color={ !data? "black": signalColor?.n1RSSI }>{ !data? "00": data.n1RSSI }</IonChip><br/>
                <IonChip color={ !data? "black": signalColor?.n1RSRP }>{ !data? "00": data.n1RSRP }</IonChip><br/>
                <IonChip color={ !data? "black": signalColor?.n1SINR }>{ !data? "00": data.n1SINR }</IonChip><br/>
                <IonChip color={ !data? "black": signalColor?.n1RSRQ }>{ !data? "00": data.n1RSRQ }</IonChip>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="4">
            <IonCard color="light" class="ion-text-center">
              <IonCardHeader>
                <IonCardSubtitle>
                  2nd Cell<br/><IonChip>{ !data? "X": data.n2PCID }</IonChip>
                </IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                <IonChip color={ !data? "black": signalColor?.n2RSSI }>{ !data? "00": data.n2RSSI }</IonChip><br/>
                <IonChip color={ !data? "black": signalColor?.n2RSRP }>{ !data? "00": data.n2RSRP }</IonChip><br/>
                <IonChip color={ !data? "black": signalColor?.n2SINR }>{ !data? "00": data.n2SINR }</IonChip><br/>
                <IonChip color={ !data? "black": signalColor?.n2RSRQ }>{ !data? "00": data.n2RSRQ }</IonChip>
              </IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="4">
            <IonCard color="light" class="ion-text-center">
              <IonCardHeader>
                <IonCardSubtitle>
                  3rd Cell<br/><IonChip>{ !data? "X": data.n3PCID }</IonChip>
                </IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                <IonChip color={ !data? "black": signalColor?.n3RSSI }>{ !data? "00": data.n3RSSI }</IonChip><br/>
                <IonChip color={ !data? "black": signalColor?.n3RSRP }>{ !data? "00": data.n3RSRP }</IonChip><br/>
                <IonChip color={ !data? "black": signalColor?.n3SINR }>{ !data? "00": data.n3SINR }</IonChip><br/>
                <IonChip color={ !data? "black": signalColor?.n3RSRQ }>{ !data? "00": data.n3RSRQ }</IonChip>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonAlert 
          isOpen={ startTestAlert }
          message={ 'Do you want to insert data to Database?' }
          buttons={[
            { text: "Yes", handler: () => startTest( true ) },
            { text: "No", handler: () => startTest( false ) }
          ]}
        />
        <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Ok", handler: clearErrorConnection }]} />
        <IonLoading isOpen={loading} message={'Please Wait...'} backdropDismiss={ false }/>
      </IonGrid>
    </IonContent>
  );
};
export default ManualCheck;
