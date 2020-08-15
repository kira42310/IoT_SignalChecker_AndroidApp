import React, { useState, useRef, useEffect, } from "react";
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
  IonIcon,
  IonCardSubtitle,
  IonCardHeader,
  IonChip,
} from "@ionic/react";
import { trash } from "ionicons/icons";
import { Plugins } from "@capacitor/core";
import { AppSettings } from "../AppSettings";
import { signalDataInterface, signalColorInterface } from "../AppFunction";

const { Geolocation, } = Plugins;

const StaticCheck: React.FC<{
  Disconnect: ( res: string) => void,
  onAutoTest: ( tname: string ) => void,
  offAutoTest: ( tname: string ) => void,
  insertDB: ( lat: number, lng: number, d: signalDataInterface ) => void,
  url: string,
}> = (props) => {
  const [ intervalHour, setIntervalHour ] = useState<string>( AppSettings.CHECK_INTERVAL_HOUR );
  const [ intervalMin, setIntervalMin ] = useState<string>( AppSettings.CHECK_INTERVAL_MIN );
  const [ intervalSec, setIntervalSec ] = useState<string>( AppSettings.CHECK_INTERVAL_SEC );
  const [ data, setData ] = useState<signalDataInterface | null>(null);
  const [ signalColor, setSignalColor ] = useState<signalColorInterface>();
  const [ startStopBtn, setStartStopBtn ] = useState<boolean>( true );
  const [ startTestAlert, setStartTestAlert ] = useState<boolean>( false );
  const [ insertData, setInsertData ] = useState<boolean>( false );
  const [ errorConnection, setErrorConnection ] = useState<string>();
  const [ loading, setLoading ] = useState<boolean>(false);
  const trackerInterval = useRef<any>( 0 );
  const averageCounter = useRef<number>( 0 );
  const averagePrevious = useRef<{
    'scRSSI': number,
    'scRSRP': number,
    'scSINR': number,
    'scRSRQ': number,
  }>({ 'scRSSI': 0, 'scRSRP': 0, 'scSINR': 0, 'scRSRQ': 0});
  const n1Previous = useRef<{
    'rssi': string,
    'rsrp': string,
    'sinr': string,
    'rsrq': string,
    'pcid': string,
  } | null >( null );
  const n2Previous = useRef<{
    'rssi': string,
    'rsrp': string,
    'sinr': string,
    'rsrq': string,
    'pcid': string,
  } | null >( null );
  const n3Previous = useRef<{
    'rssi': string,
    'rsrp': string,
    'sinr': string,
    'rsrq': string,
    'pcid': string,
  } | null >( null );

  useEffect( () => {
    if( sessionStorage.getItem( 'staticTestData' )){
      const tmp = JSON.parse( sessionStorage.getItem( 'staticTestData' )! );
      setSignalColor( convertSignalToColor( tmp ));
      setData( tmp );
    }
    return ( () => clearInterval( trackerInterval.current ) );
  }, []);

  const signalStrength = async () => {
    setLoading(true);
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );
    const res = await fetch("http://" + props.url + "/signalStrength", { signal })
      .then((response) => response.json())
      .then((data) => { return data });
    if( res === "F" ){
      setErrorConnection('Cannot connect to serving Cell');
      stopTest();
      props.Disconnect("F");
      return;
    }
    else if( signal.aborted ){
      setErrorConnection('Cannot connect to RPi');
      stopTest();
      props.Disconnect("D");
      return;
    }
    const tmp: signalDataInterface = prepareDataAndAverage( res );
    setData( tmp );
    setSignalColor( convertSignalToColor( tmp ));
    
    setLoading(false);
  };

  const startTest = ( insertDB: boolean = false ) => {
    setStartTestAlert( false );
    props.onAutoTest( "static" );
    setStartStopBtn( false );
    clearMeasure();
    setInsertData( insertDB )
    const itv: number = ( +( intervalHour ) * 3600000 ) + ( +( intervalMin ) * 60000 ) + ( +( intervalSec ) * 1000 );
    signalStrength()
    const id = setInterval( () => signalStrength() , itv );
    trackerInterval.current = id;
  };

  const stopTest = async () => {
    clearInterval( trackerInterval.current );
    if( insertData && data !== null ) {
      const location = await Geolocation.getCurrentPosition().catch( e => { return e; });
      if( !location.code ) props.insertDB( location.coords.latitude, location.coords.longitude, data );
      else setErrorConnection( 'No location service, insert DB failed' );
      setInsertData( false );
    }
    sessionStorage.setItem( 'staticTestData', JSON.stringify( data ) );
    props.offAutoTest( "static" );
    setStartStopBtn( true );
  };

  const prepareDataAndAverage = ( newData: any ): signalDataInterface => {
    averageCounter.current += 1;
    const n1: string[] = select1stNeighbor( newData );
    const n2: string[] = select2ndNeighbor( newData );
    const n3: string[] = select3rdNeighbor( newData );
    const rssi: string = averageData( +newData['scRSSI'], averagePrevious.current.scRSSI );
    const rsrp: string = averageData( +newData['scRSRP'], averagePrevious.current.scRSRP );
    const sinr: string = averageData( +newData['scSINR'], averagePrevious.current.scSINR );
    const rsrq: string = averageData( +newData['scRSRQ'], averagePrevious.current.scRSRQ );
    averagePrevious.current = { 'scRSSI': +rssi, 'scRSRP': +rsrp, 'scSINR': +sinr, 'scRSRQ': +rsrq };
    n1Previous.current = { 'rssi': n1[0], 'rsrp': n1[1], 'sinr': n1[2], 'rsrq': n1[3], 'pcid': n1[4] };
    n2Previous.current = { 'rssi': n2[0], 'rsrp': n2[1], 'sinr': n2[2], 'rsrq': n2[3], 'pcid': n2[4] };
    n3Previous.current = { 'rssi': n3[0], 'rsrp': n3[1], 'sinr': n3[2], 'rsrq': n3[3], 'pcid': n3[4] };
    return {
      "scRSSI": rssi,
      "scRSRP": rsrp,
      "scSINR": sinr,
      "scRSRQ": rsrq,
      "scPCID": String( newData['scPCID'] ),
      "n1RSSI": n1[0],
      "n1RSRP": n1[1],
      "n1SINR": n1[2],
      "n1RSRQ": n1[3],
      "n1PCID": n1[4],
      "n2RSSI": n2[0],
      "n2RSRP": n2[1],
      "n2SINR": n2[2],
      "n2RSRQ": n2[3],
      "n2PCID": n2[4],
      "n3RSSI": n3[0],
      "n3RSRP": n3[1],
      "n3SINR": n3[2],
      "n3RSRQ": n3[3],
      "n3PCID": n3[4]
    };
  };

  const averageData = ( newValue: number, oldValue: number ): string => {
    return String(((( oldValue * ( averageCounter.current-1 ) ) + newValue )/averageCounter.current).toPrecision(4));
  };

  const select1stNeighbor = ( d: any ): string[] => {
    if( n1Previous.current === null ) return [ 
      String(d['n1RSSI']), 
      String(d['n1RSRP']), 
      String(d['n1SINR']), 
      String(d['n1RSRQ']), 
      String(d['n1PCID']) 
    ];
    if( n1Previous.current.pcid !== "0" ) return [ 
      n1Previous.current.rssi, 
      n1Previous.current.rsrp,
      n1Previous.current.sinr, 
      n1Previous.current.rsrq,
      n1Previous.current.pcid,
    ];
    let i: number;
    for( i = 1; i <= 3; ++i ){
      if( String(d['n'+i+'PCID']) === "0" ) continue;
      else if( n1Previous.current.pcid === "0" ){ 
        if( String(d['n'+i+'PCID']) === n2Previous.current?.pcid ) continue;
        else if( String(d['n'+i+'PCID']) === n3Previous.current?.pcid ) continue;
        return [ 
          String(d['n'+i+'RSSI']), 
          String(d['n'+i+'RSRP']), 
          String(d['n'+i+'SINR']), 
          String(d['n'+i+'RSRQ']), 
          String(d['n'+i+'PCID']) ];
      }
    }
    return [ "0","0","0","0","0" ];
  };

  const select2ndNeighbor = ( d: any ): string[] => {
    if( n2Previous.current === null ) return [ 
      String(d['n2RSSI']), 
      String(d['n2RSRP']), 
      String(d['n2SINR']), 
      String(d['n2RSRQ']), 
      String(d['n2PCID']) 
    ];
    if( n2Previous.current.pcid !== "0" ) return [ 
      n2Previous.current.rssi, 
      n2Previous.current.rsrp,
      n2Previous.current.sinr, 
      n2Previous.current.rsrq,
      n2Previous.current.pcid,
    ];
    let i: number;
    for( i = 1; i <= 3; ++i ){
      if( String(d['n'+i+'PCID']) === "0" ) continue;
      else if( n2Previous.current.pcid === "0" ){
        if( String(d['n'+i+'PCID']) === n1Previous.current?.pcid ) continue;
        else if( String(d['n'+i+'PCID']) === n3Previous.current?.pcid ) continue;
        return [ 
          String(d['n'+i+'RSSI']), 
          String(d['n'+i+'RSRP']), 
          String(d['n'+i+'SINR']), 
          String(d['n'+i+'RSRQ']), 
          String(d['n'+i+'PCID']) ];
      }
    }
    return [ "0","0","0","0","0" ];
  };

  const select3rdNeighbor = ( d: any ): string[] => {
    if( n3Previous.current === null ) return [ 
      String(d['n3RSSI']), 
      String(d['n3RSRP']), 
      String(d['n3SINR']), 
      String(d['n3RSRQ']), 
      String(d['n3PCID']) 
    ];
    if( n3Previous.current.pcid !== "0" ) return [       
      n3Previous.current.rssi, 
      n3Previous.current.rsrp,
      n3Previous.current.sinr, 
      n3Previous.current.rsrq,
      n3Previous.current.pcid,
    ];
    let i: number;
    for( i = 1; i <= 3; ++i ){
      if( String(d['n'+i+'PCID']) === "0" ) continue;
      else if( n3Previous.current.pcid === "0" ){
        if( String(d['n'+i+'PCID']) === n1Previous.current?.pcid ) continue;
        else if( String(d['n'+i+'PCID']) === n2Previous.current?.pcid ) continue;
        return [ 
          String(d['n'+i+'RSSI']), 
          String(d['n'+i+'RSRP']), 
          String(d['n'+i+'SINR']), 
          String(d['n'+i+'RSRQ']), 
          String(d['n'+i+'PCID']) ];
      }
    }
    return [ "0","0","0","0","0" ];
  };

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

  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  const clearMeasure = () => {
    setData( null );
    averagePrevious.current = { 'scRSSI': 0, 'scRSRP': 0, 'scSINR': 0, 'scRSRQ': 0 };
    averageCounter.current = 0;
    n1Previous.current = null;
    n2Previous.current = null;
    n3Previous.current = null;
    sessionStorage.removeItem( 'staticTestData' );
  };

  return (
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
          <IonLabel>Hour(s)</IonLabel>
          <IonItem>
            <IonInput disabled={ !startStopBtn } 
              value={ intervalHour } 
              debounce={ 500 } 
              type="tel"
              minlength={ 0 }
              maxlength={ 2 }
              onIonChange={ e => setIntervalHour( e.detail.value! )} 
            />
          </IonItem>
        </IonCol>
        <IonCol>
          <IonLabel>Minute(s)</IonLabel>
          <IonItem>
            <IonInput disabled={ !startStopBtn } 
              value={ intervalMin } 
              debounce={ 500 } 
              type="tel"
              minlength={ 0 }
              maxlength={ 2 }
              onIonChange={ e => setIntervalMin( e.detail.value! )} 
            />
          </IonItem>
        </IonCol>
        <IonCol>
          <IonLabel>Second(s)</IonLabel>
          <IonItem>
            <IonInput disabled={ !startStopBtn } 
              value={ intervalSec } 
              type="tel"
              minlength={ 0 }
              maxlength={ 2 }
              onIonChange={ e => setIntervalSec( e.detail.value! )}
            />
          </IonItem>
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
              <IonChip color={ !data? "black": signalColor?.n1RSSI }>{ !data? "00": data.n2RSSI }</IonChip><br/>
              <IonChip color={ !data? "black": signalColor?.n1RSRP }>{ !data? "00": data.n2RSRP }</IonChip><br/>
              <IonChip color={ !data? "black": signalColor?.n1SINR }>{ !data? "00": data.n2SINR }</IonChip><br/>
              <IonChip color={ !data? "black": signalColor?.n1RSRQ }>{ !data? "00": data.n2RSRQ }</IonChip>
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
              <IonChip color={ !data? "black": signalColor?.n1RSSI }>{ !data? "00": data.n3RSSI }</IonChip><br/>
              <IonChip color={ !data? "black": signalColor?.n1RSRP }>{ !data? "00": data.n3RSRP }</IonChip><br/>
              <IonChip color={ !data? "black": signalColor?.n1SINR }>{ !data? "00": data.n3SINR }</IonChip><br/>
              <IonChip color={ !data? "black": signalColor?.n1RSRQ }>{ !data? "00": data.n3RSRQ }</IonChip>
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
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
      <IonLoading isOpen={loading} message={'Please Wait...'} backdropDismiss={true}/>
    </IonGrid>
  );
};
export default StaticCheck;
