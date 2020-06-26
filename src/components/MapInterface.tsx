import React, { useState, useEffect } from "react";
import { IonLoading, IonLabel, useIonViewWillEnter, useIonViewDidEnter, } from "@ionic/react"
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Plugins } from "@capacitor/core";
import { AppSettings } from "../AppSettings";

const { Geolocation } = Plugins;

const MapInterface: React.FC<{
  showValue: "rssi" | "rsrp" | "sinr" | "rsrq",
}> = (props) => {

  // const [ isMapLoaded, setIsMapLoaded ] = useState< boolean >( false );
  const [ isLoaded, setIsLoaded ] = useState< boolean >( false );
  const [ info, setInfo ] = useState<{ lat: number, lng: number, data: number }>();
  const [ isInfo, setIsInfo ] = useState< boolean >( false );
  const [ center, setCenter ] = useState< google.maps.LatLng >( new google.maps.LatLng( 13.7625293, 100.5655906 ) ); // Default @ True Building
  const [ mapOBJ, setMapOBJ ] = useState< google.maps.Map >();
  const [ mapBound, setMapBound ] = useState< google.maps.LatLngBounds >();
  const [ markers, setMarkers ] = useState<{ 
    latitude: number, 
    longitude: number, 
    rssi: number, 
    rsrp: number,
    sinr: number,
    rsrq: number,
    _id: { $oid: string } 
  }[]>([]);

  useIonViewWillEnter( () => {
    const getLocation = async () => {
      const tmp = await Geolocation.getCurrentPosition();
      setCenter( new google.maps.LatLng( tmp.coords.latitude, tmp.coords.longitude ));
    };
    getLocation()
  });

  useIonViewDidEnter( () => {
    const loadData = async () => {
      await fetch( AppSettings.DB_LOCATION + '' )
        .then( response => response.json() )
        .then( data => 
          {  
            setMarkers(data);
          }
      );
    }
    loadData();
    setIsLoaded( true );
  });

  useEffect( () => {
    const reloadMarker = async () => {
      if( !mapBound ) console.log("lololol");
      if( !mapBound?.contains( new google.maps.LatLng( info?.lat!, info?.lng!) ) ) setIsInfo(false);
      // console.log(mapBound?.getNorthEast().lat());
    };
    reloadMarker();
  }, [ mapBound ]);

  useEffect( () => {
    setIsInfo(false);
  }, [ props.showValue ]);

  const containerStyle = {
    width: '100%',
    height: '80%',
  }

  const divStyle = {
    background: `white`,
    border: `1px solid #ccc`,
    padding: 7
  }
  
  const onMapLoad = async ( map: google.maps.Map ) => {
    // setIsMapLoaded( true );
    setMapOBJ( map );
  };

  // const onScriptLoad = async () => {
  //   await fetch( AppSettings.DB_LOCATION + '' )
  //     .then( response => response.json() )
  //     .then( data => 
  //       {  
  //         setMarkers(data);
  //       }
  //   );
  //   if( availableFeatures.watchPosition ){
  //     getPosition({ timeout: 30000 });
  //     setCenter( new google.maps.LatLng( currentPosition?.coords.latitude!, currentPosition?.coords.longitude! ));
  //   }
  //   else{
  //     setCenter( new google.maps.LatLng( { lat: 13.7625293, lng: 100.5655906 })); //TRUE Building
  //   }
  // };

  const boundChange = () => {
    setCenter( new google.maps.LatLng( mapOBJ?.getCenter().lat()!, mapOBJ?.getCenter().lng()! ) );
    setMapBound( mapOBJ?.getBounds()! );
  };

  const convertDataToIcon = ( data: number ) => {
    if( props.showValue === "rssi" || props.showValue === "rsrp" ) return createPinSymbol( colorRssiRsrp(data) );
    else if( props.showValue === "sinr" ) return createPinSymbol( colorSinr(data) );
    else if( props.showValue === "rsrq" ) return createPinSymbol( colorRsrq(data) );
    else return createPinSymbol("black");
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

  const colorRssiRsrp = ( data: number ) => {
    if( data >= -80 ) return "blue"
    else if( data < -80 && data >= -90 ) return "aqua"
    else if( data < -90 && data >= -95 ) return "darkgreen"
    else if( data < -95 && data >= -100 ) return "greenyellow"
    else if( data < -100 && data >= -110 ) return "yellow"
    else if( data < -110 && data >= -116 ) return "red"
    else if( data < -116 && data >= -124 ) return "grey"
    else if( data < -124 ) return "darkblue"
    else return "black"
  };

  const colorSinr = ( data: number ) => {
    if( data >= 20 ) return "purple"
    if( data < 20 && data >= 15 ) return "hotpink"
    if( data < 15 && data >= 10 ) return "goldenrod"
    if( data < 10 && data >= 5 ) return "cornflowerblue"
    if( data < 5 && data >= 0 ) return "orchid"
    if( data < 0 ) return "gray"
    else return "black"
  };

  const colorRsrq = ( data: number ) => {
    if( data >= -6 ) return "purple"
    if( data < -6 && data >= -9 ) return "hotpink"
    if( data < -9 && data >= -11 ) return "cornflowerblue"
    if( data < -11 && data >= -14 ) return "orchid"
    if( data < -14 ) return "gray"
    else return "black"
  };

  const infoWindowPanel = ( lat: number, lng: number, data: number ) => {
    setInfo({ lat: lat, lng: lng, data: data });
    setIsInfo( true );
  };

  return (
    <GoogleMap mapContainerStyle={ containerStyle } 
        zoom={ 14 } 
        onLoad={ onMapLoad } 
        center={ center } 
        onDragEnd={ boundChange }>
        {
          markers.map( data => (
            <Marker key={ data._id.$oid } 
              position={{ lat: data.latitude, lng: data.longitude }} 
              onClick={ e => infoWindowPanel( data.latitude, data.longitude, data[props.showValue] )} 
              options={{ icon: convertDataToIcon( data[props.showValue] ) }}
            />
          ))
        }
        {
          !isInfo || <InfoWindow position={{ lat: info!.lat, lng: info!.lng }} onCloseClick={ () => setIsInfo(false) }>
            <div style={ divStyle }>
              <IonLabel color="primary">{ info!.data }</IonLabel>
            </div>
          </InfoWindow>
        }
      <IonLoading isOpen={ !isLoaded } message={ 'Please Wait...' } backdropDismiss={ true } />
    </GoogleMap>
  );
};

export default MapInterface;