import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  ViewStyle,
  TextStyle,
  ImageBackground, 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');
const IS_SMALL = Math.min(width, height) < 700 || width <= 360;
const VERY_SMALL = height < 670;

const BACKGROUND_IMAGE = require('../assets/background.png'); 
const YELLOW = '#f2f1eaff';
const TEXT = '#FFFFFF';
const CARD_BG = '#0F0F0F'; 
const OVERLAY_COLOR = '#1b0e0e25'; 

const BTN_W = Math.min(width - 64, 320);
const BTN_H = VERY_SMALL ? 54 : 60;
const RADIUS = 18;

const PROFILE_KEY = 'pm_profile_v1';

type Props = NativeStackScreenProps<RootStackParamList, 'home'>;
type SportKey = 'tennis' | 'football' | 'volleyball';
type Key = 'reaction' | 'statistics' | 'profile';

const BALL_ASSETS: Record<SportKey, any> = {
  tennis: require('../assets/ball_tennis.png'),
  football: require('../assets/ball_soccer.png'),
  volleyball: require('../assets/ball_volleyball.png'),
};

const items: { key: Key; label: string; route: keyof RootStackParamList }[] = [
  { key: 'reaction',   label: 'Reaction game', route: 'reaction' },
  { key: 'statistics', label: 'Statistics',    route: 'statistics' },
  { key: 'profile',    label: 'Profile',       route: 'profile' },
];

export default function HomeScreen({ navigation }: Props) {
  const [active, setActive] = useState<Key | null>(null);
  const [sport, setSport] = useState<SportKey>('tennis');

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(PROFILE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          const s = parsed?.sport as SportKey;

          if (mounted && s && ['tennis','football','volleyball'].includes(s))
            setSport(s);

        } catch {}
      })();
      return () => { mounted = false };
    }, [])
  );

  const pressItem = (it: typeof items[number]) => {
    setActive(it.key);
    navigation.navigate(it.route);
  };

  const btnStyle = (key: Key): ViewStyle[] => [
    styles.commonBtn,
    key === active ? styles.primaryBtn : styles.outlineBtn
  ];

  const txtStyle = (key: Key): TextStyle[] => [
    styles.commonText,
    key === active ? styles.primaryText : styles.outlineText
  ];

  const BALL_SRC = BALL_ASSETS[sport];

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay} />
        <View style={styles.container}>

          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {items.map(it => (
            <TouchableOpacity
              key={it.key}
              style={btnStyle(it.key)}
              activeOpacity={0.9}
              onPress={() => pressItem(it)}
            >
              <Text style={txtStyle(it.key)}>{it.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.ballBtn}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('changing')}
          >
            <Image
              source={BALL_SRC}
              style={styles.ballImg}
              resizeMode="contain"
            />
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OVERLAY_COLOR, 
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30, 
  },

  logo: {
    width: Math.min(width * 0.78, 360),
    height: VERY_SMALL ? 140 : 170,
    marginTop: IS_SMALL ? 28 : 36,
    marginBottom: IS_SMALL ? 28 : 36,
  },

  commonBtn: {
    width: BTN_W,
    height: BTN_H,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  primaryBtn: {
    backgroundColor: YELLOW,
  },
  primaryText: {
    color: '#0B0B0B',
    fontWeight: '800',
  },

  outlineBtn: {
    borderWidth: 2,
    borderColor: YELLOW,
    backgroundColor: CARD_BG,
  },
  outlineText: {
    color: TEXT,
    fontWeight: '700',
  },

  commonText: {
    fontSize: VERY_SMALL ? 18 : 20,
  },

  ballBtn: {
    width: 68,
    height: 68,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: IS_SMALL ? 6 : 10,
    backgroundColor: CARD_BG, 
  },

  ballImg: {
    width: 44,
    height: 44,
  },
});