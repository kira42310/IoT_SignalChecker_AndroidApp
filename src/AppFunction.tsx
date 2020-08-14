import { AppSettings }  from './AppSettings';

export interface signalDataInterface {
  scRSSI: string,
  scRSRP: string,
  scSINR: string,
  scRSRQ: string,
  scPCID: string,
  n1RSSI: string,
  n1RSRP: string,
  n1SINR: string,
  n1RSRQ: string,
  n1PCID: string,
  n2RSSI: string,
  n2RSRP: string,
  n2SINR: string,
  n2RSRQ: string,
  n2PCID: string,
  n3RSSI: string,
  n3RSRP: string,
  n3SINR: string,
  n3RSRQ: string,
  n3PCID: string,  
};

export interface signalColorInterface {
  scRSSI: string,
  scRSRP: string,
  scSINR: string,
  scRSRQ: string,
  n1RSSI: string,
  n1RSRP: string,
  n1SINR: string,
  n1RSRQ: string,
  n2RSSI: string,
  n2RSRP: string,
  n2SINR: string,
  n2RSRQ: string,
  n3RSSI: string,
  n3RSRP: string,
  n3SINR: string,
  n3RSRQ: string,
};

export interface markerInterface{  
  _id: { $oid: string },
  latitude: number, 
  longitude: number, 
  scRSSI: number, 
  scRSRP: number,
  scSINR: number,
  scRSRQ: number,};

export class AppFunction {

  static timeoutID: any;
  static controller: any;

  public static async measureSignalStrength( url: string ): Promise<any> {
    this.controller.abort();
    clearTimeout( this.timeoutID );
    this.controller = new AbortController();
    const signal = this.controller.signal;
    this.timeoutID = setTimeout( () => this.controller.abort(), AppSettings.CONNECT_TIMEOUT );
    const res = await fetch( url, { signal })
      .then( response => response.json() )
      .then( data => { return data })
      .catch( error => console.log( error ) );
    console.log( res );
    return res;
  }

  public static async disableModule( url: string ): Promise<boolean> {
    this.controller.abort();
    clearTimeout( this.timeoutID );
    this.controller = new AbortController();
    const signal = this.controller.signal;
    this.timeoutID = setTimeout( () => this.controller.abort(), AppSettings.CONNECT_TIMEOUT );
    const res = await fetch( "http://"+url+"/disable", { signal })
      .then( response => response.json() )
      .then( data => { return data })
      .catch( error => console.log( error ));
    return res;
  }

}