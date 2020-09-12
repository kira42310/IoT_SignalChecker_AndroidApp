import React from "react";
import { GoogleMap, Marker, } from "@react-google-maps/api";

const MapCustomView: React.FC<{
  latitude: number,
  longtitude: number,
}> = (props) => {

  // map style
  const containerStyle = {
    width: '100%',
    height: '100%',
  }

  const renderMap = () =>
    <GoogleMap mapContainerStyle={ containerStyle } 
      zoom={ 16 } 
      center={{ lat: props.latitude, lng: props.longtitude }} 
      options={{ gestureHandling:"none", zoomControl: false, disableDefaultUI: true }} >
      <Marker position={{ lat: props.latitude, lng: props.longtitude }} />
    </GoogleMap>

  return renderMap();
};
export default MapCustomView;