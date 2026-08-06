import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';

/**
 * react-native-pdf is a native module: it exists in the dev client / release
 * build, but Expo Go cannot load it. Resolve it lazily and fall back to opening
 * the document in the browser so the screen still works during Expo Go preview.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const PdfView: React.ComponentType<any> | null = (() => {
  if (isExpoGo) return null;
  try {
    return require('react-native-pdf').default ?? null;
  } catch {
    return null;
  }
})();

export default function PdfViewer() {
  const { path, url, title } = useLocalSearchParams<{ path?: string; url?: string; title?: string }>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const localPath = path || '';
  const remoteUrl = url || '';
  const source = localPath ? { uri: localPath } : { uri: remoteUrl, cache: true };
  const hasSource = !!source.uri;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{title ?? 'Document'}</Text>
        {localPath ? (
          <View style={styles.offlineChip}>
            <Ionicons name="checkmark" size={12} color={Colors.success} />
            <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '500', marginLeft: 3 }}>Offline</Text>
          </View>
        ) : null}
      </View>

      {!hasSource ? (
        <Centered icon="document-outline" text="No PDF available for this item." />
      ) : PdfView && !failed ? (
        <View style={{ flex: 1 }}>
          <PdfView
            source={source}
            style={{ flex: 1, backgroundColor: Colors.bg }}
            trustAllCerts={false}
            onLoadComplete={() => setLoading(false)}
            onError={() => { setLoading(false); setFailed(true); }}
          />
          {loading ? (
            <View style={styles.overlay}><ActivityIndicator color={Colors.primary} size="large" /></View>
          ) : null}
        </View>
      ) : (
        <Fallback localPath={localPath} remoteUrl={remoteUrl} failed={failed} />
      )}
    </SafeAreaView>
  );
}

/** In-app browser (SFSafariViewController / Custom Tabs) renders PDFs inline. */
async function openExternally(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}

function Fallback({ localPath, remoteUrl, failed }: { localPath: string; remoteUrl: string; failed: boolean }) {
  const message = failed
    ? 'This document could not be rendered.'
    : 'The built-in PDF reader needs the development build — Expo Go cannot load it.';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View style={styles.iconBox}>
        <Ionicons name="document-text-outline" size={34} color={Colors.primaryMid} />
      </View>
      <Text style={{ fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 22 }}>
        {message}
      </Text>
      {remoteUrl ? (
        <AppButton
          label="Open in browser"
          onPress={() => openExternally(remoteUrl)}
          style={{ marginTop: 24, width: '100%' }}
        />
      ) : null}
      {localPath ? (
        <Text style={{ fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 16 }} numberOfLines={2}>
          Saved offline at {localPath}
        </Text>
      ) : null}
    </View>
  );
}

function Centered({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={48} color={Colors.primaryLight} />
      <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  offlineChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  iconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
});
