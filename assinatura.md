Você pode criar uma nova assinatura no Dashboard ou com a API. Toda vez que você cria uma assinatura, um evento é acionado. Ouça esses eventos com os endpoints do Webhook e certifique-se de que sua integração os trate adequadamente.

Opcionalmente, crie um período de teste que não exija pagamento pela assinatura. Neste caso, ostatus étestando. Quando o teste termina, a assinatura passa paraativo e a Stripe cobra o cliente inscrito.

Comportamento do pagamento
Defina o payment_behavior de uma assinatura como default_incomplete para ajudar a lidar com pagamentos com falha e fluxos de pagamento complexos, como o 3DS. Isso criará assinaturas com status incompleto se o pagamento for necessário, o que permite que você recolha e confirme as informações de pagamento para ativar a assinatura mais tarde.

Quando você define payment_behavior para:

allow_incomplete: A Stripe imediatamente tenta recolher pagamento na fatura. Se o pagamento falhar, o status da assinatura muda paraincompleto.
error_if_incomplete: Se o pagamento falhar, a criação da assinatura falha completamente.
Subscriptions que você cria no Dashboard adotam o comportamento de pagamento apropriado, dependendo da forma de pagamento.

Tratar a fatura
Ao criar uma assinatura, a Stripe cria automaticamente uma fatura com o status aberta. Seu cliente tem cerca de 23 horas para efetuar um pagamento. Nesse período, o status da assinatura permanece incompleta e o status da fatura permanece como aberta.

Esse intervalo de 23 horas existe porque o primeiro pagamento de uma assinatura geralmente é feito com o cliente on-session. Se o cliente retornar ao aplicativo após 23 horas, crie outra assinatura para ele.

O cliente paga
Se o cliente pagar a fatura, a assinatura será atualizada para active e a fatura, para paid. Se ele não efetuar o pagamento, a assinatura será atualizada para incomplete_expired e a fatura se tornará void.

Para confirmar se a fatura foi paga:

Configure um endpoint de webhook ou outro tipo de destino de evento e ouça o evento invoice.paid.
Verifique manualmente o objeto de assinatura e procure subscription.status=active. O status muda para active quando a fatura é paga por uma cobrança automática ou manualmente pelo cliente.
Para obter mais detalhes, consulte Status de assinatura e Status de pagamento.

Provisionar acesso ao seu produto
Ao criar uma assinatura para um cliente, você cria um direito ativo para cada recurso associado a esse produto. Quando um cliente acessa seus serviços, use os direitos ativos dele para conceder acesso aos recursos incluídos na assinatura.

Como alternativa, você pode rastrear assinaturas ativas com eventos de webhook e provisionar o produto para o cliente com base nessa atividade.

Atualizar a assinatura
Você pode modificar as assinaturas existentes conforme necessário, sem precisar cancelá-las e recriá-las. Algumas das alterações mais significativas que você pode fazer são upgrade ou downgrade do preço da assinatura ou pausa na cobrança do pagamento de uma assinatura ativa.

Você pode monitorar os eventos da assinatura com endpoints de Webhook para saber se houve alterações na assinatura. Por exemplo, você poderá enviar um e-mail a um cliente se um pagamento falhar ou revogar o acesso de um cliente quando ele cancelar a assinatura.

Em integrações do Stripe Checkout, você não poderá atualizar a assinatura ou sua fatura se a assinatura da sessão estiver incomplete. Você pode ouvir o evento checkout.session.completed para fazer a atualização após a conclusão da sessão. Você também poderá expirar a sessão se desejar cancelar a assinatura da sessão, anular a fatura da assinatura ou marcar a fatura como incobrável.

Atualizar a primeira fatura
Você poderá atualizar a primeira fatura de uma assinatura se collection_method for send_invoice. Após a criação da fatura, você tem uma hora para fazer atualizações em valores, itens, descrição, metadados e assim por diante. Não será possível atualizar a fatura depois que ela for finalizada e enviada ao cliente para pagamento.

A primeira fatura de uma assinatura com ocollection_method definido como charge_automatically é finalizado e cobrado imediatamente. Você não pode atualizar a primeira fatura antes de finalizá-la, mas pode atualizar as faturas subsequentes para renovações de assinatura.

Você também não pode atualizar a primeira fatura para agendamentos de assinatura. A primeira fatura está sempre aberta, independentemente do método de cobrança.

Lidar com assinaturas não pagas
Para assinaturas com faturas não pagas, as faturas não pagas permanecem abertas, mas novas tentativas de pagamento são suspensas. A assinatura continua gerando faturas a cada período de cobrança, que permanecem no estado draft. Para reativar a assinatura:

Colete novos dados de pagamento, se necessário.
Habilite a cobrança automática definindo o auto_advance como true em faturas provisórias.
Finalize e pague as faturas abertas. O pagamento da fatura não anulada mais recente antes da data de vencimento atualiza o status da assinatura para active.
As faturas marcadas como incobráveis mantêm a assinatura subjacente active. A Stripe ignora faturas anuladas ao determinar o status da assinatura e usa a fatura não anulada mais recente.

O status da assinatura não paga depende das suas configurações de falha de pagamento no Dashboard.

Cancelar a assinatura
Você pode cancelar uma assinatura a qualquer momento, inclusive no final de um ciclo de faturamento ou após um número definido de ciclos de faturamento.

Por padrão, cancelar uma assinatura desabilita a criação de novas faturas e interrompe a cobrança automática de todas as faturas pendentes da assinatura. Também exclui a assinatura e você não poderá mais atualizá-la ou seus metadados. Se o seu cliente quiser assinar novamente, você precisará coletar novas informações de pagamento e criar uma nova assinatura.

Status da assinatura
As assinaturas podem ter os status a seguir. As ações a serem executadas em uma assinatura dependem do seu status.

Status	Descrição
trialing	A assinatura está em período de avaliação e você pode fornecer seu produto com segurança para o cliente. A assinatura muda automaticamente para active quando o cliente faz o primeiro pagamento.
active	A assinatura está em bom estado. Para assinaturaspast_due, pagar a fatura associada mais recente ou marcá-la como não coletável muda as assinatura para ativo. Note queativo não indica que todas as faturas pendentes associadas a assinatura foram pagas. Você pode deixar outras faturas pendentes abertas para pagamento, marcá-las como não cobráveis ou anulá-las conforme achar melhor.
incomplete	O cliente precisa fazer um pagamento em até 23 horas para ativar a assinatura. Ou o pagamento demanda atenção, como autenticação do cliente. As assinaturas também podem ficar incomplete se houver um pagamento pendente e o status do PaymentIntent for processing.
incomplete_expired	O pagamento inicial da assinatura falhou e o cliente não concretizou o pagamento em 23 horas após a criação da assinatura. Essas assinaturas não cobram os clientes. Esse status existe para que você acompanhe os clientes que não ativaram as assinaturas.
past_due	O pagamento da última fatura finalizada falhou ou não foi tentado. A assinatura continua a criar faturas. As configurações de assinatura do seu Dashboard determinam o próximo status da assinatura. Se a fatura ainda não tiver sido paga depois de todos os Smart Retries tentados, você poderá configurar a assinatura de modo a passar para canceled, unpaid ou deixá-la como past_due. Para reativar a assinatura, peça para o cliente pagar a fatura mais recente. O status da assinatura torna-se active independentemente de o pagamento ser feito antes ou depois da data de vencimento da fatura mais recente.
canceled	A assinatura foi cancelada. Durante o cancelamento, a cobrança automática de todas as faturas não pagas é desativada (auto_advance=false). Este estado é terminal e não pode ser atualizado.
unpaid	A fatura mais recente não foi paga, mas a assinatura continua ativa. A última fatura está aberta e as faturas continuam a ser geradas, mas não são feitas tentativas de pagamento. Suspensa o acesso ao seu produto quando a assinatura estiver unpaid, porque as tentativas de pagamento já foram feitas enquanto estava em past_due. Para colocar a assinatura no modo active, pague a fatura mais recente antes do vencimento.
paused	A período de avaliação da assinatura terminou sem uma forma de pagamento padrão e o trial_settings.end_behavior.missing_payment_method está definido como pause. Não são criadas mais faturas para a assinatura. Após vincular uma forma de pagamento padrão ao cliente, você pode reiniciar a assinatura.
Status de pagamento
Um PaymentIntent rastreia o ciclo de vida de cada pagamento. Sempre que o pagamento de uma assinatura vence, a Stripe gera uma fatura e um PaymentIntent. O ID do PaymentIntent é anexado à fatura e você pode acessá-lo a partir dos objetos Fatura e Assinatura.

O status do PaymentIntent afeta o status da fatura e da assinatura. Veja como os diferentes resultados de um pagamento são mapeados para os diferentes status:

Resultado do pagamento	Status do PaymentIntent	Status da fatura	Status da assinatura
Sucesso	succeeded	paid	active
Falhas por erro no cartão	requires_payment_method	open	incomplete
Falhas por autenticação	requires_action	open	incomplete
Formas de pagamento assíncronas, como o ACH Direct Debit, tratam as transições de status de assinatura de forma diferente dos métodos de pagamento imediatos. Quando você usa um método de pagamento assíncrono, uma assinatura pode passar diretamente para o status ativa após a criação e ignorar o status incompleta. Se o pagamento falhar mais tarde, a Stripe anula a fatura, mas a assinatura permanece ativa. Considere esse comportamento ao definir seu controle de acesso e sua lógica de novas tentativas.

As próximas seções explicam esses status e o que fazer para cada um deles.

Pagamento bem-sucedido
Quando o pagamento do cliente é realizado:

O status do PaymentIntent passa para succeeded.
O status da assinatura é active.
O status da fatura é paid.
A Stripe envia um evento invoice.paid aos seus endpoints de webhook configurados.
Para as formas de pagamento com períodos de processamento mais longos, as assinaturas são ativadas imediatamente. Nesses casos, o status do PaymentIntent pode ser processing para uma assinatura active até que o pagamento seja realizado.

Agora que sua assinatura está ativada, provisione acesso ao produto.

Exige forma de pagamento
Se o pagamento falhar devido a um erro do cartão, como um pagamento recusado:

O status do PaymentIntent é requires_payment_method.
O status da assinatura é incomplete.
O status da fatura é open.
Para gerenciar esses cenários:

Avise o cliente.
Colete novas informações de pagamento e confirme o PaymentIntent.
Atualize a forma de pagamento padrão na assinatura.
A Stripe tenta o pagamento novamente usando o Smart Retries ou com base nas suas regras de nova tentativa personalizadas.
Use o evento invoice.payment_failed para monitorar eventos de falha de pagamento de assinatura e atualizações de novas tentativas. Após uma tentativa de pagamento em uma fatura, seu valor next_payment_attempt é definido usando as configurações de assinatura atuais no Dashboard.
Saiba como gerenciar falhas de pagamento de assinaturas.

Exige ação
Algumas formas de pagamento exigem a autenticação do cliente com o 3D Secure (3DS) para concluir o processo de pagamento. O 3DS conclui o processo de autenticação. A exigência de autenticação de uma forma de pagamento depende das suas regras do Radar e do banco emissor do cartão.

Se o pagamento falhar porque o cliente precisa autenticar um pagamento:

O status do PaymentIntent é requires_action.
O status da assinatura é incomplete.
O status da fatura é open.
Para gerenciar esses cenários:

Monitore a notificação de evento invoice.payment_action_required com endpoints de webhook. Isso indica que a autenticação é necessária.
Avise o cliente de que a autenticação é necessária.
Recupere o segredo do cliente para o PaymentIntent e passe-o em uma chamada para stripe.ConfirmCardPayment. Isso exibe um modal de autenticação para seus clientes, faz a tentativa de pagamento, fecha o modal e devolve o contexto para sua inscrição.
Monitore o evento invoice.paid no seu destino de evento para verificar se o pagamento foi bem-sucedido. Os usuários podem sair do aplicativo antes do término de confirmCardPayment(). Verificar se o pagamento foi bem-sucedido permite provisionar corretamente seu produto.

https://docs.stripe.com/billing/subscriptions/overview
https://docs.stripe.com/billing/subscriptions/design-an-integration
https://docs.stripe.com/billing/customer
