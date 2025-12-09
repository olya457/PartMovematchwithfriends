import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  Share,
  Alert,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'profile'>;

const { width, height } = Dimensions.get('window');
const IS_SMALL = Math.min(width, height) < 700 || width <= 360;
const VERY_SMALL = height < 670;

const YELLOW = '#FFE651';
const TEXT = '#FFFFFF';
const SUB = '#CFCFCF';
const BG = '#000000';
const CARD_BG = '#0B0B0B';

const STORAGE_KEY = 'pm_profile_v1';

type StoredProfile = {
  sport: 'tennis' | 'football' | 'volleyball' | null;
  name: string;
  photoUri: string | null;
  savedAt: number;
};

export default function ProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<StoredProfile>({
    sport: null,
    name: '',
    photoUri: null,
    savedAt: 0,
  });
  const [edit, setEdit] = useState(false);
  const nameRef = useRef<TextInput>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(shift, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, shift]);

  const loadProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as StoredProfile;
        setProfile({
          sport: data.sport ?? null,
          name: data.name ?? '',
          photoUri: data.photoUri ?? null,
          savedAt: data.savedAt ?? 0,
        });
      }
    } catch {
    }
  };
  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async (next: Partial<StoredProfile> = {}) => {
    try {
      const merged = { ...profile, ...next, savedAt: Date.now() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      setProfile(merged);
      return true;
    } catch {
      Alert.alert('Error', 'Failed to save profile');
      return false;
    }
  };

  const changePhoto = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9 });
      if (res.didCancel) return;
      const asset: Asset | undefined = res.assets?.[0];
      if (asset?.uri) await saveProfile({ photoUri: asset.uri });
    } catch {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const editBtnTitle = useMemo(() => (edit ? 'Save' : 'Edit'), [edit]);

  const onShare = async () => {
    try {
      await Share.share({
        message:
          'Part Move: match with friends is a reaction game where every move counts. Choose your sport, train your speed, compete with friends and track your progress in convenient statistics.',
      });
    } catch {}
  };

  const [tempName, setTempName] = useState('');
  useEffect(() => setTempName(profile.name || ''), [profile.name]);

  const onToggleEdit = async () => {
    if (!edit) {
      setEdit(true);
      setTimeout(() => nameRef.current?.focus(), 50);
      return;
    }
    await saveProfile({ name: tempName.trim() });
    setEdit(false);
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
            <Text style={styles.headerBtnIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerBtn}>
            <Image source={require('../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
          </View>
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: shift }] }]}>
        <View style={styles.card}>
          <Pressable onPress={changePhoto} style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.85 }]}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <Image source={require('../assets/add_photo_placeholder.png')} style={styles.avatar} resizeMode="cover" />
            )}
          </Pressable>

          <View style={styles.nameBox}>
            <TextInput
              ref={nameRef}
              style={[styles.nameInput, !edit && styles.nameInputDisabled]}
              value={tempName}
              onChangeText={setTempName}
              editable={edit}
              placeholder="Your name"
              placeholderTextColor="#8F8F8F"
              returnKeyType="done"
              onSubmitEditing={onToggleEdit}
            />
          </View>

          <TouchableOpacity style={styles.editBtn} activeOpacity={0.9} onPress={onToggleEdit}>
            <Text style={styles.editBtnText}>{editBtnTitle}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bigCard}>
          <Image source={require('../assets/logo.png')} style={styles.bigLogo} resizeMode="contain" />
          <Text style={styles.desc}>
            Part Move: match with friends is a reaction game where every move counts. Choose your sport, train your
            speed, compete with friends and track your progress in convenient statistics. Check how fast you can win.
          </Text>
          <TouchableOpacity style={styles.shareBtn} onPress={onShare} activeOpacity={0.9}>
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const CARD_W = Math.min(width - 32, 420);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, alignItems: 'center', paddingTop: IS_SMALL ? 60 : 64 },

  headerWrap: { width: '100%', paddingHorizontal: 16, marginBottom: 34 },
  headerBar: {
    height: 64,
    borderWidth: 2,
    borderColor: YELLOW,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: { color: TEXT, fontSize: 18, fontWeight: '800', marginTop: -1 },
  headerTitle: { flex: 1, textAlign: 'center', color: TEXT, fontSize: 20, fontWeight: '800' },
  headerLogo: { width: 34, height: 34 },

  content: { width: '100%', paddingHorizontal: 16 },

  card: {
    width: '100%',
    maxWidth: CARD_W,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: YELLOW,
    borderRadius: 18,
    padding: 14,
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 35,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: YELLOW,
    backgroundColor: '#111',
  },
  avatar: { width: '100%', height: '100%' },

  nameBox: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  nameInput: { color: TEXT, fontSize: 16 },
  nameInputDisabled: { color: '#DADADA' },

  editBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { color: '#0B0B0B', fontWeight: '900' },

  bigCard: {
    width: '100%',
    maxWidth: CARD_W,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: YELLOW,
    borderRadius: 18,
    padding: 18,
    backgroundColor: CARD_BG,
    alignItems: 'center',
  },
  bigLogo: { width: 180, height: 72, marginTop: 6, marginBottom: 12 },
  desc: { color: SUB, fontSize: 14, lineHeight: 20, textAlign: 'left', width: '100%', marginBottom: 18 },
  shareBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 22,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  shareBtnText: { color: '#0B0B0B', fontWeight: '900' },
});
