import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Share,
  Image,
  FlatList,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'statistics'>;

type DuoItem = { p1: string; p2: string; t1: number; t2: number; ts: number };

const { width, height } = Dimensions.get('window');
const IS_SMALL = Math.min(width, height) < 700 || width <= 360;
const VERY_SMALL = height < 670;

const YELLOW = '#FFE651';
const TEXT = '#FFFFFF';
const SUB = '#CFCFCF';
const BG = '#000000';

const SOLO_KEY = 'pm_stats_solo_v1';
const DUO_KEY  = 'pm_stats_duo_v1';

export default function StatisticsNoDataScreen({ navigation }: Props) {
  const scale = (n: number) => (VERY_SMALL ? n * 0.9 : IS_SMALL ? n * 0.95 : n);

  const [mode, setMode] = useState<'solo' | 'duo'>('solo');
  const [soloList, setSoloList] = useState<number[]>([]);
  const [duoList, setDuoList] = useState<DuoItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isFocused = useIsFocused();

  const fade = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(12)).current;
  const appear = useCallback(() => {
    fade.setValue(0);
    shift.setValue(12);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(shift,{ toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, shift]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRaw, dRaw] = await Promise.all([
        AsyncStorage.getItem(SOLO_KEY),
        AsyncStorage.getItem(DUO_KEY),
      ]);
      setSoloList(sRaw ? JSON.parse(sRaw) : []);
      setDuoList(dRaw ? JSON.parse(dRaw) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadData();
      appear();
    }
  }, [isFocused, loadData, appear]);

  const avgSolo = useMemo(() => soloList.length ? soloList.reduce((a,b)=>a+b,0)/soloList.length : 0, [soloList]);
  const avgDuo  = useMemo(() => {
    if (!duoList.length) return 0;
    const all = duoList.flatMap(r => [r.t1, r.t2]);
    return all.reduce((a,b)=>a+b,0)/all.length;
  }, [duoList]);

  const format = (t: number) => t.toFixed(3);
  const formatIndex = (len:number, idx:number) => `#${len - idx}`;
  const formatDate = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const hh = String(d.getHours()).padStart(2,'0');
    const mi = String(d.getMinutes()).padStart(2,'0');
    return `${dd}.${mm} ${hh}:${mi}`;
  };

  const onShare = async () => {
    try {
      const msg = mode === 'solo'
        ? `Average reaction time: ${format(avgSolo)} sec.`
        : `Average reaction time (duo): ${format(avgDuo)} sec.`;
      await Share.share({ message: msg });
    } catch {}
  };

  const onClear = async () => {
    try {
      await AsyncStorage.multiRemove([SOLO_KEY, DUO_KEY]);
      setSoloList([]);
      setDuoList([]);
    } catch {}
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

  const AvgAndTabs = () => (
    <View style={{ width: '100%' }}>
      <View style={[styles.avgCard, { paddingVertical: scale(28), paddingHorizontal: scale(22), borderRadius: scale(18) }]}>
        <Text style={[styles.avgTitle, { fontSize: scale(14), marginBottom: scale(14) }]}>Average reaction time</Text>
        <Text style={[styles.avgValue, { fontSize: scale(40), marginBottom: scale(16) }]}>
          {format(mode === 'solo' ? avgSolo : avgDuo)} sec.
        </Text>
        <View style={[styles.row, { gap: scale(12) }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { height: scale(50), borderRadius: scale(14), paddingHorizontal: scale(22), backgroundColor: YELLOW }]}
            activeOpacity={0.9}
            onPress={onShare}
          >
            <Text style={[styles.actionBtnText, { fontSize: scale(18), color: '#0B0B0B' }]}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { height: scale(50), borderRadius: scale(14), paddingHorizontal: scale(22), borderColor: YELLOW, borderWidth: 2 }]}
            activeOpacity={0.9}
            onPress={onClear}
          >
            <Text style={[styles.actionBtnText, { fontSize: scale(18), color: YELLOW }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.tabsRow, { gap: scale(14), marginTop: scale(18), marginBottom: 20 }]}>
        <TouchableOpacity
          onPress={() => setMode('solo')}
          activeOpacity={0.9}
          style={[styles.tabBtn, mode === 'solo' ? styles.tabBtnActive : styles.tabBtnInactive, { height: scale(56), borderRadius: scale(16) }]}
        >
          <Text style={[styles.tabText, mode === 'solo' ? styles.tabTextActive : styles.tabTextInactive, { fontSize: scale(18) }]}>
            Solo mode
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('duo')}
          activeOpacity={0.9}
          style={[styles.tabBtn, mode === 'duo' ? styles.tabBtnActive : styles.tabBtnInactive, { height: scale(56), borderRadius: scale(16) }]}
        >
          <Text style={[styles.tabText, mode === 'duo' ? styles.tabTextActive : styles.tabTextInactive, { fontSize: scale(18) }]}>
            Duo mode
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSolo = ({ item, index }: ListRenderItemInfo<number>) => (
    <View style={[styles.itemRow, { height: scale(64), borderRadius: scale(14), paddingHorizontal: scale(16), marginBottom: scale(12) }]}>
      <View style={styles.rowBetween}>
        <Text style={[styles.itemDate, { fontSize: scale(12) }]}>{`#${soloList.length - index}`}</Text>
        <Text style={[styles.itemDate, { fontSize: scale(12) }]} />
      </View>
      <View style={styles.itemPill}>
        <Text style={[styles.itemPillText, { fontSize: scale(16) }]}>{item.toFixed(3)} sec.</Text>
      </View>
    </View>
  );

  const renderDuo = ({ item, index }: ListRenderItemInfo<DuoItem>) => (
    <View style={[styles.itemRow, { borderRadius: scale(14), paddingHorizontal: scale(16), paddingVertical: scale(12), marginBottom: scale(12) }]}>
      <View style={[styles.rowBetween, { marginBottom: scale(8) }]}>
        <Text style={[styles.itemDate, { fontSize: scale(12) }]}>{`#${duoList.length - index}`}</Text>
        <Text style={[styles.itemDate, { fontSize: scale(12) }]}>{formatDate(item.ts)}</Text>
      </View>
      <View style={[styles.itemTwoCols, { gap: scale(10) }]}>
        <View style={[styles.smallPill, { borderRadius: scale(12), height: scale(56) }]}>
          <Text style={[styles.smallPillName, { fontSize: scale(12) }]}>{item.p1}</Text>
          <Text style={[styles.smallPillVal, { fontSize: scale(16) }]}>{item.t1.toFixed(3)} sec.</Text>
        </View>
        <View style={[styles.smallPill, { borderRadius: scale(12), height: scale(56) }]}>
          <Text style={[styles.smallPillName, { fontSize: scale(12) }]}>{item.p2}</Text>
          <Text style={[styles.smallPillVal, { fontSize: scale(16) }]}>{item.t2.toFixed(3)} sec.</Text>
        </View>
      </View>
    </View>
  );

  const contentBottomPad = VERY_SMALL ? 96 : IS_SMALL ? 80 : 56;

  return (
    <View style={styles.root}>
      <HeaderBar title="Statistics" />
      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: shift }], marginTop: IS_SMALL ? 76 : 84 }]}>
        {mode === 'solo' ? (
          <FlatList<number>
            data={soloList.slice().reverse()}
            keyExtractor={(_, i) => `s-${i}`}
            renderItem={renderSolo}
            ListHeaderComponent={<AvgAndTabs />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: scale(120) }}>
                <Text style={[styles.nodata, { fontSize: scale(16) }]}>No data…</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={YELLOW} />}
            contentContainerStyle={{ paddingBottom: contentBottomPad, paddingTop: scale(16) }}
            initialNumToRender={10}
            removeClippedSubviews
          />
        ) : (
          <FlatList<DuoItem>
            data={duoList.slice().reverse()}
            keyExtractor={(_, i) => `d-${i}`}
            renderItem={renderDuo}
            ListHeaderComponent={<AvgAndTabs />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: scale(120) }}>
                <Text style={[styles.nodata, { fontSize: scale(16) }]}>No data…</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={YELLOW} />}
            contentContainerStyle={{ paddingBottom: contentBottomPad, paddingTop: scale(16) }}
            initialNumToRender={10}
            removeClippedSubviews
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, alignItems: 'center', paddingTop: IS_SMALL ? 60 : 64 },
  headerWrap: { width: '100%', paddingHorizontal: 16 },
  headerBar: {
    height: 64, borderWidth: 2, borderColor: YELLOW, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
  },
  headerBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: YELLOW, alignItems: 'center', justifyContent: 'center' },
  headerBtnIcon: { color: TEXT, fontSize: 18, fontWeight: '800', marginTop: -1 },
  headerTitle: { flex: 1, textAlign: 'center', color: TEXT, fontSize: 20, fontWeight: '800' },
  headerLogo: { width: 34, height: 34 },

  content: { width: '100%', paddingHorizontal: 16 },

  avgCard: { borderWidth: 2, borderColor: YELLOW, borderRadius: 18, alignItems: 'center', backgroundColor: '#000' },
  avgTitle: { color: SUB, fontWeight: '700' },
  avgValue: { color: TEXT, fontWeight: '900' },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  actionBtn: { alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontWeight: '900' },

  tabsRow: { flexDirection: 'row', width: '100%' },
  tabBtn: { flex: 1, borderWidth: 2, borderColor: YELLOW, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { backgroundColor: YELLOW, borderRadius: 16 },
  tabBtnInactive: { backgroundColor: 'transparent', borderRadius: 16 },
  tabText: { fontWeight: '800' },
  tabTextActive: { color: '#0B0B0B' },
  tabTextInactive: { color: TEXT },

  nodata: { color: SUB },

  itemRow: { width: '100%', borderWidth: 2, borderColor: YELLOW, backgroundColor: '#000' },
  itemDate: { color: SUB },
  itemPill: { alignSelf: 'flex-start', backgroundColor: YELLOW, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 6 },
  itemPillText: { color: '#0B0B0B', fontWeight: '900' },

  itemTwoCols: { flexDirection: 'row', width: '100%' },
  smallPill: { flex: 1, borderWidth: 2, borderColor: YELLOW, alignItems: 'center', justifyContent: 'center' },
  smallPillName: { color: SUB, marginBottom: 2 },
  smallPillVal: { color: TEXT, fontWeight: '900' },
});
