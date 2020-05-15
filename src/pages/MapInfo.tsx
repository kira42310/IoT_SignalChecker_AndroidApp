import React from "react";
import { 
    IonPage, 
    IonHeader, 
    IonToolbar, 
    IonTitle } from "@ionic/react";

const MapInfo: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>Map</IonTitle>
                </IonToolbar>
            </IonHeader>
        </IonPage>
    );
};

export default MapInfo;