import React, { useState } from "react";
import {
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonButton,
  IonAlert,
  IonLoading,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { AppSettings } from "../AppSettings"

const PingSection: React.FC<{
  destination: string,
}> = (props) => {
  const [ site, setSite ] = useState<string>(AppSettings.DEFAULT_PING_SITE);
  const [ retry, setRetry ] = useState<number>(AppSettings.DEFAULT_PING_RETRY);
  const [ data, setData ] = useState<{ send: string, recv: string, avg: string }>({ send: "", recv: "", avg: ""});
  const [ showData, setShowData ] = useState<boolean>(false);
  const [ errorConnection, setErrorConnection ] = useState<string>();
  const [ loading, setLoading ] = useState<boolean>(false);

  const clearErrorConnection = () => {
    setErrorConnection("");
  };

  const pingSite = async () => {
    const url = ("http://" + props.destination + "/ping?site=" + site )
    var result:any;
    setLoading(true);
    for( var i = 0; i <= retry; i++){
      const controller = new AbortController();
      const signal = controller.signal;
      setTimeout(() => controller.abort(), AppSettings.CONNECT_TIMEOUT);
      result = await fetch(url, {signal})
        .then( (response) => response.json() )
        .then( (data) => { return data; })
      if( result ){ break; }
    };
    setLoading(false);
    if( result[0] === "F" ) { setErrorConnection("Cannot Ping!"); return ;}
    setData({ send: result[0], recv: result[1], avg: result[2] });
    setShowData(true);
  };

  return (
    <IonGrid>
      <IonRow>
        <IonCol size="10" class="ion-margin-top">
          <IonLabel>Site</IonLabel>
          <IonItem>
            <IonInput value={site} onIonChange={ e => setSite(e.detail.value!) } debounce={500} />
          </IonItem>
        </IonCol>
        <IonCol size="2" class="ion-margin-top">
          <IonLabel>Retry</IonLabel>
          <IonItem>
            <IonInput value={retry} onIonChange={ e => setRetry(+e.detail.value!) } debounce={500} type="number" />
          </IonItem>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol className="ion-margin-top">
          <IonButton onClick={pingSite} expand="full" size="large">Ping</IonButton>
        </IonCol>
      </IonRow>
      { showData &&
      <IonCard>
        <IonCardContent>
          <IonRow>
            <IonCol size="3"><IonLabel>Send:</IonLabel>{data.send}</IonCol>
            <IonCol size="3"><IonLabel>Receive:</IonLabel>{data.recv}</IonCol>
            <IonCol size="6"><IonLabel>Avg Response:</IonLabel>{data.avg}<IonLabel>ms</IonLabel></IonCol>
          </IonRow>
        </IonCardContent>
      </IonCard>
      }
      <IonAlert isOpen={!!errorConnection} message={errorConnection} buttons={[{ text: "Okey", handler: clearErrorConnection }]} />
      <IonLoading isOpen={loading} message={'Please Wait...'} backdropDismiss={true}/>
    </IonGrid>
  );
};
export default PingSection;
