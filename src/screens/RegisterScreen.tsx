import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  Platform,
  SafeAreaView,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'register'>;

const { width, height } = Dimensions.get('window');
const IS_SMALL = Math.min(width, height) < 700 || width <= 360;
const VERY_SMALL = height < 670;

const YELLOW = '#FFE651';
const BG = '#000000';
const CARD_BG = '#0B0B0B';
const TEXT = '#FFFFFF';
const SUBTEXT = '#CFCFCF';

type SportKey = 'tennis' | 'football' | 'volleyball';
const STORAGE_KEY = 'pm_profile_v1';

const SPORTS: Array<{ key: SportKey; title: string; img: any }> = [
  { key: 'tennis', title: 'Tennis', img: require('../assets/sport_tennis.png') },
  { key: 'football', title: 'Football', img: require('../assets/sport_football.png') },
  { key: 'volleyball', title: 'Volleyball', img: require('../assets/sport_volleyball.png') },
];

export default function RegisterScreen({ navigation }: Props) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [sport, setSport] = useState<SportKey | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const insets = useSafeAreaInsets();
  const nameRef = useRef<TextInput>(null);

  const logoY = useRef(new Animated.Value(-14)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const blockY = useRef(new Animated.Value(24)).current;
  const blockOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(logoY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(blockY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(blockOpacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoY, logoOpacity, blockY, blockOpacity]);

  const buttonLabel = useMemo(() => (step === 0 ? 'Choose' : step === 1 ? 'Next' : 'Start'), [step]);

  const canProceed = useMemo(() => {
    if (step === 0) return !!sport;
    if (step === 1) return true;
    return name.trim().length > 0;
  }, [step, sport, name]);

  const pickPhoto = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9 });
      if (res.didCancel) return;
      const asset: Asset | undefined = res.assets?.[0];
      if (asset?.uri) setPhotoUri(asset.uri);
    } catch {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const saveProfile = async () => {
    try {
      const payload = { sport, name: name.trim(), photoUri, savedAt: Date.now() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      Alert.alert('Error', 'Failed to save data');
      return false;
    }
  };

  const onPressMain = async () => {
    if (!canProceed) return;
    if (step === 0) setStep(1);
    else if (step === 1) setStep(2);
    else {
      const ok = await saveProfile();
      if (ok) navigation.replace('home');
    }
  };

  const logoTopPad = insets.top + (IS_SMALL ? 6 : 10) + 30;
  const containerBottomPad = Math.max(insets.bottom, IS_SMALL ? 18 : 26);
  const buttonBottomInset = insets.bottom + (IS_SMALL ? 12 : 14);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <View style={[styles.container, { paddingBottom: containerBottomPad }]}>
        <Animated.View style={[styles.logoWrap, { paddingTop: logoTopPad, transform: [{ translateY: logoY }], opacity: logoOpacity }]}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.View style={{ flex: 1, transform: [{ translateY: blockY }], opacity: blockOpacity }}>
          <Text style={styles.header}>{step === 0 ? 'Choose a sport' : 'Registration'}</Text>

          {step === 0 ? (
            <View style={styles.sportList}>
              {SPORTS.map((s) => {
                const active = sport === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.sportCard, active && styles.sportCardActive]}
                    onPress={() => setSport(s.key)}
                    activeOpacity={0.9}
                  >
                    <ImageBackground
                      source={s.img}
                      style={styles.sportImage}
                      imageStyle={styles.sportImageRadius}
                      resizeMode="cover"
                    >
                      <View style={styles.sportOverlay} />
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : step === 1 ? (
            <View style={styles.centerCard}>
              <View style={styles.yellowCard}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <TouchableOpacity style={styles.addPhoto} activeOpacity={0.8} onPress={pickPhoto}>
                    <Image source={require('../assets/add_photo_placeholder.png')} style={styles.addIcon} resizeMode="contain" />
                    <Text style={styles.addText}>Add a photo</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.note}>Important! We do not use your data, your photo is only for you.</Text>
              <View style={styles.dots}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={[styles.dot, styles.dotInactive]} />
              </View>
            </View>
          ) : (
            <View style={styles.centerCard}>
              <TouchableOpacity style={styles.yellowCard} activeOpacity={1} onPress={() => nameRef.current?.focus()}>
                <TextInput
                  ref={nameRef}
                  style={styles.input}
                  placeholder="Add a name"
                  placeholderTextColor="#8F8F8F"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  returnKeyType="done"
                />
              </TouchableOpacity>
              <Text style={styles.note}>Important! We do not use your data, your data is only for you.</Text>
              <View style={styles.dots}>
                <View style={[styles.dot, styles.dotInactive]} />
                <View style={[styles.dot, styles.dotActive]} />
              </View>
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[styles.btn, !canProceed && { opacity: 0.5 }, { marginBottom: buttonBottomInset }]}
          onPress={onPressMain}
          activeOpacity={0.9}
          disabled={!canProceed}
        >
          <Text style={styles.btnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const LOGO_W = Math.min(width * 0.42, 220);
const LOGO_H = VERY_SMALL ? 36 : 44;
const SPORT_H = VERY_SMALL ? 92 : IS_SMALL ? 110 : 120;
const SPORT_RADIUS = 14;
const CARD_SIDE = Math.min(width - 64, VERY_SMALL ? 300 : 320);
const INPUT_PAD_V = VERY_SMALL ? 12 : 14;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 20 },
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: IS_SMALL ? 8 : 12 },
  logo: { width: LOGO_W, height: LOGO_H },
  header: { color: TEXT, fontSize: VERY_SMALL ? 18 : 20, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  sportList: { gap: 12, marginTop: 6, marginBottom: 28 },
  sportCard: { borderRadius: SPORT_RADIUS, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: '#111' },
  sportCardActive: { borderColor: YELLOW },
  sportImage: { width: '100%', height: SPORT_H, justifyContent: 'flex-end' },
  sportImageRadius: { borderRadius: SPORT_RADIUS },
  sportOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  centerCard: { alignItems: 'center', marginTop: 6, marginBottom: 28 },
  yellowCard: { width: CARD_SIDE, height: CARD_SIDE, borderRadius: 18, borderWidth: 2, borderColor: YELLOW, backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  addPhoto: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  addIcon: { width: 54, height: 54, opacity: 0.9 },
  addText: { color: SUBTEXT, fontSize: 14 },
  photo: { width: '100%', height: '100%' },
  input: { width: '88%', backgroundColor: '#1A1A1A', color: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: INPUT_PAD_V, fontSize: 16 },
  note: { color: SUBTEXT, fontSize: VERY_SMALL ? 12 : 13, marginTop: 12, marginBottom: 14, textAlign: 'center', width: CARD_SIDE },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 18, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#3A3A3A', backgroundColor: '#1E1E1E' },
  dotActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  dotInactive: { opacity: 0.7 },
  btn: { backgroundColor: YELLOW, paddingVertical: VERY_SMALL ? 12 : 14, borderRadius: 12, alignItems: 'center', marginTop: 'auto' },
  btnText: { color: '#0B0B0B', fontSize: VERY_SMALL ? 15 : 16, fontWeight: '800' },
});
