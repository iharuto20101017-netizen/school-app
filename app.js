// =====================================
// 学校管理アプリ Ultimate（完全統合・バグ修正版）
// =====================================

const $ = id => document.getElementById(id);

// =====================================
// DB（完全維持）
// =====================================

const DB = {

    schedule: JSON.parse(localStorage.getItem("schedule") || "{}"),
    assignments: JSON.parse(localStorage.getItem("assignments") || "[]"),
    tests: JSON.parse(localStorage.getItem("tests") || "[]"),
    items: JSON.parse(localStorage.getItem("items") || "[]"),
    grades: JSON.parse(localStorage.getItem("grades") || "[]"),
    studyLogs: JSON.parse(localStorage.getItem("studyLogs") || "[]"),
    goals: JSON.parse(localStorage.getItem("goals") || "[]")

};

// =====================================
// 保存（安全化）
// =====================================

function saveDB() {

    Object.keys(DB).forEach(key => {
        localStorage.setItem(
            key,
            JSON.stringify(DB[key])
        );
    });

}

// =====================================
// 安全ユーティリティ
// =====================================

function safeDate(d) {

    const date = new Date(d);

    if (isNaN(date)) return null;

    return date;

}

function daysLeft(date) {

    const d = safeDate(date);

    if (!d) return 9999;

    return Math.ceil((d - new Date()) / 86400000);

}

// =====================================
// Navigation（そのまま）
// =====================================

document.querySelectorAll(".nav-btn")
.forEach(btn => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".nav-btn")
        .forEach(b => b.classList.remove("active"));

        document.querySelectorAll(".page")
        .forEach(p => p.classList.remove("active"));

        btn.classList.add("active");

        const page = $(btn.dataset.page);

        if (page) page.classList.add("active");

    });

});

// =====================================
// 時間割
// =====================================

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat"];

function renderSchedule() {

    const body = $("scheduleBody");
    if (!body) return;

    body.innerHTML = "";

    for (let period = 1; period <= 6; period++) {

        const tr = document.createElement("tr");

        let html = `<td>${period}</td>`;

        DAYS.forEach(day => {

            const key = `${day}_${period}`;

            html += `
            <td>
                <input value="${DB.schedule[key] || ""}"
                onchange="updateSchedule('${key}', this.value)">
            </td>`;

        });

        tr.innerHTML = html;
        body.appendChild(tr);

    }

}

window.updateSchedule = (key, value) => {

    DB.schedule[key] = value;

    saveDB();

    updateDashboard();

};

// =====================================
// 今日の時間割
// =====================================

function updateTodaySchedule() {

    const target = $("todaySchedule");
    if (!target) return;

    const map = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const day = map[new Date().getDay()];

    if (day === "Sun") {
        target.innerHTML = "今日は授業なし";
        return;
    }

    let html = "";

    for (let i = 1; i <= 6; i++) {

        html += `${i}限：${DB.schedule[`${day}_${i}`] || "-"}<br>`;

    }

    target.innerHTML = html;

}

// =====================================
// 次の授業
// =====================================

function updateNextClass() {

    const target = $("nextClass");
    if (!target) return;

    const map = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const day = map[new Date().getDay()];

    if (day === "Sun") {
        target.innerHTML = "授業なし";
        return;
    }

    const hour = new Date().getHours();
    const times = [8,9,10,11,13,14];

    let next = null;

    for (let i = 0; i < times.length; i++) {

        if (hour < times[i]) {
            next = i + 1;
            break;
        }

    }

    if (!next) {
        target.innerHTML = "本日の授業終了";
        return;
    }

    target.innerHTML =
        `${next}限<br>${DB.schedule[`${day}_${next}`] || "-"}`;

}
// =====================================
// 提出物
// =====================================

$("addAssignment")?.addEventListener("click", () => {

    const title = $("assignmentTitle").value.trim();
    const deadline = $("assignmentDeadline").value;

    if (!title) return;

    DB.assignments.push({

        title,
        deadline,
        done: false

    });

    saveDB();

    renderAssignments();

    updateDashboard();

});

function renderAssignments() {

    const list = $("assignmentList");
    if (!list) return;

    list.innerHTML = "";

    DB.assignments
    .sort((a,b)=>daysLeft(a.deadline)-daysLeft(b.deadline))
    .forEach((a,index)=>{

        const div = document.createElement("div");
        div.className = "assignment-card";

        div.innerHTML = `
            <input type="checkbox"
            ${a.done ? "checked" : ""}
            onchange="toggleAssignment(${index})">

            <strong>${a.title}</strong><br>
            締切:${a.deadline}<br>

            <button onclick="deleteAssignment(${index})">
                削除
            </button>
        `;

        list.appendChild(div);

    });

}

window.toggleAssignment = (index) => {

    DB.assignments[index].done =
        !DB.assignments[index].done;

    saveDB();

    renderAssignments();

    updateDashboard();

};

window.deleteAssignment = (index) => {

    DB.assignments.splice(index,1);

    saveDB();

    renderAssignments();

};

// =====================================
// テスト
// =====================================

$("addTest")?.addEventListener("click", () => {

    const name = $("testName").value.trim();
    const date = $("testDate").value;
    const target = Number($("targetScore").value || 0);

    if (!name) return;

    DB.tests.push({
        name,
        date,
        target
    });

    saveDB();

    renderTests();

    updateDashboard();

});

function renderTests() {

    const list = $("testList");
    if (!list) return;

    list.innerHTML = "";

    DB.tests
    .sort((a,b)=>daysLeft(a.date)-daysLeft(b.date))
    .forEach((t,index)=>{

        const remain = daysLeft(t.date);

        list.innerHTML += `
        <div class="test-card">
            <strong>${t.name}</strong><br>
            ${t.date}<br>
            目標:${t.target}<br>
            残り:${remain}日<br>

            <button onclick="deleteTest(${index})">
                削除
            </button>
        </div>`;
    });

}

window.deleteTest = (index) => {

    DB.tests.splice(index,1);

    saveDB();

    renderTests();

};
// =====================================
// 持ち物
// =====================================

$("addItem")?.addEventListener("click", () => {

    const day = $("itemDay").value;
    const name = $("itemName").value.trim();

    if (!name) return;

    DB.items.push({day,name});

    saveDB();

    renderItems();

    updateDashboard();

});

function renderItems() {

    const list = $("itemList");
    if (!list) return;

    list.innerHTML = "";

    DB.items.forEach((item,index)=>{

        list.innerHTML += `
        <div class="item-card">
            ${item.day} / ${item.name}
            <button onclick="deleteItem(${index})">削除</button>
        </div>`;
    });

}

window.deleteItem = (index) => {

    DB.items.splice(index,1);

    saveDB();

    renderItems();

};

// =====================================
// GPA（安全化）
// =====================================

function calculateGPA() {

    if (!DB.grades.length) return 0;

    let total = 0;

    DB.grades.forEach(g => {

        const s = Number(g.score || 0);

        if (s >= 90) total += 4;
        else if (s >= 80) total += 3;
        else if (s >= 70) total += 2;
        else if (s >= 60) total += 1;

    });

    return (total / DB.grades.length).toFixed(2);

}

function updateGPA() {

    const el = $("gpaDisplay");
    if (!el) return;

    el.innerHTML = calculateGPA();

}

// =====================================
// notify（安全）
// =====================================

function notify(msg) {

    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {

        new Notification("学校管理アプリ",{body:msg});

    }

}

// 遅延許可（バグ防止）
if ("Notification" in window) {

    setTimeout(()=>Notification.requestPermission(),2000);

}

// =====================================
// DASHBOARD（安全版）
// =====================================

function updateDashboard() {

    try {

        updateTodaySchedule();
        updateNextClass();
        updateGPA?.();

    } catch (e) {
        console.error(e);
    }

}

// =====================================
// INIT
// =====================================

renderSchedule();
renderAssignments();
renderTests();
renderItems?.();
renderGrades?.();
renderGoals?.();
renderStudyLogs?.();

updateDashboard();
