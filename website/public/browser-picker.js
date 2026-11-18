/* Accessible select-only combobox. The native select remains the data source. */
(() => {
  "use strict";
  const mounted = new WeakMap();
  const ROW_HEIGHT = 56;
  const VISIBLE_ROWS = 5;
  const EDGE = 12;

  function mount(select) {
    if (!select) return null;
    if (mounted.has(select)) return mounted.get(select);
    const root = document.createElement("div");
    root.className = "browser-picker";
    const button = document.createElement("button");
    button.id = "browser-picker-input";
    button.type = "button";
    button.className = "browser-picker-button";
    button.setAttribute("role", "combobox");
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "browser-options");
    const describedBy = select.getAttribute("aria-describedby");
    if (describedBy) button.setAttribute("aria-describedby", describedBy);
    const name = document.createElement("span");
    name.className = "browser-picker-value";
    const chevron = document.createElement("span");
    chevron.className = "browser-picker-chevron";
    chevron.setAttribute("aria-hidden", "true");
    button.append(name, chevron);
    const list = document.createElement("div");
    list.id = "browser-options";
    list.className = "browser-picker-options";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    const labels = Array.from(select.labels || []);
    for (const label of labels) label.htmlFor = button.id;
    list.setAttribute(
      "aria-label",
      labels.map((label) => label.textContent.trim()).join(" ") || "Browsers",
    );
    if (!labels.length)
      button.setAttribute(
        "aria-label",
        select.getAttribute("aria-label") || "Browser",
      );
    select.before(root);
    root.append(select, button, list);
    let options = [];
    let rows = [];
    let active = -1;
    let opened = false;
    let search = "";
    let searchTimer = 0;

    function clearSearch() {
      window.clearTimeout(searchTimer);
      searchTimer = 0;
      search = "";
    }
    function position() {
      if (!opened) return;
      const rect = button.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft || 0;
      const viewportTop = viewport?.offsetTop || 0;
      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      const popupHeight = ROW_HEIGHT * VISIBLE_ROWS + 2;
      const width = Math.min(rect.width, Math.max(0, viewportWidth - EDGE * 2));
      const left = Math.max(
        viewportLeft + EDGE,
        Math.min(rect.left, viewportLeft + viewportWidth - width - EDGE),
      );
      const below = rect.bottom + 8;
      const above = rect.top - popupHeight - 8;
      let top = below;
      if (below + popupHeight > viewportTop + viewportHeight - EDGE)
        top = above >= viewportTop + EDGE ? above : viewportTop + EDGE;
      list.style.width = `${width}px`;
      list.style.left = `${left}px`;
      list.style.top = `${top}px`;
    }
    function showActive(index) {
      if (index < 0 || !options[index] || options[index].disabled) return;
      if (active >= 0 && rows[active])
        rows[active].classList.remove("is-active");
      active = index;
      rows[active].classList.add("is-active");
      if (opened) {
        button.setAttribute("aria-activedescendant", rows[active].id);
        // Equivalent to block: nearest, confined to this scroll container.
        const top = active * ROW_HEIGHT;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (top + ROW_HEIGHT > list.scrollTop + list.clientHeight)
          list.scrollTop = top + ROW_HEIGHT - list.clientHeight;
      }
    }
    function firstEnabled() {
      return options.findIndex((option) => !option.disabled);
    }
    function selectedIndex() {
      return options.findIndex((option) => option.value === select.value);
    }
    function sync() {
      const previousActiveValue = options[active]?.value;
      options = Array.from(select.options).map((option) => ({
        value: option.value,
        name: option.textContent.trim(),
        family:
          option.parentElement?.tagName === "OPTGROUP"
            ? option.parentElement.label
            : "",
        disabled: option.disabled || !!option.parentElement?.disabled,
      }));
      list.replaceChildren();
      rows = options.map((option, index) => {
        const row = document.createElement("div");
        row.id = `browser-option-${index}`;
        row.className = "browser-picker-option";
        row.dataset.value = option.value;
        row.setAttribute("role", "option");
        row.setAttribute(
          "aria-selected",
          String(option.value === select.value),
        );
        if (option.disabled) row.setAttribute("aria-disabled", "true");
        const label = document.createElement("span");
        label.className = "browser-option-name";
        label.textContent = option.name;
        const family = document.createElement("span");
        family.className = "browser-option-family";
        family.textContent = option.family;
        row.append(label, family);
        list.append(row);
        return row;
      });
      const selected = selectedIndex();
      name.textContent = options[selected]?.name || "Choose your browser";
      button.disabled = select.disabled;
      const previous = options.findIndex(
        (option) => option.value === previousActiveValue,
      );
      active = -1;
      showActive(
        opened && previous >= 0
          ? previous
          : selected >= 0
            ? selected
            : firstEnabled(),
      );
      position();
    }
    function close(focus = false) {
      opened = false;
      list.hidden = true;
      root.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      button.removeAttribute("aria-activedescendant");
      clearSearch();
      if (focus) button.focus({ preventScroll: true });
    }
    function open() {
      if (opened || button.disabled) return;
      opened = true;
      list.hidden = false;
      root.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      position();
      const selected = selectedIndex();
      showActive(selected >= 0 ? selected : firstEnabled());
    }
    function commit(index, closeAfter = false) {
      const option = options[index];
      if (!option || option.disabled) return;
      const changed = select.value !== option.value;
      select.value = option.value;
      if (closeAfter) close(true);
      sync();
      if (changed)
        select.dispatchEvent(new window.Event("change", { bubbles: true }));
    }
    function move(direction) {
      for (
        let index = active + direction;
        index >= 0 && index < options.length;
        index += direction
      )
        if (!options[index].disabled) {
          showActive(index);
          return;
        }
    }
    function typeahead(key) {
      window.clearTimeout(searchTimer);
      const letter = key.toLocaleLowerCase();
      search =
        search && Array.from(search).every((character) => character === letter)
          ? letter
          : search + letter;
      const start = search.length === 1 ? active + 1 : Math.max(0, active);
      for (let offset = 0; offset < options.length; offset++) {
        const index = (start + offset) % options.length;
        if (
          !options[index].disabled &&
          options[index].name.toLocaleLowerCase().startsWith(search)
        ) {
          if (opened) showActive(index);
          else commit(index);
          break;
        }
      }
      searchTimer = window.setTimeout(clearSearch, 700);
    }
    function onKeydown(event) {
      if (event.key === "Tab") {
        close();
        return;
      }
      if (event.key === "Escape" && opened) {
        event.preventDefault();
        close(true);
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!opened) open();
        else if (!event.altKey) move(event.key === "ArrowDown" ? 1 : -1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        open();
        if (event.key === "Home") showActive(firstEnabled());
        else
          for (let index = options.length - 1; index >= 0; index--)
            if (!options[index].disabled) {
              showActive(index);
              break;
            }
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (opened) commit(active, true);
        else open();
      } else if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        typeahead(event.key);
      }
    }
    button.addEventListener("click", () => (opened ? close() : open()));
    button.addEventListener("keydown", onKeydown);
    button.addEventListener("blur", () => close());
    list.addEventListener("pointerdown", (event) => event.preventDefault());
    list.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const row = event.target.closest("[role=option]");
      if (row && list.contains(row)) showActive(rows.indexOf(row));
    });
    list.addEventListener("click", (event) => {
      const row = event.target.closest("[role=option]");
      if (row && list.contains(row)) commit(rows.indexOf(row), true);
    });
    document.addEventListener("pointerdown", (event) => {
      if (opened && !root.contains(event.target)) close();
    });
    window.addEventListener("resize", position, { passive: true });
    window.addEventListener("scroll", position, { passive: true });
    window.visualViewport?.addEventListener("resize", position, {
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", position, {
      passive: true,
    });
    select.addEventListener("change", sync);
    sync();
    select.hidden = true;
    const api = { sync };
    mounted.set(select, api);
    return api;
  }
  window.SpoilenceBrowserPicker = { mount };
})();
