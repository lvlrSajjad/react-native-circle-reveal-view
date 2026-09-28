/**
 * Minimal demo. Drop this file into any React Native or Expo app as App.tsx.
 */
import { useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CircleRevealView } from 'react-native-circle-reveal-view';
import type { CircleRevealViewRef } from 'react-native-circle-reveal-view';

export default function App() {
  const revealRef = useRef<CircleRevealViewRef>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>react-native-circle-reveal-view</Text>

      <CircleRevealView
        ref={revealRef}
        style={styles.sheet}
        backgroundColor="#1f6feb"
        duration={450}
        revealOrigin={{ bottom: true, right: true }}
        onExpanded={() => setExpanded(true)}
        onCollapsed={() => setExpanded(false)}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetText}>Revealed content</Text>
        </View>
      </CircleRevealView>

      <Pressable style={styles.fab} onPress={() => revealRef.current?.toggle()}>
        <Text style={styles.fabText}>{expanded ? '×' : '+'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d1117' },
  title: { color: '#c9d1d9', fontSize: 18, textAlign: 'center', marginTop: 24 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 },
  sheetContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sheetText: { color: '#ffffff', fontSize: 22, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f78166',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabText: { color: '#ffffff', fontSize: 28, lineHeight: 30 },
});
