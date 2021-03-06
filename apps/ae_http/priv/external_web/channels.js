
var channel_manager = {};
channels1();
function channel_manager_read(x) {
    var y = channel_manager[x];
    if (y == undefined) {
        return undefined;
    } else {
        return JSON.parse(JSON.stringify(y));
    }
}
function new_cd(me, them, ssme, ssthem, cid) {
    return {"me": me, "them": them, "ssme": ssme, "ssthem": ssthem, "cid":cid};
}
function new_ss(code, prove, meta) {
    if (meta == undefined) {
        meta = 0;
    }
    return {"code": code, "prove": prove, "meta": meta};
}
function channels1() {
    var channel_title = document.createElement("h3");
    channel_title.innerHTML = get_words("channel");
    document.body.appendChild(channel_title);
    //check if we have a chnnel with the server yet.
    //if we don't, then give an interface for making one.
    var cd;
    var channels_div = document.createElement("div");
    document.body.append(channels_div);
    var channel_warning_div = document.createElement("div");
    channels_div.appendChild(channel_warning_div);
    var channel_interface_div = document.createElement("div");
    
    var load_button = document.createElement("input");
    load_button.type = "file";
    load_button.onchange = load_channels;
    channels_div.appendChild(load_button);

    channels_div.appendChild(document.createElement("br"));
    channels_div.appendChild(document.createElement("br"));
    var save_name = document.createElement("INPUT");
    save_name.type = "text";
    save_name.id = "channel_name";
    save_name.value = get_words("channel_state");
    //save_name.value = "amoveo_channel_state";
    var save_button = document.createElement("input");
    save_button.type = "button";
    //save_button.value = "save channel data to file";
    save_button.value = get_words("save_channel");
    save_button.onclick = save_channel_data;
    channels_div.appendChild(save_name);
    channels_div.appendChild(save_button);
    channels_div.appendChild(document.createElement("br"));
    channels_div.appendChild(document.createElement("br"));
    channels_div.appendChild(channel_interface_div);



    
    variable_public_get(["pubkey"], refresh_channels_interfaces);
    function make_channel_func(pubkey) {
        var spend_amount = document.getElementById("spend_amount");
        var amount = Math.floor(parseFloat(spend_amount.value, 10) * 100000000);
        var spend_delay = document.getElementById("spend_delay");
        var delay = parseInt(spend_delay.value, 10);
        var bal2 = amount - 1;
        spend_amount.value = "";
        var fee = 20;
        var acc1 = pubkey_64();
        var acc2 = pubkey;
        //let the server choose an unused cid for us.
        variable_public_get(["new_channel_tx", acc1, pubkey, amount, bal2,delay, fee], function(x) { make_channel_func2(x, amount, bal2, fee, acc1, acc2, delay); } );
    }
    function make_channel_func2(tx, amount, bal2, fee, acc1, acc2, delay) {
        //ask a server to make the tx for us, then check that all our data matches.
        console.log("make channel tx is ");
        console.log(tx);
        var amount0 = tx[5];
        var bal20 = tx[6];
        var fee0 = tx[3];
        var acc10 = tx[1];
        var acc20 = tx[2];
        var cid = tx[8];
        var delay0 = tx[7];
        if ((!(delay == delay0)) || (!(amount == amount0)) ||
            (!(bal2 == bal20)) || (!(fee == fee0)) ||
            (!(acc1 == acc10)) || (!(acc2 == acc20))) {
            console.log(JSON.stringify([[delay, delay0],
                                        [amount, amount0],
                                        [bal2, bal20],
                                        [fee, fee0],
                                        [acc1, acc10],
                                        [acc2, acc20]]));
            console.log("server edited the tx. aborting");
        } else {
            console.log("tx is valid");
            var spk = ["spk", acc1, acc2, [-6], 0, 0, cid, 0, 0, delay];
            /*-record(spk, {acc1,acc2, 
	      bets, space_gas, time_gas, 
	      cid, amount = 0, nonce = 0,
	      delay = 0
	      }).
            */
            var stx = sign_tx(tx);
            var sspk = sign_tx(spk);
            console.log("signed spk");
            console.log(JSON.stringify(sspk));
            variable_public_get(["new_channel", stx, sspk], channels3);
        }
    }
    function empty_ss() {
        return [];
    }
    function channels3(x) {
        console.log("channels3 ");
        console.log(x);
        var sstx = x[1];
        var s2spk = x[2];
        var tx = sstx[1];
        var cid = tx[9];
        var acc2 = tx[2];
        console.log("double signed tx ");
        console.log(JSON.stringify(sstx));
        //variable_public_get(["txs", [-6, sstx]], function(x) {});
        var spk = s2spk[1];
        var cd = new_cd(spk, s2spk, empty_ss(), empty_ss(), cid);
        //console.log("cd is ");
        //console.log(cd);
        channel_manager[acc2] = cd;
        channel_warning();
        variable_public_get(["pubkey"], refresh_channels_interfaces);//we already asked for the pubkey, it would be faster to reuse it instead of redownloading.
    }
    function channel_warning() {
        channel_warning_div.innerHTML = "channel state needs to be saved!~~~~~~~";
    }
    function save_channel_data() {
        var save_name = document.getElementById("channel_name");
        download(JSON.stringify(channel_manager), save_name.value, "text/plain");
        //channel_warning_div.innerHTML = "channel state is saved.";
        channel_warning_div.innerHTML = get_words("save_confirm");
    }
    function load_channels() {
        var file = (load_button.files)[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            channel_manager = JSON.parse(reader.result);
            //console.log("loaded channel manager");
            //console.log(JSON.stringify(channel_manager));
            variable_public_get(["pubkey"], refresh_channels_interfaces);//we already asked for the pubkey, it would be faster to reuse it instead of redownloading.
        }
        reader.readAsText(file);
    }
    function refresh_channels_interfaces(pubkey) {
        //console.log("server pubkey is ");
        //console.log(pubkey);
        var div = channel_interface_div;
        div.innerHTML = "";
        var v = channel_manager_read(pubkey);
        //console.log("v is ");
        //console.log(JSON.stringify(v));
        if (v == undefined) {
            var make_channel = document.createElement("div");
            //console.log("give interface for making channels.");
            div.appendChild(make_channel);
            var height_button = document.createElement("BUTTON");
            var button_text_node = document.createTextNode(get_words("make_channel"));
            height_button.appendChild(button_text_node);
            height_button.onclick = function() { return make_channel_func(pubkey) };
            make_channel.appendChild(height_button);
            
            var spend_amount = document.createElement("INPUT");
            spend_amount.setAttribute("type", "text");
            spend_amount.id = "spend_amount";
            var amount_info = document.createElement("h8");
            amount_info.innerHTML = get_words("amount_channel");
            make_channel.appendChild(amount_info);
            make_channel.appendChild(spend_amount);

            var spend_delay = document.createElement("INPUT");
            spend_delay.setAttribute("type", "text");
            spend_delay.id = "spend_delay";
            var delay_info = document.createElement("h8");
            delay_info.innerHTML = get_words("channel_delay");
            make_channel.appendChild(delay_info);
            make_channel.appendChild(spend_delay);
        } else {

            console.log("give interface for making bets in channels.");
            var balance_div = document.createElement("div");
            balance_div.id = "balance_div";

            balance_div.innerHTML = get_words("your_balance").concat(get_words("unknown"));
            div.appendChild(balance_div);

            var channel_balance_button = document.createElement("input");
            channel_balance_button.type = "button";
            channel_balance_button.value = get_words("check_channel");
            channel_balance_button.onclick = function() {refresh_balance(pubkey);};
            div.appendChild(channel_balance_button);
            div.appendChild(document.createElement("br"));
            var market_title = document.createElement("h3");
            market_title.innerHTML = get_words("markets");
            div.appendChild(market_title);

            var market_link = document.createElement("a");
            market_link.innerHTML = get_words("markets_link");
            market_link.href = "http://146.185.142.103:8080/explorer.html";
            div.appendChild(market_link);
            div.appendChild(document.createElement("br"));

            var price = document.createElement("INPUT");
            price.setAttribute("type", "text");
            var price_info = document.createElement("h8");
            price_info.innerHTML = get_words("price").concat(" (between 0 and 100) : ");
            div.appendChild(price_info);
            div.appendChild(price);

            var trade_type = document.createElement("INPUT");
            trade_type.setAttribute("type", "text");
            var trade_type_info = document.createElement("h8");
            trade_type_info.innerHTML = get_words("trade_type").concat(get_words("true")).concat(get_words("false"));
            div.appendChild(trade_type_info);
            div.appendChild(trade_type);

            var amount = document.createElement("INPUT");
            amount.setAttribute("type", "text");
            var amount_info = document.createElement("h8");
            amount_info.innerHTML = get_words("amount").concat(": ");
            div.appendChild(amount_info);
            div.appendChild(amount);

            var oid = document.createElement("INPUT");
            oid.setAttribute("type", "text");
            var oid_info = document.createElement("h8");
            oid_info.innerHTML = get_words("market").concat(": ");
            div.appendChild(oid_info);
            div.appendChild(oid);

            var button = document.createElement("BUTTON");
            button.id = "button";
            var buttonText = document.createTextNode(get_words("make_bet"));
            button.appendChild(buttonText);
            button.onclick = make_bet;
            div.appendChild(button);

            div.appendChild(document.createElement("br"));
            var bet_update_button = document.createElement("input");
            bet_update_button.type = "button";
            bet_update_button.value = get_words("finalize_bets");
            bet_update_button.onclick = function() {
                //var chalang_object = chalang();
                chalang_object.pull_channel_state();
                variable_public_get(["pubkey"], refresh_channels_interfaces);
            };
            div.appendChild(bet_update_button);
            div.appendChild(document.createElement("br"));
            div.appendChild(document.createElement("br"));
            var combine_cancel_button = document.createElement("input");
            combine_cancel_button.type = "button";
            combine_cancel_button.value = get_words("gather_bets");
            combine_cancel_button.onclick = function() {
                variable_public_get(["pubkey"], combine_cancel_object.main);
            }
            div.appendChild(combine_cancel_button);
            div.appendChild(document.createElement("br"));
            div.appendChild(document.createElement("br"));

            var list_bets_button = document.createElement("input");
            list_bets_button.type = "button";
            list_bets_button.value = get_words("refresh_bets");
            list_bets_button.onclick = outstanding_bets2;
            
            div.appendChild(list_bets_button);
            div.appendChild(document.createElement("br"));
            

            function make_bet() {
                //server's pubkey is pubkey.
                var oid_final = parseInt(oid.value, 10);
                variable_public_get(["market_data", oid_final], make_bet2);
            }
            function make_bet2(l) {
                var price_final = Math.floor(100 * parseFloat(price.value, 10));
                var type_final;
                var ttv = trade_type.value;
                if ((ttv == "true") ||
                    (ttv == 1) ||
                    (ttv == "cierto") ||
                    (ttv == "lon") ||
                    (ttv == "真正") ||
                    (ttv == "既不是")) {
                    type_final = 1;
                } else if ((ttv == "false") ||
                           (ttv == 0) ||
                           (ttv == 2) ||
                           (ttv == "falso") ||
                           (ttv == "lon ala") ||
                           (ttv == "也不是") ||
                           (ttv == "假")) {
                    type_final = 2;
                }
                var amount_final = Math.floor(parseFloat(amount.value, 10) * 100000000);
                var oid_final = parseInt(oid.value, 10);
                var fee = 20
                console.log("expires, pubkey, period");
                console.log(JSON.stringify(l));
                //pubkey is server id.
                var expires = l[1];
                var server_pubkey = l[2];
                var period = l[3];
                var sc = market_contract(type_final, expires, price_final, server_pubkey, period, amount_final, oid_final, top_header[1]);

                
                var cd = channel_manager_read(pubkey);
                var spk = market_trade(cd, amount_final, price_final, sc, pubkey, oid_final);
                var sspk = sign_tx(spk);
                console.log("signed spk");
                console.log(JSON.stringify(sspk));
                var msg = ["trade", pubkey_64(), price_final, type_final, amount_final, oid_final, sspk, fee];
                return variable_public_get(msg, function(x) {
                    make_bet3(x, sspk, server_pubkey, oid_final);
                });
            }
            function make_bet3(sspk2, sspk, server_pubkey, oid_final) {
                //check that the signature is valid.
                var hspk2 = JSON.stringify(sspk2[1]);
                var hspk = JSON.stringify(sspk[1]);
                if (hspk2 == hspk) { //make sure that both spks match
                    var cd = channel_manager_read(server_pubkey);
                    cd.me = sspk[1];
                    cd.them = sspk2;
                    //var newss = {"code": [0,0,0,0,4], "prove":[]};
                    var newss = new_ss([0,0,0,0,4], [-6, ["oracles", oid_final]]);
                    //var newss = [0,0,0,0,4];
                    console.log("about to update channel manager after having made a bet");
                    console.log("cd.ssme currently is");
                    console.log(JSON.stringify(cd.ssme));
                    console.log(JSON.stringify(sspk[1]));
                    console.log(JSON.stringify(newss));
                    cd.ssme = ([newss]).concat(cd.ssme);
                    cd.ssthem = ([newss]).concat(cd.ssthem);
                    channel_manager[server_pubkey] = cd;
                    amount.value = "";
                    channel_warning();
                } else {
                    console.log("error, we calculated the spk differently from the server. you calculated this: ");
                    console.log(JSON.stringify(sspk[1]));
                    console.log("the server calculated this: ");
                    console.log(JSON.stringify(sspk2[1]));
                }
            }
        }
    }
    function refresh_balance(pubkey) {
        //console.log(channel_manager[pubkey]);
        var cd = channel_manager_read(pubkey);
        var trie_key = cd.me[7];//channel id, cid
        var top_hash = hash(serialize_header(top_header));

        verify_callback("channels", trie_key, function(val) {
            var balance_div = document.getElementById("balance_div");
            var spk = cd.them[1];
            var amount = spk[7];
            var betAmount = sum_bets(spk[3]);

            var mybalance = ((val[4] + amount)/ 100000000).toString();
            var serverbalance = ((val[5] - amount - betAmount) / 100000000).toString();
            balance_div.innerHTML = (get_words("your_balance").concat(": ")).concat(
                mybalance).concat(get_words("server_balance").concat(": ")).concat(
                    serverbalance);
        });
    }
    function sum_bets(bets) {
        var x = 0;
        for (var i = 1; i < bets.length; i++) {
            console.log("sum bets bet is ");
            console.log(JSON.stringify(bets[i][2]));
            x += bets[i][2];
        }
        return x;
    }
}         
