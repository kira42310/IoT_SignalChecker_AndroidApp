import React, { useState, useEffect } from "react";
import { IonLoading, IonLabel, } from "@ionic/react"
import { GoogleMap, LoadScript, Marker, MarkerClusterer } from "@react-google-maps/api";
import { useCurrentPosition } from "@ionic/react-hooks/geolocation";
import { AppSettings } from "../AppSettings";

const MapInterface: React.FC<{
}> = (props) => {

  const { currentPosition, getPosition } = useCurrentPosition();
  const [ isMapLoaded, setIsMapLoaded ] = useState<boolean>(false);
  const [ markers, setMarkers ] = useState<{lat:number, lng:number}[]>([]);

  useEffect( () => {
    const fetchData = async () => {
      await fetch(AppSettings.DB_LOCATION+'')
        .then( response => response.json() )
        .then( data => 
          {  
            var tmp = [];
            for ( var i in data ) {
              const marker = {lat: data[i].latitude, lng: data[i].longitude};
              tmp.push(marker);
            } 
            setMarkers(tmp);
          }
      );
    }
    fetchData();
  }, []);

  const containerStyle = {
    width: '100%',
    height: '80%',
  }

  const center = {
    lat: currentPosition?.coords.latitude,
    lng: currentPosition?.coords.longitude,
  }
  
  const onMapLoad = async () => {
    // getPosition({ enableHighAccuracy:AppSettings.GPS_HIGH_ACCURACY, timeout: 30000 });
    setIsMapLoaded(true);
  };

  const onScriptLoad = async () => {
    getPosition();
    console.log( center );
  };

  function createKey(location: { lat: number, lng: number }): React.ReactText {
    return location.lat + location.lng
  }

  const renderMap = () =>
    <LoadScript googleMapsApiKey={AppSettings.GOOGLE_API_KEY} onLoad={onScriptLoad}>
      <GoogleMap mapContainerStyle={containerStyle} zoom={14} onLoad={onMapLoad} center={center}>
        <MarkerClusterer>
          {
            clusterer => markers.map( location => (
              <Marker key={createKey(location)} position={location} clusterer={clusterer}/>
            ))
          }
        </MarkerClusterer>
      </GoogleMap>
      <IonLoading isOpen={!isMapLoaded} />
      <IonLabel>Latitude: {currentPosition?.coords.latitude}{"\n"}Longitude: {currentPosition?.coords.longitude}</IonLabel>
    </LoadScript>

  return renderMap();
};
export default MapInterface;