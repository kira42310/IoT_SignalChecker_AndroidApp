import React from "react";
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";
import { AppSettings } from "../AppSettings";

const MapCustomView: React.FC<{
  latitude: number,
  longtitude: number,
}> = (props) => {


  const containerStyle = {
    width: '100%',
    height: '100%',
  }

  const renderMap = () =>
    // <LoadScript googleMapsApiKey={AppSettings.GOOGLE_API_KEY} >
    <GoogleMap mapContainerStyle={ containerStyle } 
      zoom={ 16 } 
      center={{ lat: props.latitude, lng: props.longtitude }} 
      options={{ gestureHandling:"none", zoomControl: false, disableDefaultUI: true }} >
      <Marker position={{ lat: props.latitude, lng: props.longtitude }} />
    </GoogleMap>
    // </LoadScript>

  return renderMap();
};
export default MapCustomView;