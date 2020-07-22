import React from "react";
import {
  IonApp,
  IonLabel,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
} from "@ionic/react";
import { IonReactRouter, } from "@ionic/react-router";
import { Route, Redirect, } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";

/* Pages and components */
import SignalChecker from "./pages/SignalChecker";
import MapInfo from "./pages/MapInfo";
import HistorySearch from "./pages/HistorySearch";
import { AppSettings } from "./AppSettings"

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";

const App: React.FC = () => {
  
  return (
    <React.Fragment>
      <IonApp>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route path="/signalchecker" component={SignalChecker} />
              <Route path="/mapinfo" component={MapInfo} />
              <Route path="/historysearch" component={HistorySearch} />
              <Redirect from="/" to="/signalchecker" exact />
            </IonRouterOutlet>
            <IonTabBar slot="bottom">
              <IonTabButton tab="signalchecker" href="/signalchecker">
                <IonLabel>Signal Checker</IonLabel>
              </IonTabButton>
              <IonTabButton tab="mapinfo" href="/mapinfo">
                <IonLabel>Map</IonLabel>
              </IonTabButton>
              <IonTabButton tab="historysearch" href="/historysearch">
                <IonLabel>History</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      </IonApp>
      <LoadScript googleMapsApiKey={AppSettings.GOOGLE_API_KEY} />
    </React.Fragment>
  );
};

export default App;
