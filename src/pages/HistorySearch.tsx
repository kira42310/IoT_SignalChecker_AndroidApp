import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent, 
} from "@ionic/react";
import HistoryCard from "../components/HistoryCard";
import { AppSettings } from "../AppSettings";

const HistorySearch: React.FC = () => {

  const [ data, setData ] = useState<{ 
    immi: string, 
    rssi: string, 
    rsrp: string, 
    sinr: string, 
    rsrq: string, 
    pcid: string, 
    cellular: string, 
    gsm: string, 
    latitude: number, 
    longitude: number, 
    _id: { $oid: string },
    date: { $date: Date}
  }[]>([]);

  useEffect( () => {
    const loadData = async () => {
      const result = await fetch(AppSettings.DB_LOCATION+"")
        .then( Response => Response.json())
        .then( data => setData(data))
      };
    loadData();
  },[]);

  function createKey( id: string ){
    return id;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>History</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {
          data.map( info => (
            <HistoryCard key={createKey(info._id.$oid)}
              imei={info.immi}
              rssi={info.rssi}
              rsrp={info.rsrp}
              sinr={info.sinr}
              rsrq={info.rsrq}
              pcid={info.pcid}
              mode={info.cellular}
              band={info.gsm}
              lat={info.latitude}
              lng={info.longitude}
            />
          ))
        }
      </IonContent>
    </IonPage>
  );
};

export default HistorySearch;