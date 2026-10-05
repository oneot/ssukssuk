# 쑥쑥아동청소년발달센터 웹사이트

[ssukssuk.org](https://ssukssuk.org)에 공개되는 정적 사이트입니다. GitHub Pages(`main` 브랜치 루트)에서 바로 배포되고, 빌드 단계는 없습니다.

## 구조

```
index.html              메인 페이지 (모든 문구는 여기에서 수정)
404.html                없는 주소로 들어왔을 때 보이는 페이지
assets/css/style.css    디자인 (맨 위 :root에서 색·서체 수정)
assets/js/main.js       모바일 메뉴, 스크롤 효과, 사진 확대 보기
assets/img/             로고, 정부 상징, 파비콘, OG 이미지
assets/img/photos/      사진 (WebP, 위치정보 제거됨)
robots.txt, sitemap.xml 검색엔진용
CNAME                   ssukssuk.org 도메인 연결
```

## 자주 하는 수정

- **문구·전화번호**: `index.html`에서 찾아 바꾸기. 전화번호는 `0507-1428-3425`로 검색하면 모든 위치가 나옵니다.
- **사진 교체**: 같은 이름으로 `assets/img/photos/`에 덮어쓰기. 가로 800px(`-800.webp`)과 1440px(`-1440.webp`) 두 가지를 둡니다.
- **사진 추가**: `index.html`의 `쑥쑥의 순간들` 블록에서 `<a class="tile ...">` 한 줄을 복사해 파일명과 설명을 바꿉니다.
- **정부 상징**: `assets/img/gov-emblem.png`는 히어로 아래와 푸터의 "보건복지부 사회서비스 제공기관" 두 곳에만 씁니다.

## 로컬 미리보기

```bash
python3 -m http.server 8000
# http://localhost:8000 접속
```

## 변경 이력

- 2026-10 전면 리디자인. SharePoint 갤러리 자동 동기화(GitHub Actions + Microsoft Graph)를 없애고, 사진을 저장소에 직접 넣는 방식으로 바꿨습니다.
