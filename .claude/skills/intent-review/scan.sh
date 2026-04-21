#!/bin/bash
# intent-review scan — JS/JSX 전수 스캔
# Usage: bash scan.sh [대상경로]  (기본: subtodoc/src/)
# 출력: findings/scan-YYYYMMDD-HHMMSS.txt

TARGET="${1:-subtodoc/src/}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUT_DIR="findings"
OUT_FILE="$OUT_DIR/scan-$TIMESTAMP.txt"

mkdir -p "$OUT_DIR"

RED='\033[0;31m'
YEL='\033[1;33m'
BLU='\033[0;34m'
NC='\033[0m'

TOTAL_FILES=0
TOTAL_FUNCS=0
FINDINGS=()

echo "🔍 intent-review 전수 스캔: $TARGET"
echo "출력: $OUT_FILE"
echo ""

{
  echo "# intent-review 전수 스캔 — $TIMESTAMP"
  echo "대상: $TARGET"
  echo ""

  while IFS= read -r FILE; do
    [[ "$FILE" == *".test."* ]] && continue
    [[ "$FILE" == *".spec."* ]] && continue
    [[ "$FILE" == *"/node_modules/"* ]] && continue

    TOTAL_FILES=$((TOTAL_FILES + 1))

    # 함수 선언 줄 수집
    mapfile -t FUNC_LINES < <(grep -n \
      -E '^\s*(export\s+)?(default\s+)?(async\s+)?function\s+\w+|^\s*(export\s+)?(const|let)\s+\w+\s*=\s*(async\s*)?(\(|function)' \
      "$FILE" 2>/dev/null | cut -d: -f1)

    TOTAL=$(wc -l < "$FILE")

    for i in "${!FUNC_LINES[@]}"; do
      LINE="${FUNC_LINES[$i]}"
      NEXT="${FUNC_LINES[$((i+1))]:-$TOTAL}"
      LEN=$(( NEXT - LINE ))
      NAME=$(sed -n "${LINE}p" "$FILE" | grep -o '\b\w\+\b' | grep -v -E '^(export|default|async|function|const|let|var)$' | head -1)
      TOTAL_FUNCS=$((TOTAL_FUNCS + 1))

      if [ "$LEN" -ge 80 ]; then
        echo "🔴 A. Long Function [$FILE:$LINE] $NAME — ${LEN}줄"
        FINDINGS+=("🔴 $FILE:$LINE $NAME (${LEN}줄)")
      elif [ "$LEN" -ge 50 ]; then
        echo "🟡 A. Long Function [$FILE:$LINE] $NAME — ${LEN}줄"
        FINDINGS+=("🟡 $FILE:$LINE $NAME (${LEN}줄)")
      fi
    done

    # B. 범용 동사
    while IFS= read -r MATCH; do
      echo "🟡 B. Generic Verb [$FILE] $MATCH"
      FINDINGS+=("🟡 $FILE — 범용동사: $MATCH")
    done < <(grep -n -E '(function|const|let)\s+(process|handle|manage|execute|run)[A-Z_$]' "$FILE" 2>/dev/null || true)

    # C. 접속사
    while IFS= read -r MATCH; do
      echo "🟡 C. Conjunction [$FILE] $MATCH"
      FINDINGS+=("🟡 $FILE — 접속사: $MATCH")
    done < <(grep -n -E '(function|const|let)\s+\w*(And|With|Also)[A-Z]' "$FILE" 2>/dev/null || true)

    # D. 섹션 구분 주석
    SECTIONS=$(grep -c -E '^\s*//\s*[─━=\-]{3,}|^\s*//\s*──' "$FILE" 2>/dev/null || echo 0)
    if [ "$SECTIONS" -ge 3 ]; then
      echo "🔵 D. Multi-concern [$FILE] 섹션 구분 ${SECTIONS}개"
      FINDINGS+=("🔵 $FILE — 섹션 ${SECTIONS}개")
    fi

  done < <(find "$TARGET" -name "*.js" -o -name "*.jsx" 2>/dev/null | sort)

  echo ""
  echo "## 요약"
  echo "- 스캔 파일: $TOTAL_FILES"
  echo "- 스캔 함수(추정): $TOTAL_FUNCS"
  echo "- 발견: ${#FINDINGS[@]}건"
  echo ""
  echo "## 전체 목록"
  for F in "${FINDINGS[@]}"; do echo "  $F"; done

} | tee "$OUT_FILE"

echo ""
echo "📄 보고서 저장: $OUT_FILE"
echo "다음: Claude에게 '$OUT_FILE 기반으로 intent-review 평가해줘' 요청"
