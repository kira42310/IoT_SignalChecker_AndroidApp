import React, { useState, useEffect, } from "react";
import {
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonAlert,
  IonLoading,
  IonCard,
  IonCardContent,
  IonIcon,
  IonContent,
  IonPicker,
} from "@ionic/react";
import { PickerColumn } from "@ionic/core";
import { trash } from "ionicons/icons";
import { Plugins } from "@capacitor/core";
import { AppSettings } from "../AppSettings";

const { Geolocation, } = Plugins;

const StaticCheck: React.FC<{
  Disconnect: ( res: string) => void,
  onAutoTest: ( tname: string ) => void,
  offAutoTest: ( tname: string ) => void,
  url: string,
  info: string,
}> = (props) => {
  const [ intervalMin, setIntervalMin ] = useState<number>( AppSettings.CHECK_INTERVAL_MIN );
  const [ intervalSec, setIntervalSec ] = useState<number>( AppSettings.CHECK_INTERVAL_SEC );
  const [ startStopBtn, setStartStopBtn ] = useState<boolean>( true );
  const [ startTestAlert, setStartTestAlert ] = useState<boolean>( false );
  const [ errorConnection, setErrorConnection ] = useState<string>();
  const [ loading, setLoading ] = useState<boolean>( false );
  const [ minPicker, setMinPicker ] = useState<boolean>( false );
  const [ secPicker, setSecPicker ] = useState<boolean>( false );
  const [ signalData, setSignalData ] = useState<{ 
    'scRSSI': number, 'scRSRP': number, 'scSINR': number, 'scRSRQ': number, 'scPCID': string 
  } | null >( null );
  const [ signalColor, setSignalColor ] = useState<{
    'scRSSI': string, 'scRSRP': string, 'scSINR': string, 'scRSRQ': string, 
  }>();

  useEffect( () => {
    const checkRPiState = async () => {
      let url = 'http://' + props.url + '/staticstatus';

      const controller = new AbortController();
      const signal = controller.signal;
      setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );
      const res = await fetch( url, { signal })
        .then( response => response.json() )
        .then( d => { return d; });
      if( res === 'P' ){
        setStartStopBtn( false );
      }
      else if( res === 'F' ){
        setStartStopBtn( true );
      }
      else if( signal.aborted ){
        props.Disconnect( 'D' );
        setErrorConnection( 'Cannot connect to RPi' );
      }
    };

    if( sessionStorage.getItem( 'staticTestData' )){
      const tmp = JSON.parse( sessionStorage.getItem( 'staticTestData' )! );
      setSignalColor( convertSignalToColor( tmp ));
      setSignalData( tmp );
    }
    checkRPiState();
  }, [ props ]);


  const startTest = async () => {
    setStartTestAlert( false );
    setStartStopBtn( false );
    setLoading( true );

    // interval in python is sec not millisec.
    const itv: number = ( intervalMin * 60 ) + intervalSec;

    const location = await Geolocation.getCurrentPosition().catch( e => { return e; });

    let data = '';
    if( location.code ){ 
      setErrorConnection( 'No location service, insert DB failed' );
    }
    else if( props.info === '' ){
      setErrorConnection( 'No database token, insert database failed');
    }
    else data = props.info + '_' + location.coords.latitude + '_' + location.coords.longitude + '_';

    let url = 'http://' + props.url + '/starttest?interval=' + itv.toString() + '&dblocation=' + AppSettings.MQT_LOCATION + '&data=' + data;

    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );
    await fetch( url, { signal })
      .then( response => response.json() )
      .then( d => { return d; });
    if( signal.aborted ){
      setLoading( false );
      setStartStopBtn( true );
      setErrorConnection( 'Cannot connect to RPi' );
    }
    setLoading( false );
  };

  const stopTest = async () => {
    let url = 'http://' + props.url + '/stoptest';

    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );
    const res = await fetch( url, { signal })
      .then( response => response.json() )
      .then( d => { return d; });
    if( signal.aborted ){
      setErrorConnection( 'Cannot connect to RPi' );
      return ;
    }
    setStartStopBtn( true );

    const d = {
      'scRSSI': +res[0],
      'scRSRP': +res[1],
      'scSINR': +res[2],
      'scRSRQ': +res[3],
      'scPCID': res[4],
    };
    setSignalData( d );
    sessionStorage.setItem( 'staticTestData', JSON.stringify( d ) );
  };


  const convertSignalToColor = ( d: any ) => {
    return {
      "scRSSI": AppSettings.getColorRssiRsrp( d[ 'scRSSI' ] ),
      "scRSRP": AppSettings.getColorRssiRsrp( d[ 'scRSRP' ] ),
      "scSINR": AppSettings.getColorSinr( d[ 'scSINR' ] ),
      "scRSRQ": AppSettings.getColorRsrq( d[ 'scRSRQ' ] ),
    };
  };

  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  const clearMeasure = () => {
    setSignalData( null );
    sessionStorage.removeItem( 'staticTestData' );
  };

  const secColumn: PickerColumn = {
    name: "sec",
    options: [
      { text: '0 sec', value: 0 },
      { text: '15 sec', value: 15 },
      { text: '30 sec', value: 30 },
      { text: '45 sec', value: 45 },
    ],
  };

  const minColumn: PickerColumn = {
    name: "min",
    options: [
      { text: '1 min', value: 1 },
      { text: '5 min', value: 5 },
      { text: '10 min', value: 10 },
      { text: '15 min', value: 15 },
      { text: '30 min', value: 30 },
      { text: '45 min', value: 45 },
      { text: '60 min', value: 60 },
    ]
  };

  return (
    <IonContent>
      <IonGrid fixed={ true }>
        <IonRow>
          <IonCol size="5">
            <IonButton disabled={ !startStopBtn } onClick={ () => setStartTestAlert( true ) } expand="full">Start Test</IonButton>
          </IonCol>
          <IonCol size="5">
            <IonButton disabled={ startStopBtn } onClick={ stopTest } expand="full">Stop Test</IonButton>
          </IonCol>
          <IonCol size="2">
            <IonButton disabled={ !startStopBtn } onClick={ () => clearMeasure() }  expand="full" >
              <IonIcon slot="icon-only" icon={ trash } />
            </IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonLabel>Minutes</IonLabel>
            <IonButton onClick={ () => setMinPicker( true )} expand="full" disabled={ !startStopBtn }>{ intervalMin } min.</IonButton>
            <IonPicker 
              isOpen={ minPicker } 
              columns={[ minColumn ]} 
              buttons={[
                {
                  text: 'Confirm',
                  handler: e => {
                    setIntervalMin( e.min.value );
                    setMinPicker( false );
                  }
                }
              ]}
            />
          </IonCol>
          <IonCol>
            <IonLabel>Seconds</IonLabel>
            <IonButton onClick={ () => setSecPicker( true )} expand="full" disabled={ !startStopBtn }>{ intervalSec } Sec.</IonButton>
            <IonPicker 
              isOpen={ secPicker } 
              columns={[ secColumn ]} 
              buttons={[
                {
                  text: 'Confirm',
                  handler: e => {
                    setIntervalSec( e.sec.value );
                    setSecPicker( false );
                  }
                }
              ]}
            />
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>Serving Cell ID: { !signalData? "X": signalData.scPCID }</IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6" class="ion-text-center">
            <IonCard color={ !signalData? "black": signalColor?.scRSSI }>
              <IonCardContent>RSSI: { !signalData? "00": signalData.scRSSI }</IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6" class="ion-text-center">
            <IonCard color={ !signalData? "black": signalColor?.scRSRP }>
              <IonCardContent>RSRP: { !signalData? "00": signalData.scRSRP }</IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6" class="ion-text-center">
            <IonCard color={ !signalData? "black": signalColor?.scSINR }>
              <IonCardContent>SINR: { !signalData? "00": signalData.scSINR }</IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="6" class="ion-text-center">
            <IonCard color={ !signalData? "black": signalColor?.scRSRQ }>
              <IonCardContent>RSRQ: { !signalData? "00": signalData.scRSRQ }</IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonAlert 
          isOpen={ startTestAlert }
          message={ 'Do you want to start measurement?' }
          buttons={[
            { text: "Yes", handler: () => startTest() },
            { text: "No", handler: () => setStartTestAlert( false )}
          ]}
        />
        <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
        <IonLoading 
          isOpen={loading} 
          message={'Please Wait...'} 
          backdropDismiss={true}
          onDidDismiss={ () => setLoading( false )}
        />
      </IonGrid>
    </IonContent>
  );
};
export default StaticCheck;
