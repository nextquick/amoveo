-module(oracle_new_tx).
-export([go/3, make/8, from/1, id/1, governance/1]).
-record(oracle_new, {from = 0, 
		     nonce = 0, 
		     fee = 0, 
		     question = <<>>, 
		     start, 
		     id, 
		     %recent_price, %if this is a governance oracle, or if it is asking a question, then we need to reference another oracle that closed recently with the state "bad". We reference it so we know the current price of shares.
		     difficulty = 0, 
		     governance, 
		     governance_amount}).
%This asks the oracle a question.
%The oracle can only answer true/false questions.
%Running the oracle costs a fee which is used as a reward to get people to use the oracle.
%The fact that an oracle exists is recorded on the blockchain in a way that is accessible to the VM. So we can use channels to make smart contracts to raise funds to run the oracle.
%The entire text of the question is written into the transaction, but only the hash of the text is stored into a consensus state merkel tree.
%The oracle has a start-date written in it. Trading doesn't start until the start-date.
%The oracle can be published before we know the outcome of the question, that way the oracle id can be used to make channel contracts that bet on the eventual outcome of the oracle.
from(X) -> X#oracle_new.from.
id(X) -> X#oracle_new.id.
governance(X) -> X#oracle_new.governance.
make(From, Fee, Question, Start, ID, Governance, GovAmount, Trees) ->
    Accounts = trees:accounts(Trees),
    {_, Acc, _Proof} = accounts:get(From, Accounts),
    Tx = #oracle_new{from = From, nonce = accounts:nonce(Acc) + 1, fee = Fee, question = Question, start = Start, id = ID, governance = Governance, governance_amount = GovAmount},
    {Tx, []}.
go(Tx, Dict, NewHeight) ->
    Gov = Tx#oracle_new.governance,
    GovAmount = Tx#oracle_new.governance_amount,
    GCL = governance:dict_get_value(governance_change_limit, Dict),
    true = GovAmount > -1,
    true = GovAmount < GCL,
    Question = Tx#oracle_new.question,
    Dict2 = 
        case Gov of
            0 ->
                GovAmount = 0,
                Dict;
            G ->
                true = GovAmount > 0,
		Question = <<"">>,
                GVar = governance:dict_get(G, Dict),
                false = governance:is_locked(GVar),
                governance:dict_lock(G, Dict)
        end,
    ok = case Question of
             <<"">> -> ok;
             Q ->
                 MQS = governance:dict_get_value(maximum_question_size, Dict2),
                 true = size(Q) < MQS,
                 0 = GovAmount,
                 ok
         end,
    From = Tx#oracle_new.from,
    OIL = governance:dict_get_value(oracle_initial_liquidity, Dict2),
    Facc = accounts:dict_update(From, Dict2, -Tx#oracle_new.fee-OIL, Tx#oracle_new.nonce, NewHeight),
    Dict3 = accounts:dict_write(Facc, Dict2),
    Starts = Tx#oracle_new.start,
    %OFL = governance:dict_get_value(oracle_future_limit, Dict3),
    %true = (Starts - NewHeight) < OFL,
    ID = Tx#oracle_new.id,
    Question = Tx#oracle_new.question,
    true = is_binary(Question),
    QH = hash:doit(Question),
    oracle_questions:store(QH, Question),
    Diff = Tx#oracle_new.difficulty,
    ON = oracles:dict_new(ID, QH, Starts, From, Gov, GovAmount, Dict),
    empty = oracles:dict_get(ID, Dict),
    Dict4 = oracles:dict_write(ON, Dict3).
    
    
