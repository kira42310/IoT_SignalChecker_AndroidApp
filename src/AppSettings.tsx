export class AppSettings {
  public static RPI_IP: string = "192.168.42.11";
  public static RPI_PORT: number = 32123;
  public static MODE: "AUTO" | "NB-IoT" | "Cat-M1" = "AUTO";
  public static BAND: "AUTO" | "900MHz" | "1800MHz" = "AUTO";
  public static LTE: string = "B8";
  public static GPS_HIGH_ACCURACY: boolean = false;
  public static DB_LOCATION = "http://158.108.38.94:32124";
  public static GOOGLE_MAP_API = "AIzaSyDGaZkYBcT81QHkokUy-slamRd_yxUsq1E";
}