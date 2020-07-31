export class AppSettings {
  public static RPI_IP: string = "192.168.42.11";
  public static RPI_PORT: number = 32123;
  public static MODE = "3";
  public static BAND = "1";
  public static LTE: string = "B8";
  public static GPS_HIGH_ACCURACY: boolean = false;
  public static DB_LOCATION = "http://158.108.38.94:32124";
  public static GOOGLE_API_KEY = "AIzaSyDGaZkYBcT81QHkokUy-slamRd_yxUsq1E";
  public static TRACKING_DELAY: number = 30;
  public static DEFAULT_PING_SITE: string = "www.google.com";
  public static DEFAULT_PING_RETRY: number = 5;
  public static CONNECTION_INTERVAL: number = 60000;
  public static CONNECT_TIMEOUT: number = 30000;
  public static CHECK_INTERVAL_HOUR: string = "00";
  public static CHECK_INTERVAL_MIN: string = "15";
  public static CHECK_INTERVAL_SEC: string = "00";

  public static getColorRssiRsrp( data: number ): string  {
    if( data >= -80 ) return "blue"
    else if( data < -80 && data >= -90 ) return "aqua"
    else if( data < -90 && data >= -95 ) return "darkgreen"
    else if( data < -95 && data >= -100 ) return "greenyellow"
    else if( data < -100 && data >= -110 ) return "yellow"
    else if( data < -110 && data >= -116 ) return "red"
    else if( data < -116 && data >= -124 ) return "grey"
    else if( data < -124 ) return "darkblue"
    else return "black"
  };

  public static getColorSinr( data: number ): string {
    if( data >= 20 ) return "purple"
    if( data < 20 && data >= 15 ) return "hotpink"
    if( data < 15 && data >= 10 ) return "goldenrod"
    if( data < 10 && data >= 5 ) return "cornflowerblue"
    if( data < 5 && data >= 0 ) return "orchid"
    if( data < 0 ) return "gray"
    else return "black"
  };

  public static getColorRsrq( data: number ): string {
    if( data >= -6 ) return "purple"
    if( data < -6 && data >= -9 ) return "hotpink"
    if( data < -9 && data >= -11 ) return "cornflowerblue"
    if( data < -11 && data >= -14 ) return "orchid"
    if( data < -14 ) return "gray"
    else return "black"
  };
}