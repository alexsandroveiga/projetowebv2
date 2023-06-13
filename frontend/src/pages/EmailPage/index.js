import React, { useState } from "react";
import axios from "axios";
import "./styles.css";

function EmailPage() {
  const [destinatario, setDestinatario] = useState("");
  const [assunto, setAssunto] = useState("");
  const [conteudo, setConteudo] = useState("");

  const enviarEmail = async () => {
    try {
      await axios.post("http://localhost:3001/emailPage", {
        destinatario,
        assunto,
        conteudo,
      });

      alert("E-mail enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar o e-mail:", error);
    }
  };

  return (
    <div className="containerEmail">
      <form>
        <label>
          Destinatário:
          <input
            type="email"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
          />
        </label>
        <br />
        <label>
          Assunto:
          <input
            type="text"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
          />
        </label>
        <br />
        <label>
          Conteúdo:
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
          />
        </label>
        <br />
        <button type="button" onClick={enviarEmail}>
          Enviar E-mail
        </button>
      </form>
    </div>
  );
}

export default EmailPage;
