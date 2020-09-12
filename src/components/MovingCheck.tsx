import React, { useState, useEffect, useRef, } from "react";
import {
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonAlert,
  IonLoading,
  IonIcon,
  IonPicker,
} from "@ionic/react";
import { PickerColumn } from "@ionic/core";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Plugins, GeolocationPosition } from "@capacitor/core";
import { trash } from "ionicons/icons";
import { AppSettings } from "../AppSettings";
import { markerInterface } from "../AppFunction";

const { Geolocation, } = Plugins;

const MovingCheck: React.FC<{
  Disconnect: ( res: string) => void,
  onAutoTest: ( tname: string ) => void,
  offAutoTest: ( tname: string ) => void,
  info: string,
  url: string,
}> = (props) => {

  const [ intervalMin, setIntervalMin ] = useState<number>( AppSettings.CHECK_INTERVAL_MIN );
  const [ intervalSec, setIntervalSec ] = useState<number>( AppSettings.CHECK_INTERVAL_SEC );
  const [ mapCenter, setMapCenter ] = useState<google.maps.LatLng>( new google.maps.LatLng( 13.7625293, 100.5655906 ) ); // Default @ True Building
  const [ errorConnection, setErrorConnection ] = useState<string>();
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ startStopBtn, setStartStopBtn ] = useState<boolean>(true);
  const [ startTestAlert, setStartTestAlert ] = useState<boolean>(false);
  const [ secPicker, setSecPicker ] = useState<boolean>( false );
  const [ minPicker, setMinPicker ] = useState<boolean>( false );
  const [ update, setUpdate ] = useState(0);
  const markers = useRef<markerInterface[]>([]);
  const trackerInterval = useRef<any>( 0 );

  useEffect( () => {
    getLocation();
    if( sessionStorage.getItem( 'movingTestMarker' ) ){
      markers.current = JSON.parse( sessionStorage.getItem( 'movingTestMarker' )! );
    }
    return ( () => clearInterval( trackerInterval.current ) );
  },[]);

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
        setStartStopBtn( false );
      }
      else if( signal.aborted ){
        props.Disconnect( 'D' );
        setErrorConnection( 'Cannot connect to RPi' );
      }
    };
    checkRPiState();
  }, [ props ]);

  const getLocation = async () => {
    const tmp = await Geolocation.getCurrentPosition().catch( e => { return e; });
    if( !tmp.code ) setMapCenter( new google.maps.LatLng( tmp.coords.latitude, tmp.coords.longitude ));
    else setErrorConnection( 'Location service not available' );
  };

  const signalStrength = async ( insertDB: boolean = false ) => {
    setLoading(true);
    const location = await Geolocation.getCurrentPosition().catch( e => { return e; });

    let data = '';
    if( insertDB && location.code ){ 
      setErrorConnection( 'No location service, insert DB failed' );
      insertDB = false;
    }
    else if( insertDB && props.info === '' ){
      setErrorConnection( 'No database token, insert database failed');
      insertDB = false;
    }
    else data = props.info + ',' + location.coords.latitude + ',' + location.coords.longitude;

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
    
    if( !location.code ){
      markers.current = [ ...markers.current, convertToMarkerData( res, location)];
      setMapCenter( new google.maps.LatLng( location.coords.latitude, location.coords.longitude ));
    }
    else setErrorConnection( 'No location service, operation failed' );
    
    setLoading(false);
  };

  const startTest = ( insertDB: boolean = false ) => {
    setStartTestAlert( false );
    
    // interval in typescript is in millisec not sec
    const itv: number = ( +( intervalMin ) * 60000 ) + ( +( intervalSec ) * 1000 );
    if( itv === 0 ){
      setErrorConnection( 'Interval is 0 second, failed to start' );
      return ;
    }

    setStartStopBtn( false );
    props.onAutoTest( "moving" );
    
    signalStrength( insertDB )
    const id = setInterval( () => signalStrength( insertDB ) , itv );
    trackerInterval.current = id;
  };

  const stopTest = () => {
    clearInterval( trackerInterval.current );
    sessionStorage.setItem( 'movingTestMarker', JSON.stringify( markers.current ) );
    props.offAutoTest( "moving" );
    setStartStopBtn( true );
  };

  const convertToMarkerData = ( data: any, location: GeolocationPosition ): markerInterface => {
    return { 
      '_id': { $oid: Date.now().toString() },
      'latitude': location.coords.latitude, 
      'longitude': location.coords.longitude, 
      'scRSSI': data['scRSSI'],
      'scRSRP': data['scRSRP'],
      'scSINR': data['scSINR'],
      'scRSRQ': data['scRSRQ']
     }
  };

  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  const clearMarker = () => {
    markers.current = markers.current.filter( m => m._id.$oid === "0" );
    sessionStorage.removeItem('movingTestMarker')
    setUpdate( update + 1 )
  };

  const containerStyle = {
    width: '100%',
    height: '75%',
  };

  const convertDataToIcon = ( data: number ) => {
    return createPinSymbol( AppSettings.getColorRssiRsrp( data ) );
  };

  function createPinSymbol( color: string ) {
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#000',
      strokeWeight: 2,
      scale: 1
    };
  };

  const secColumn: PickerColumn = {
    name: "sec",
    options: [
      { text: '0 sec', value: 0 },
      { text: '15 secs', value: 15 },
      { text: '30 secs', value: 30 },
      { text: '45 secs', value: 45 },
    ],
  };

  const minColumn: PickerColumn = {
    name: "min",
    options: [
      { text: '0 min', value: 0 },
      { text: '1 min', value: 1 },
      { text: '5 mins', value: 5 },
      { text: '10 mins', value: 10 },
      { text: '15 mins', value: 15 },
      { text: '30 mins', value: 30 },
      { text: '45 mins', value: 45 },
      { text: '60 mins', value: 60 },
    ]
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
          <IonButton disabled={ !startStopBtn } onClick={ () => clearMarker() }  expand="full" >
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
      <GoogleMap mapContainerStyle={ containerStyle } 
        center={ mapCenter }
        zoom={14}
        options={{ gestureHandling: "none" }}
        >
        {
          markers.current.map( data => (
            <Marker key={ data._id.$oid } 
              position={{ lat: data.latitude, lng: data.longitude }} 
              options={{ icon: convertDataToIcon( data['scRSSI'] ) }}
            />
          ))
        }
      </GoogleMap>

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
  );
};
export default MovingCheck;
