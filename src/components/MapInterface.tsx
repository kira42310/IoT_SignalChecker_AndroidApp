import React, { useState, useEffect } from "react";
import { IonLoading, IonLabel, } from "@ionic/react"
import { GoogleMap, LoadScript, Marker, MarkerClusterer, InfoWindow } from "@react-google-maps/api";
import { useCurrentPosition } from "@ionic/react-hooks/geolocation";
import { AppSettings } from "../AppSettings";

const MapInterface: React.FC<{
}> = (props) => {

  const { currentPosition, getPosition } = useCurrentPosition();
  const [ isMapLoaded, setIsMapLoaded ] = useState<boolean>(false);
  const [ markers, setMarkers ] = useState<{ latitude: number, longitude: number, rssi: number , _id: { $oid: string } }[]>([]);
  const [ info, setInfo ] = useState<{ lat: number, lng: number, rssi: number }>();
  const [ isInfo, setIsInfo ] = useState<boolean>(false);

  useEffect( () => {
    const fetchData = async () => {
      await fetch(AppSettings.DB_LOCATION+'')
        .then( response => response.json() )
        .then( data => 
          {  
            setMarkers(data);
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

  const divStyle = {
    background: `white`,
    border: `1px solid #ccc`,
    padding: 15
  }
  
  const onMapLoad = async () => {
    // getPosition({ enableHighAccuracy:AppSettings.GPS_HIGH_ACCURACY, timeout: 30000 });
    setIsMapLoaded(true);
  };

  const onScriptLoad = async () => {
    getPosition();
  };

  const infoWindowPanel = (lat: number, lng: number, rssi: number) => {
    setInfo({lat:lat,lng:lng,rssi:rssi});
    setIsInfo(true);
  }

  function createKey( id: string ): React.ReactText {
    return id;
  }

  const renderMap = () =>
    <LoadScript googleMapsApiKey={AppSettings.GOOGLE_API_KEY} onLoad={onScriptLoad}>
      <GoogleMap mapContainerStyle={containerStyle} zoom={14} onLoad={onMapLoad} center={center}>
        <MarkerClusterer>
          {
            clusterer => markers.map( data => (
              <Marker key={createKey(data._id.$oid)} position={{lat:data.latitude,lng:data.longitude}} clusterer={clusterer} onClick={e => infoWindowPanel(data.latitude,data.longitude,data.rssi)}>
              </Marker>
            ))
          }
        </MarkerClusterer>
        {
          !isInfo || <InfoWindow position={{lat:info!.lat,lng:info!.lng}} onCloseClick={ () => setIsInfo(false)}>
            <div style={divStyle}>
              <IonLabel color="primary">{info!.rssi}</IonLabel>
            </div>
          </InfoWindow>
        }
      </GoogleMap>
      <IonLoading isOpen={!isMapLoaded} />
      <IonLabel>Latitude: {currentPosition?.coords.latitude}{"\n"}Longitude: {currentPosition?.coords.longitude}</IonLabel>
    </LoadScript>

  return renderMap();
};
export default MapInterface;