#!/bin/bash
# intent-review delta-check — 커밋 간 변화량 추적
# Usage: bash delta-check.sh [base] [head]  (기본: HEAD~1 HEAD)

BASE="${1:-HEAD~1}"
HEAD="${2:-HEAD}"

RED='\033[0;31m'
YEL='\033[1;33m'
GRN='\033[0;32m'
NC='\033[0m'

echo "📊 intent-review delta-check: $BASE → $HEAD"
echo ""

# 변경된 JS/JSX 파일 목록
CHANGED=$(git diff --name-only "$BASE" "$HEAD" 2>/dev/null \
  | grep -E '\.(js|jsx)$' \
  | grep -v -E '(\.test\.|\.spec\.|node_modules)' || true)

if [ -z "$CHANGED" ]; then
  echo "변경된 JS/JSX 파일 없음"
  exit 0
fi

WARNED=0
while IFS= read -r FILE; do
  [ -f "$FILE" ] || continue

  # 현재 파일의 함수별 줄 수 추정
  mapfile -t CURR_LINES < <(grep -n \
    -E '^\s*(export\s+)?(default\s+)?(async\s+)?function\s+\w+|^\s*(export\s+)?(const|let)\s+\w+\s*=\s*(async\s*)?(\(|function)' \
    "$FILE" 2>/dev/null | cut -d: -f1)

  TOTAL=$(wc -l < "$FILE")

  # diff에서 해당 파일의 추가/삭제 줄 수
  ADDED=$(git diff "$BASE" "$HEAD" -- "$FILE" 2>/dev/null | grep '^+' | grep -v '^+++' | wc -l || echo 0)
  REMOVED=$(git diff "$BASE" "$HEAD" -- "$FILE" 2>/dev/null | grep '^-' | grep -v '^---' | wc -l || echo 0)
  NET=$((ADDED - REMOVED))

  if [ "$NET" -ge 20 ]; then
    echo -e "${RED}🔴 [$FILE] +${NET}줄 증가 — intent-review 권장${NC}"
    WARNED=1
  elif [ "$NET" -ge 10 ]; then
    echo -e "${YEL}🟡 [$FILE] +${NET}줄 증가 — 검토 권장${NC}"
    WARNED=1
  elif [ "$NET" -le -20 ]; then
    echo -e "${GRN}🟢 [$FILE] ${NET}줄 감소 — 개선됨${NC}"
  fi

done <<< "$CHANGED"

[ "$WARNED" -eq 0 ] && echo "✅ 큰 변화 없음 ($BASE → $HEAD)"
exit 0
