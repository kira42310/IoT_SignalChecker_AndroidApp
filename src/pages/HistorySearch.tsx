import React from "react";
import { 
    IonPage, 
    IonHeader, 
    IonToolbar, 
    IonTitle } from "@ionic/react";

const HistorySearch: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>History</IonTitle>
                </IonToolbar>
            </IonHeader>
        </IonPage>
    );
};

export default HistorySearch;