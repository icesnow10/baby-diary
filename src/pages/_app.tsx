import type { AppProps } from "next/app";
import { App as AntApp, ConfigProvider, theme } from "antd";
import { DataProvider } from "@/context/DataContext";
import { ThemeProvider, useThemeMode } from "@/context/ThemeContext";
import "@/styles/globals.css";
import "antd/dist/reset.css";

function AppProviders({ Component, pageProps }: AppProps) {
  const { mode } = useThemeMode();

  return (
    <ConfigProvider
      theme={{
        algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#ff6fa3",
          colorLink: "#d778c5",
          borderRadius: 12,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        },
      }}
    >
      <AntApp>
        <DataProvider>
          <Component {...pageProps} />
        </DataProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default function App(props: AppProps) {
  return (
    <ThemeProvider>
      <AppProviders {...props} />
    </ThemeProvider>
  );
}
