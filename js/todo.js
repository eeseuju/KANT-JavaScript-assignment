// 1. 데이터
const STORAGE_KEY = "todo-list";       // localStorage에 저장할 이름(키)
let todos = [];                        // 할 일 목록 (id, date, time, title, content, done)
let editingId = null;                  // 수정 중인 항목의 id (추가 중이면 null)
let deletingId = null;                 // 삭제하려는 항목의 id

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
function isValidTodo(item) {
  return item !== null
    && typeof item === "object"
    && typeof item.id === "number"
    && typeof item.title === "string";
}

// 빠진 칸(옛 데이터의 time 등)을 기본값으로 채운 새 객체를 만들기
function normalizeTodo(item) {
  return {
    id: item.id,
    title: item.title,
    content: typeof item.content === "string" ? item.content : "",
    date: typeof item.date === "string" ? item.date : "",
    time: typeof item.time === "string" ? item.time : "",
    done: item.done === true
  };
}

// 저장된 목록을 읽어서 돌려주기 (무슨 일이 있어도 배열을 돌려줌)
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
function findTodo(list, id) {
  return list.find(todo => todo.id === id);
}

// 입력값으로 새 할 일 객체 만들기
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
function addTodo(list, todo) {
  return [...list, todo];
}

// id가 같은 항목만 changes로 덮어쓴 새 배열
function updateTodo(list, id, changes) {
  return list.map(todo => (todo.id === id ? { ...todo, ...changes } : todo));
}

// id가 같은 항목을 뺀 새 배열
function removeTodo(list, id) {
  return list.filter(todo => todo.id !== id);
}

// id가 같은 항목의 완료 여부를 뒤집은 새 배열
function toggleTodo(list, id) {
  return list.map(todo => (todo.id === id ? { ...todo, done: !todo.done } : todo));
}

// 오늘 날짜를 "2026-11-15" 형식 글자로
function getToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");   // 5 → "05"
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// 3-3. 목록을 새 값으로 바꾸고, 저장하고, 화면을 다시 그리기 (세 단계를 한 번에)
function setTodos(nextTodos) {
  todos = nextTodos;
  saveTodos();
  renderTodos();
}

// 4. 목록 화면에 그리기
function renderTodos() {
  // 목록이 있으면 빈 안내 숨김, 비었으면 전체 삭제 버튼 숨김
  emptyMsg.classList.toggle("hidden", todos.length > 0);
  clearArea.classList.toggle("hidden", todos.length === 0);

  const today = getToday();   // 오늘 날짜는 한 번만 계산해서 항목마다 넘겨줌
  const fragment = document.createDocumentFragment();   // 임시 상자
  fragment.append(...todos.map(todo => makeItem(todo, today)));
  todoList.replaceChildren(fragment);   // 기존 목록을 비우고 한 번에 붙이기
}

// 할 일 하나를 li 요소로 만들기 (아래 작은 부품 함수들을 조립)
function makeItem(todo, today) {
  const li = document.createElement("li");
  li.className = "flex items-center justify-between px-[30px] py-3 border-b border-gray-200 hover:bg-gray-50";

  // 왼쪽(체크 + 제목/날짜), 오른쪽(수정/삭제)
  const left = document.createElement("div");
  left.className = "flex items-start gap-3";
  left.append(makeCheckButton(todo), makeInfo(todo, today));

  li.append(left, makeButtons(todo));
  return li;
}

// 완료 체크 버튼 (동그라미)
function makeCheckButton(todo) {
  const btn = document.createElement("button");
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
  btn.addEventListener("click", () => toggleDone(todo.id));
  return btn;
}

// 제목 + 날짜 (누르면 상세 팝업)
function makeInfo(todo, today) {
  const info = document.createElement("div");
  info.className = "cursor-pointer";
  info.addEventListener("click", () => openDetailPopup(todo));
  info.append(makeTitle(todo), makeDateLabel(todo, today));
  return info;
}

// 제목 (완료되면 취소선)
function makeTitle(todo) {
  const title = document.createElement("p");
  title.className = todo.done ? "text-sm text-gray-400 line-through" : "text-sm";
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
function makeButtons(todo) {
  const box = document.createElement("div");
  box.className = "flex gap-2 self-end";
  box.append(
    createActionButton("수정", "text-[#228B22]", () => openEditPopup(todo.id)),
    createActionButton("삭제", "text-[#f87171]", () => openDeletePopup(todo.id))
  );
  return box;
}

// 글자만 있는 작은 버튼 하나 만들기 (이름, 글자 색 클래스, 눌렀을 때 할 일)
function createActionButton(label, colorClass, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = `text-xs py-0.5 border border-transparent hover:font-bold ${colorClass}`;
  btn.addEventListener("click", onClick);
  return btn;
}

// 날짜가 오늘보다 이전이면 true (완료한 항목이나 날짜가 없는 항목은 false)
function isOverdue(todo, today = getToday()) {
  return todo.done === false && todo.date !== "" && todo.date < today;
}

// 날짜와 시간을 보여줄 글자로 만들기 (예: "2026-10-02 10:30")
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

// 5. 상세 보기 팝업
function openDetailPopup(todo) {
  detailTitle.textContent = todo.title;

  detailDate.textContent = makeDateText(todo);

  if (todo.content === "") {
    detailContent.textContent = "내용 없음";
  } else {
    detailContent.textContent = todo.content;
  }

  detailPopup.classList.remove("hidden");
}

function closeDetailPopup() {
  detailPopup.classList.add("hidden");
}

// 6. 추가 / 수정 팝업

// 빠른 추가: 제목만 넣고 바로 등록 (날짜, 시간, 내용은 비워둠)
function quickAdd() {
  const title = mainInput.value.trim();
  if (title === "") {
    return;   // 비어 있으면 아무것도 안 함
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
  formPopup.classList.remove("hidden");
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

function closeFormPopup() {
  formPopup.classList.add("hidden");
}

// '저장' 버튼 (추가일 때와 수정일 때 모두)
function submitForm() {
  const title = titleInput.value.trim();   // 앞뒤 공백 제거

  if (title === "") {
    errorMsg.textContent = "제목을 입력하세요.";
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

  closeFormPopup();
}

// 7. 삭제 팝업
function openDeletePopup(id) {
  const todo = findTodo(todos, id);
  if (todo === undefined) {
    return;   // 못 찾으면 팝업을 열지 않음
  }

  deletingId = id;
  deleteTitle.textContent = todo.title;
  deletePopup.classList.remove("hidden");
}

function closeDeletePopup() {
  deletePopup.classList.add("hidden");
}

function confirmDelete() {
  setTodos(removeTodo(todos, deletingId));
  closeDeletePopup();
}

// 전체 삭제 (확인창에서 '확인'을 눌렀을 때만)
function clearAll() {
  const ok = confirm("할 일을 모두 삭제할까요? 되돌릴 수 없습니다.");
  if (ok === false) {
    return;
  }

  setTodos([]);
}

// 8. 버튼에 기능 연결
clearBtn.addEventListener("click", clearAll);
mainInput.addEventListener("keydown", function (event) {
  // isComposing: 한글 조합 중일 때 Enter가 두 번 눌리는 것을 막기
  if (event.key === "Enter" && event.isComposing === false) {
    quickAdd();
  }
});
openFormBtn.addEventListener("click", openAddPopup);
formOkBtn.addEventListener("click", submitForm);
formCancelBtn.addEventListener("click", closeFormPopup);
detailCloseBtn.addEventListener("click", closeDetailPopup);
deleteOkBtn.addEventListener("click", confirmDelete);
deleteCancelBtn.addEventListener("click", closeDeletePopup);

// 9. 앱 시작
todos = loadTodos();   // 이전: loadTodos();
renderTodos();
