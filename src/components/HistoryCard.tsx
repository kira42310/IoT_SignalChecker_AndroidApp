import React from "react";
import { IonCard, IonCardContent, IonCol, IonGrid, IonRow } from "@ionic/react";
import MapCustomView from "./MapCustomView";
import { retriveDataFromDBInterface } from "../AppFunction";

const HistoryCard: React.FC<{ data: retriveDataFromDBInterface }> = (props) => {

  // function for convert UTC time to human readable.
  const timestampConverter = () => {
    const rawData = new Date(props.data.date.$date);
    return (
      rawData.getDate() + " "
      + rawData.toLocaleString( 'default', { month: 'short' }) + " "
      + rawData.getFullYear() + "  "
      + ( "0" + rawData.getHours() ).substr( -2 ) + ":"
      + ( "0" + rawData.getMinutes() ).substr( -2 )
    );
  };

  return (
    <IonCard>
      <IonCardContent>
        <IonGrid>
          <IonRow>
            <IonCol size="4">
              <MapCustomView latitude={ +props.data.latitude.$numberDecimal } longtitude={ +props.data.longitude.$numberDecimal } />
            </IonCol>
            <IonCol>
              <p>Date</p>
              <p>IMEI</p>
              <p>Mode</p>
              <p>Band</p>
              <p>RSSI</p>
              <p>RSRP</p>
              <p>SINR</p>
              <p>RSRQ</p>
              <p>PCID</p>
            </IonCol>
            <IonCol>
              <p>{timestampConverter()}</p>
              <p>{props.data.imei}</p>
              <p>{props.data.mode}</p>
              <p>{props.data.band}</p>
              <p>{props.data.scRSSI}</p>
              <p>{props.data.scRSRP}</p>
              <p>{props.data.scSINR}</p>
              <p>{props.data.scRSRQ}</p>
              <p>{props.data.scPCID}</p>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>    
  );
};
export default HistoryCard;
