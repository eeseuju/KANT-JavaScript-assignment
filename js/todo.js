// 함수 라벨 안내 (함수 바로 위 주석에 붙어 있음)
//   [순수 함수]       같은 값을 넣으면 항상 같은 결과이고, 화면·전역 변수·넘겨받은 배열을 바꾸지 않음
//   [고차 함수]       함수를 받거나 돌려주는 함수 자체 (예: debounce)
//   [고차 함수 사용]  함수를 받는 배열 메서드(filter, map, find, reduce, sort, forEach)를 씀 (괄호 안에 무엇을 썼는지)
//   라벨이 없는 함수는 화면(DOM)·저장소·전역 상태를 직접 바꾸는 함수

// 1. 데이터
const STORAGE_KEY = "todo-list";       // localStorage에 저장할 이름(키)
const TITLE_MAX_LENGTH = 50;           // 제목 최대 글자 수
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;   // 저장된 날짜 모양 (예: 2026-11-15)
const TIME_PATTERN = /^\d{2}:\d{2}$/;         // 저장된 시간 모양 (예: 09:30)
let todos = [];                        // 할 일 목록 (id, date, time, title, content, done)
let editingId = null;                  // 수정 중인 항목의 id (추가 중이면 null)
let deletingId = null;                 // 삭제하려는 항목의 id
const view = { search: "", filter: "all", sort: "created" };   // 지금 어떻게 보고 있는지 (저장 안 함)

// 2. HTML 요소 가져오기
const mainInput = document.getElementById("main-input");
const openFormBtn = document.getElementById("open-form-btn");
const todoList = document.getElementById("todo-list");
const emptyMsg = document.getElementById("empty-msg");
const thumb = document.getElementById("thumb");
const clearArea = document.getElementById("clear-area");
const clearBtn = document.getElementById("clear-btn");

const formPopup = document.getElementById("form-popup");
const dateInput = document.getElementById("date-input");
const timeInput = document.getElementById("time-input");
const titleInput = document.getElementById("title-input");
const contentInput = document.getElementById("content-input");
const errorMsg = document.getElementById("error-msg");
const formOkBtn = document.getElementById("form-ok-btn");
const formCancelBtn = document.getElementById("form-cancel-btn");

const detailPopup = document.getElementById("detail-popup");
const detailTitle = document.getElementById("detail-title");
const detailDate = document.getElementById("detail-date");
const detailContent = document.getElementById("detail-content");
const detailCloseBtn = document.getElementById("detail-close-btn");

const deletePopup = document.getElementById("delete-popup");
const deleteTitle = document.getElementById("delete-title");
const deleteOkBtn = document.getElementById("delete-ok-btn");
const deleteCancelBtn = document.getElementById("delete-cancel-btn");

const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const filterGroup = document.getElementById("filter-group");
const filterButtons = filterGroup.querySelectorAll("button");
const countText = document.getElementById("count-text");

mainInput.maxLength = TITLE_MAX_LENGTH;    // 50자 넘게 못 치게 (숫자는 위 상수 한 곳에서만 정함)
titleInput.maxLength = TITLE_MAX_LENGTH;

// 3-1. 저장 / 불러오기
function saveTodos() {
  try {
    // 배열은 그대로 저장이 안 되므로 문자열로 바꿔서 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error("저장 실패:", error);
    alert("저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.");
  }
}

// 항목 하나가 쓸 수 있는 모양인지 검사 (id는 숫자, title은 문자열이어야 함)
// [순수 함수]
function isValidTodo(item) {
  return item !== null
    && typeof item === "object"
    && typeof item.id === "number"
    && typeof item.title === "string";
}

// 빠진 칸(옛 데이터의 time 등)을 기본값으로 채운 새 객체를 만들기
// [순수 함수]
function normalizeTodo(item) {
  return {
    id: item.id,
    title: item.title,
    content: typeof item.content === "string" ? item.content : "",
    date: DATE_PATTERN.test(item.date) ? item.date : "",
    time: TIME_PATTERN.test(item.time) ? item.time : "",
    done: item.done === true
  };
}

// 저장된 목록을 읽어서 돌려주기 (무슨 일이 있어도 배열을 돌려줌)
// [고차 함수 사용: filter, map] (저장소를 읽으므로 순수 함수는 아님)
function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      return [];   // 저장된 게 없으면 빈 목록
    }

    const parsed = JSON.parse(saved);   // 깨진 글자면 여기서 에러 → catch로
    if (Array.isArray(parsed) === false) {
      return [];   // 배열이 아니면 쓸 수 없음
    }

    return parsed.filter(isValidTodo).map(normalizeTodo);
  } catch (error) {
    console.error("저장된 데이터를 읽지 못했습니다:", error);
    return [];
  }
}

// 3-2. 데이터 함수 (화면을 건드리지 않는 순수 함수: 새 배열, 객체를 돌려줌)

// id가 같은 항목 찾기 (없으면 undefined)
// [순수 함수] [고차 함수 사용: find]
function findTodo(list, id) {
  return list.find(todo => todo.id === id);
}

// 입력값으로 새 할 일 객체 만들기
// (id에 현재 시간을 써서 같은 입력이라도 id가 달라지므로 완전한 순수 함수는 아님)
function createTodo(fields) {
  return {
    id: Date.now(),   // 현재 시간(숫자)을 고유 id로 사용
    title: fields.title,
    content: fields.content || "",
    date: fields.date || "",
    time: fields.time || "",
    done: false
  };
}

// 맨 뒤에 추가한 새 배열
// [순수 함수]
function addTodo(list, todo) {
  return [...list, todo];
}

// id가 같은 항목만 changes로 덮어쓴 새 배열
// [순수 함수] [고차 함수 사용: map]
function updateTodo(list, id, changes) {
  return list.map(todo => (todo.id === id ? { ...todo, ...changes } : todo));
}

// id가 같은 항목을 뺀 새 배열
// [순수 함수] [고차 함수 사용: filter]
function removeTodo(list, id) {
  return list.filter(todo => todo.id !== id);
}

// id가 같은 항목의 완료 여부를 뒤집은 새 배열
// [순수 함수] [고차 함수 사용: map]
function toggleTodo(list, id) {
  return list.map(todo => (todo.id === id ? { ...todo, done: !todo.done } : todo));
}

// 오늘 날짜를 "2026-11-15" 형식 글자로
// (현재 시간을 읽으므로 순수 함수는 아님)
function getToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");   // 5 → "05"
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// 검색어가 제목이나 내용에 들어 있는지 (대소문자 무시, 검색어가 비면 전부 통과)
// [순수 함수]
function matchesSearch(todo, text) {
  const keyword = text.trim().toLowerCase();
  return keyword === ""
    || todo.title.toLowerCase().includes(keyword)
    || todo.content.toLowerCase().includes(keyword);
}

// 상태 필터: all(전체), active(진행 중), done(완료)
// [순수 함수]
function matchesFilter(todo, filter) {
  if (filter === "active") {
    return todo.done === false;
  }
  if (filter === "done") {
    return todo.done === true;
  }
  return true;
}

// 날짜순 비교: 날짜(+시간)가 빠른 순, 날짜 없는 항목은 맨 뒤 (sort에 넘겨 쓰는 비교 함수)
// [순수 함수]
function compareByDate(a, b) {
  if (a.date === "" && b.date === "") {
    return 0;
  }
  if (a.date === "") {
    return 1;
  }
  if (b.date === "") {
    return -1;
  }
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
}

// 화면에 보여줄 목록 = 필터 → 검색 → 정렬 (원본 list는 바뀌지 않음)
// [순수 함수] [고차 함수 사용: filter, sort]
function getVisibleTodos(list, view) {
  const visible = list.filter(todo => matchesFilter(todo, view.filter) && matchesSearch(todo, view.search));
  // sort는 배열을 그 자리에서 바꾸지만, filter가 이미 새 배열을 만들어 줘서 원본은 안전함
  return view.sort === "date" ? visible.sort(compareByDate) : visible;   // 등록순은 추가한 순서 그대로
}

// 완료된 항목 개수
// [순수 함수] [고차 함수 사용: reduce]
function countDone(list) {
  return list.reduce((count, todo) => count + (todo.done ? 1 : 0), 0);
}

// 개수 안내 글자 (예: "완료 1 / 전체 3 · 표시 1")
// [순수 함수]
function makeCountText(allTodos, visibleTodos) {
  let text = `완료 ${countDone(allTodos)} / 전체 ${allTodos.length}`;
  if (visibleTodos.length !== allTodos.length) {
    text += ` · 표시 ${visibleTodos.length}`;   // 필터·검색으로 일부만 보일 때
  }
  return text;
}

// 제목 검사: 문제가 있으면 안내 문구, 없으면 빈 글자("")를 돌려줌
// [순수 함수]
function validateTitle(title) {
  if (title === "") {
    return "제목을 입력하세요.";
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return `제목은 ${TITLE_MAX_LENGTH}자 이내로 입력하세요.`;
  }
  return "";
}

// 3-3. 목록을 새 값으로 바꾸고, 저장하고, 화면을 다시 그리기 (세 단계를 한 번에)
function setTodos(nextTodos) {
  todos = nextTodos;
  saveTodos();
  renderTodos();
}

// 4. 목록 화면에 그리기
// [고차 함수 사용: map, forEach]
function renderTodos() {
  const visible = getVisibleTodos(todos, view);   // 지금 보여줄 항목만

  // 빈 안내: 아예 없을 때와 조건에 맞는 게 없을 때 문구가 다름
  emptyMsg.classList.toggle("hidden", visible.length > 0);
  emptyMsg.textContent = todos.length === 0 ? "등록된 할 일이 없습니다." : "조건에 맞는 할 일이 없습니다.";
  clearArea.classList.toggle("hidden", todos.length === 0);
  countText.textContent = makeCountText(todos, visible);
  filterButtons.forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.filter === view.filter)));

  const today = getToday();   // 오늘 날짜는 한 번만 계산해서 항목마다 넘겨줌
  const fragment = document.createDocumentFragment();   // 임시 상자
  fragment.append(...visible.map(todo => makeItem(todo, today)));
  todoList.replaceChildren(fragment);   // 기존 목록을 비우고 한 번에 붙이기
}

// 할 일 하나를 li 요소로 만들기 (아래 작은 부품 함수들을 조립)
function makeItem(todo, today) {
  const li = document.createElement("li");
  li.dataset.id = todo.id;   // 위임 처리에서 "어느 항목인지" 알아내는 용도
  li.className = "flex items-center justify-between gap-3 px-[30px] py-3 border-b border-gray-200 hover:bg-gray-50";

  // 왼쪽(체크 + 제목/날짜), 오른쪽(수정/삭제)
  const left = document.createElement("div");
  left.className = "flex items-start gap-3 min-w-0";
  left.append(makeCheckButton(todo), makeInfo(todo, today));

  li.append(left, makeButtons());
  return li;
}

// 완료 체크 버튼 (동그라미)
function makeCheckButton(todo) {
  const btn = document.createElement("button");
  btn.dataset.action = "toggle";   // 누르면 무슨 일을 할지 (처리는 handleListClick)
  btn.className = "w-5 h-5 mt-0.5 shrink-0 rounded-full border-2 text-xs leading-none flex items-center justify-center";
  if (todo.done) {
    // 머테리얼 아이콘 (!text-sm: 아이콘 크기를 14px로 강제)
    btn.className += " bg-[#228B22] border-[#228B22] text-white material-symbols-outlined !text-sm";
    btn.textContent = "check";   // 아이콘 이름
    btn.title = "미완료로 표시";   // 마우스를 올리면 뜨는 말풍선
  } else {
    btn.className += " border-gray-400";
    btn.title = "완료로 표시";
  }
  return btn;
}

// 제목 + 날짜 (누르면 상세 팝업)
function makeInfo(todo, today) {
  const info = document.createElement("div");
  info.dataset.action = "detail";
  info.className = "cursor-pointer min-w-0";
  info.append(makeTitle(todo), makeDateLabel(todo, today));
  return info;
}

// 제목 (완료되면 취소선)
function makeTitle(todo) {
  const title = document.createElement("p");
  title.className = todo.done ? "text-sm text-gray-400 line-through break-words" : "text-sm break-words";
  title.textContent = todo.title;
  return title;
}

// 날짜/시간 라벨 (지난 날짜는 주황색)
function makeDateLabel(todo, today) {
  const label = document.createElement("span");
  const color = isOverdue(todo, today)
    ? "border-[#ffa500] text-[#ffa500]"
    : "border-gray-300 text-gray-500";
  label.className = `inline-flex items-center gap-1 mt-2 px-2 py-1 text-xs border rounded-full ${color}`;

  // 라벨 안에 시계 아이콘 + 날짜 글자 (아이콘은 항상 표시)
  const icon = document.createElement("span");
  icon.className = "material-symbols-outlined !text-[11.5px] relative top-px";
  icon.textContent = "schedule";

  const text = document.createElement("span");
  text.textContent = makeDateText(todo);

  label.append(icon, text);
  return label;
}

// 수정, 삭제 버튼 묶음
function makeButtons() {
  const box = document.createElement("div");
  box.className = "flex gap-2 self-end shrink-0 whitespace-nowrap";
  box.append(
    createActionButton("수정", "edit", "text-[#228B22]"),
    createActionButton("삭제", "delete", "text-[#f87171]")
  );
  return box;
}

// 글자만 있는 작은 버튼 하나 만들기 (이름, 동작 이름, 글자 색 클래스)
function createActionButton(label, action, colorClass) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.dataset.action = action;
  btn.className = `text-xs py-0.5 border border-transparent hover:font-bold ${colorClass}`;
  return btn;
}

// 날짜가 오늘보다 이전이면 true (완료한 항목이나 날짜가 없는 항목은 false)
// [순수 함수] today를 넘겨주면 항상 같은 결과 (안 넘기면 getToday()로 현재 날짜를 읽음)
function isOverdue(todo, today = getToday()) {
  return todo.done === false && todo.date !== "" && todo.date < today;
}

// 날짜와 시간을 보여줄 글자로 만들기 (예: "2026-10-02 10:30")
// (올해인지 판단하려고 현재 시간을 읽으므로 순수 함수는 아님)
function makeDateText(todo) {
  let text = "";
  if (todo.date) {
    // "2026-10-02"를 "-" 기준으로 잘라서 [년, 월, 일]로 만들기
    const parts = todo.date.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);   // Number()로 "02"를 2로 바꿈
    const day = Number(parts[2]);

    if (year === new Date().getFullYear()) {
      text = month + "월 " + day + "일";                 // 올해: 10월 2일
    } else {
      text = year + "년 " + month + "월 " + day + "일";   // 다른 해: 2027년 5월 22일
    }
  }
  if (todo.time) {   // 이전에 저장한 데이터는 time이 없을 수 있음
    text = (text + " " + todo.time).trim();
  }
  if (text === "") {
    text = "날짜 없음";
  }
  return text;
}

// 완료 체크 바꾸기
function toggleDone(id) {
  const target = findTodo(todos, id);
  if (target === undefined) {
    return;   // 못 찾으면 아무것도 안 함
  }

  setTodos(toggleTodo(todos, id));

  if (target.done === false) {
    showThumb();   // 미완료였다가 완료로 바뀔 때만 따봉 보여주기
  }
}

// 따봉을 보여주고 1초 뒤에 숨기기
function showThumb() {
  thumb.classList.remove("hidden");
  setTimeout(function () {
    thumb.classList.add("hidden");
  }, 1000);   // 1000 = 1초
}

// 5-1. 팝업 열기/닫기 (모든 팝업이 같이 씀)
function openPopup(popup) {
  popup.classList.remove("hidden");
}

function closePopup(popup) {
  popup.classList.add("hidden");
}

// 5-2. 상세 보기 팝업
function openDetailPopup(id) {
  const todo = findTodo(todos, id);
  if (todo === undefined) {
    return;   // 못 찾으면 팝업을 열지 않음
  }

  detailTitle.textContent = todo.title;

  detailDate.textContent = makeDateText(todo);

  if (todo.content === "") {
    detailContent.textContent = "내용 없음";
  } else {
    detailContent.textContent = todo.content;
  }

  openPopup(detailPopup);
}

// 6. 추가 / 수정 팝업

// 빠른 추가: 제목만 넣고 바로 등록 (날짜, 시간, 내용은 비워둠)
function quickAdd() {
  const title = mainInput.value.trim();
  if (validateTitle(title) !== "") {
    return;   // 비었으면 조용히 무시 (너무 긴 제목은 입력창 maxlength가 이미 막음)
  }

  setTodos(addTodo(todos, createTodo({ title: title })));
  mainInput.value = "";
}

// 추가/수정 팝업 열기: todo의 값을 입력칸에 채움 (id가 있으면 수정, 없으면 추가)
const EMPTY_FORM = { title: "", content: "", date: "", time: "" };

function openFormPopup(todo, id = null) {
  editingId = id;
  titleInput.value = todo.title;
  contentInput.value = todo.content;
  dateInput.value = todo.date;
  timeInput.value = todo.time;   // 불러올 때 normalizeTodo가 빈 글자("")를 채워 줌
  errorMsg.textContent = "";
  openPopup(formPopup);
  titleInput.focus();   // 바로 제목을 입력할 수 있게
}

// 상세 설정: 메인 입력값을 제목으로 옮겨서 팝업 열기
function openAddPopup() {
  openFormPopup({ ...EMPTY_FORM, title: mainInput.value });
}

function openEditPopup(id) {
  const todo = findTodo(todos, id);
  if (todo === undefined) {
    return;   // 못 찾으면 팝업을 열지 않음
  }
  openFormPopup(todo, id);
}

// '저장' 버튼 (추가일 때와 수정일 때 모두)
function submitForm() {
  const title = titleInput.value.trim();   // 앞뒤 공백 제거

  const error = validateTitle(title);
  errorMsg.textContent = error;   // 문제가 없으면 ""라서 이전 에러 문구도 지워짐
  if (error !== "") {
    return;   // 팝업은 그대로 두고 끝
  }

  const fields = {
    title: title,
    content: contentInput.value,
    date: dateInput.value,
    time: timeInput.value
  };

  if (editingId === null) {
    setTodos(addTodo(todos, createTodo(fields)));   // 새로 추가
    mainInput.value = "";   // 메인 입력창 비우기
  } else {
    setTodos(updateTodo(todos, editingId, fields));   // 선택한 항목만 수정
  }

  closePopup(formPopup);
}

// 7. 삭제 팝업
function openDeletePopup(id) {
  const todo = findTodo(todos, id);
  if (todo === undefined) {
    return;   // 못 찾으면 팝업을 열지 않음
  }

  deletingId = id;
  deleteTitle.textContent = todo.title;
  openPopup(deletePopup);
}

function confirmDelete() {
  if (deletingId === null) {
    return;   // 삭제할 항목이 정해지지 않았으면 아무것도 안 함
  }
  setTodos(removeTodo(todos, deletingId));
  deletingId = null;
  closePopup(deletePopup);
}

// 전체 삭제 (확인창에서 '확인'을 눌렀을 때만)
function clearAll() {
  const ok = confirm(`할 일 ${todos.length}개를 모두 삭제할까요? (필터와 상관없이 전체) 되돌릴 수 없습니다.`);
  if (ok === false) {
    return;
  }

  setTodos([]);
}

// 8. 이벤트 연결

// 동작 이름 → 실행할 함수 (모두 id를 받음)
const LIST_ACTIONS = {
  toggle: toggleDone,
  detail: openDetailPopup,
  edit: openEditPopup,
  delete: openDeletePopup
};

// 목록 클릭: 목록(ul) 하나에만 리스너를 달고, 눌린 곳의 data-action으로 무슨 일인지 구분 (이벤트 위임)
function handleListClick(event) {
  const actionEl = event.target.closest("[data-action]");   // 눌린 곳(또는 부모) 중 data-action이 있는 요소
  if (actionEl === null) {
    return;   // 동작이 없는 곳을 누름
  }

  const li = actionEl.closest("li");
  if (li === null) {
    return;   // 항목 안이 아니면 무시
  }

  const id = Number(li.dataset.id);   // data는 글자라서 숫자로 바꿈
  const action = LIST_ACTIONS[actionEl.dataset.action];
  if (action !== undefined) {
    action(id);
  }
}

// 키보드: document 하나에서 모든 키 입력을 받음
// [고차 함수 사용: forEach]
function handleKeydown(event) {
  if (event.isComposing) {
    return;   // 한글 조합 중에는 무시 (Enter가 두 번 눌리는 것을 막기)
  }

  if (event.key === "Escape") {
    // 열려 있는 팝업을 모두 닫기
    document.querySelectorAll(".popup:not(.hidden)").forEach(popup => closePopup(popup));
  } else if (event.key === "Enter" && event.target === mainInput) {
    quickAdd();
  } else if (event.key === "Enter" && event.target === titleInput) {
    submitForm();
  }
}

// 팝업의 어두운 배경(.popup 자체)을 누르면 닫기
// (click이 아니라 mousedown: 입력창에서 드래그하다 배경에서 놓아도 닫히지 않게)
function handleBackdropMousedown(event) {
  if (event.target.classList.contains("popup")) {
    closePopup(event.target);
  }
}

todoList.addEventListener("click", handleListClick);
document.addEventListener("keydown", handleKeydown);
document.addEventListener("mousedown", handleBackdropMousedown);

// 하나뿐인 정적 버튼은 위임 없이 직접 연결
clearBtn.addEventListener("click", clearAll);
openFormBtn.addEventListener("click", openAddPopup);
formOkBtn.addEventListener("click", submitForm);
formCancelBtn.addEventListener("click", () => closePopup(formPopup));
detailCloseBtn.addEventListener("click", () => closePopup(detailPopup));
deleteOkBtn.addEventListener("click", confirmDelete);
deleteCancelBtn.addEventListener("click", () => closePopup(deletePopup));

// 마지막 호출 후 delay(ms) 동안 또 호출되지 않을 때만 fn을 한 번 실행 (키 입력마다 다시 그리는 낭비 방지)
// [고차 함수] 함수를 받아서 새 함수를 돌려줌
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// 조회 조건 바꾸기: 검색어 / 상태 필터 / 정렬
const handleSearchInput = debounce(() => {
  view.search = searchInput.value;
  renderTodos();
}, 200);

function handleFilterClick(event) {
  const btn = event.target.closest("[data-filter]");
  if (btn === null) {
    return;
  }
  view.filter = btn.dataset.filter;
  renderTodos();
}

function handleSortChange() {
  view.sort = sortSelect.value;
  renderTodos();
}

searchInput.addEventListener("input", handleSearchInput);
filterGroup.addEventListener("click", handleFilterClick);   // 버튼 3개지만 위임으로 리스너 1개
sortSelect.addEventListener("change", handleSortChange);

// 9. 앱 시작
todos = loadTodos();   // 이전: loadTodos();
renderTodos();
