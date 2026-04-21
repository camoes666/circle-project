#!/bin/bash
# intent-review quick-check — JS/JSX 단일 파일 빠른 검사
# Usage: bash quick-check.sh <file> [<file2> ...]
# 출력: 색상 경고 (표준출력), 비차단

RED='\033[0;31m'
YEL='\033[1;33m'
BLU='\033[0;34m'
NC='\033[0m'

WARNED=0

check_file() {
  local FILE="$1"
  [ -f "$FILE" ] || return

  # A. 긴 함수 — 함수 선언 줄 번호 수집 후 간격으로 길이 추정
  mapfile -t FUNC_LINES < <(grep -n \
    -E '^\s*(export\s+)?(default\s+)?(async\s+)?function\s+\w+|^\s*(export\s+)?(const|let)\s+\w+\s*=\s*(async\s*)?(\(|function)' \
    "$FILE" 2>/dev/null | cut -d: -f1)

  TOTAL=$(wc -l < "$FILE")
  PREV_LINE=0
  PREV_NAME=""
  for i in "${!FUNC_LINES[@]}"; do
    LINE="${FUNC_LINES[$i]}"
    NEXT="${FUNC_LINES[$((i+1))]:-$TOTAL}"
    LEN=$(( NEXT - LINE ))
    NAME=$(sed -n "${LINE}p" "$FILE" | grep -o '\w\+' | grep -v -E '^(export|default|async|function|const|let|var)$' | head -1)

    if [ "$LEN" -ge 100 ]; then
      echo -e "${RED}🔴 [$(basename $FILE):$LINE] $NAME — ${LEN}줄 (즉시 분해 필요)${NC}"
      WARNED=1
    elif [ "$LEN" -ge 80 ]; then
      echo -e "${RED}🔴 [$(basename $FILE):$LINE] $NAME — ${LEN}줄 (80줄+ 위험)${NC}"
      WARNED=1
    elif [ "$LEN" -ge 50 ]; then
      echo -e "${YEL}🟡 [$(basename $FILE):$LINE] $NAME — ${LEN}줄 (50줄+ 주의)${NC}"
      WARNED=1
    fi
  done

  # B. 범용 동사 함수명 (Core Domain 한정, boundary 레이어 제외)
  GENERIC=$(grep -n \
    -E '(function|const|let)\s+(process|handle|manage|doSomething|execute|run)[A-Z_$]' \
    "$FILE" 2>/dev/null || true)
  if [ -n "$GENERIC" ]; then
    echo -e "${YEL}🟡 [$(basename $FILE)] 범용 동사 함수명:${NC}"
    echo "$GENERIC" | sed 's/^/   /' | head -5
    WARNED=1
  fi

  # C. 접속사 함수명 (And/With/Also)
  CONJ=$(grep -n \
    -E '(function|const|let)\s+\w*(And|With|Also)[A-Z]' \
    "$FILE" 2>/dev/null || true)
  if [ -n "$CONJ" ]; then
    echo -e "${YEL}🟡 [$(basename $FILE)] 접속사 함수명 (단일 책임 위반 의심):${NC}"
    echo "$CONJ" | sed 's/^/   /' | head -3
    WARNED=1
  fi

  # D. 섹션 구분 주석 3개 이상 (다중 관심사)
  SECTIONS=$(grep -c -E '^\s*//\s*[─━=\-]{3,}|^\s*//\s*──' "$FILE" 2>/dev/null || echo 0)
  if [ "$SECTIONS" -ge 3 ]; then
    echo -e "${BLU}🔵 [$(basename $FILE)] 섹션 구분 ${SECTIONS}개 — 다중 관심사 의심${NC}"
    WARNED=1
  fi
}

for FILE in "$@"; do
  check_file "$FILE"
done

[ "$WARNED" -eq 0 ] && echo "✅ intent-review: 이슈 없음 ($*)"
exit 0
