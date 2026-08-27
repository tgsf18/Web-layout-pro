// ==========================================================================
// contact-form.js — validação acessível no cliente + simulação de envio.
//
// Importante: isto é validação de UX (feedback imediato), não segurança.
// O backend/serviço de envio (Formspree, EmailJS, endpoint próprio etc.)
// SEMPRE deve validar novamente no servidor.
// ==========================================================================

import { qs } from "./utils.js";

const VALIDATORS = {
  name: (value) => value.trim().length > 0,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
  message: (value) => value.trim().length >= 10,
};

export function initContactForm(form) {
  const statusEl = qs("#form-status", form.parentElement) ?? qs("#form-status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fields = ["name", "email", "message"];
    const isValid = fields.every((name) => validateField(form, name));

    if (!isValid) {
      // Move o foco para o primeiro campo inválido — essencial para quem
      // navega por teclado ou leitor de tela.
      const firstInvalid = form.querySelector('[data-invalid="true"] input, [data-invalid="true"] textarea');
      firstInvalid?.focus();
      showStatus(statusEl, "error", "Corrija os campos destacados antes de enviar.");
      return;
    }

    await submitForm(form, statusEl);
  });

  // Valida em tempo real ao sair do campo (blur), sem incomodar enquanto digita.
  fieldsOf(form).forEach((fieldName) => {
    const input = form.elements[fieldName];
    input.addEventListener("blur", () => validateField(form, fieldName));
  });
}

function fieldsOf(form) {
  return Object.keys(VALIDATORS).filter((name) => form.elements[name]);
}

function validateField(form, name) {
  const input = form.elements[name];
  const fieldWrapper = input.closest(".form-field");
  const valid = VALIDATORS[name](input.value);

  fieldWrapper.dataset.invalid = String(!valid);
  input.setAttribute("aria-invalid", String(!valid));

  return valid;
}

async function submitForm(form, statusEl) {
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  try {
    // TODO: troque pela integração real (Formspree, EmailJS, endpoint próprio...).
    // A Promise abaixo apenas simula latência de rede para demonstrar o
    // gerenciamento de estado de carregamento/sucesso/erro no formulário.
    await simulateNetworkRequest();

    showStatus(statusEl, "success", "Mensagem enviada! Retorno em até 2 dias úteis.");
    form.reset();
    fieldsOf(form).forEach((name) => {
      form.elements[name].closest(".form-field").dataset.invalid = "false";
    });
  } catch (error) {
    console.error("Erro ao enviar formulário:", error);
    showStatus(statusEl, "error", "Não foi possível enviar agora. Tente novamente em instantes.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar mensagem";
  }
}

function simulateNetworkRequest() {
  return new Promise((resolve) => setTimeout(resolve, 900));
}

function showStatus(statusEl, kind, message) {
  if (!statusEl) return;
  statusEl.dataset.kind = kind;
  statusEl.dataset.visible = "true";
  statusEl.textContent = message;
}
