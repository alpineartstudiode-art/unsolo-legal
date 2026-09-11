import { loadActivityCatalog } from "./activity-data.mjs";
import { addCalendarMonths, berlinToday, emptyDateState } from "./date-state.mjs";
import { createDestinationSearchClient } from "./destination-search.mjs";
import { buildSubmitFields } from "./form-state.mjs";
import { createSubmissionIntent, createSubmitPlanClient, SubmitPlanError } from "./submit-client.mjs";
import { applyPublicFeed, focusPlanOnMap, isMapActive } from "../plans.mjs";

export const FORM_ERROR_COPY = Object.freeze({
  invalid_activity: "Choose an activity.",
  invalid_destination: "Choose a destination from the list.",
  invalid_dates: "Check when your plan happens.",
  invalid_date_mode: "Choose when your plan happens.",
  invalid_email: "Check your email address.",
  invalid_consent: "Please agree before adding your email.",
  validation: "Check the details and try again.",
  rate_limited: "You’ve added enough plans for now. Please try again later.",
  kill_switch: "Plan sharing is paused for a little while.",
  global_limit: "Plan sharing is paused for a little while.",
  conflict: "We couldn’t safely retry this plan. Change one detail and try again.",
  temporary_failure: "We couldn’t add your plan. Please try again.",
});

export function submitErrorCopy(error) {
  const key = error instanceof SubmitPlanError ? error.kind : error;
  return FORM_ERROR_COPY[key] ?? FORM_ERROR_COPY.temporary_failure;
}

export function monthValueToStart(value) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : null;
}

export function dateStateFromValues({ mode, dateFrom = "", dateTo = "", month = "" }) {
  if (mode === "exact") {
    return Object.freeze({ date_mode: "exact", date_from: dateFrom || null, date_to: dateTo || null, month_start: null });
  }
  if (mode === "month") {
    return Object.freeze({ date_mode: "month", date_from: null, date_to: null, month_start: monthValueToStart(month) });
  }
  return emptyDateState("flexible");
}

function option(value, label) {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = label;
  return node;
}

function initializeAddPlan() {
  const dialog = document.querySelector("#add-plan-dialog");
  const openButton = document.querySelector("#add-plan-open");
  const closeButton = document.querySelector("#add-plan-close");
  const form = document.querySelector("#add-plan-form");
  if (!dialog || !openButton || !closeButton || !form) return;

  const page = document.querySelector(".page-shell");
  const fields = document.querySelector(".add-plan-fields");
  const activity = document.querySelector("#plan-activity");
  const destinationInput = document.querySelector("#plan-destination");
  const destinationResults = document.querySelector("#destination-results");
  const destinationMessage = document.querySelector("#destination-message");
  const exactFields = document.querySelector("#exact-date-fields");
  const monthField = document.querySelector("#month-date-field");
  const flexibleNote = document.querySelector("#flexible-date-note");
  const dateFrom = document.querySelector("#plan-date-from");
  const dateTo = document.querySelector("#plan-date-to");
  const month = document.querySelector("#plan-month");
  const email = document.querySelector("#plan-email");
  const consentField = document.querySelector("#launch-consent-field");
  const launchConsent = document.querySelector("#plan-launch-consent");
  const errorNode = document.querySelector("#add-plan-error");
  const submitButton = document.querySelector("#add-plan-submit");
  const success = document.querySelector("#add-plan-success");
  const successAction = document.querySelector("#add-plan-success-action");
  const mapConsentButton = document.querySelector("#load-map");

  let catalog = null;
  let intent = null;
  let intentSignature = null;
  let completed = false;
  let submitting = false;

  const searchClient = createDestinationSearchClient();
  const submitClient = createSubmitPlanClient();

  const clearError = () => {
    errorNode.textContent = "";
    errorNode.hidden = true;
  };
  const showError = (message, target = null) => {
    errorNode.textContent = message;
    errorNode.hidden = false;
    target?.focus?.();
  };
  const invalidateIntent = () => {
    if (!submitting) {
      intent = null;
      intentSignature = null;
    }
  };

  function setMode(mode) {
    exactFields.hidden = mode !== "exact";
    monthField.hidden = mode !== "month";
    flexibleNote.hidden = mode !== "flexible";
    if (mode !== "exact") {
      dateFrom.value = "";
      dateTo.value = "";
    }
    if (mode !== "month") month.value = "";
    invalidateIntent();
  }

  function resetForm() {
    form.reset();
    searchClient.clear();
    destinationInput.value = "";
    destinationResults.replaceChildren();
    destinationResults.hidden = true;
    destinationInput.setAttribute("aria-expanded", "false");
    destinationMessage.hidden = true;
    consentField.hidden = true;
    launchConsent.required = false;
    clearError();
    setMode("flexible");
    form.hidden = false;
    success.hidden = true;
    completed = false;
    intent = null;
    intentSignature = null;
  }

  function openDialog() {
    if (completed) resetForm();
    dialog.showModal();
    document.body.classList.add("add-plan-open");
    if (page) page.inert = true;
    setTimeout(() => (activity.disabled ? destinationInput : activity).focus(), 0);
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
    document.body.classList.remove("add-plan-open");
    if (page) page.inert = false;
    openButton.focus();
  }

  function renderDestinationState(state) {
    destinationResults.replaceChildren();
    if (state.status === "ready" && state.results.length) {
      for (const result of state.results) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", "false");
        button.dataset.destinationId = result.id;
        button.textContent = result.label;
        button.addEventListener("click", () => {
          searchClient.select(result.id);
          destinationInput.value = result.label;
          destinationInput.focus();
          clearError();
        });
        item.append(button);
        destinationResults.append(item);
      }
    }
    const showResults = state.status === "ready" && state.results.length > 0;
    destinationResults.hidden = !showResults;
    destinationInput.setAttribute("aria-expanded", String(showResults));

    const messages = {
      waiting: "Keep typing…",
      loading: "Looking for places…",
      unavailable: "Destination search is unavailable. Try again.",
      rate_limited: "Destination search is busy. Try again in a minute.",
      invalid: "Use no more than 80 letters.",
    };
    const message = messages[state.status] ??
      (state.status === "ready" && state.results.length === 0 ? "No places found." : "");
    destinationMessage.textContent = message;
    destinationMessage.hidden = !message;
  }

  searchClient.subscribe(renderDestinationState);

  destinationInput.addEventListener("input", () => {
    searchClient.updateQuery(destinationInput.value);
    invalidateIntent();
    clearError();
  });
  destinationInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && !destinationResults.hidden) {
      event.preventDefault();
      destinationResults.querySelector("button")?.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
    }
  });
  destinationResults.addEventListener("keydown", (event) => {
    const buttons = [...destinationResults.querySelectorAll("button")];
    const index = buttons.indexOf(document.activeElement);
    if (event.key === "ArrowDown" && index >= 0) {
      event.preventDefault();
      buttons[Math.min(buttons.length - 1, index + 1)]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index <= 0) destinationInput.focus();
      else buttons[index - 1]?.focus();
    } else if (event.key === "Escape") {
      destinationInput.focus();
      destinationResults.hidden = true;
      destinationInput.setAttribute("aria-expanded", "false");
    }
  });

  for (const radio of document.querySelectorAll('input[name="date_mode"]')) {
    radio.addEventListener("change", () => {
      if (radio.checked) setMode(radio.value);
      clearError();
    });
  }
  for (const control of [activity, dateFrom, dateTo, month, launchConsent]) {
    control.addEventListener("change", () => {
      invalidateIntent();
      clearError();
    });
  }
  email.addEventListener("input", () => {
    const hasEmail = Boolean(email.value.trim());
    consentField.hidden = !hasEmail;
    launchConsent.required = hasEmail;
    if (!hasEmail) launchConsent.checked = false;
    invalidateIntent();
    clearError();
  });

  const today = berlinToday();
  const horizon = addCalendarMonths(today, 24);
  dateFrom.max = horizon;
  dateTo.max = horizon;
  month.min = today.slice(0, 7);
  month.max = horizon.slice(0, 7);

  loadActivityCatalog().then((loaded) => {
    catalog = loaded;
    activity.replaceChildren(option("", "Choose an activity"));
    for (const item of loaded.activities) activity.append(option(item.id, item.label));
    activity.disabled = false;
    submitButton.disabled = false;
  }).catch(() => {
    activity.replaceChildren(option("", "Activities unavailable"));
    showError("Activities could not load. Please try again later.");
  });

  submitButton.disabled = true;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    clearError();
    if (!catalog) {
      showError("Activities could not load. Please try again later.", activity);
      return;
    }
    const mode = document.querySelector('input[name="date_mode"]:checked')?.value;
    const built = buildSubmitFields({
      activity_id: activity.value,
      destination: searchClient.getState(),
      dates: dateStateFromValues({ mode, dateFrom: dateFrom.value, dateTo: dateTo.value, month: month.value }),
      email: email.value,
      launchConsent: launchConsent.checked,
      source: "direct",
    }, { activityCatalog: catalog, today });
    if (!built.ok) {
      const targets = {
        invalid_activity: activity,
        invalid_destination: destinationInput,
        invalid_dates: mode === "month" ? month : mode === "exact" ? dateFrom : null,
        invalid_email: email,
        invalid_consent: launchConsent,
      };
      showError(FORM_ERROR_COPY[built.error] ?? FORM_ERROR_COPY.validation, targets[built.error]);
      return;
    }

    const signature = JSON.stringify(built.fields);
    if (!intent || signature !== intentSignature) {
      try {
        intent = createSubmissionIntent(built.fields);
        intentSignature = signature;
      } catch {
        showError(FORM_ERROR_COPY.temporary_failure);
        return;
      }
    }

    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Adding your plan…";
    try {
      const result = await submitClient.submit(intent);
      if (result.feed) applyPublicFeed(result.feed);
      const mapWasActive = isMapActive();
      if (mapWasActive && result.focus) focusPlanOnMap(result.focus);
      form.hidden = true;
      success.hidden = false;
      successAction.textContent = mapWasActive ? "Go find it" : "View the map";
      successAction.dataset.mapActive = String(mapWasActive);
      completed = true;
      success.querySelector("h2")?.focus?.();
    } catch (error) {
      showError(submitErrorCopy(error));
      fields.scrollTo?.({ top: fields.scrollHeight, behavior: "smooth" });
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = "Add my plan";
    }
  });

  openButton.addEventListener("click", openDialog);
  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  successAction.addEventListener("click", () => {
    const mapWasActive = successAction.dataset.mapActive === "true";
    closeDialog();
    if (!mapWasActive) mapConsentButton.focus();
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAddPlan, { once: true });
  } else {
    initializeAddPlan();
  }
}
