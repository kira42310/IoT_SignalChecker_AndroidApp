import React, { useState, } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  useIonViewWillEnter,
  useIonViewDidEnter,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonCard,
  IonDatetime,
  IonCardTitle,
  IonCardHeader,
  IonButton, 
} from "@ionic/react";
import { Plugins } from "@capacitor/core";
import InfiniteScroll from "react-infinite-scroll-component";
import HistoryCard from "../components/HistoryCard";
import { AppSettings } from "../AppSettings";

const { Storage } = Plugins;

const HistorySearch: React.FC = () => {

  const [ dtFrom, setDTFrom ] = useState<string>();
  const [ dtEnd, setDTEnd ] = useState<string>();
  const [ imei, setIMEI ] = useState<string>();
  const [ page, setPage ] = useState<number>(0);

  const [ data, setData ] = useState<{ 
    imei: string, 
    rssi: string, 
    rsrp: string, 
    sinr: string, 
    rsrq: string, 
    pcid: string, 
    mode: string,
    latitude: number, 
    longitude: number, 
    _id: { $oid: string },
    date: { $date: Date }
  }[]>([]);

  useIonViewWillEnter( () => {
    const tmp = new Date().toISOString();
    setDTFrom( tmp );
    setDTEnd( tmp );
  });

  useIonViewDidEnter( () => {
    searchData();
    getIMEIFromStorage();
  });

  const searchData = async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );

    let url = AppSettings.DB_LOCATION + "/search?page=" + page;
    if( imei ) url += "&imei=" + imei.toString();
    if(!( dtFrom === dtEnd )) url += "&start=" + new Date(dtFrom!).toJSON() + "&end=" + new Date(dtEnd!).toJSON();
    console.log( url );
    
    // await fetch( url, { signal })
    //   .then( response => response.json() )
    //   .then( data => setData( data ) );

    await fetch( url, { signal })
      .then( response => response.json() )
      .then( data => { setData( data ); console.log( data.length ); });
  };

  const getIMEIFromStorage = async () => {
    const res = await Storage.get({ key: 'imei' });
    if( res.value ) setIMEI( res.value );
  };

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
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Search</IonCardTitle>
          </IonCardHeader>
          <IonGrid>
            <IonRow>
              <IonCol>
                <IonLabel>From</IonLabel>
                <IonItem>
                  <IonDatetime displayFormat="DD.MM.YYYY HH:mm" value={ dtFrom } onIonChange={ e => setDTFrom( e.detail.value! ) } />
                </IonItem>
              </IonCol>
              <IonCol>
                <IonLabel>To</IonLabel>
                <IonItem>
                  <IonDatetime displayFormat="DD.MM.YYYY HH:mm" value={ dtEnd } onIonChange={ e => setDTEnd( e.detail.value! ) } />
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonLabel>IMEI</IonLabel>
                <IonItem>
                  <IonInput placeholder="Input IMEI" value={ imei } type="number" clearInput={ true } debounce={ 500 } onIonChange={ e => setIMEI( e.detail.value! ) } />
                </IonItem>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonButton expand="block" onClick={ searchData }>Search</IonButton>
        </IonCard>
        <InfiniteScroll
          dataLength={ 10 }
          next={ searchData }
          hasMore={ true }
          loader={ <h4>Loading...</h4> }
        >
          {
            data.map( info => (
              <HistoryCard key={ createKey( info._id.$oid ) }
                imei={info.imei}
                rssi={info.rssi}
                rsrp={info.rsrp}
                sinr={info.sinr}
                rsrq={info.rsrq}
                pcid={info.pcid}
                mode={info.mode}
                date={info.date.$date}
                lat={info.latitude}
                lng={info.longitude}
              />
            ))
          }
        </InfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default HistorySearch;