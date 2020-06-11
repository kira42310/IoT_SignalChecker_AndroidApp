import React, { useState, useEffect } from "react";
import { IonLoading, IonLabel, } from "@ionic/react"
import { GoogleMap, LoadScript, Marker, MarkerClusterer, InfoWindow, GoogleMapProps } from "@react-google-maps/api";
import { useCurrentPosition, availableFeatures } from "@ionic/react-hooks/geolocation";
import { AppSettings } from "../AppSettings";

const MapInterface: React.FC<{}> = (props) => {

  const { currentPosition, getPosition } = useCurrentPosition();
  const [ isMapLoaded, setIsMapLoaded ] = useState< boolean >( false );
  const [ markers, setMarkers ] = useState<{ latitude: number, longitude: number, rssi: number , _id: { $oid: string } }[]>([]);
  const [ info, setInfo ] = useState<{ lat: number, lng: number, rssi: number }>();
  const [ isInfo, setIsInfo ] = useState< boolean >( false );
  const [ center, setCenter ] = useState<{ lat: number, lng: number }>();
  const [ mapOBJ, setMapOBJ ] = useState<google.maps.Map>();
  const [ mapBound, setMapBound ] = useState<google.maps.LatLngBounds>();

  useEffect( () => {
    const reloadMarker = async () => {
      console.log(mapBound);
    };
    reloadMarker();
  }, [mapBound]);

  const containerStyle = {
    width: '100%',
    height: '80%',
  }

  const divStyle = {
    background: `white`,
    border: `1px solid #ccc`,
    padding: 15
  }
  
  const onMapLoad = async (map: google.maps.Map) => {
    setIsMapLoaded( true );
    setMapOBJ(map);
  };

  // const loadMarker = (marker: google.maps.Marker) => {
  //   console.log(marker);
  // };

  const onScriptLoad = async () => {
    await fetch(AppSettings.DB_LOCATION+'')
      .then( response => response.json() )
      .then( data => 
        {  
          setMarkers(data);
        }
    );
    if(availableFeatures.watchPosition){
      getPosition({ timeout: 15000 });
      setCenter({ lat: currentPosition?.coords.latitude!, lng: currentPosition?.coords.longitude! });
    }
    else{
      setCenter({ lat: 13.7625293, lng: 100.5655906 }); //TRUE Building
    }
  };

  const boundChange = () => {
    setMapBound(mapOBJ?.getBounds()!);
  };

  const infoWindowPanel = ( lat: number, lng: number, rssi: number ) => {
    setInfo({ lat: lat, lng: lng, rssi: rssi });
    setIsInfo( true );
  }

  function createKey( id: string ): React.ReactText {
    return id;
  }

  const renderMap = () =>
    <LoadScript googleMapsApiKey={AppSettings.GOOGLE_API_KEY} onLoad={onScriptLoad}>
      <GoogleMap mapContainerStyle={containerStyle} zoom={14} onLoad={onMapLoad} center={center} onDragEnd={boundChange}>
        <MarkerClusterer>
          {
            clusterer => markers.map( data => (
              <Marker key={createKey(data._id.$oid)} 
                position={{lat:data.latitude,lng:data.longitude}} 
                onClick={e => infoWindowPanel(data.latitude,data.longitude,data.rssi)} 
                options={{ icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
              />
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
    </LoadScript>

  return renderMap();
};
export default MapInterface;