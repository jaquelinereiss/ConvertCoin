const form = document.getElementById("form");
const inputValue = document.getElementById("value");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const result = document.getElementById("result");
const historyList = document.getElementById("history");
const feedback = document.getElementById("feedback");

let currencies = {};
let history = [];

// Função para buscar os tipos de moedas da API Frankfurter
async function fetchCurrencies() {
  try {
    const response = await fetch("https://api.frankfurter.dev/v1/currencies");
    if (!response.ok) throw new Error("Erro ao buscar os dados");

    currencies = await response.json();
    populateSelect(fromCurrency, "Selecione a moeda de origem.");
    populateSelect(toCurrency, "Selecione a moeda de destino.");

    renderHistory();
  } catch (error) {
    showFeedback("Erro ao carregar os dados. Tente recarregar a página.", "error");
    console.error(error);
  }
}

// Preenche o <select> com os tipos de moedas e placeholder
function populateSelect(selectElement, placeholderText) {
  selectElement.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  placeholderOption.textContent = placeholderText;
  selectElement.appendChild(placeholderOption);


  Object.entries(currencies).forEach(([code, name]) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = `${code} - ${name}`;
    selectElement.appendChild(option);
  });
}

// Mostra mensagens de feedback
function showFeedback(message, type = "info") {
  feedback.textContent = message;
  feedback.className = ""; // Reset classes
  feedback.classList.add("mt-6", "p-4", "rounded", "text-center");

  if (type === "error") {
    feedback.classList.add("bg-red-200", "text-red-800");
  } else if (type === "success") {
    feedback.classList.add("bg-green-200", "text-green-800");
  } else { // info/loading
    feedback.classList.add("bg-yellow-100", "text-yellow-800");
  }
  feedback.classList.remove("hidden");
}

// Oculta feedback
function hideFeedback() {
  feedback.classList.add("hidden");
}

// Converte o valor usando a API Frankfurter
async function convertCurrency(amount, from, to) {
  try {
    const url = `https://api.frankfurter.dev/v1/latest?amount=${amount}&from=${from}&to=${to}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro na conversão");

    const data = await response.json();
    return {
      query: { amount, from, to },
      result: data.rates[to],
    };
  } catch (error) {
    showFeedback("Erro na conversão. Tente novamente.", "error");
    console.error(error);
    return null;
  }
}

// Formata valores com separador de milhar e 2 casas decimais
function formatCurrency(amount, code) {
  return `${Number(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`;
}

// Renderiza histórico no HTML
function renderHistory() {
  historyList.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nenhuma conversão realizada.";
    li.classList.add("p-2", "text-gray-500", "italic", "text-center");
    historyList.appendChild(li);
    return;
  }

  history.forEach((h) => {
    const li = document.createElement("li");
    li.textContent = `${formatCurrency(h.query.amount, h.query.from)} → ${formatCurrency(h.result, h.query.to)}`;
    li.classList.add("p-2", "bg-gray-200", "rounded");
    historyList.appendChild(li);
  });
}

// Evento de submit do formulário
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideFeedback(); // Limpa feedback anterior

  let rawValue = inputValue.value;
  rawValue = rawValue.replace(/\./g, '').replace(',', '.');
  
  const amount = parseFloat(rawValue);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (!inputValue.value || isNaN(amount) || amount <= 0) {
    showFeedback("Por favor, insira um valor válido.", "error");
    return;
  }
  if (!from || !to) {
    showFeedback("Selecione as moedas de origem e destino.", "error");
    return;
  }

  showFeedback("Convertendo...", "info");

  const conversion = await convertCurrency(amount, from, to);

  if (conversion) {
    // Mostra resultado formatado
    result.textContent = `${formatCurrency(conversion.query.amount, conversion.query.from)} = ${formatCurrency(conversion.result, conversion.query.to)}`;
    showFeedback("Conversão realizada com sucesso!", "success");

    // Adiciona ao histórico
    history.unshift(conversion);
    if (history.length > 5) history.pop();
    renderHistory();
  }
});

fetchCurrencies();
