import React from "react";
import { removeToken } from "../../services/auth";
import "./styles.css";

function HomePage() {
  const handleLogout = () => {
    removeToken(); // Remove o token
    window.location.reload(); // Recarrega a página
  };

  const redirectCadastro = () => {
    window.location.href = "/cadastroMoeda";
  };

  const redirectLista = () => {
    window.location.href = "/listaMoeda";
  };

  return (
    <div className="container">
      <div className="menu">
        <button className="btn-padrao" onClick={redirectCadastro}>
          Cadastrar Moeda
        </button>
        <button className="btn-padrao" onClick={redirectLista}>
          Listar Moedas
        </button>
        <div className="logout-btn">
          <input
            type="button"
            className="logout"
            value="Logout"
            onClick={handleLogout}
          />
        </div>
      </div>
      <div className="content">
        <h1 className="txtHome">Bem vindo(a) a tela Home!</h1>
      </div>
    </div>
  );
}

export default HomePage;
