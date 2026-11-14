// todo.js의 STORAGE_KEY와 같은 이름이어야 같은 데이터를 읽음
const STORAGE_KEY = "todo-list";

const keyName = document.getElementById("key-name");
const output = document.getElementById("output");
const totalCount = document.getElementById("total-count");
const doneCount = document.getElementById("done-count");
const updatedAt = document.getElementById("updated-at");

let lastSaved;   // 지난번에 읽은 값 (바뀌었는지 비교용). 처음에는 비교할 값이 없어서 꼭 한 번은 그려짐

keyName.textContent = STORAGE_KEY;

// 화면에 보여주기 (숫자를 모를 때는 "-")
function show(text, total, done) {
  output.textContent = text;
  totalCount.textContent = total;
  doneCount.textContent = done;
  updatedAt.textContent = new Date().toLocaleTimeString();
}

function refresh() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved === lastSaved) {
    return;   // 바뀐 게 없으면 아무것도 안 함
  }
  lastSaved = saved;

  // 저장된 게 없을 때
  if (saved === null) {
    show("저장된 데이터가 없습니다.", 0, 0);
    return;
  }

  // 저장된 글자가 JSON이 아닐 때 (깨진 값): 원래 글자를 그대로 보여줌
  let todos;
  try {
    todos = JSON.parse(saved);
  } catch (error) {
    show("저장된 값이 올바른 JSON이 아닙니다.\n\n" + saved, "-", "-");
    return;
  }

  // JSON이지만 목록(배열)이 아닐 때
  if (Array.isArray(todos) === false) {
    show("저장된 값이 목록(배열)이 아닙니다.\n\n" + JSON.stringify(todos, null, 2), "-", "-");
    return;
  }

  // 보기 좋게 들여쓰기해서 보여주기 (2칸) + 완료 개수 세기
  const done = todos.filter(todo => todo !== null && todo.done === true).length;
  show(JSON.stringify(todos, null, 2), todos.length, done);
}

refresh();
setInterval(refresh, 500);   // 0.5초마다 다시 읽기
