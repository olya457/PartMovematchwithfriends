import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Image,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'changing'>;

type SportKey = 'tennis' | 'football' | 'volleyball';
const STORAGE_KEY = 'pm_profile_v1';

const { width, height } = Dimensions.get('window');
const IS_SMALL = Math.min(width, height) < 700 || width <= 360;
const VERY_SMALL = height < 670;

const BACKGROUND_IMAGE = require('../assets/background.png'); 
const YELLOW = '#eeeeeaff';
const TEXT = '#FFFFFF';
const CARD_BG = '#0b0b0b16';

const SPORTS: Array<{ key: SportKey; img: any; title: string }> = [
  { key: 'tennis', img: require('../assets/sport_tennis.png'), title: 'Tennis' },
  { key: 'football', img: require('../assets/sport_football.png'), title: 'Football' },
  { key: 'volleyball', img: require('../assets/sport_volleyball.png'), title: 'Volleyball' },
];

export default function ChangingSportsScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<SportKey>('tennis');
  const fade = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(16)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(shift, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, shift]);

  const CARD_H = useMemo(() => (VERY_SMALL ? 96 : IS_SMALL ? 112 : 124), []);
  const BTN_H = useMemo(() => (IS_SMALL ? 56 : 60), []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.sport) setSelected(parsed.sport as SportKey);
      } catch {}
    })();
  }, []);

  const scales = useRef(SPORTS.map(() => new Animated.Value(1))).current;
  const onPressCard = (idx: number, key: SportKey) => {
    setSelected(key);
    Animated.spring(scales[idx], { toValue: 1.02, useNativeDriver: true, friction: 6, tension: 120 }).start(() => {
      Animated.spring(scales[idx], { toValue: 1, useNativeDriver: true, friction: 7, tension: 140 }).start();
    });
  };

  const onChoose = () => {
    Alert.alert('Change sport', 'Do you want to change sport?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const prev = raw ? JSON.parse(raw) : {};
            const payload = { ...prev, sport: selected, savedAt: Date.now() };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to save selection');
          }
        },
      },
    ]);
  };

  const HeaderBar = ({ title }: { title: string }) => (
    <View style={styles.headerWrap}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Text style={styles.headerBtnIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerBtn}>
          <Image source={require('../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
        </View>
      </View>
    </View>
  );

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.root} resizeMode="cover">
      <View style={styles.overlayRoot} />
      <HeaderBar title="Changing sports" />

      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: shift }],
          width: '100%',
          paddingHorizontal: 16,
        }}
      >
        <Text style={styles.subtitle}>Choose a sport</Text>
        <View style={{ gap: 32 }}>
          {SPORTS.map((s, idx) => {
            const active = selected === s.key;
            return (
              <Animated.View key={s.key} style={{ transform: [{ scale: scales[idx] }] }}>
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => onPressCard(idx, s.key)}
                  style={[styles.card, active && styles.cardActive]}
                >
                  <ImageBackground
                    source={s.img}
                    style={{ height: CARD_H, justifyContent: 'flex-end' }}
                    imageStyle={{ borderRadius: 14 }}
                    resizeMode="cover"
                  >
                
                    <View style={styles.overlay} /> 
                  </ImageBackground>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        <TouchableOpacity style={[styles.chooseBtn, { height: BTN_H, marginTop: 38 }]} onPress={onChoose} activeOpacity={0.9}>
          <Text style={styles.chooseText}>Choose</Text>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', paddingTop: IS_SMALL ? 60 : 64 },
  overlayRoot: { ...StyleSheet.absoluteFillObject, backgroundColor: '#320909e4' },
  headerWrap: { width: '100%', paddingHorizontal: 16, marginBottom: 20 },
  headerBar: {
    height: 64,
    borderWidth: 2,
    borderColor: YELLOW,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#000000a0',
  },
  headerBtn: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: YELLOW,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000000a0',
  },
  headerBtnIcon: { color: TEXT, fontSize: 18, fontWeight: '800', marginTop: -1 },
  headerTitle: { flex: 1, textAlign: 'center', color: TEXT, fontSize: 20, fontWeight: '800' },
  headerLogo: { width: 34, height: 34 },
  subtitle: { color: TEXT, fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 20 },

  card: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: CARD_BG,
    overflow: 'hidden',
  },
  cardActive: { borderColor: YELLOW },

  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  
  chooseBtn: {
    backgroundColor: YELLOW,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseText: { color: '#0B0B0B', fontWeight: '900', fontSize: 16 },
});