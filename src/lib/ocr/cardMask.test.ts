import { describe, expect, it } from 'vitest';
import {
  scoreOrientationText,
  selectBestOrientation,
  selectSensitiveWordIndexes,
  type OcrWordBox,
} from './cardMask';

function words(...texts: string[]): OcrWordBox[] {
  return texts.map((text, index) => ({
    text,
    bbox: { x0: index * 60, y0: 10, x1: index * 60 + 50, y1: 30 },
  }));
}

describe('학생증 회전 선택', () => {
  it('학번·학교 토큰·한글이 많은 OCR 결과에 더 높은 점수를 준다', () => {
    expect(
      scoreOrientationText('광운대학교 Kwangwoon 2026123456 홍길동 소프트웨어학부'),
    ).toBeGreaterThan(scoreOrientationText('CARD MEMBER'));
  });

  it('점수가 같으면 세로 방향 후보를 선택한다', () => {
    expect(
      selectBestOrientation([
        { rotation: 0, width: 1000, height: 600, text: 'same' },
        { rotation: 90, width: 600, height: 1000, text: 'same' },
      ]).rotation,
    ).toBe(90);
  });
});

describe('학생증 민감정보 bbox 선택', () => {
  it('연속된 카드번호 4-4-4-4 네 단어를 모두 선택한다', () => {
    expect(selectSensitiveWordIndexes(words('1234', '5678', '9012', '3456'))).toEqual(
      new Set([0, 1, 2, 3]),
    );
  });

  it('CVC와 바로 뒤 3~4자리 숫자를 선택한다', () => {
    expect(selectSensitiveWordIndexes(words('CVC', '123', '광운대학교'))).toEqual(new Set([0, 1]));
  });

  it('10자리 학번은 선택하지 않는다', () => {
    expect(selectSensitiveWordIndexes(words('2026123456'))).toEqual(new Set());
  });
});
