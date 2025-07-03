
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, Timestamp, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ADMINS = ['alanrigon845@gmail.com'];

function renderLogin() {
  document.body.innerHTML = `
    <div class="login-form">
      <h2>Login - BOPE</h2>
      <input id="email" type="email" placeholder="Email">
      <input id="senha" type="password" placeholder="Senha">
      <button onclick="login()">Entrar</button>
      <button onclick="registrar()">Criar Conta</button>
      <div id="status"></div>
    </div>
  `;
}

window.login = async function () {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (err) {
    document.getElementById("status").innerText = err.message;
  }
};

window.registrar = async function () {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  try {
    await createUserWithEmailAndPassword(auth, email, senha);
  } catch (err) {
    document.getElementById("status").innerText = err.message;
  }
};

function renderApp(user) {
  document.body.innerHTML = `
    <h1>Controle de Sequestro - BOPE</h1>
    <form id="form">
      <input id="qra" placeholder="QRA" required>
      <input id="id" placeholder="ID" required>
      <textarea id="acao" placeholder="AÇÃO" required></textarea>
      <input id="datahora" type="datetime-local" required>
      <button type="submit">Registrar</button>
    </form>

    <div>
      <label>Filtrar por Data:</label>
      <input id="filtroDataInicio" type="date"> até <input id="filtroDataFim" type="date">
      <button onclick="filtrar()">Aplicar Filtro</button>
      <button onclick="exportarCSV()">Exportar CSV</button>
    </div>
    <table id="tabela" class="display"><thead><tr><th>QRA</th><th>ID</th><th>Ação</th><th>Data</th></tr></thead><tbody></tbody></table>
  `;

  document.getElementById("form").onsubmit = async function (e) {
    e.preventDefault();
    const data = {
      qra: form.qra.value,
      id: form.id.value,
      acao: form.acao.value,
      datahora: Timestamp.fromDate(new Date(form.datahora.value))
    };
    await addDoc(collection(db, "acoes"), data);
    alert("Registrado!");
    form.reset();
  };

  carregarRegistros();
}

async function carregarRegistros(filtro = null) {
  const tabela = document.querySelector("#tabela tbody");
  tabela.innerHTML = "";
  let registros = [];
  const ref = collection(db, "acoes");
  let q = ref;

  if (filtro) {
    q = query(ref, where("datahora", ">=", filtro.inicio), where("datahora", "<=", filtro.fim));
  }

  const snap = await getDocs(q);
  snap.forEach(doc => {
    const d = doc.data();
    const data = d.datahora.toDate().toLocaleString("pt-BR");
    tabela.innerHTML += `<tr><td>${d.qra}</td><td>${d.id}</td><td>${d.acao}</td><td>${data}</td></tr>`;
    registros.push(d);
  });

  if (!$.fn.DataTable.isDataTable('#tabela')) {
    $('#tabela').DataTable();
  }
}

window.filtrar = () => {
  const inicio = new Date(document.getElementById("filtroDataInicio").value);
  const fim = new Date(document.getElementById("filtroDataFim").value);
  if (!isNaN(inicio) && !isNaN(fim)) {
    carregarRegistros({ inicio: Timestamp.fromDate(inicio), fim: Timestamp.fromDate(fim) });
  }
};

window.exportarCSV = async () => {
  const ref = collection(db, "acoes");
  const snap = await getDocs(ref);
  const dados = [];
  snap.forEach(doc => {
    const d = doc.data();
    dados.push({
      QRA: d.qra,
      ID: d.id,
      Ação: d.acao,
      DataHora: d.datahora.toDate().toLocaleString("pt-BR")
    });
  });
  const csv = Papa.unparse(dados);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "registros.csv";
  link.click();
};

onAuthStateChanged(auth, (user) => {
  if (user) renderApp(user);
  else renderLogin();
});
