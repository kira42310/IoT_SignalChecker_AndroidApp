import React, { useState, useEffect, useRef, } from "react";
import {
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonButton,
  IonAlert,
  IonLoading,
  IonInput,
  IonIcon,
} from "@ionic/react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Plugins, GeolocationPosition } from "@capacitor/core";
import { trash } from "ionicons/icons";
import { AppSettings } from "../AppSettings";
import { signalDataInterface, markerInterface } from "../AppFunction";

const { Geolocation, } = Plugins;

const MovingCheck: React.FC<{
  Disconnect: ( res: string) => void,
  onAutoTest: ( tname: string ) => void,
  offAutoTest: ( tname: string ) => void,
  info: string,
  url: string,
}> = (props) => {

  const [ intervalHour, setIntervalHour ] = useState<string>( AppSettings.CHECK_INTERVAL_HOUR );
  const [ intervalMin, setIntervalMin ] = useState<string>( AppSettings.CHECK_INTERVAL_MIN );
  const [ intervalSec, setIntervalSec ] = useState<string>( AppSettings.CHECK_INTERVAL_SEC );
  const [ mapCenter, setMapCenter ] = useState<google.maps.LatLng>( new google.maps.LatLng( 13.7625293, 100.5655906 ) ); // Default @ True Building
  const [ errorConnection, setErrorConnection ] = useState<string>();
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ startStopBtn, setStartStopBtn ] = useState<boolean>(true);
  const [ startTestAlert, setStartTestAlert ] = useState<boolean>(false);
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
    else data = props.info + '_' + location.coords.latitude + '_' + location.coords.longitude + '_';

    let url = 'http://' + props.url + '/signalStrength?insert=';
    if( insertDB ) url = url + 'y&dblocation=' + AppSettings.DB_LOCATION + '&data=' + data;
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
    props.onAutoTest( "moving" );
    setStartStopBtn( false );
    const itv: number = ( +( intervalHour ) * 3600000 ) + ( +( intervalMin ) * 60000 ) + ( +( intervalSec ) * 1000 );
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
  }

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
  }

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
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
      <IonLoading isOpen={loading} message={'Please Wait...'} backdropDismiss={true}/>
    </IonGrid>
  );
};
export default MovingCheck;
