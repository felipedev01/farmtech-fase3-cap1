Introdução
PROJETO FASE 3 – ETAPAS DE UMA MÁQUINA AGRÍCOLA

 



 

Introdução

O PBL (Project-Based Learning) do curso de Inteligência Artificial é uma jornada que simula o crescimento de uma startup.

 No nosso caso, essa startup é a FarmTech Solutions, que atua (de forma fictícia) como uma consultoria em soluções para o setor do agronegócio — uma das áreas mais promissoras para aplicação de IA no Brasil, segundo o Global AI Jobs Barometer da PwC (2025).

A seguir, você encontra o mapa mental que demonstra os assuntos e entregas explorados em cada fase do curso.



Fig. 1 – Estrutura do PBL do curso de IA

Fonte: Elaborado pelo autor (2025). Disponível em alta definição nesse link https://xmind.ai/share/LwsoOKB2?xid=oErUWyET

 

Entregas do PBL

O PBL sempre conta com:

1 entrega obrigatória → vale pontos no boletim.
2 entregas opcionais (Ir Além) → não são obrigatórias, mas incentivamos que você e seu grupo explorem.


 

Entrega Obrigatória

Nesta atividade, vamos explorar conceitos iniciais de Banco de Dados, carregando os dados coletados pelos sensores da Fase 2 em um banco relacional Oracle.

Você deverá entregar:

Um relatório com os passos seguidos;
Prints de tela das consultas realizadas;
Uso do arquivo da Fase 2 como base para importação.
 

Passo a Passo no Oracle SQL Developer

 

1) Faça download do Oracle SQL Developer acessando o site https://www.oracle.com/database/sqldeveloper/technologies/download/.

2) Faça download da versão correspondente para seu sistema operacional. Há versões para o sistema operacional Windows, Linux (x86 e ARM) e Mac OSX. Eventualmente, o site pode pedir que seja feito um cadastro gratuito antes do download.



Fig. 2 - Tela de opções de download

Fonte: Oracle (2025)

  

3) Descompacte o arquivo e execute o programa SQLDEVELOPER. Observação: é necessário extrair os arquivos e não apenas abrir o arquivo compactado.



Fig. 3 – Tela do SQL DEVELOPER

Fonte: Oracle (2025)

 

4) Clique em “Nova Conexão” (o ícone + em verde).



Fig. 4 – Opções de conexões

Fonte: Oracle (2025)

 

5) Estabeleça uma conexão com o banco de dados Oracle:

No campo Nome informe um nome qualquer, por exemplo, FIAP.
No campo Nome do Usuário informe o seu RM, incluindo as letras RM, por exemplo: RM12345.
No campo Senha informe a sua data de nascimento com seis dígitos no formato DDMMYY, por exemplo, se sua data de nascimento for 07 de setembro de 2005 sua senha será 070905.
Em Nome do Host, informe oracle.fiap.com.br.
Em Porta, mantenha o número 1521 que já está lá.
Em SID, informe ORCL.
Clique em Testar. Se receber uma mensagem dizendo que sua conta está bloqueada, entre em contato com o suporte pedindo que desbloqueiem a sua conta. Se receber uma mensagem dizendo que seu usuário ou senha estão inválido, verifique se digitou o seu RM no formato RM12345 (sem espaços e com as letras RM no início) caso esteja correto, entre em contato com o suporte para que resetem sua senha.


Fig. 5 – Configurações da conexão

Fonte: Oracle (2025)

 

6) Uma vez conectado ao banco, localize o ícone “Tabelas (Filtrado)”.



Fig. 6 – Conexões Oracle

Fonte: Oracle (2025)

 

7) Clique com o botão direito do mouse em “Tabelas (Filtrado)” e selecione “Importa Dados”.



Fig. 7 – Como importar dados

Fonte: Oracle (2025)

 

8) Clique em “Procurar” e carregue os dados dos seus sensores.



Fig. 8 – Tela de Visualização de Dados

Fonte: Oracle (2025)

 

9) Clique em “Próximo”. No campo “Nome da Tabela”, defina um nome para sua tabela. O nome não pode conter espaços, caracteres especiais, deve começar por uma letra e não deve ter mais que 30 dígitos.



Fig. 9 – Tela de Importação e consulta de Dados

Fonte: Oracle (2025)

 

10) Clique em “Próximo”. Selecione os campos que deseja que sejam importados para o banco de dados, não altere nada caso queira importar todos os dados.



Fig. 10 – Opções de filtragem

Fonte: Oracle (2025)

 

11) Clique em “Próximo”. Caso seja necessário, altere o nome das colunas.



Fig. 11 – Opções de colunas

Fonte: Oracle (2025)

 

12) Clique em próximo.



Fig. 12 – Tela de conclusão

Fonte: Oracle (2025)

 

13) Clique em “Finalizar” e aguarde a mensagem informando que os dados foram importados com sucesso.



Fig. 13 – Tela de confirmação

Fonte: Oracle (2025)

 

14) Clique em OK e consulte os dados da sua tabela executando o comando SELECT * FROM NOME_DA_SUA_TABELA; onde NOME_DA_SUA_TABELA é o nome que escolheu para a sua tabela. Ctrl+Enter executa o comando.



Fig. 14 – Tela de uso do seu banco de dados

Fonte: Oracle (2025)

 

15) Agora, você consegue explorar seus dados fazendo consultas neles e o mais legal, estão armazenados no banco da Oracle, em algum lugar do mundo.

 

Entregáveis

O grupo (1 a 5 alunos) deve entregar:

Repositório no GitHub organizado (meugit/cursotiao/pbl/fase3/...);
Arquivo README.md documentando o projeto, com prints do banco;
Códigos C/C++ ou Python usados;
Vídeo (de até 5 minutos no YouTube como “não listado”) mostrando o funcionamento. 


 

Programa Ir Além (opcional)

 

Opção 1 – Dashboard em Python

Crie uma dashboard (Streamlit, Dash etc.) para visualizar:

Níveis de umidade, P, K e pH;
Status da irrigação;
Sugestões de irrigação baseadas em clima.
 

Opção 2 – Machine Learning no Agronegócio

Use a base produtos_agricolas.csv (variáveis: N, P, K, temperatura, umidade, pH, chuva, label).

Atividades:

Análise exploratória com pelo menos 5 gráficos.
Identificação do “perfil ideal” de solo/clima para 3 culturas escolhidas.
Desenvolvimento de 5 modelos preditivos com diferentes algoritmos.
Avaliação comparativa dos modelos.
Entregas:

Jupyter Notebook (SeuNome_RMxxxx_fase3_cap1.ipynb) com código e análises.
Vídeo (de até 5 minutos no YouTube como “não listado”) apresentando o trabalho.
 

Baremas

Entrega Obrigatória (máximo 10 pontos) – Banco de Dados

Critério

Descrição

Pontos

Organização do repositório GitHub

Estrutura de pastas clara, README.md presente, arquivos nomeados corretamente.

2,0

Documentação (README.md)

Explicação detalhada do processo, prints de tela das etapas no Oracle SQL Developer e consulta SELECT *.

2,0

Carga de dados no Oracle

Importação correta dos dados coletados na Fase 2, evidenciada por prints de tela.

2,0

Consultas SQL

Execução e apresentação de consultas SQL corretas e funcionais.

2,0

Vídeo demonstrativo (até 5 min)

Clareza na explicação, mostra o funcionamento do banco e organização do repositório.

2,0

Total

 

10,0

 

Programa Ir Além (máximo 5 pontos extras cada – nota fictícia sem influência no boletim) – Dashboard em Python

Critério

Descrição

Pontos

Funcionamento da Dashboard

Visualização clara de pelo menos 3 variáveis (exemplo: umidade, pH, P/K).

1,5

Interatividade/Visualização

Gráficos ou tabelas bem apresentados, uso de bibliotecas adequadas (Streamlit, Dash etc.).

1,0

Integração com dados da Fase 2

Uso correto dos dados coletados no projeto.

1,0

Documentação no GitHub

README.md explicando a dashboard, prints da interface.

0,5

Vídeo demonstrativo (até 5 min)

Demonstração clara da dashboard em funcionamento.

1,0

Total

 

5,0

 

Programa Ir Além – Machine Learning no Agronegócio

Critério

Descrição

Pontos

Análise exploratória

Pelo menos 5 gráficos com análise descritiva.

1,0

Discussão sobre o perfil ideal de solo/clima

Identificação clara e comparação com 3 culturas.

1,0

Modelagem preditiva

Desenvolvimento de 5 modelos com algoritmos distintos.

1,5

Avaliação de performance

Uso de métricas adequadas, comparação dos modelos.

1,0

Documentação e Notebook

Notebook bem organizado, README.md e vídeo de apresentação.

0,5

Total

 

5,0

