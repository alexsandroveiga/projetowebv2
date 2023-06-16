import React, { useEffect } from "react";
import { removeToken } from "../../services/auth";
import "./styles.css";
// import io from "socket.io-client";

function HomePage() {
  // useEffect(() => {
  //   const socket = io("http://localhost:3001");

  //   // Lidar com o evento "atualizacao" recebido do servidor
  //   socket.on("atualizacao", (mensagem) => {
  //     console.log("Recebeu uma atualização:", mensagem);
  //   });

  //   return () => {
  //     socket.disconnect(); // Desconectar quando o componente for desmontado
  //   };
  // }, []);

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

  const redirectEmail = () => {
    window.location.href = "/emailPage";
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
        <button className="btn-padrao" onClick={redirectEmail}>
          Enviar E-mail com rabbitmq
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
