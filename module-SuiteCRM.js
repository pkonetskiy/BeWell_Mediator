/* 
 * BizForce 25.11.2020
 * Company: BizForce
 * Name: BeWell Mediator
 * version: 0.19 alpha
 */
const integrationCRM = require('./integration_SuiteCRM/integration').Integration;
const oneRequestCRM = require('./integration_SuiteCRM/request').oneRequest;
var integration=new integrationCRM();

// поэтапный вызов функций для формирования ответа на запрос
// циклический вызов функции необходим для ожидания получения данных от сервера
module.exports = (robot) => {
    var oneRequest={};
    for (let corRes in integration.resConfig){
        oneRequest[corRes] = new oneRequestCRM(integration,corRes);
        robot.respond(oneRequest[corRes].elem.res, (res) => {
            var soap = require('soap');
            var url = integration.url;
            res.reply(integration.autoAnswers.firstWait.toUser);
            // инициализация вызова soap
            soap.createClient(url, function(err, client) {
                // вызов функции для формирования данных
                // ассинхронный вызов связан с тем, что скрипт не ждет получения данных от сервера
                if(typeof(client)!=='undefined'){
                    oneRequest[corRes].init(robot,res);
                    integration.makeReplay(res,client,oneRequest[corRes],0,robot);
                }else{
                    console.log('ERROR code connection to server: "'+err.code+'"');
                }
            });
        });
    }
};