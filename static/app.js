// static/app.js

let n = 0;
let m = 0;

/* ---------- Helpers to build and read matrices ---------- */

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
      const cell = row.children[j + 1]; // +1 to skip process header
      cell.textContent = matrix[i][j];
    }
  }
}

function renderAvailableVector(containerId, arr) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  if (!arr || arr.length === 0) {
    container.textContent = "(not computed)";
    return;
  }
  arr.forEach((val, idx) => {
    const span = document.createElement("span");
    span.className = "avail-cell";
    span.textContent = `R${idx}=${val}`;
    container.appendChild(span);
  });
}

/* ---------- Logging helper ---------- */

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

/* ---------- Button Handlers ---------- */

document.getElementById("btn-init").addEventListener("click", async () => {
  n = parseInt(document.getElementById("num-processes").value);
  m = parseInt(document.getElementById("num-resources").value);

  if (!n || !m || n <= 0 || m <= 0) {
    alert("Please enter valid n and m.");
    return;
  }

  // Inform backend to create a new toolkit
  await fetch("/api/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ n, m })
  });

  // Build UI matrices
  createMatrixTable("max-matrix", n, m, true);
  createMatrixTable("alloc-matrix", n, m, true);
  createMatrixTable("need-matrix", n, m, false);

  document.getElementById("matrices-section").style.display = "block";
  document.getElementById("ops-section").style.display = "block";

  logLine(`System initialized with n=${n}, m=${m}`, "ok");
});

document.getElementById("btn-update-state").addEventListener("click", async () => {
  if (!n || !m) return;

  const maxMat = readEditableMatrix("max-matrix", n, m);
  const allocMat = readEditableMatrix("alloc-matrix", n, m);

  const totalText = document.getElementById("total-resources").value.trim();
  if (!totalText) {
    logLine("Please enter the Total Resources vector (comma separated).", "error");
    return;
  }
  const totalParts = totalText.split(",");
  if (totalParts.length !== m) {
    logLine(`Total vector must have exactly ${m} values.`, "error");
    return;
  }
  const totalVec = totalParts.map(x => parseInt(x.trim()) || 0);

  const res = await fetch("/api/update_state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      n,
      m,
      max: maxMat,
      alloc: allocMat,
      total: totalVec
    })
  });
  const data = await res.json();

  setReadOnlyMatrix("need-matrix", data.need);
  renderAvailableVector("available-vector", data.avail);
  logLine("System state updated from UI (Need & Available computed).", "ok");
  document.getElementById("graph-output").textContent = JSON.stringify(data.graph, null, 2);
});

document.getElementById("btn-check-safe").addEventListener("click", async () => {
  const res = await fetch("/api/check_safe", { method: "GET" });
  const data = await res.json();
  renderAvailableVector("available-vector", data.avail);
  if (data.safe) {
    logLine("System is in SAFE state. Sequence: " + data.sequence.join(" -> "), "ok");
  } else {
    logLine("System is UNSAFE. Partial sequence: " + data.sequence.join(" -> "), "warn");
  }
});

document.getElementById("btn-detect-deadlock").addEventListener("click", async () => {
  const res = await fetch("/api/detect_deadlock", { method: "GET" });
  const data = await res.json();
  renderAvailableVector("available-vector", data.avail);
  if (data.deadlocked.length === 0) {
    logLine("No deadlock detected.", "ok");
  } else {
    logLine("Deadlock detected among: " + data.deadlocked.join(", "), "error");
  }
});

document.getElementById("btn-recover").addEventListener("click", async () => {
  const res = await fetch("/api/recover", { method: "POST" });
  const data = await res.json();
  renderAvailableVector("available-vector", data.avail);
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
  if (!vecText) {
    logLine("Please enter a request vector.", "error");
    return;
  }
  const parts = vecText.split(",");
  if (parts.length !== m) {
    logLine(`Invalid request. Need exactly ${m} values.`, "error");
    return;
  }
  const req = parts.map(x => parseInt(x.trim()) || 0);

  const res = await fetch("/api/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pid, req })
  });
  const data = await res.json();

  renderAvailableVector("available-vector", data.avail);

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
