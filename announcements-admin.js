(() => {
  "use strict";

  const API = "https://aircraft-reference-usage.wgy9sy6b59.workers.dev";
  const report = document.getElementById("report");
  if (!report || document.getElementById("updatesAdmin")) return;

  const style = document.createElement("style");
  style.textContent = `
    #updatesAdmin {
      padding: 16px;
      margin: 15px 0;
      border: 1px solid #8876dc;
      border-radius: 15px;
      background: #141d36;
    }
    #updatesAdmin input, #updatesAdmin textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: 11px;
      margin: 6px 0 12px;
      background: #0b1629;
      color: white;
      border: 1px solid #526580;
      border-radius: 9px;
      font: inherit;
    }
    #updatesAdmin textarea { min-height: 90px; }
    #updatesAdmin label { display: block; margin-top: 9px; }
    #updatesAdmin .updateItem {
      border: 1px solid #40516e;
      padding: 11px;
      border-radius: 10px;
      margin-top: 10px;
    }
    #updatesAdmin .updateItem p { white-space: pre-wrap; }
    #updatesAdmin button { margin: 5px 5px 5px 0; }
  `;
  document.head.appendChild(style);

  const panel = document.createElement("section");
  panel.id = "updatesAdmin";
  panel.innerHTML = `
    <h2>Upcoming Updates — Message Center</h2>
    <p class="muted">Manage announcements shown above aircraft selection.</p>

    <label for="upTitle">Update title</label>
    <input id="upTitle" maxlength="120" placeholder="Upcoming improvement">

    <label for="upBody">Description</label>
    <textarea id="upBody" maxlength="2500"
      placeholder="What's coming soon?"></textarea>

    <label for="upDate">Expected date (optional)</label>
    <input id="upDate" type="date">

    <button id="upPublish" class="primary" type="button">Publish Update</button>
    <button id="upClear" type="button">Clear</button>
    <p id="upStatus" class="muted" role="status"></p>

    <h3>Published Updates</h3>
    <div id="upList"></div>
  `;

  const controls = report.querySelector(":scope > .controls");
  if (controls) controls.after(panel);
  else report.prepend(panel);

  const el = id => document.getElementById(id);
  let editing = null;
  let busy = false;

  const getKey = () => {
    try {
      if (typeof key !== "undefined" && key) return key;
    } catch (_) {}
    return el("key")?.value?.trim() || "";
  };

  async function call(method, path, data) {
    const secret = getKey();
    if (!secret) throw Error("Unlock your dashboard first.");

    const response = await fetch(API + path, {
      method,
      headers: {
        Authorization: "Bearer " + secret,
        ...(data ? {"Content-Type": "application/json"} : {})
      },
      ...(data ? {body: JSON.stringify(data)} : {}),
      cache: "no-store"
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw Error(result.error || "HTTP " + response.status);
    return result;
  }

  function clearForm() {
    editing = null;
    el("upTitle").value = "";
    el("upBody").value = "";
    el("upDate").value = "";
    el("upPublish").textContent = "Publish Update";
  }

  async function refreshUpdates() {
    if (report.hidden || busy) return;
    busy = true;
    try {
      const data = await call("GET", "/announcements/admin");
      const list = el("upList");
      list.replaceChildren();

      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        list.textContent = "No announcements published.";
        return;
      }

      for (const item of items) {
        const box = document.createElement("div");
        box.className = "updateItem";

        const title = document.createElement("strong");
        title.textContent = item.title || "";

        const body = document.createElement("p");
        body.textContent = item.body || "";

        const date = document.createElement("small");
        date.textContent = item.target_date
          ? "Expected: " + item.target_date : "";

        const edit = document.createElement("button");
        edit.textContent = "Edit";
        edit.onclick = () => {
          editing = item.id;
          el("upTitle").value = item.title || "";
          el("upBody").value = item.body || "";
          el("upDate").value = item.target_date || "";
          el("upPublish").textContent = "Save Changes";
          el("upStatus").textContent = "Editing announcement.";
        };

        const remove = document.createElement("button");
        remove.textContent = "Remove";
        remove.onclick = async () => {
          if (!confirm("Remove this announcement?")) return;
          try {
            await call("DELETE", "/announcements/" + encodeURIComponent(item.id));
            if (editing === item.id) clearForm();
            await refreshUpdates();
            el("upStatus").textContent = "Announcement removed.";
          } catch (err) {
            el("upStatus").textContent = err.message;
          }
        };

        box.append(title, body, date, edit, remove);
        list.appendChild(box);
      }
    } catch (err) {
      el("upStatus").textContent = err.message;
    } finally {
      busy = false;
    }
  }

  el("upPublish").onclick = async () => {
    const title = el("upTitle").value.trim();
    const body = el("upBody").value.trim();
    const target_date = el("upDate").value || null;

    if (!title || !body) {
      el("upStatus").textContent = "Enter a title and description.";
      return;
    }

    const button = el("upPublish");
    button.disabled = true;

    try {
      const path = editing
        ? "/announcements/" + encodeURIComponent(editing)
        : "/announcements";

      await call(editing ? "PUT" : "POST", path, {
        title, body, target_date
      });

      clearForm();
      el("upStatus").textContent = "Announcement published.";
      await refreshUpdates();
    } catch (err) {
      el("upStatus").textContent = err.message;
    } finally {
      button.disabled = false;
    }
  };

  el("upClear").onclick = clearForm;

  new MutationObserver(() => {
    if (!report.hidden) refreshUpdates();
  }).observe(report, {
    attributes: true,
    attributeFilter: ["hidden"]
  });

  if (!report.hidden) refreshUpdates();
})();
