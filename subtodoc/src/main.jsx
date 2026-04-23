/**
 * ════════════════════════════════════════════════════════════
 *  main.jsx  —  프로그램의 시작점 (진입점)
 * ════════════════════════════════════════════════════════════
 *
 * 이 파일은 웹사이트가 처음 실행될 때 제일 먼저 열리는 파일이에요.
 * 마치 학교의 정문 같은 역할이에요.
 *
 * 여기서 하는 일:
 * 1. React(리액트)라는 도구를 불러와요.
 *    → React는 화면을 만들어주는 특별한 도구예요.
 *      레고 블록처럼 화면을 조각조각 쉽게 만들 수 있어요.
 *
 * 2. App 컴포넌트(화면 조각)를 불러와요.
 *    → App.jsx 파일에 있는 우리 프로그램 전체 화면이에요.
 *
 * 3. index.css(스타일 파일)를 불러와요.
 *    → 화면의 색깔, 글자 크기, 배경 등을 꾸며주는 파일이에요.
 *
 * 4. HTML 파일의 id="root" 라는 빈 박스를 찾아서
 *    거기에 우리 App 화면을 심어줘요.
 *    → 마치 빈 액자에 그림을 끼워넣는 것처럼요!
 *
 * 5. React.StrictMode는 개발할 때 실수를 미리 잡아주는 안전장치예요.
 *    → 학교에서 선생님이 숙제를 두 번 검사해주는 것과 비슷해요.
 */

// React 라이브러리 전체를 불러와요
import React from 'react'

// ReactDOM은 React로 만든 화면을 실제 웹페이지에 붙여주는 도구예요
import ReactDOM from 'react-dom/client'

// 우리 프로그램의 메인 화면(App)을 불러와요
import App from './App'

// 기본 스타일(색깔, 테마 등)을 불러와요
import './index.css'

// HTML에 있는 id="root" 라는 빈 박스를 찾아서
// 거기에 우리 App 화면을 넣어요!
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode: 개발 중 버그를 미리 찾아주는 안전망이에요
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
