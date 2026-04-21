# docs/reviews/

코드 품질 및 아키텍처 진단 보고서 모음.

## 파일 목록

| 파일 | 종류 | 결과 요약 |
|------|------|-----------|
| `intent-review-2026-04-16.md` | Intent Review | 5건 발견 (High 1, Medium 3, Low 1). 핵심: 에러 감지 로직 명명 함수 분리 권장. |
| `architecture-review-2026-04-16.md` | Architecture Review | 현재 구조 유지 권장. 상태/이벤트/의존 방향 모두 문제 없음. |
| `architecture-review-2026-04-21.md` | Architecture Review (v2) | `videoId` 파생 상태화 필요. `useMemo` 1줄 변경으로 해결. |

## 리뷰 주기

- **intent-review**: 함수를 크게 수정하거나 새 기능 추가 후 실행
- **architecture-review**: 새 기능으로 파일 4개 이상 수정이 필요해지는 시점에 실행

Claude Code에서 실행:
```
intent-review 돌려줘
/architecture-review
```
