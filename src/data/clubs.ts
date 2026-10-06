// 광운대학교 총동아리연합회(총동연) 중앙동아리 목록 — 6개 분과 48개 (2026-10-08 수집)
//
// 출처
// - 광운대학교 공식 홈페이지 > 대학생활 > 중앙동아리 (분과명·동아리명·순서의 기준)
//   https://www.kw.ac.kr/ko/life/activity03.jsp
// - 나무위키 '광운대학교/동아리' 2026-07-18 수정판 (교차 확인용)
//   https://namu.wiki/w/광운대학교/동아리
//
// 표기 규칙: 공식 페이지 표기를 따르되 영문·한글 병기(페가수스(Pegasus), 두윗(DO-WITH), 로랩(ROLAB),
// C-SPOT(씨스팟), HL0B(제로비))는 한글만 쓰고 괄호 설명은 뺐다.
// '33&13 RPM'은 공식 페이지의 표기 오류로 보고 33⅓ RPM으로 적었다.
// 두 출처가 다른 항목: 팡팡(공식 페이지에만 있음, 유지), 원리연구회(나무위키에만 있음, 제외).
export const CLUB_GROUPS: { group: string; clubs: string[] }[] = [
  {
    group: '공연예술분과',
    clubs: [
      '14Fret',
      '씨스팟',
      'DaKAPO',
      'K-ME',
      'PHOEBUS',
      '광운극예술연구회',
      '노을',
      '여섯소리',
      '트릭',
      '페가수스',
    ],
  },
  { group: '문화분과', clubs: ['33⅓ RPM', 'KAPA', 'PUB', '만화동아리 C.I.A', '보해미안'] },
  {
    group: '종교봉사분과',
    clubs: ['CCC', 'IVF', 'RCY', '네비게이토 선교회', '두윗', '세상사람들'],
  },
  {
    group: '체육1분과',
    clubs: [
      'KABA',
      'KAFA',
      'KATT',
      'KWTC아마테니스부',
      '아마야구반 PEGASUS',
      '아이스 유니콘스',
      '예인회',
      '팡팡',
    ],
  },
  {
    group: '체육2분과',
    clubs: [
      '검도부',
      '기우회',
      '블랙샤크',
      '블레이드러너',
      '비마유도회',
      '산악부',
      '아마스키부',
      '천운',
    ],
  },
  {
    group: '학술분과',
    clubs: [
      '블랙썬',
      'Blackcat',
      "COM's",
      'FOVU',
      '제로비',
      'K-NET',
      'SELA',
      'TIME',
      '로랩',
      '문학동우회',
      '전자연구회',
    ],
  },
];
export const ALL_CLUBS: string[] = CLUB_GROUPS.flatMap((item) => item.clubs);
