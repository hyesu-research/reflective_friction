# Reflective Friction

AI 사용에 개입하는 프릭션 사례를 수집하고, 연구자들이 관점과 관심 사례를 함께 기록하는 비공개 연구 아카이브입니다.

현재 운영 주소: [reflective-friction.vercel.app/archive](https://reflective-friction.vercel.app/archive)

## 기본 버전

2026년 11월 15일 운영 버전을 기준으로 정리한 React + Vite 소스입니다. 기본 정렬은 **Most liked**입니다.

- 유형별 사례 필터, 썸네일, 상세 설명과 출처
- 공용 발급 ID 로그인과 서버 세션
- 사례 추가·수정 및 이미지 공동 저장
- 윤재영(PI)·김혜수·박영찬·배정우의 노트 자동 저장
- 연구자별 하트, 참여자 표시, Perspectives 대시보드
- 최신 공동 자료의 JSON 내보내기와 노트 포함 옵션
- JSON 가져오기의 중복·변경 미리보기 및 선택 반영

## 실행과 검증

Node.js 22 이상 환경에서 다음 명령을 사용합니다.

```sh
npm ci
npm run build
npm test
```

`npm run dev`는 Vite 프런트엔드 개발 서버입니다. 로그인과 공동 저장은 `api/`의 Vercel Functions를 사용하므로, 전체 동작은 환경변수를 설정한 Vercel Preview 또는 기존 Vercel 프로젝트에서 확인합니다.

## Vercel 설정

- 설치: `npm ci`
- 빌드: `npm run build`
- 출력: `dist`
- 라우팅·서버 함수: `vercel.json`
- 저장소: 연결된 **private Vercel Blob**

필요한 서버 환경변수는 [.env.example](.env.example)에 이름만 기록했습니다. 실제 값은 GitHub에 저장하지 않습니다. 기존 Vercel 프로젝트의 환경변수와 연결된 Blob 저장소를 유지하면 현재 공동 저장 자료를 계속 사용할 수 있습니다.

발급 ID는 원문 대신 정규화된 값의 SHA-256 digest로 설정합니다. 정규화와 검증 방식은 [lib/archive-access.js](lib/archive-access.js)에 있습니다. 세션 비밀키는 32자 이상의 무작위 값이어야 합니다.

## 소스와 운영 데이터의 구분

- `src/data.json`, `src/curated.json`: 초기 사례와 기본 콘텐츠
- `public/`: 운영 중인 이미지, 폰트, 프롬프트·스킬 자료
- Vercel Blob: 공동 추가·수정 사례, 업로드 이미지, 최신 연구자 노트와 하트

**실시간 공동 저장 자료는 이 Git 저장소에 복사하지 않았습니다.** 별도 Vercel 프로젝트로 옮기는 경우 기존 저장소 연결이나 데이터 이전이 필요합니다. 초기 사례에 대한 공동 수정본은 서버 기록이 우선합니다.

새 버전에서 이미 공동 수정된 사례를 변경할 때는 JSON 파일만 고치지 말고 운영 화면 또는 인증된 API도 확인해주세요. 자세한 구조는 [SHARED_DATA.md](SHARED_DATA.md)를 참고합니다.

## 협업용 파일

하단 **Export JSON**에서 최신 자료를 내려받고 **Import JSON**에서 변경 내용을 검토합니다. 연구자 노트는 기본 제외이며 선택해서 포함합니다. 가져오기는 노트·하트를 덮어쓰지 않습니다. 이미지는 파일 대신 주소를 포함하고, 아카이브 내부 이미지 주소는 로그인이 필요합니다.

다른 AI에 전달할 양식: [COLLABORATION_FORMAT.md](COLLABORATION_FORMAT.md)

## 접근 보호

공개 로그인 화면·공용 UI 코드와 실제 사례 코드가 분리되어 있습니다. `/archive`, 사례 코드·자료, 공동 저장 API는 서버에서 세션을 검사합니다. 이 라우팅을 일반 정적 파일 호스팅으로 바꾸면 같은 접근 보호를 유지할 수 없습니다.

이 GitHub 저장소에는 초기 사례 콘텐츠와 정적 자료가 포함됩니다. 웹사이트의 로그인은 GitHub에 공개된 소스 자체를 비공개로 만들지는 않습니다.

## 자료 출처

사례별 원문·이미지 출처와 기존 자료의 라이선스 표기를 유지했습니다. 이미지·프롬프트·스킬 등 외부 자료의 권리는 각 제작자에게 있습니다. 이 저장소에 일괄적인 새 라이선스를 부여하지 않습니다.
