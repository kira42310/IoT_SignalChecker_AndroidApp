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
import HistoryCard from "../components/HistoryCard";
import { AppSettings } from "../AppSettings";
import { retriveDataFromDBInterface } from "../AppFunction";

const { Storage } = Plugins;

const HistorySearch: React.FC = () => {

  const [ dtFrom, setDTFrom ] = useState<string>();
  const [ dtEnd, setDTEnd ] = useState<string>();
  const [ imei, setIMEI ] = useState<string>();
  const [ refDTFrom, setRefDTFrom ] = useState<string>();
  const [ refDTEnd, setRefDTEnd ] = useState<string>();
  const [ refIMEI, setRefIMEI ] = useState<string>();
  const [ page, setPage ] = useState<number>(1);
  const [ hasMore, setHasMore ] = useState<boolean>(true);
  const [ data, setData ] = useState< retriveDataFromDBInterface[]>([]);

  // ion life cycle before load into page, to get current time and set to input form.
  useIonViewWillEnter( () => {
    const tmp = new Date().toISOString();
    setDTFrom( tmp );
    setDTEnd( tmp );
  });

  // ion life cycle after load into page, get data from database.
  useIonViewDidEnter( () => {
    searchData();
    getIMEIFromStorage();
  });

  // function for search data in database, if dtFrom and dtEnd(dt is date time) is the same, input won't condition with dt in search.
  const searchData = async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );

    let url = 'http://' + AppSettings.DB_LOCATION + "/search?page=" + 1;
    if( imei ) url += "&imei=" + imei.toString();
    if(!( dtFrom === dtEnd )) url += "&start=" + new Date(dtFrom!).toJSON() + "&end=" + new Date(dtEnd!).toJSON();

    setRefIMEI( imei );
    setRefDTFrom( dtFrom );
    setRefDTEnd( dtEnd );

    await fetch( url, { signal })
      .then( response => response.json() )
      .then( d => { 
        setData( d ); 
        if( d.length === 10 ){
          setHasMore( true );
          setPage( 2 );
        }
        else{
          setHasMore( false );
        }
      });
  };

  // function for get next 10 data from database.
  const searchNext = async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout( () => controller.abort(), AppSettings.CONNECT_TIMEOUT );

    let url = 'http://' + AppSettings.DB_LOCATION + "/search?page=" + page;
    if( imei ) url += "&imei=" + refIMEI!.toString();
    if(!( dtFrom === dtEnd )) url += "&start=" + new Date(refDTFrom!).toJSON() + "&end=" + new Date(refDTEnd!).toJSON();

    await fetch( url, { signal })
      .then( response => response.json() )
      .then( d => { 
        setData([ ...data, ...d ]); 
        if( d.length === 10 ){
          setPage( page + 1 );
        }
        else{
          setHasMore( false );
        }
      });
  };

  // function for clear input and set current data to form.
  const clearInput = () => {
    const tmp = new Date().toISOString();
    setDTFrom( tmp );
    setDTEnd( tmp );
    setIMEI(""); 
  };

  // function for get imei from storage.
  const getIMEIFromStorage = async () => {
    const res = await Storage.get({ key: 'imei' });
    if( res.value ) setIMEI( res.value );
  };

  // function to create key for history card.
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
            <IonRow>
              <IonCol>
                <IonButton expand="block" onClick={ searchData }>Search</IonButton>
              </IonCol>
              <IonCol>
                <IonButton expand="block" onClick={ clearInput }>Clear</IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCard>
        {
          data.map( info => (
            <HistoryCard key={ createKey( info._id.$oid ) }
              data={ info }
            />
          ))
        }
        <IonButton fill="outline" expand="block" onClick={ searchNext } disabled={!hasMore}>{ hasMore? "Load More":"Finish" }</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default HistorySearch;