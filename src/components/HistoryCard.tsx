import React from "react";
import { IonCard, IonCardContent, IonCol, IonGrid, IonRow } from "@ionic/react";
import MapCustomView from "./MapCustomView";
// import { AppSettings } from "../AppSettings"

const HistoryCard: React.FC<{
  imei: string,
  rssi: string,
  rsrp: string,
  sinr: string,
  rsrq: string,
  pcid: string,
  mode: string,
  date: Date,
  lat: number,
  lng: number
}> = (props) => {

  const timestampConverter = () => {
    const rawData = new Date(props.date);
    return (
      rawData.getDate()+"/"
      +rawData.getMonth()+"/"
      +rawData.getFullYear()+" "
      +("0"+rawData.getHours()).substr(-2)+":"
      +("0"+rawData.getMinutes()).substr(-2)
    );
  };

  return (
    <IonCard>
      <IonCardContent>
        <IonGrid>
          <IonRow>
            <IonCol size="4">
              <MapCustomView latitude={ props.lat } longtitude={ props.lng } />
            </IonCol>
            <IonCol>
              <p>Date</p>
              <p>IMEI</p>
              <p>Mode</p>
              <p>RSSI</p>
              <p>RSRP</p>
              <p>SINR</p>
              <p>RSRQ</p>
              <p>PCID</p>
            </IonCol>
            <IonCol>
              <p>{timestampConverter()}</p>
              <p>{props.imei}</p>
              <p>{props.mode}</p>
              <p>{props.rssi}</p>
              <p>{props.rsrp}</p>
              <p>{props.sinr}</p>
              <p>{props.rsrq}</p>
              <p>{props.pcid}</p>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>    
  );
};
export default HistoryCard;
