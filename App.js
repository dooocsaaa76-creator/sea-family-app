// 바다가족 - 가족 바다놀이 정보 앱 (v2: 물때 + 길찾기)
// Expo Snack(snack.expo.dev)에 이 파일 내용을 App.js에 붙여넣으면 바로 실행됩니다.
// 추가 설치가 필요한 라이브러리는 없습니다.

import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, ScrollView, TouchableOpacity,
  Linking, StatusBar, Platform, BackHandler, StyleSheet,
} from 'react-native';

// ─── 색상 ───────────────────────────────────────────
const C = {
  sea: '#0F5C7A', seaDeep: '#0A3F54', mist: '#EAF2F4', ink: '#12303B',
  sub: '#5B7580', buoy: '#F26B38', mud: '#7A6A55', line: '#D3E2E7', white: '#FFFFFF',
};

// ─── 예시 데이터 ────────────────────────────────────
// ※ 실제 출시 전 장소·규정·가격·좌표는 반드시 직접 확인하세요.
const SPOTS = [
  {
    id: 'jebudo', name: '제부도', region: '경기 화성', type: '해루질', emoji: '🦀',
    lat: 37.1975, lng: 126.6229,
    summary: '하루 두 번 바닷길이 열리는 섬. 갯벌체험장에서 아이와 조개·게를 잡을 수 있어요.',
    season: '봄~가을', kids: '유아부터 가능',
    caution: ['갯벌은 대부분 어촌계 마을어장이에요. 지정 체험장에서만 채취하세요.', '바닷길 통행 가능 시간을 꼭 확인하고 들어가세요.'],
    gear: [{ name: '갯벌용 호미', price: '약 5천원' }, { name: '장화 (아동용 포함)', price: '약 1~3만원' }, { name: '채집 바구니', price: '약 5천원' }],
  },
  {
    id: 'mongsanpo', name: '몽산포해수욕장', region: '충남 태안', type: '해루질', emoji: '🐚',
    lat: 36.7580, lng: 126.1660,
    summary: '맛조개 구멍에 소금을 뿌려 잡는 체험으로 유명한 넓은 모래갯벌이에요.',
    season: '봄~가을 (썰물 때)', kids: '초등학생 이상 추천',
    caution: ['채취 가능 구역과 1인당 채취량 제한이 있는지 현장 안내를 확인하세요.', '물이 들어오기 시작하기 전에 여유 있게 나오세요.'],
    gear: [{ name: '맛조개 삽', price: '약 1만원' }, { name: '맛소금', price: '약 2천원' }, { name: '장화', price: '약 1~3만원' }],
  },
  {
    id: 'dongmyeong', name: '동명항', region: '강원 속초', type: '낚시', emoji: '🎣',
    lat: 38.1949, lng: 128.5934,
    summary: '항구 주변에서 가볍게 즐기는 생활낚시. 근처에 회센터와 먹거리가 많아요.',
    season: '여름~가을', kids: '구명조끼 착용 시 초등학생 이상',
    caution: ['테트라포드(방파제 블록) 위는 출입금지 구역이 많고 매우 위험해요.', '어종별 포획금지 기간·크기를 확인하세요.'],
    gear: [{ name: '바다낚시 입문 세트', price: '약 3~5만원' }, { name: '아동용 구명조끼', price: '약 3~5만원' }, { name: '크릴 미끼', price: '약 5천원' }],
  },
  {
    id: 'jumunjin', name: '주문진항', region: '강원 강릉', type: '낚시', emoji: '🐟',
    lat: 37.8996, lng: 128.8305,
    summary: '방파제 생활낚시와 수산시장 구경을 함께 할 수 있는 항구예요.',
    season: '여름~가을', kids: '구명조끼 착용 시 초등학생 이상',
    caution: ['파도가 높은 날에는 방파제 낚시를 피하세요.', '출입 통제 표지가 있는 곳에는 들어가지 마세요.'],
    gear: [{ name: '바다낚시 입문 세트', price: '약 3~5만원' }, { name: '아동용 구명조끼', price: '약 3~5만원' }, { name: '갯지렁이 미끼', price: '약 5천원' }],
  },
];

// ─── 외부 링크 (API 키 불필요, 바로 작동) ───────────────
const q = (s) => encodeURIComponent(s);
const LINKS = {
  food: (s) => `https://map.kakao.com/?q=${q(s.region + ' ' + s.name + ' 맛집')}`,
  youtube: (s) => `https://www.youtube.com/results?search_query=${q(s.name + ' ' + s.type)}`,
  buy: (item) => `https://www.coupang.com/np/search?q=${q(item)}`,
  // 구글맵 경로 길찾기: 현재 위치 → 목적지. API 키 없이 바로 작동합니다.
  drive: (s) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=driving`,
  transit: (s) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=transit`,
};
const open = (url) => Linking.openURL(url).catch(() => {});

// ─── 물때(조석) 계산 ────────────────────────────────
// ⚠️ 지금은 실제 관측 데이터가 아니라, 화면 동작 확인용 "예시 계산"입니다.
// 실제 서비스 전에는 아래 getTideEvents 함수 내부를,
// 국립해양조사원(KHOA) 공공데이터포털 조석예보 API 호출로 교체하세요.
// (data.go.kr에서 "조석예보" 검색 → API 키 발급 → 관측소 코드 확인)
//
// 예시 (실제 연동 시 이런 형태가 됩니다):
// const res = await fetch(`https://www.khoa.go.kr/api/oceangrid/tideObsPreTab/search.do?ServiceKey=발급받은키&ObsCode=관측소코드&Date=${dateStr}&ResultType=json`);
// const json = await res.json();

const TIDE_EPOCH = new Date(2026, 0, 1, 3, 10, 0); // 임의 기준 시각 (예시 계산용)
const TIDE_PERIOD_HOURS = 12 + 25 / 60; // 반일주조 평균 주기(약 12시간 25분)

function pad(n) { return n.toString().padStart(2, '0'); }
function fmtDate(d) { return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${'일월화수목금토'[d.getDay()]})`; }
function fmtTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMinutes(d, n) { return new Date(d.getTime() + n * 60000); }
function startOfDay(d) { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; }
function setTime(day, h, m) { const r = new Date(day); r.setHours(h, m, 0, 0); return r; }
// 장소마다 물때 시각이 조금씩 다르게 보이도록 하는 예시용 시드값 (실제 데이터와 무관)
function seedHours(id) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 720; return h / 60; }

// fromDate ~ toDate 사이의 간조/만조 이벤트 목록 (예시 계산)
function getTideEvents(fromDate, toDate, seed) {
  const periodMs = TIDE_PERIOD_HOURS * 3600000;
  const start = TIDE_EPOCH.getTime() + seed * 3600000;
  let i = Math.floor((fromDate.getTime() - start) / periodMs) - 1;
  const events = [];
  let t = new Date(start + i * periodMs);
  while (t < toDate) {
    if (t >= fromDate) events.push({ time: new Date(t), kind: i % 2 === 0 ? '간조' : '만조' });
    i += 1;
    t = new Date(start + i * periodMs);
  }
  return events;
}

// 낚시 골든타임(경험 법칙): 물때 변화 전후, 새벽·해질녘
function fishingWindows(dayEvents, day) {
  const windows = dayEvents.map((e) => ({
    start: addMinutes(e.time, -60), end: addMinutes(e.time, 60),
    label: `${e.kind} 전후 · 조류가 바뀌는 시점`,
  }));
  windows.push({ start: setTime(day, 5, 30), end: setTime(day, 7, 30), label: '새벽 여명 (일출 전후)' });
  windows.push({ start: setTime(day, 17, 0), end: setTime(day, 19, 0), label: '해질녘 (일몰 전후)' });
  return windows.sort((a, b) => a.start - b.start);
}

// 해루질 골든타임(경험 법칙): 간조 전후, 야간이면 가산점
function haeruljilWindows(dayEvents) {
  return dayEvents
    .filter((e) => e.kind === '간조')
    .map((e) => {
      const night = e.time.getHours() >= 18 || e.time.getHours() < 6;
      return {
        start: addMinutes(e.time, -90), end: addMinutes(e.time, 90),
        label: night ? '간조 전후 · 야간이라 더 추천' : '간조 전후 · 주간',
      };
    });
}

// "원하는 시간대 + 간조/만조"로 향후 날짜 찾기
function findMatchingDates({ type, fromHour, toHour, seed, daysAhead = 45 }) {
  const today = startOfDay(new Date());
  const events = getTideEvents(today, addDays(today, daysAhead), seed);
  const seen = new Set(); const out = [];
  events.forEach((e) => {
    if (e.kind !== type) return;
    const h = e.time.getHours() + e.time.getMinutes() / 60;
    const inRange = fromHour <= toHour ? (h >= fromHour && h <= toHour) : (h >= fromHour || h <= toHour);
    if (!inRange) return;
    const key = fmtDate(e.time);
    if (!seen.has(key)) { seen.add(key); out.push(e); }
  });
  return out.slice(0, 10);
}

// ─── 목록 화면 ──────────────────────────────────────
function SpotList({ onSelect }) {
  const [filter, setFilter] = useState('전체');
  const shown = filter === '전체' ? SPOTS : SPOTS.filter((s) => s.type === filter);
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>이번 주말,{'\n'}바다 어디 갈까?</Text>
        <Text style={styles.heroSub}>가족과 함께 갈 만한 낚시·해루질 장소</Text>
      </View>
      <View style={styles.filterRow}>
        {['전체', '해루질', '낚시'].map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipOn]}>
            <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {shown.map((s) => (
        <TouchableOpacity key={s.id} style={styles.card} onPress={() => onSelect(s)} activeOpacity={0.8}>
          <View style={[styles.cardIcon, { backgroundColor: s.type === '해루질' ? C.mud : C.sea }]}>
            <Text style={{ fontSize: 30 }}>{s.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardType}>{s.type} · {s.region}</Text>
            <Text style={styles.cardName}>{s.name}</Text>
            <Text style={styles.cardSummary} numberOfLines={2}>{s.summary}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={styles.adSlot}><Text style={styles.adText}>광고 영역 (AdMob 배너 예정)</Text></View>
      <Text style={styles.notice}>장소 정보는 예시이며, 방문 전 현지 규정과 기상을 꼭 확인하세요.</Text>
    </ScrollView>
  );
}

// ─── 상세 화면 ──────────────────────────────────────
function SpotDetail({ spot, onBack, onTide }) {
  const accent = spot.type === '해루질' ? C.mud : C.sea;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.detailHead, { backgroundColor: accent }]}>
        <TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>‹ 목록</Text></TouchableOpacity>
        <Text style={{ fontSize: 48 }}>{spot.emoji}</Text>
        <Text style={styles.detailName}>{spot.name}</Text>
        <Text style={styles.detailRegion}>{spot.region} · {spot.type}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.summary}>{spot.summary}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>추천 시기</Text><Text style={styles.infoValue}>{spot.season}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>아이 동반</Text><Text style={styles.infoValue}>{spot.kids}</Text></View>
        </View>

        <TouchableOpacity style={styles.tideBtn} onPress={() => onTide(spot)}>
          <Text style={styles.tideText}>🌊 물때 확인하고 좋은 시간 찾기</Text>
        </TouchableOpacity>

        <Text style={styles.section}>가는 방법</Text>
        <View style={styles.routeRow}>
          <TouchableOpacity style={styles.routeBtn} onPress={() => open(LINKS.drive(spot))}>
            <Text style={styles.routeIcon}>🚗</Text><Text style={styles.routeText}>자가용 길찾기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.routeBtn} onPress={() => open(LINKS.transit(spot))}>
            <Text style={styles.routeIcon}>🚌</Text><Text style={styles.routeText}>대중교통 길찾기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cautionBox}>
          <Text style={styles.cautionTitle}>⚠️ 가기 전에 꼭 확인하세요</Text>
          {spot.caution.map((c, i) => <Text key={i} style={styles.cautionItem}>• {c}</Text>)}
        </View>

        <Text style={styles.section}>필요한 장비</Text>
        {spot.gear.map((g) => (
          <View key={g.name} style={styles.gearRow}>
            <View style={{ flex: 1 }}><Text style={styles.gearName}>{g.name}</Text><Text style={styles.gearPrice}>{g.price}</Text></View>
            <TouchableOpacity style={styles.buyBtn} onPress={() => open(LINKS.buy(g.name))}><Text style={styles.buyText}>구매처 보기</Text></TouchableOpacity>
          </View>
        ))}
        <Text style={styles.small}>가격은 대략적인 금액이며 판매처마다 다릅니다.</Text>

        <Text style={styles.section}>더 알아보기</Text>
        <LinkRow icon="🍽️" label="근처 맛집 찾기" onPress={() => open(LINKS.food(spot))} />
        <LinkRow icon="▶️" label="유튜브 영상 보기" onPress={() => open(LINKS.youtube(spot))} />
      </View>
    </ScrollView>
  );
}

function LinkRow({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.linkRow} onPress={onPress}>
      <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>
      <Text style={styles.linkText}>{label}</Text>
      <Text style={styles.linkArrow}>›</Text>
    </TouchableOpacity>
  );
}

// ─── 물때 화면 ──────────────────────────────────────
function Stepper({ label, value, onChange }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange((value + 23) % 24)}><Text style={styles.stepBtnText}>−</Text></TouchableOpacity>
        <Text style={styles.stepValue}>{pad(value)}:00</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange((value + 1) % 24)}><Text style={styles.stepBtnText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function TideScreen({ spot, onBack }) {
  const [mode, setMode] = useState('day'); // 'day' | 'search'
  const [dayOffset, setDayOffset] = useState(0);
  const [searchType, setSearchType] = useState('간조');
  const [fromHour, setFromHour] = useState(14);
  const [toHour, setToHour] = useState(17);
  const [results, setResults] = useState(null);

  const seed = seedHours(spot.id);
  const day = startOfDay(addDays(new Date(), dayOffset));
  const dayEvents = getTideEvents(day, addDays(day, 1), seed);
  const windows = spot.type === '낚시' ? fishingWindows(dayEvents, day) : haeruljilWindows(dayEvents);

  const runSearch = () => setResults(findMatchingDates({ type: searchType, fromHour, toHour, seed }));

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.detailHead, { backgroundColor: C.seaDeep }]}>
        <TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>‹ {spot.name}</Text></TouchableOpacity>
        <Text style={{ fontSize: 40 }}>🌊</Text>
        <Text style={styles.detailName}>물때 확인</Text>
        <Text style={styles.detailRegion}>{spot.name} 기준 예시 계산</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity onPress={() => setMode('day')} style={[styles.chip, mode === 'day' && styles.chipOn]}>
          <Text style={[styles.chipText, mode === 'day' && styles.chipTextOn]}>날짜별 확인</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('search')} style={[styles.chip, mode === 'search' && styles.chipOn]}>
          <Text style={[styles.chipText, mode === 'search' && styles.chipTextOn]}>원하는 시간 찾기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {mode === 'day' ? (
          <>
            <View style={styles.dateNav}>
              <TouchableOpacity onPress={() => setDayOffset(dayOffset - 1)} style={styles.dateArrow}><Text style={styles.dateArrowText}>‹</Text></TouchableOpacity>
              <Text style={styles.dateText}>{fmtDate(day)}</Text>
              <TouchableOpacity onPress={() => setDayOffset(dayOffset + 1)} style={styles.dateArrow}><Text style={styles.dateArrowText}>›</Text></TouchableOpacity>
            </View>

            <Text style={styles.section}>이날의 간조·만조</Text>
            {dayEvents.map((e, i) => (
              <View key={i} style={styles.tideRow}>
                <Text style={styles.tideKind}>{e.kind === '간조' ? '🔽 간조' : '🔼 만조'}</Text>
                <Text style={styles.tideTime}>{fmtTime(e.time)}</Text>
              </View>
            ))}

            <View style={styles.cautionBox}>
              <Text style={styles.cautionTitle}>{spot.type === '낚시' ? '🎣 오늘의 낚시 골든타임 (경험 법칙 기반 추천)' : '🦀 오늘의 해루질 좋은 시간 (경험 법칙 기반 추천)'}</Text>
              {windows.map((w, i) => (
                <Text key={i} style={styles.cautionItem}>• {fmtTime(w.start)} ~ {fmtTime(w.end)} — {w.label}</Text>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.section}>찾고 싶은 조건</Text>
            <View style={styles.filterRow}>
              {['간조', '만조'].map((t) => (
                <TouchableOpacity key={t} onPress={() => setSearchType(t)} style={[styles.chip, searchType === t && styles.chipOn]}>
                  <Text style={[styles.chipText, searchType === t && styles.chipTextOn]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Stepper label="시작 시각" value={fromHour} onChange={setFromHour} />
            <Stepper label="종료 시각" value={toHour} onChange={setToHour} />

            <TouchableOpacity style={styles.tideBtn} onPress={runSearch}>
              <Text style={styles.tideText}>이 조건에 맞는 날짜 찾기</Text>
            </TouchableOpacity>

            {results && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.section}>앞으로 45일 중 맞는 날짜</Text>
                {results.length === 0 ? (
                  <Text style={styles.cautionItem}>조건에 맞는 날짜가 없어요. 시간 범위를 넓혀보세요.</Text>
                ) : results.map((r, i) => (
                  <View key={i} style={styles.tideRow}>
                    <Text style={styles.tideKind}>{fmtDate(r.time)}</Text>
                    <Text style={styles.tideTime}>{r.kind} {fmtTime(r.time)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        <Text style={styles.small}>※ 지금은 예시 계산이며, 실제 관측 데이터가 아닙니다. 정확한 물때는 국립해양조사원 자료를 함께 확인하세요.</Text>
      </View>
    </ScrollView>
  );
}

// ─── 앱 시작점 ──────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState({ name: 'list' });

  const goList = () => setScreen({ name: 'list' });
  const goDetail = (spot) => setScreen({ name: 'detail', spot });
  const goTide = (spot) => setScreen({ name: 'tide', spot });

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen.name === 'tide') { goDetail(screen.spot); return true; }
      if (screen.name === 'detail') { goList(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [screen]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      {screen.name === 'list' && <SpotList onSelect={goDetail} />}
      {screen.name === 'detail' && <SpotDetail spot={screen.spot} onBack={goList} onTide={goTide} />}
      {screen.name === 'tide' && <TideScreen spot={screen.spot} onBack={() => goDetail(screen.spot)} />}
    </SafeAreaView>
  );
}

// ─── 스타일 ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.mist, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  hero: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 18 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: C.seaDeep, lineHeight: 38 },
  heroSub: { fontSize: 15, color: C.sub, marginTop: 8 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 22, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, marginRight: 8 },
  chipOn: { backgroundColor: C.sea, borderColor: C.sea },
  chipText: { color: C.ink, fontSize: 14, fontWeight: '600' },
  chipTextOn: { color: C.white },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 14 },
  cardIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardType: { fontSize: 12, color: C.sub },
  cardName: { fontSize: 18, fontWeight: '700', color: C.ink, marginVertical: 2 },
  cardSummary: { fontSize: 13, color: C.sub, lineHeight: 19 },
  adSlot: { marginHorizontal: 16, marginTop: 8, height: 60, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: C.sub, alignItems: 'center', justifyContent: 'center' },
  adText: { color: C.sub, fontSize: 12 },
  notice: { fontSize: 12, color: C.sub, textAlign: 'center', marginTop: 16, paddingHorizontal: 30 },
  detailHead: { alignItems: 'center', paddingTop: 16, paddingBottom: 26 },
  back: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6 },
  backText: { color: C.white, fontSize: 16, fontWeight: '600' },
  detailName: { color: C.white, fontSize: 28, fontWeight: '800', marginTop: 6 },
  detailRegion: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
  body: { padding: 18 },
  summary: { fontSize: 16, color: C.ink, lineHeight: 25 },
  infoRow: { flexDirection: 'row', marginTop: 16 },
  infoBox: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 12, marginRight: 8 },
  infoLabel: { fontSize: 12, color: C.sub },
  infoValue: { fontSize: 14, color: C.ink, fontWeight: '600', marginTop: 4 },
  tideBtn: { backgroundColor: C.sea, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  tideText: { color: C.white, fontSize: 17, fontWeight: '700' },
  routeRow: { flexDirection: 'row', marginTop: 4 },
  routeBtn: { flex: 1, backgroundColor: C.white, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginRight: 8 },
  routeIcon: { fontSize: 22 },
  routeText: { fontSize: 13, fontWeight: '700', color: C.ink, marginTop: 4 },
  cautionBox: { backgroundColor: '#FFF1EA', borderLeftWidth: 4, borderLeftColor: C.buoy, borderRadius: 8, padding: 14, marginTop: 16 },
  cautionTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 6 },
  cautionItem: { fontSize: 14, color: C.ink, lineHeight: 21, marginTop: 2 },
  section: { fontSize: 18, fontWeight: '800', color: C.seaDeep, marginTop: 26, marginBottom: 10 },
  gearRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 8 },
  gearName: { fontSize: 15, color: C.ink, fontWeight: '600' },
  gearPrice: { fontSize: 13, color: C.sub, marginTop: 2 },
  buyBtn: { borderWidth: 1, borderColor: C.buoy, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12 },
  buyText: { color: C.buoy, fontSize: 13, fontWeight: '700' },
  small: { fontSize: 12, color: C.sub, marginTop: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 8 },
  linkText: { flex: 1, fontSize: 15, color: C.ink, fontWeight: '600' },
  linkArrow: { fontSize: 22, color: C.sub },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dateArrow: { paddingHorizontal: 20, paddingVertical: 8 },
  dateArrowText: { fontSize: 24, color: C.sea, fontWeight: '700' },
  dateText: { fontSize: 18, fontWeight: '700', color: C.ink, minWidth: 170, textAlign: 'center' },
  tideRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: C.white, borderRadius: 10, padding: 14, marginBottom: 6 },
  tideKind: { fontSize: 15, fontWeight: '600', color: C.ink },
  tideTime: { fontSize: 15, fontWeight: '700', color: C.sea },
  stepper: { backgroundColor: C.white, borderRadius: 12, padding: 14, marginTop: 10 },
  stepperLabel: { fontSize: 13, color: C.sub, marginBottom: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.mist, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 22, fontWeight: '700', color: C.sea },
  stepValue: { fontSize: 20, fontWeight: '800', color: C.ink, marginHorizontal: 24, minWidth: 70, textAlign: 'center' },
});
