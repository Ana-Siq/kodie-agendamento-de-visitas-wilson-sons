# 🚢 Sistema de Gerenciamento de Agendamento de Visitas – Wilson Sons

## 📋 Sobre o Projeto

O Sistema de Gerenciamento de Agendamento de Visitas da Wilson Sons é uma aplicação web desenvolvida para centralizar, automatizar e controlar solicitações de visitas técnicas aos terminais portuários da empresa.

A plataforma permite que estudantes, profissionais e entusiastas realizem solicitações de visita, enquanto gestores acompanham, aprovam ou rejeitam pedidos através de um painel administrativo integrado ao Google Sheets e Google Apps Script.

---

## ✨ Principais Funcionalidades

### 👥 Gestão de Solicitações

* Cadastro de solicitações de visitas.
* Controle de status:

  * Pendente
  * Aprovado
  * Rejeitado
* Exclusão de registros.
* Filtros por perfil do visitante.
* Busca por nome, e-mail ou instituição.

### 📊 Dashboard Operacional

* Total de solicitações.
* Solicitações pendentes.
* Visitas aprovadas.
* Quantidade total de visitantes autorizados.
* Indicadores visuais de distribuição dos perfis.

### 📁 Exportação de Dados

* Exportação completa das solicitações em formato CSV.
* Compatibilidade com Excel, Google Sheets e Power BI.

### 🔄 Integração com Google Sheets

* Sincronização automática dos registros.
* Atualização bidirecional dos dados.
* Controle centralizado via planilha Google.

### 📧 Automação de E-mails

* Confirmação automática de recebimento da solicitação.
* Envio automático de aprovação da visita.
* Registro do status de envio dos e-mails.

### 🔐 Controle de Acesso

Painel administrativo protegido por autenticação.

Credenciais padrão:

Usuário:
admin

Senha:
admin

> Recomenda-se alterar este mecanismo de autenticação antes da implantação em produção.

---

## 🏗️ Tecnologias Utilizadas

### Front-end

* React
* TypeScript
* Tailwind CSS
* Lucide React Icons

### Integração

* Google Apps Script
* Google Sheets API
* MailApp (Google Workspace)

---

## 📂 Estrutura de Dados

Cada solicitação contém:

| Campo                    | Descrição                             |
| ------------------------ | ------------------------------------- |
| ID                       | Identificador único                   |
| Nome                     | Nome do visitante                     |
| E-mail                   | E-mail para contato                   |
| Telefone                 | Telefone do visitante                 |
| Instituição              | Empresa ou instituição                |
| Perfil                   | Estudante, Profissional ou Entusiasta |
| Data                     | Data desejada para visita             |
| Horário                  | Manhã ou Tarde                        |
| Quantidade de Visitantes | Número de participantes               |
| Objetivo                 | Motivo da visita                      |
| Status                   | Pendente, Aprovado ou Rejeitado       |

---

## 📧 Fluxo de E-mails

### Solicitação Enviada

Quando um visitante envia uma solicitação:

1. Registro é criado.
2. Dados são armazenados no Google Sheets.
3. E-mail de confirmação é enviado automaticamente.

### Solicitação Aprovada

Quando o gestor aprova uma visita:

1. Status é atualizado.
2. E-mail de aprovação é enviado.
3. São informados:

   * Data da visita
   * Turno
   * Regras de segurança
   * Uso obrigatório de EPIs

---

## 📊 Estrutura da Planilha Google

O sistema foi projetado para trabalhar com a seguinte estrutura:

| Coluna | Campo                    |
| ------ | ------------------------ |
| A      | Carimbo de data/hora     |
| B      | Endereço de e-mail       |
| C      | Nome completo            |
| D      | E-mail                   |
| E      | Telefone                 |
| F      | Instituição ou Empresa   |
| G      | Perfil do visitante      |
| H      | Quantidade de visitantes |
| I      | Data desejada            |
| J      | Horário desejado         |
| K      | Objetivo da visita       |
| L      | Observações / ID         |
| M      | Reservado                |
| N      | Reservado                |
| O      | Status do E-mail         |
| P      | Status da Visita         |

---

## ⚙️ Configuração do Google Apps Script

### 1. Criar Projeto

Acesse:

[https://script.google.com](https://script.google.com)

Crie um novo projeto.

---

### 2. Copiar o Script

Cole o código Apps Script disponibilizado pelo sistema.

---

### 3. Implantar como Web App

Menu:

Implantar → Nova Implantação

Configurações:

* Tipo: Aplicativo da Web
* Executar como: Você
* Quem pode acessar: Qualquer pessoa

Copie a URL gerada.

---

### 4. Configurar no Sistema

No painel administrativo:

Integrações → Google Sheets

Cole a URL do Web App.

---

## 🚀 Instalação Local

### Clonar o projeto

```bash
git clone https://github.com/seu-usuario/wilson-sons-visitas.git
```

### Instalar dependências

```bash
npm install
```

### Executar em desenvolvimento

```bash
npm run dev
```

### Gerar build de produção

```bash
npm run build
```

---

## 📈 Indicadores Disponíveis

O dashboard apresenta:

* Total de solicitações
* Total de visitantes aprovados
* Solicitações pendentes
* Solicitações aprovadas
* Distribuição por perfil

---

## 🔒 Segurança

Atualmente o projeto utiliza autenticação simples via LocalStorage para fins demonstrativos.

Para ambientes produtivos recomenda-se:

* JWT Authentication
* OAuth Google
* Firebase Authentication
* Microsoft Entra ID (Azure AD)

---

## 🎯 Objetivo do Projeto

O objetivo principal é substituir processos descentralizados de agendamento por uma solução digital integrada, proporcionando:

* Maior controle operacional;
* Redução de trabalho manual;
* Rastreabilidade das solicitações;
* Comunicação automatizada com visitantes;
* Integração direta com ferramentas Google.

---

## 👨‍💻 Autor

Projeto desenvolvido para apoio ao processo de agendamento de visitas técnicas da Wilson Sons.

---

## 📄 Licença

Este projeto é disponibilizado para fins educacionais e corporativos internos.

Todos os direitos referentes à marca Wilson Sons pertencem aos seus respectivos proprietários.
