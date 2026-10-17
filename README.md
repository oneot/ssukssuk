# 쑥쑥아동청소년발달센터 웹사이트

[ssukssuk.org](https://ssukssuk.org)에 공개되는 정적 사이트입니다. [Astro](https://astro.build)로 HTML을 만들고, `main` 브랜치에 변경이 합쳐지면 GitHub Actions가 자동으로 빌드해 GitHub Pages에 배포합니다. 방문자에게는 지금처럼 HTML·CSS와 아주 작은 스크립트만 전달됩니다.

## 무엇을 어디서 고치나요

| 바꾸려는 것                                          | 파일                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| 전화번호, 주소, 네이버 지도 링크, 인스타그램 계정    | `src/data/site.ts` (한 곳만 바꾸면 사이트 전체에 반영됩니다)           |
| 센터 소개: 층별 공간 3곳의 이름·설명·꼬리표          | `src/content/floors.yaml`                                              |
| 프로그램: 치료 카드와 활동(사진) 카드                | `src/content/programs.yaml`                                            |
| 이용 안내: 이용할 수 있는 지원 제도 목록             | `src/content/support.yaml`                                             |
| 쑥쑥의 순간들(갤러리)                                | `src/content/gallery.yaml` (아래 **갤러리 6칸 규칙**을 꼭 읽어 주세요) |
| 사진 파일                                            | `src/assets/photos/`                                                   |
| 그 밖의 문구(첫 화면, 이용 절차, 오시는 길, 푸터 등) | `src/components/sections/`, `src/components/layout/`의 `.astro` 파일   |
| 길을 잘못 들었을 때 보이는 페이지(404)               | `src/pages/404.astro`                                                  |
| 색·서체·간격                                         | `src/styles/tokens.css` (디자인 작업이므로 개발자와 상의해 주세요)     |

YAML 파일 맨 위에는 항목마다 무엇을 쓰는지 설명이 있습니다. 항목 이름(`photo:`, `alt:` 같은 것)과 들여쓰기는 그대로 두고 글자만 바꿔 주세요. 빠진 항목, 오타 난 항목 이름, 없는 사진·아이콘 이름이 있으면 사이트를 만들 때 어느 파일의 어느 항목이 잘못됐는지(형식이 깨졌다면 몇 번째 줄인지) 알려 주며 멈춥니다. 잘못된 내용은 배포되지 않습니다.

## 고치는 방법 (GitHub 웹에서)

1. GitHub에서 고칠 파일을 열고 연필(Edit) 버튼을 누릅니다.
2. 내용을 고친 뒤 **Commit changes…** → **Create a new branch…** 를 선택하고 **Propose changes** 를 누릅니다.
3. 열리는 화면에서 **Create pull request** 를 누릅니다.
4. 몇 분 뒤 아래쪽 검사(CI)가 모두 초록색 체크가 되면 **Merge pull request** 를 누릅니다.
5. 합치고 2~3분 뒤 [ssukssuk.org](https://ssukssuk.org)에 반영됩니다.

`main` 브랜치는 보호되어 있어 바로 고칠 수 없고, 검사를 통과한 pull request로만 바뀝니다. 승인(리뷰)은 필요하지 않습니다.

Dependabot이 매달 의존성(빌드 도구·GitHub Actions) 업데이트 pull request를 엽니다. 검사가 모두 통과하면 합쳐도 되고, 실패하면 개발자에게 맡겨 주세요.

### 검사(CI)가 하는 일

- **Lint & build**: 사이트를 만들고, 깨진 링크, 빠진 공개 파일(OG 이미지, 파비콘 등), 사진 속 위치 정보(EXIF), 쓰이지 않는 사진, 서체에 없는 글자를 확인합니다.
- **Behaviour & accessibility**: 모바일 메뉴, 스크롤, 사진 크게 보기(키보드·스와이프)가 그대로 동작하는지, 접근성 규칙(axe)을 지키는지 Chromium과 WebKit(사파리 엔진)에서 확인합니다.
- **Design lock**: 바뀌기 전 사이트와 화면을 픽셀 단위로 비교합니다(폭 360·390·768·1024·1440px).
  - 글·사진·연락처만 고친 경우(`src/content/`, `src/assets/photos/`, `src/data/site.ts`, `README.md`)에는 달라진 화면을 **보고만 하고** 막지 않습니다. 검사 결과의 요약에서 달라진 부분을 확인할 수 있습니다.
  - 그 밖의 파일(코드·스타일)을 고친 경우에는 **화면이 한 픽셀도 달라지면 안 됩니다.** 디자인을 일부러 바꾸는 작업이라면 pull request에 `design-change` 라벨을 붙이면 보고만 합니다.
- **Lighthouse**: 모바일 성능 점수(0.9 이상), 접근성·권장사항·검색엔진 최적화(모두 만점), 화면 밀림(CLS), 첫 화면 사진이 뜨는 시간(LCP 3.5초 이하), 전송량 예산을 확인합니다.

## 갤러리 6칸 규칙

큰 화면의 "쑥쑥의 순간들" 콜라주는 사진 **6칸으로 고정**되어 있습니다. 칸마다 위치·모양·기울기가 디자인에 정해져 있어서, `gallery.yaml`의 칸 이름은 바꾸거나 더하거나 뺄 수 없습니다. 칸이 빠지거나, 같은 칸이 두 번 나오거나, 7번째 칸을 넣으면 사이트를 만들 때 오류가 납니다. 사진을 바꾸려면 각 칸의 `photo`·`alt`·`caption`만 고쳐 주세요.

| 칸 이름     | 큰 화면에서의 자리 | 모양                  |
| ----------- | ------------------ | --------------------- |
| `music`     | 왼쪽 위            | 가로 사진(4:3)        |
| `horse`     | 왼쪽 가운데        | 세로 잎 모양(5:6)     |
| `party`     | 아래 왼쪽          | 넓은 가로 사진(16:10) |
| `vr`        | 오른쪽 위          | 가로 사진(4:3)        |
| `simulator` | 오른쪽 가운데      | 세로 잎 모양(5:6)     |
| `digital`   | 아래 오른쪽        | 가로 사진(4:3)        |

칸 이름은 처음 넣은 사진에서 따온 것이라, 다른 사진을 넣어도 이름은 그대로 둡니다. 모양에 맞게 사진의 가운데 부분이 보이도록 잘립니다. 휴대폰 화면에서는 2열로 쌓이고 `party`·`digital`은 한 줄을 다 씁니다. 칸을 늘리는 것은 디자인 작업입니다.

## 사진 바꾸기·추가하기

1. 사진 파일(JPEG, PNG, WebP)을 `src/assets/photos/`에 올립니다. 가지고 있는 **가장 큰 원본**을 그대로 올려도 됩니다. 파일 이름은 영문 소문자·숫자·하이픈으로 지어 주세요(예: `summer-camp.jpg`).
2. `gallery.yaml` 또는 `programs.yaml`에서 `photo:`를 새 파일 이름으로 바꾸고, `alt:`(사진 설명)도 새 사진에 맞게 고칩니다.
3. 더 이상 쓰지 않는 사진 파일은 지워 주세요. 어디에도 쓰이지 않는 사진이 남아 있으면 검사가 알려 줍니다.

사이트를 만들 때 사진마다 화면 크기별로 작은 AVIF·WebP 사본을 만들고, 위치 정보(GPS) 같은 촬영 정보를 지웁니다. 사진을 크게 보는 화면에는 가로 1440px WebP를 씁니다. 촬영 정보가 남은 파일이 배포되려 하면 검사가 실패하므로 아이들 사진의 위치가 공개될 일은 없습니다.

첫 화면의 큰 사진은 `hero-outdoor.jpg`, 그 아래 작은 원형 사진은 `horse.webp`에서 잘라 낸 `hero-circle.webp`입니다. `horse.webp`를 바꾸면 개발자가 `node scripts/make-hero-circle.mjs`로 원형 사진을 다시 만들어야 합니다.

---

## 개발자용

### 준비

- Node.js 24 (`.nvmrc`). `npm ci`로 설치합니다.
- `package-lock.json`에는 패키지 주소(`resolved`)를 기록하지 않습니다(`.npmrc`의 `omit-lockfile-registry-resolved`). 사내 프록시 레지스트리에서 설치해도 lockfile이 그 주소에 묶이지 않아 GitHub Actions에서도 그대로 `npm ci`가 됩니다. 의존성은 모두 정확한 버전으로 고정합니다(`save-exact`).

### 명령어

| 명령                   | 하는 일                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`          | 개발 서버 (http://localhost:4321)                                            |
| `npm run build`        | `dist/`에 사이트 생성 (서체 자르기·사진 변환 포함)                           |
| `npm run validate`     | HTML 검증 + `scripts/check-dist.mjs` (공개 URL, 링크, EXIF, 서체 범위 등)    |
| `npm run lint`         | Prettier, Stylelint, 토큰 검사, `astro check`                                |
| `npm run baseline`     | 비교 기준 사이트 준비 (`main`과의 merge base. `BASELINE_REF`로 바꿀 수 있음) |
| `npm test`             | Playwright 전체 (`test:visual` 디자인 잠금, `test:e2e` 동작·접근성)          |
| `npm run lhci`         | Lighthouse CI (예산은 `lighthouserc.json`)                                   |
| `npm run optimize:svg` | `public/assets/img`의 SVG 최적화 (모양이 바뀌지 않는 설정만)                 |

### 구조

```
src/
  pages/            index.astro, 404.astro, sitemap.xml.ts
  layouts/          BaseLayout.astro (head, 서체, 아이콘 스프라이트)
  components/       layout/(헤더·푸터·모바일 버튼), sections/(각 구역), ui/(아이콘·잔디·정부 상징)
  content/          floors·programs·support·gallery YAML
  data/             site.ts(연락처), content.ts(YAML 스키마), photos.ts(사진), grass.ts(잔디 장식)
  styles/           tokens → base → components → sections → pages 순서의 @layer CSS
  scripts/          header-scroll, mobile-menu, reveal, scrollspy, lightbox (TypeScript)
  assets/           photos/, images/, fonts/google/
integrations/       pretendard-slices.mjs (빌드 후 Pretendard 자르기)
public/             그대로 복사되는 공개 파일 (CNAME, robots.txt, favicon, OG 이미지, 로고)
tests/              Playwright (visual, behavior, a11y, aria)
```

### 서체

- **Pretendard Variable 1.3.9**: CDN 스타일시트와 같은 92개 조각(unicode-range) 구조를 유지하고, 페이지에 실제로 쓰인 조각만 쓰인 글자로 잘라 `/_astro/`에 둡니다(약 411KiB → 113KiB). 조각 경계가 같아야 커닝이 그대로이고, 잘라 낸 파일도 글리프 이름(`post` 표)과 라틴 문자 전체를 남겨야 작은 글씨가 이전과 똑같이 그려집니다(macOS CoreText는 `X`·`o` 글리프를 이름으로 찾아 기준을 잡습니다). 잘라 낸 조각에 없는 글자는 전체 서체로 대체됩니다. 각 페이지는 보이는 글자에 필요한 조각만 preload합니다.
- **Geist Mono, Instrument Serif**: Google Fonts가 iOS·Android·macOS에 주는 CSS와 힌팅 없는 woff2를 그대로 저장해 직접 제공합니다(`scripts/vendor-google-fonts.mjs src/assets/fonts/google`로 다시 받을 수 있음).

### 디자인 잠금(시각 회귀) 하네스

- 기준(baseline)은 `main`과의 merge base입니다. 빌드 스크립트가 없는 옛 수작업 사이트(`2dcc3c5`)가 기준이면 `tests/support/expected-changes.ts`의 의도된 변경만 허용합니다: 404 낙서 아이콘의 잎맥(아이콘 스프라이트 공유), 다시 인코딩한 사진 영역(지각 비교, 허용치 3%). 그 뒤의 기준(Astro 빌드)과는 모든 화면을 엄격히 비교합니다.
- 결정적인 캡처를 위해 reduced motion, 이미지 즉시 로드·동기 디코딩, `document.fonts.ready`, 고정 Chrome 옵션을 쓰고, 기준 사이트의 jsDelivr·Google Fonts 요청은 같은 파일로 바꿔 응답합니다(`tests/support/web-fonts.ts`).
- 결과 이미지는 `visual-results/`에, 요약은 `node scripts/visual-summary.mjs`로 볼 수 있습니다. CI에서는 작업 요약과 아티팩트로 올라갑니다.

### 배포와 되돌리기

- Pages 설정은 **GitHub Actions** 배포입니다(`.github/workflows/deploy.yml`, `withastro/action`). `main`에 push되면 빌드 → `npm run validate` → 배포합니다.
- 문제가 생기면 해당 merge를 revert하는 pull request를 합치면 이전 상태로 다시 배포됩니다.
- Astro 이전의 정적 사이트로 완전히 되돌려야 할 때는 Astro 도입 merge를 revert한 뒤 Pages 설정을 브랜치 배포로 돌립니다:
  `gh api -X PUT repos/oneot/ssukssuk/pages -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/'`

## 변경 이력

- 2026-10 전면 리디자인. SharePoint 갤러리 자동 동기화(GitHub Actions + Microsoft Graph)를 없애고, 사진을 저장소에 직접 넣는 방식으로 바꿨습니다.
- 2026-10 Astro로 이전. 디자인은 그대로 두고 구조를 정리했습니다: 연락처·콘텐츠 데이터 분리(YAML), CSS `@layer`·토큰, TypeScript 모듈, 서체 직접 제공과 자르기, AVIF 사진, 시각 회귀·동작·접근성·Lighthouse 검사, GitHub Actions 배포.
