import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lyrt.dira365",
  appName: "Dira 365",
  webDir: "dist",
  server: {
    url: "https://dira365.com",
    androidScheme: "https",
  },
};

export default config;
