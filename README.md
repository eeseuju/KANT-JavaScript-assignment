# Todo 웹 문서 구현

구글 Tasks를 참고해 만든 Todo 웹 문서입니다. 할 일을 추가·수정·삭제·조회할 수 있습니다.
- HTML5, CSS3, Tailwind CSS, 프레임워크 없는 JavaScript로 구현
- 데이터는 브라우저 localStorage에 저장 (새로고침해도 목록 유지)

<br>

> **목차**
> 1. [실행 방법](#1-실행-방법)
> 2. [주요 기능](#2-주요-기능)
> 3. [파일 구성](#3-파일-구성)
> 4. [구현 포인트](#4-구현-포인트)
> 6. [의도적으로 남긴 중복](#6-의도적으로-남긴-중복)
> 7. [시연 영상](#7-시연-영상)
> 8. [아쉬운 점](#8-아쉬운-점)

<br>

## 1. 실행 방법

`index.html`을 브라우저로 엽니다. (설치나 빌드는 필요 없습니다. Tailwind와 폰트를 불러오므로 인터넷 연결이 필요합니다.)

저장된 데이터를 보고 싶으면 `index.html`과 같은 방식으로 `debug.html`을 다른 탭에 열면 됩니다.  
할 일 내역이 업데이트될 때마다 0.5초 안에 화면이 갱신됩니다. 저장된 값이 깨져 있어도 원래 글자를 그대로 보여줍니다.

<br>

## 2. 주요 기능

| 기능 | 설명 |
| --- | --- |
| 추가 | 입력창에 제목을 쓰고 `Enter`로 바로 등록하거나 오른쪽 버튼으로 팝업을 열어 날짜·시간·내용까지 입력해 등록 |
| 수정 | 항목의 "수정"을 누르면 기존 값이 채워진 팝업이 열림. 저장해야 반영되고 닫으면 변경이 버려짐 |
| 삭제 | 항목의 "삭제"로 확인 팝업을 거쳐 삭제. "전체 삭제"는 확인 창에 지울 개수를 보여줌 |
| 조회 | 제목·내용 검색, 상태 필터 (전체 / 진행 중 / 완료), 정렬 (등록순 / 날짜순), 상태 개수, 항목의 제목을 누르면 상세 보기 |
| 완료 체크 | 동그라미를 누르면 완료(취소선 + 👍 효과)되고  다시 누르면 미완료로 상태 변경 |
| 지난 날짜 표시 | 오늘보다 이전 날짜는 주황색으로 표시 (완료한 항목은 제외) |
| 입력 규칙 | 제목은 필수이고 최대 50자 (공백만 입력 불가)이고 날짜·시간·내용은 선택이며 날짜가 없으면 "날짜 없음" 표시 |
| 키보드·팝업 | 팝업은 `Esc`, 어두운 배경 클릭, 닫기 버튼으로 닫힘. 제목칸에서 `Enter`로 저장 |

<br>

## 3. 파일 구성

```text
index.html      화면 구조 (Tailwind 색 이름 설정 포함)
debug.html      저장 데이터 확인용 페이지
js/todo.js      모든 동작: 저장, 데이터 함수, 렌더링, 팝업, 이벤트
js/debug.js     debug.html 동작
css/style.css   색 변수, 공통 스타일 클래스, 팝업, 따봉 애니메이션, 폰트
```

`js/todo.js`는 위에서 아래로 읽으면 흐름이 보이도록 구역을 나눴습니다.

| 구역 | 내용 |
| --- | --- |
| 1. 데이터 | 상수(저장 키, 제목 최대 길이 등), 상태(`todos`, `view` 등) |
| 2. HTML 요소 가져오기 | `getElementById`로 찾은 요소들 |
| 3-1. 저장 / 불러오기 | `saveTodos`, `loadTodos`, `isValidTodo`, `normalizeTodo` |
| 3-2. 데이터 함수 | `findTodo`, `createTodo`, `addTodo`, `updateTodo`, `removeTodo`, `toggleTodo` |
| 3-3. 날짜 함수 | `getToday`, `isOverdue`, `makeDateText`, `compareByDate` |
| 3-4. 조회 함수 | `matchesSearch`, `matchesFilter`, `getVisibleTodos`, `countDone`, `makeCountText` |
| 3-5. 입력 검증 | `validateTitle` |
| 3-6. 상태 바꾸기 | `setTodos` (목록 바꾸기 + 저장 + 화면 갱신) |
| 4. 목록 화면에 그리기 | `renderTodos`와 항목을 만드는 작은 함수들 |
| 5. 할 일 동작 | `toggleDone`, `quickAdd`, `clearAll`, 따봉 보이기/숨기기 |
| 6. 팝업 | 공통 열기/닫기, 상세, 추가·수정, 삭제 |
| 7. 이벤트 처리 | 핸들러들과 이벤트 연결 |
| 8. 앱 시작 | 저장된 목록을 불러와 첫 화면 그리기 |

<br>

## 4. 구현 포인트

### 데이터 변환 · 고차 함수

데이터를 다루는 함수는 **화면을 건드리지 않고 새 배열·객체를 돌려주는 순수 함수**로 만들었습니다.  
원본을 바꾸지 않기 때문에 따로 테스트하기 쉽고, 검색·필터 같은 곳에서 그대로 다시 씁니다.  
소스에서는 함수 위 주석에 `[순수 함수]`, `[고차 함수 사용: map]` 같은 라벨을 달아 구분했습니다.

| 하는 일 | 함수 | 쓴 고차 함수 |
| --- | --- | --- |
| id로 항목 찾기 | `findTodo` | `find` |
| 수정·완료 체크 (바뀐 새 배열) | `updateTodo`, `toggleTodo` | `map` |
| 삭제 (뺀 새 배열) | `removeTodo` | `filter` |
| 저장된 데이터 검사·정리 | `loadTodos` | `filter`, `map` |
| 검색 → 필터 → 정렬 | `getVisibleTodos` | `filter`, `sort` |
| 완료 개수 | `countDone` | `reduce` |
| 목록 그리기 | `renderTodos` | `map`, `forEach` |
| 검색 입력 지연 | `debounce` | 함수를 받아 함수를 돌려줌 |

### 동적 DOM · 이벤트

- **이벤트 위임** : 항목이 몇 개든 목록(`ul`)에는 클릭 리스너가 **1개**입니다. 항목의 버튼에 `data-action`(toggle / detail / edit / delete)을 달아 `handleListClick`이 구분합니다. 팝업 닫기 버튼(`data-close`)과 상태 필터 버튼도 같은 방식입니다.
- **한 번에 그리기** : 항목을 `DocumentFragment`에 모았다가 `replaceChildren`으로 한 번에 붙입니다.
- **디바운스** : 검색창은 마지막 입력 후 0.2초 뒤에 한 번만 다시 그립니다.
- **한글 입력** : 글자를 조합하는 중에는 `Enter`를 무시해서 같은 항목이 두 번 등록되는 것을 막습니다.
- **배경 클릭** : `click`이 아니라 `mousedown`으로 처리해서, 입력창에서 글자를 드래그하다 배경에서 놓아도 팝업이 닫히지 않습니다.
- **따봉 애니메이션** : 사라지는 시간은 CSS 애니메이션 길이 한 곳에서만 정하고, JS는 `animationend`로 숨깁니다.

### 스타일 구조

- 색은 `css/style.css`의 CSS 변수 3개(`--color-brand`, `--color-warn`, `--color-danger`)에서만 정하고 Tailwind에 `brand`, `warn`, `danger` 이름으로 등록해 사용합니다. 변수 하나를 바꾸면 화면 전체의 색이 같이 바뀝니다.
- 반복되던 클래스 묶음은 이름을 붙였습니다: `.btn`, `.btn-primary`, `.btn-text`, `.filter-chip`, `.field`, `.popup-card`.

### 안정성

- 저장된 데이터가 깨졌거나 모양이 다르면 `try/catch`와 `isValidTodo`·`normalizeTodo`로 걸러내어 앱이 멈추지 않습니다. 이상한 날짜·시간은 "날짜 없음"으로 보이게 했습니다.
- 제목은 입력창 `maxLength`와 `validateTitle`로 두 번 검사합니다.
- 긴 제목이 레이아웃을 깨지 않도록 줄바꿈과 최소 너비를 보정했습니다.
- 항목을 못 찾는 경우(`findTodo`가 `undefined`)와 삭제할 항목이 정해지지 않은 경우를 방어합니다.

<br>

## 5. DOM 구조

`#`이 붙은 이름은 `id`이고, JS가 `document.getElementById`로 찾아서 씁니다.

### 📄 index.html (요약)

```text
body
├─ 카드 (흰색)
│   ├─ 헤더: 아이콘 + "Todo"
│   ├─ 빠른 추가: #main-input, #open-form-btn
│   ├─ 조회 영역: #search-input, #sort-select, #filter-group(버튼 3개), #count-text
│   ├─ ul #todo-list            ← JS가 li를 채움 (아래 참고)
│   ├─ p #empty-msg             ← 보여줄 항목이 없으면 표시
│   └─ div #clear-area          ← 할 일이 하나도 없으면 숨김 (#clear-btn "전체 삭제")
├─ #form-popup (.popup)         ← 추가/수정 팝업: #title-input, #error-msg, #date-input, #time-input, #content-input, #form-ok-btn
├─ #detail-popup (.popup)       ← 상세 보기 팝업: #detail-title, #detail-date, #detail-content
├─ #delete-popup (.popup)       ← 삭제 확인 팝업: #delete-title, #delete-ok-btn
└─ #thumb "👍"                  ← 완료 체크할 때만 잠깐 표시
```

### 🧩 할 일 항목별 구조 (JS가 만드는 DOM)

`renderTodos`가 보여줄 항목마다 `makeItem`으로 `li`를 만들어 `#todo-list`에 붙입니다.  
`makeItem`은 작은 함수(`makeCheckButton`, `makeInfo`, `makeTitle`, `makeDateLabel`, `makeButtons`)를 조립합니다.

```text
ul #todo-list
└─ li [data-id]  × 보여줄 항목 수
    ├─ div (왼쪽)
    │   ├─ button [data-action="toggle"]   완료 체크 (완료이면 check 아이콘)
    │   └─ div [data-action="detail"]      누르면 상세 팝업
    │       ├─ p 제목                      (완료이면 취소선)
    │       └─ span 날짜 라벨              (지난 날짜이면 주황색, 예: "10월 2일 10:30")
    └─ div (오른쪽)
        ├─ button [data-action="edit"]    "수정"
        └─ button [data-action="delete"]  "삭제"
```

### 🔀 화면 상태에 따라 바뀌는 부분

JS는 팝업처럼 미리 만들어 둔 요소의 `hidden` 클래스를 넣고 빼서 보이고 숨깁니다.

| 상황 | 바뀌는 요소 |
| --- | --- |
| 할 일이 하나도 없음 | `#empty-msg`에 "등록된 할 일이 없습니다." 표시, `#clear-area` 숨김 |
| 할 일은 있지만 검색·필터에 맞는 게 없음 | `#empty-msg`에 "조건에 맞는 할 일이 없습니다." 표시, `#clear-area`는 보임 |
| 보여줄 항목이 있음 | `#empty-msg` 숨김, `#clear-area` 표시 |
| 빠른 추가 입력창의 상세 설정 버튼 | `#form-popup` 표시 (`#title-input`에 입력값 옮김) |
| 항목의 수정 | `#form-popup` 표시 (기존 값 채움) |
| 항목의 제목·날짜 | `#detail-popup` 표시 |
| 항목의 삭제 | `#delete-popup` 표시 |
| 팝업 닫기 | `Esc`, 배경 클릭, 닫기 버튼 모두 해당 팝업에 `hidden` |
| 항목을 완료로 체크 | `#thumb`를 보였다가 CSS 애니메이션이 끝나면 숨김 |
| 제목이 비었거나 50자 초과 | `#error-msg`에 문구 표시 |
| 필터 버튼 선택 | 선택된 버튼에 `aria-pressed="true"` (스타일은 `.filter-chip`) |
| 추가·수정·삭제·체크·검색·필터·정렬 | `renderTodos`가 `#todo-list`를 다시 채움 |

### 🐞 debug.html

```text
body
└─ 카드
    ├─ h1 "저장 데이터 확인"
    ├─ 키 이름 (code #key-name)
    ├─ 요약: #total-count, #done-count, #updated-at
    └─ pre #output              ← 저장된 JSON을 보여줌
```

<br>

## 6. 의도적으로 남긴 중복

비슷한 코드가 반복되는 곳 중 일부는 하나로 합치지 않고 일부러 남겼습니다.  
합치면 코드가 짧아지지만 오히려 읽기 어려워지거나, 합칠 수 없는 이유가 있기 때문입니다.

| 중복 | 위치 | 남긴 이유 |
| --- | --- | --- |
| `list.map(todo => id가 같으면 바꾸고 아니면 그대로)` 모양 | `js/todo.js`의 `updateTodo`, `toggleTodo` | 둘을 한 함수로 합칠 수는 있지만, 호출하는 쪽이 무슨 일을 하는지 오히려 알아보기 어려워져서 따로 두었습니다. |
| `findTodo`로 찾고 없으면 `return` 하는 3줄 | `js/todo.js`의 `openDetailPopup`, `openEditPopup`, `openDeletePopup` | 3줄이라 함수로 빼는 것보다 그 자리에서 바로 읽히는 편이 낫다고 판단했습니다. |
| `STORAGE_KEY = "todo-list"` 상수 | `js/todo.js`, `js/debug.js` | `debug.html`이 `todo.js`를 불러오면 Todo 앱이 같이 실행되기 때문에 공유할 수 없습니다. 두 값은 반드시 같아야 합니다. |
| 완료 개수 셈 (`filter`로 센 개수) | `js/todo.js`의 `countDone`, `js/debug.js` | 위와 같은 이유로 함수를 공유할 수 없습니다. |
| `<head>`의 Tailwind·폰트·파비콘 4줄 | `index.html`, `debug.html` | 빌드 도구 없이 HTML 파일끼리 일부를 공유할 방법이 없습니다. |
| `event.key === "Enter" && event.target === ...` 분기 2개 | `js/todo.js`의 `handleKeydown` | 표로 합치면 분기 2개를 읽는 것보다 오히려 복잡해집니다. |
| `.popup` 규칙(`position: fixed` 등) | `css/style.css` | Tailwind 클래스로도 쓸 수 있지만, 과제에서 쓰기로 한 `css/style.css`에 실제 스타일이 있도록 CSS로 두었습니다. |

<br>

## 7. 시연 영상

(연결 예정)

<br>

## 8. 아쉬운 점

### 🚧 만들지 못한 기능
- 완료 / 미완료로 나누어 묶어서 보여주는 그룹화 (지금은 필터로 골라 보기만 가능)
- 전체 삭제 같은 작업의 일시와 내용 기록, 삭제 되돌리기

### 🖱️ 사용성
- 검색어·필터·정렬 조건은 저장하지 않아서 새로고침하면 처음 상태로 돌아갑니다.
- 완료 필터를 켠 상태에서 새 항목을 추가하면 목록에 보이지 않습니다. (필터 때문이며 "전체"로 바꾸면 보입니다)
- 지난 날짜 판정이 날짜만 비교합니다. 오늘 날짜는 시간이 지나도 표시가 바뀌지 않습니다.
- 지난 날짜 표시는 자정을 넘겨도 화면을 그대로 두면 바뀌지 않습니다.
- 날짜 입력칸의 표시 형식(`mm/dd/yyyy` 등)은 브라우저 언어 설정을 따라서 바꿀 수 없습니다.

### 🛡️ 안정성
- 데이터 저장 키 이름을 바꿀 때 이전 데이터를 옮겨 주는 코드가 없습니다.
- 여러 탭에서 동시에 수정하면 마지막에 저장한 탭의 내용이 남습니다. (다른 탭의 변경을 감지하지 않음)
- 이미 50자를 넘는 옛 데이터는 그대로 보이지만, 수정해서 저장하려면 50자 이내로 줄여야 합니다.
