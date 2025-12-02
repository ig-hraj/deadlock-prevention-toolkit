// static/app.js

let n = 0;
let m = 0;

function createMatrixTable(containerId, rows, cols, editable = true) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const table = document.createElement("table");
  table.className = "matrix-table";

  const thead = document.createElement("thead");
  const hrow = document.createElement("tr");
  const empty = document.createElement("th");
  hrow.appendChild(empty);
  for (let j = 0; j < cols; j++) {
    const th = document.createElement("th");
    th.textContent = "R" + j;
    hrow.appendChild(th);
  }
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = "P" + i;
    tr.appendChild(th);
    for (let j = 0; j < cols; j++) {
      const td = document.createElement("td");
      if (editable) {
        const inp = document.createElement("input");
        inp.type = "number";
        inp.value = "0";
        inp.dataset.row = i;
        inp.dataset.col = j;
        td.appendChild(inp);
      } else {
        td.textContent = "0";
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

function createAvailableVector(containerId, cols) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  for (let j = 0; j < cols; j++) {
    const inp = document.createElement("input");
    inp.type = "number";
    inp.value = "0";
    inp.dataset.col = j;
    container.appendChild(inp);
  }
}

function readEditableMatrix(containerId, rows, cols) {
  const container = document.getElementById(containerId);
  const inputs = container.querySelectorAll("input");
  const mat = Array.from({ length: rows }, () => Array(cols).fill(0));

  inputs.forEach(inp => {
    const r = parseInt(inp.dataset.row);
    const c = parseInt(inp.dataset.col);
    const val = parseInt(inp.value) || 0;
    mat[r][c] = val;
  });
  return mat;
}

function setReadOnlyMatrix(containerId, matrix) {
  const container = document.getElementById(containerId);
  const table = container.querySelector("table");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[0].length; j++) {
      const row = tbody.children[i];
      const cell = row.children[j + 1];
      cell.textContent = matrix[i][j];
    }
  }
}

function readAvailableVector(containerId, cols) {
  const container = document.getElementById(containerId);
  const inputs = container.querySelectorAll("input");
  const arr = Array(cols).fill(0);
  inputs.forEach(inp => {
    const c = parseInt(inp.dataset.col);
    const val = parseInt(inp.value) || 0;
    arr[c] = val;
  });
  return arr;
}

function logLine(text, type = "normal") {
  const log = document.getElementById("log-output");
  const div = document.createElement("div");
  if (type === "ok") div.className = "log-line-ok";
  else if (type === "error") div.className = "log-line-error";
  else if (type === "warn") div.className = "log-line-warn";
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// === Event Listeners ===

document.getElementById("btn-init").addEventListener("click", async () => {
  n = parseInt(document.getElementById("num-processes").value);
  m = parseInt(document.getElementById("num-resources").value);

  if (!n || !m || n <= 0 || m <= 0) {
    alert("Please enter valid n and m.");
    return;
  }

  await fetch("/api/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ n, m })
  });

  createMatrixTable("max-matrix", n, m, true);
  createMatrixTable("alloc-matrix", n, m, true);
  createMatrixTable("need-matrix", n, m, false);
  createAvailableVector("available-vector", m);

  document.getElementById("matrices-section").style.display = "block";
  document.getElementById("ops-section").style.display = "block";

  logLine(`System initialized with n=${n}, m=${m}`, "ok");
});

document.getElementById("btn-update-state").addEventListener("click", async () => {
  if (!n || !m) return;

  const maxMat = readEditableMatrix("max-matrix", n, m);
  const allocMat = readEditableMatrix("alloc-matrix", n, m);
  const availVec = readAvailableVector("available-vector", m);

  const res = await fetch("/api/update_state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      n, m,
      max: maxMat,
      alloc: allocMat,
      avail: availVec
    })
  });
  const data = await res.json();

  setReadOnlyMatrix("need-matrix", data.need);
  logLine("System state updated from UI.", "ok");
  document.getElementById("graph-output").textContent = JSON.stringify(data.graph, null, 2);
});

document.getElementById("btn-check-safe").addEventListener("click", async () => {
  const res = await fetch("/api/check_safe", { method: "GET" });
  const data = await res.json();
  if (data.safe) {
    logLine("System is in SAFE state. Sequence: " + data.sequence.join(" -> "), "ok");
  } else {
    logLine("System is UNSAFE. Partial sequence: " + data.sequence.join(" -> "), "warn");
  }
});

document.getElementById("btn-detect-deadlock").addEventListener("click", async () => {
  const res = await fetch("/api/detect_deadlock", { method: "GET" });
  const data = await res.json();
  if (data.deadlocked.length === 0) {
    logLine("No deadlock detected.", "ok");
  } else {
    logLine("Deadlock detected among: " + data.deadlocked.join(", "), "error");
  }
});

document.getElementById("btn-recover").addEventListener("click", async () => {
  const res = await fetch("/api/recover", { method: "POST" });
  const data = await res.json();
  if (data.victim === null) {
    logLine(data.message, "ok");
  } else {
    logLine(data.message, "warn");
  }
  if (data.need) {
    setReadOnlyMatrix("need-matrix", data.need);
  }
  if (data.graph) {
    document.getElementById("graph-output").textContent = JSON.stringify(data.graph, null, 2);
  }
});

document.getElementById("btn-request").addEventListener("click", async () => {
  const pid = parseInt(document.getElementById("req-pid").value);
  const vecText = document.getElementById("req-vector").value.trim();
  if (!vecText) return;
  const parts = vecText.split(",");
  if (parts.length !== m) {
    logLine(`Invalid request. Need ${m} values.`, "error");
    return;
  }
  const req = parts.map(x => parseInt(x.trim()) || 0);

  const res = await fetch("/api/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pid, req })
  });
  const data = await res.json();

  if (data.granted) {
    logLine(`Request by P${pid}: ${data.message}`, "ok");
  } else {
    logLine(`Request by P${pid}: ${data.message}`, "error");
  }

  if (data.need) {
    setReadOnlyMatrix("need-matrix", data.need);
  }
  if (data.graph) {
    document.getElementById("graph-output").textContent = JSON.stringify(data.graph, null, 2);
  }
});
