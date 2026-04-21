# docs/superpowers/plans/

기능별 단계 구현 계획서 모음. 각 계획서는 Task 단위로 체크박스를 제공한다.

## 파일 목록

| 파일 | 대상 | 상태 |
|------|------|------|
| `2026-04-14-subtodoc-plan.md` | SubToDoc v1 전체 구현 | ✅ 완료 |
| `2026-04-21-subtodoc-v2-plan.md` | SubToDoc v2 — 4개 신기능 | 🔜 진행 예정 |

## v2 계획서 Task 순서

```
Task 1: videoId 파생 상태 (useMemo)     ← 기반 작업, 먼저 해야 함
Task 2: VideoPreview 컴포넌트           ← Task 1 완료 후
Task 3: transcript withTimestamps       ← 독립 진행 가능
Task 4: prompts options                 ← Task 3 완료 후
Task 5: ResultViewer 타임스탬프 링크    ← Task 1, 4 완료 후
Task 6: FormatSelector UI 추가          ← Task 4 완료 후
Task 7: useHistory + HistoryPanel       ← Task 1 완료 후 독립 진행 가능
Task 8: 통합 검증 + 배포                ← 전체 완료 후
```
