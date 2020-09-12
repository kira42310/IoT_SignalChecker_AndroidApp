import React, { useState, useEffect } from "react";
import { IonLabel, useIonViewWillEnter, IonAlert, } from "@ionic/react"
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Plugins } from "@capacitor/core";
import { AppSettings } from "../AppSettings";
import { markerInterfaceMongo } from "../AppFunction";

const { Geolocation, } = Plugins;

const MapInterface: React.FC<{
  showValue: "scRSSI" | "scRSRP" | "scSINR" | "scRSRQ" ,
  address: string,
}> = (props) => {

  const [ info, setInfo ] = useState<{ lat: number, lng: number, data: number }>();
  const [ isInfo, setIsInfo ] = useState< boolean >( false );
  const [ center, setCenter ] = useState< google.maps.LatLng >( new google.maps.LatLng( 13.7625293, 100.5655906 ) ); // Default @ True Building
  const [ mapOBJ, setMapOBJ ] = useState< google.maps.Map >();
  const [ markers, setMarkers ] = useState< markerInterfaceMongo[] >([]);
  const [ error, setError ] = useState<string>();

  // ion life cycle before load into the page, get lat and lng for google maps.
  useIonViewWillEnter( () => {
    const getLocation = async () => {
      const tmp = await Geolocation.getCurrentPosition().catch( e => { return e; } );
      if( !tmp.code ) setCenter( new google.maps.LatLng( tmp.coords.latitude, tmp.coords.longitude ));
      else setError("Location service not available");
    };
    getLocation()
  });

  // function will trigger when show value is change and clear info window.
  useEffect( () => {
    setIsInfo(false);
  }, [ props.showValue ]);

  // function will trigger when address is change for set the new map center.
  useEffect( () => {
    if( props.address !== "" ) getToNewLocation( props.address );
  }, [ props.address ]);

  // function for clear info window if out of map bound.
  const reloadMarker = async ( mapBound: google.maps.LatLngBounds ) => {
    if( !mapBound?.contains( new google.maps.LatLng( info?.lat!, info?.lng!) ) ) setIsInfo(false);
  };

  // function for load data and create marker that is in the map bound.
  const loadData = async ( latNE: number, lngNE: number, latSW: number, lngSW: number ) => {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );

    await fetch( 'http://' + AppSettings.DB_LOCATION + "/areafind?latNE=" + latNE + "&lngNE=" + lngNE + "&latSW=" + latSW + "&lngSW=" + lngSW, { signal })
      .then( response => response.json() )
      .then( data => { setMarkers( data ); });
  };

  // map style
  const containerStyle = {
    width: '100%',
    height: '80%',
  }

  // info window style
  const divStyle = {
    background: `white`,
    border: `1px solid #ccc`,
    padding: 7
  }
  
  // function will trigger after map is load to get the map object.
  const onMapLoad = async ( map: google.maps.Map ) => {
    setMapOBJ( map );
  };

  // function to check is bound is chenge and load new data in the new map bound.
  const boundChange = () => {
    setCenter( new google.maps.LatLng( mapOBJ?.getCenter().lat()!, mapOBJ?.getCenter().lng()! ) );
    const mapBound = mapOBJ?.getBounds();
    reloadMarker( mapBound! );
    if( !( typeof mapOBJ?.getBounds() === 'undefined') ){
      loadData( mapBound?.getNorthEast().lat()!, mapBound?.getNorthEast().lng()!, mapBound?.getSouthWest().lat()!, mapBound?.getSouthWest().lng()! );
    }
  };

  // function for create marker.
  const convertDataToIcon = ( data: number ) => {
    if( props.showValue === "scRSSI" || props.showValue === "scRSRP" ) return createPinSymbol( AppSettings.getColorRssiRsrp(data) );
    else if( props.showValue === "scSINR" ) return createPinSymbol( AppSettings.getColorSinr(data) );
    else if( props.showValue === "scRSRQ" ) return createPinSymbol( AppSettings.getColorRsrq(data) );
    else return createPinSymbol("black");
  };

  // function for create custom marker with specific color.
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

  // function to set info window with value by latlng.
  const infoWindowPanel = ( lat: number, lng: number, data: number ) => {
    setInfo({ lat: lat, lng: lng, data: data });
    setIsInfo( true );
  };

  // function for clear alert message.
  const clearError = () => {
    setError("");
  };

  // function for reverse geolocation use api from opencage to set the new map center.
  const getToNewLocation = async ( address: string ) => {
    const res = await fetch( 'https://api.opencagedata.com/geocode/v1/json?key='+ AppSettings.OPENCAGE_API_KEY + '&limit=1&q=' + address)
      .then( response => response.json() )
      .then( d => { return d; });
    if( res.results[0] ) setCenter( new google.maps.LatLng( res.results[0].geometry.lat, res.results[0].geometry.lng ));
    else setError( 'Cannot find place name ' + address );
  };

  // function for render google map.
  function getMap() {
    return (
      <GoogleMap mapContainerStyle={ containerStyle } 
          zoom={ 14 } 
          onLoad={ onMapLoad } 
          center={ center } 
          onDragEnd={ boundChange }
          onTilesLoaded={ boundChange }>
          {
            markers.map( data => (
              <Marker key={ data._id.$oid } 
                position={{ lat: +data.latitude.$numberDecimal, lng: +data.longitude.$numberDecimal }} 
                onClick={ e => infoWindowPanel( +data.latitude.$numberDecimal, +data.longitude.$numberDecimal, data[props.showValue] )} 
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
        <IonAlert isOpen={!!error} message={error} buttons={[{ text: "Ok", handler: clearError }]} />
      </GoogleMap>
    );
  };

  return getMap()
};

export default MapInterface;