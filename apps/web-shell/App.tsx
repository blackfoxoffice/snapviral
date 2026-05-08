import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';

const APP_URL = 'https://app.snapviral.in/';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [bootGate, setBootGate] = useState(true);
  const [firstLoadDone, setFirstLoadDone] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  useEffect(() => {
    if (firstLoadDone) {
      SplashScreen.hideAsync().catch(() => {});
      const t = setTimeout(() => setBootGate(false), 200);
      return () => clearTimeout(t);
    }
    return;
  }, [firstLoadDone]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <WebView
        ref={webRef}
        source={{ uri: APP_URL }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        allowsBackForwardNavigationGestures
        decelerationRate="normal"
        pullToRefreshEnabled
        startInLoadingState
        setSupportMultipleWindows={false}
        mediaPlaybackRequiresUserAction={false}
        onNavigationStateChange={(state: WebViewNavigation) =>
          setCanGoBack(state.canGoBack)
        }
        onLoadEnd={() => setFirstLoadDone(true)}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#E53935" />
          </View>
        )}
        style={styles.webview}
      />
      {bootGate ? (
        <View pointerEvents="none" style={styles.bootGate}>
          <Image
            source={require('./assets/icon.png')}
            style={styles.bootIcon}
            resizeMode="contain"
          />
          <ActivityIndicator size="small" color="#E53935" style={{ marginTop: 24 }} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loader: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  bootGate: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  bootIcon: {
    width: 96,
    height: 96,
  },
});
