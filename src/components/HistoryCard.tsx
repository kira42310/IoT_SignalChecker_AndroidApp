import React from "react";
import { IonCard, IonCardContent } from "@ionic/react";
// import { AppSettings } from "../AppSettings"

const HistoryCard: React.FC<{
  imei: string,
  rssi: string,
  rsrp: string,
  sinr: string,
  rsrq: string,
  pcid: string,
  mode: string,
  band: string,
  lat: number,
  lng: number
}> = (props) => {

  return (
    <IonCard>
      <IonCardContent>
        <p>IMEI:{props.imei}</p>
        <p>RSSI:{props.rssi}</p>
        <p>RSRP:{props.rsrp}</p>
        <p>SINR:{props.sinr}</p>
        <p>RSRQ:{props.rsrq}</p>
        <p>PCID:{props.pcid}</p>
        <p>Mode:{props.mode}</p>
        <p>Band:{props.band}</p>
        <p>Latitude:{props.lat}</p>
        <p>Longitude:{props.lng}</p>
      </IonCardContent>
    </IonCard>    
  );
};
export default HistoryCard;
