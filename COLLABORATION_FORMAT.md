# Reflective Friction · 다른 AI와 협업하는 JSON 양식

아카이브의 Export JSON에서 최신 공동 저장 자료를 내려받을 수 있습니다. 연구자 노트와 하트 포함 여부는 사용자가 선택합니다. 파일 다운로드는 다른 AI로의 자동 전송이 아닙니다.

## 다른 AI에게 전달할 요청
사례의 공식 명칭과 1차 출처를 확인하고 아래 양식으로 정리해주세요. 기존 사례를 수정할 때는 id를 유지하고, 새 사례는 id를 생략하세요. 확인하지 못한 기능·효과·이용률은 만들어내지 마세요. 연구자 노트와 likedBy는 사람이 남긴 참고 자료이며 수정하거나 새로 만들어 넣지 마세요.

## 가져올 파일 예시
예시 값을 실제 사례와 출처로 바꾼 뒤 JSON 파일로 저장하세요.

```json
{"schema":"reflective-friction.collaboration","schemaVersion":1,"cases":[{"title":"실제 사례명","type":"Website","research":false,"overview":"어떤 서비스 또는 기능인지","features":"확인된 주요 기능","action":"사용자가 하는 일","method":"작동 방식","steps":"첫 단계\n다음 단계","conditions":"이용 조건","sources":["https://example.org/official-source"],"image":"https://example.org/screenshot.png","imageCredit":"제작자명","imageSource":"https://example.org/official-source","gallery":[],"purposes":[],"ways":[]}]}
```

## 필드
- title: 사례명. 필수.
- id: 기존 사례의 식별자. 수정 시 유지하고 새 사례는 생략할 수 있습니다.
- type: Prompt / Skill / Extension / Plugin / Built-in Feature / Website / App / Serious Game / Art.
- kind: 기존 파일의 한국어 유형을 그대로 사용해도 됩니다. type 또는 kind가 필요합니다.
- research: 연구 프로젝트·프로토타입이면 true. 제공 형태(type)와 별도로 기록합니다.
- sources: 공식 링크. 문자열(한 줄에 URL 하나) 또는 URL 배열. 직접 만든 프롬프트는 author 또는 promptCredit에 작성자를 명시할 수 있습니다.
- overview, features, action, method, steps, conditions: 설명·기능·사용자 행동·작동 방식·이용 방법·이용 조건.
- image, imageSource, imageCredit: 썸네일 주소·출처 페이지·크레딧.
- gallery: [{"src":"이미지 주소","caption":"설명","source":"출처 페이지","credit":"제작자","type":"공식 화면"}].
- prompt, promptCredit: 프롬프트 전문과 출처·작성자. 해당 사례만.
- installation: [{"title":"단계명","text":"설명","code":"선택 명령어","links":[]}]. 해당 사례만.

## 참고 자료와 반영 범위
- researcherNotes와 likedBy는 내보내기 전용 참고 자료입니다. 가져오기로 노트나 하트를 덮어쓰지 않습니다.
- archiveMeta는 내보낸 시점의 버전 정보입니다. 가져오기 전에 서버의 최신 사례와 다시 비교합니다.
- 이미지 파일 자체가 아닌 주소를 내보냅니다. 아카이브 내부 이미지 주소는 로그인이 필요하므로 외부 AI가 내용을 확인했다고 가정하지 마세요.
- 기존 JSON 배열도 가져올 수 있습니다. 미리보기에서 중복과 변경 항목을 확인하고 반영할 사례를 선택합니다.
- 가져오기 과정에서 다른 사람이 사례를 수정하면 해당 건은 충돌로 남겨두며, 이미 반영한 다른 건은 유지됩니다.
