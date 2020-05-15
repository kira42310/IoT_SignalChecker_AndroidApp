export class AppSettings {
  public static RPI_IP: string = "192.168.42.11";
  public static RPI_PORT: number = 32123;
  public static MODE: "NB-IoT" | "Cat-M1" = "NB-IoT";
  public static BAND: "900MHz" | "1800MHz" = "900MHz";
  public static LTE: string = "B8";
  public static GPS_HIGH_ACCURACY: boolean = false;
  public static DB_LOCATION = "http://158.108.38.94:32124";
}