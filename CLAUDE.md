# CLAUDE.md — natalsolidário

## Estado do projeto

- O projeto ainda não tem código-fonte, stack definida nem comandos de build, lint ou teste.
- Quando a stack for escolhida, atualize esta seção com: linguagem/framework, gerenciador de pacotes e os comandos reais de instalação, build, lint e teste.
- Até lá, não presuma comandos: verifique os manifestos (`package.json`, `pyproject.toml` etc.) antes de executar qualquer coisa.
- Ambiente de desenvolvimento: Windows 11, com Git Bash e PowerShell disponíveis.

## Regras gerais

- Leia os arquivos relevantes antes de editá-los e siga as convenções existentes.
- Faça alterações mínimas e focadas no pedido; evite refatorações não relacionadas.
- Nunca declare que um teste, build ou lint passou sem executá-lo e conferir o resultado.
- Não grave segredos, tokens ou credenciais em código, logs ou documentação.
- Não sobrescreva `.env`, credenciais, configurações ou trabalho existente sem necessidade justificada.
- Peça autorização antes de ações destrutivas, irreversíveis ou com efeito externo (apagar dados, migrar dados reais, publicar, chamar serviços de produção).

## Agentes do projeto (`.claude/agents/`)

| Agente | Quando acionar | Edita código? |
|---|---|---|
| `implementer` | Implementar funcionalidades, correções e melhorias | Sim |
| `debugger` | Investigar erros, falhas de teste e comportamento inesperado até a causa raiz | Só com evidência |
| `tester` | Identificar e executar testes, criar ou atualizar testes para as mudanças | Apenas testes |
| `code-reviewer` | Revisão independente, somente leitura, antes de concluir mudanças relevantes | Não |

Não existe agente orquestrador: a conversa principal coordena e dá a resposta final.

## Fluxo de trabalho

A delegação deve ser proporcional à complexidade, ao risco e ao benefício. Não acione todos os agentes em toda tarefa. Mudanças triviais (um ajuste de texto, uma linha) podem ser feitas diretamente pela conversa principal.

### Tarefas pequenas

1. A conversa principal compreende a solicitação.
2. O `implementer` (ou a conversa principal, se for trivial) realiza a alteração.
3. Os testes relevantes são executados.
4. O `code-reviewer` é acionado quando houver risco, mudança significativa ou pedido de revisão.
5. A conversa principal apresenta o resultado.

### Tarefas complexas

1. A conversa principal delimita o objetivo e os critérios de aceitação.
2. A conversa principal faz o planejamento (ou um agente `planner`, se for criado no futuro).
3. O `implementer` executa a implementação.
4. O `tester` valida os resultados.
5. O `code-reviewer` faz uma revisão independente.
6. Se houver defeitos, o `implementer` ou o `debugger` investiga e corrige.
7. Os testes afetados são executados novamente.
8. A conversa principal verifica os resultados e apresenta a conclusão.

### Alterações críticas

Vale para autenticação, autorização, dados pessoais, operações financeiras ou de doações, migrações e mudanças de alto impacto:

- Ampliar a revisão de segurança (sempre acionar o `code-reviewer`).
- Conferir o impacto sobre compatibilidade e dados existentes.
- Não executar operações destrutivas sem autorização.
- Exigir evidências das verificações realizadas (comandos e saídas reais).
- Explicitar os riscos residuais antes de concluir.

## Coordenação e delegação

- A conversa principal mantém a responsabilidade pela coordenação e pela resposta final, e confere o que os agentes relatam antes de repassar.
- Delegue explicitamente quando a especialização importar; não suponha que a delegação automática acontecerá.
- Ao delegar, envie contexto suficiente: objetivo, arquivos envolvidos, critérios de aceitação e restrições.
- Não coloque dois agentes editando os mesmos arquivos ao mesmo tempo, nem deixe um sobrescrever as alterações do outro.
- Use delegação paralela apenas para trabalho independente (análise de módulos diferentes, revisão sem edição).
- Não crie novos agentes quando os existentes forem suficientes.
