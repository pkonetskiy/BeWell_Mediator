/* 
 * BizForce 25.11.2020
 * Company: BizForce
 * Name: BeWell Mediator
 * version: 0.19 alpha
 */
const structRequst = require('./config').structRequst;
var soapcontrol=true;
var time=100;
var max_results=50;
function timeOutSOAP(integration,res,client,rS,i,robot){
    if (soapcontrol){
        integration.makeReplay(res,client,rS,i,robot);
    }else{
        setTimeout(timeOutSOAP, time, integration, res,client,rS,i,robot);
    }
}
function setItems(result,rSstep){
    let itemsList=[];
    // если 1 запись, то она приходит в виде готового объекта
    // если несколько записей, то они приходят в виде массива объектов
    // создание верменного массива из полученных данных 
    if (typeof(result.return.entry_list.item.length)==='undefined'){
        itemsList[0]=result.return.entry_list.item;
    }else{
        let k=0;
        for(let item in result.return.entry_list.item){
            itemsList[k]=result.return.entry_list.item[item];
            k++;
        }
    }
    // извлечение каждой записи
    let rFields=Object.keys(rSstep.resultFields);
    let fieldsValues={};
    for(let j=0;j<itemsList.length;j++){
        let items=itemsList[j].name_value_list.item;
        let d={};
        // извлечение каждого поля
        for (let it=0;it<items.length;it++){
            // сохранение только нужных полей
            if (rFields.indexOf(items[it].name['$value'])>=0){
                let k=items[it].name['$value'];
                let v=items[it].value['$value'];
                d[k]=v;
            }
        }
        fieldsValues[j]=d;
    }
    return fieldsValues;
};
class Integration {
    res={};
    resConfig={}
    login={
        func:'login',
        reqFields:structRequst.server.login,
        resultFields:{'id':''}
    }
    logout={
        func:'logout',
        reqFields:{
            session:''
        }
    }
    url=''
    constructor(){
        let structTMP=structRequst.ress;
        for (let i in structTMP){
            this.resConfig[i]={'res':structTMP[i].res,'requestServer':structTMP[i].requestServer,'steps':{}};
            let position=1;
            if (structTMP[i].requestServer){
                this.resConfig[i].steps[0]={};
                this.resConfig[i].steps[0]=this.login;
                let l=Object.keys(structTMP[i].steps).length+position;
                this.resConfig[i].steps[l]={};
                this.resConfig[i].steps[l]=this.logout;
                for (let k in structTMP[i].steps){
                    this.resConfig[i].steps[position]={};
                    this.resConfig[i].steps[position]=structTMP[i].steps[k];
                    if (structTMP[i].requestServer){
                        let f={};
                        if(typeof(this.resConfig[i].steps[position].reqFields)!=='undefined'){
                            f=this.resConfig[i].steps[position].reqFields;
                        }
                        this.resConfig[i].steps[position].reqFields={};
                        this.resConfig[i].steps[position].reqFields.session='';
                        for (const [key, value] of Object.entries(f)) {
                            this.resConfig[i].steps[position].reqFields[key]=value;
                        }
                    }
                    position++;
                }
            }
        }
        this.autoAnswers=structRequst.autoAnswers;
        this.url=structRequst.server.url;
        this.formatFiled=structRequst.formatFiled;
        this.colorBorder=structRequst.colorBorder;
    }
    // !!! Доделать сообщения об ошибках !!!
    createError(mess,rS){
        for (let mes in mess){
            let str=' ';
            if(typeof(mess[mes])==='object'){
                for (let n; n<mess[mes].length;n++){
                    str=str+mess[mes][n]+' ';
                }
            }
            console.log(this.autoAnswers[mes].toConsole+str);
            rS.res.send(this.autoAnswers[mes].toUser);
        }
        
    }
    makeReplay(res,client,rS,i,robot) {
        let finish=false;
        if(typeof(rS.elem.steps[i].module)!=='undefined'){
            var moduleName=rS.elem.steps[i].module;
        }
        rS.initStep(i);
        switch(rS.elem.steps[i].func){
            // вход в CRM
            case 'login':
                this.loginCRM(client,rS,i);
                break;
            // выход из CRM
            case 'logout':
                finish=true;
                if (rS.noData){
                    res.send(this.autoAnswers.noDate.toUser);
                }
                this.logoutCRM(client,rS,i);
                break;
            // запрос данных из CRM
            case 'get_entry_list':
                // проверка на то, что предыдцщий запрос вернул данные, если он был
                if(!rS.noData){
                    this.getListCRM(client,rS,i,moduleName,res);
                } else{
                    i=Object.keys(rS.elem.steps).length-1;
                }
                break;
            // запрос данных из CRM
            case 'get_entries':
                // проверка на то, что предыдцщий запрос вернул данные, если он был
                if(!rS.noData){
                    this.getCRM(client,rS,i,moduleName);
                } else{
                    i=Object.keys(rS.elem.steps).length-1;
                }
                break;
            // вывод результата
            case 'stop':             
                // att формирует ответ в виде ссылки; возможно включание дополнительной ссылки на изображение
                res.reply('\n');
                rS.outFields={};
                if(typeof(rS.elem.steps[i].formatFields)==='object'){
                    rS.setOutFields(i);
                }else{
                    let keys=Object.keys(rS.items);
                    rS.outFields=rS.items[keys[keys.length-1]];
                }
                let mess=rS.setPrintFields(i);
                if(mess===''){
                    var str=rS.outString;
                    res.send(str);
                }else{
                    this.createError(mess,rS);
                }
                // максимум 40-42 строки, скорее всего есть ограничение на количество символов в ответе/сообщении.
                break;
            default:;
                break;
        }
        if (rS.elem.steps[i].func!=='logout'){
            i++;
        }
        if(!finish){
            timeOutSOAP(this,res,client,rS,i,robot);
        }else{
            // сохранение результата в переменной hubot для анализа при следующем запросе
            this.historySave(res, robot, str);
        }
    }
    // сохранение данных об истории запросов
    // структура: вложенных объектов {комната:{пользователь:{метка_времени:{информация_текущего_сообщения}}}}
    historySave(res, robot,str){
        const d = new Date();
        // запись о времени
        const t = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()} and ${d.getSeconds()} seconds`;
        // метка времени
        let Did=+d;
        // сохряняемые данные
        let req={'mesid':res.envelope.message.id,'mestext':res.envelope.message.text,'time':t,'str':str};
        // чтение текущего хранилища данных во временную переменную
        let brain=robot.brain.get('request');
        // проеверка на отсутсвие данных
        if (robot.brain.get('request')===null){
            brain={};
        }
        // временные переменные
        let room={};
        let user={};
        // наличие текущей комнаты в данных
        if(res.envelope.user.roomID in brain){
            // если комната есть, сохранение всех объектов во временную переменную
            room=brain[res.envelope.user.roomID];
            // наличие текущего пользователя в данных
            if(res.envelope.user.id in room){
                // если пользователь есть, сохранение всех объектов во временную переменную
                user=room[res.envelope.user.id];
            }
        }
        // запись информация_текущего_сообщения в пользователя
        user[Did]=req;
        // запись пользователя в комнату
        room[res.envelope.user.id]=user;
        // запись комнаты во временную переменную
        brain[res.envelope.user.roomID]=room;
        // запись переменной в хранилище данных
        robot.brain.set('request',brain);
    }
    //открытие сессии с сервером
    loginCRM(client,rS,i) {
        let rSstep=rS.elem.steps[i];
        // включение переключателя контроля работы функции, так как она работает в ассинхронном режиме
        soapcontrol=false;
        // отправка логина и пароля; функция работает в фоновом режиме
        client.login(rSstep.reqFields, function (err, result){
            // сохранение идентификатора сессии
            for(let k in rSstep.resultFields){
                let t=result.return[k];
                rS.setActiveSession(t['$value']);
            };
            // удаление контроля работы функии, так как ответ от сервера получен
            soapcontrol=true;
        });
    }
    // закрытие сессии с сервером
    logoutCRM(client,rS,i) {
        let rSstep=rS.elem.steps[i];
        // включение переключателя контроля работы функции, так как она работает в ассинхронном режиме
        soapcontrol=false;
        // отправка идентификатора для закрытия; функция работает в фоновом режиме
        client.logout(rSstep.reqFields, function (err, result){
            // удаление контроля работы функии, так как ответ от сервера получен
            soapcontrol=true;
        });
    }
    // отправка запроса не сервер для получения каждой записи связанной со списком
    getCRM(client,rS,i,moduleName) {
        let rSstep=rS.elem.steps[i];
        // включение переключателя контроля работы функции, так как она работает в ассинхронном режиме
        soapcontrol=false;
        // установить модуль для запроса
        rSstep.reqFields.module_name=rSstep.module;
        // создание объекта для списка id
        rSstep.reqFields.ids={};
        // получить id текущего модуля из поля родительского модуля
        let idNmae=rSstep.parent_id;
        // получить данные родительского модуля
        let resultsParent=rS.items[rSstep.parent_type];
        for(let result in resultsParent){
            // проверить что в родительском модуле поле с id текущего не пустое
            if(typeof(resultsParent[result][idNmae])==='string'){
                // записать все id текущего модуля из объекта в массив
                let ids=Object.values(rSstep.reqFields.ids);
                // сравнить, что текущего id еще нет в выбранных
                if(ids.indexOf(resultsParent[result][idNmae],0)===-1){
                    // сформировать из id ключ 
                    let arr=resultsParent[result][idNmae].match(/([\w\d]+)/g);
                    let keyName='id';
                    for(let k=0; k<arr.length;k++){
                        keyName=keyName+arr[k];
                    }
                    // записать текущий id в список
                    rSstep.reqFields.ids[keyName]=resultsParent[result][idNmae];
                }
            }
        }
        // создание объекта для списка получаемых полей
        rSstep.reqFields.select_fields={};
        //установить список получаемых полей
        for (let nameField in rSstep.resultFields){
            rSstep.reqFields.select_fields[nameField]=nameField;
        }
        rSstep.reqFields.link_name_to_fields_array={};
        // soap запрос на получение списка записей по списку id
        // функция работает в фоновом режиме
        client.get_entries(rSstep.reqFields, function (err, result){
            // проверка, что результат не пустой
            if (typeof(result.return.entry_list.item)==='object'){
                // извлечение конкретных полей с данными
                rS.items[moduleName]={};
                rS.items[moduleName]=setItems(result,rSstep);
            }else{
                rS.noData=true;
            }
            // удаление контроля работы функии, так как ответ от сервера получен
            soapcontrol=true;
        });
    }
    // отправка запроса не сервер для получения списка записей
    getListCRM(client,rS,i,moduleName,res) {
        let rSstep=rS.elem.steps[i];
        // установить модуль для запроса
        rSstep.reqFields.module_name=rSstep.module;
        // установить строку запроса к базе данных
        rSstep.reqFields.query='';
        // запрос для заполнения query
        let mess=rS.setQueryFields(i);
        if(mess===''){
            rSstep.reqFields.order_by='';
            rSstep.reqFields.offset='';
            // создание объекта для списка получаемых полей
            rSstep.reqFields.select_fields={};
            //установить список получаемых полей
            for (let nameField in rSstep.resultFields){
                rSstep.reqFields.select_fields[nameField]=nameField;
            }
            rSstep.reqFields.link_name_to_fields_array='';
            if(typeof(rSstep.max_results)==='number'){
                rSstep.reqFields.max_results=rSstep.max_results;
            }else{
                rSstep.reqFields.max_results=max_results;
            }
            // включение переключателя контроля работы функции, так как она работает в ассинхронном режиме
            soapcontrol=false;
            // soap запрос на получение списка записей модуля по определенному условию в query
            // функция работает в фоновом режиме
            client.get_entry_list(rSstep.reqFields, function (err, result){
                // проверка, что результат не пустой
                if (typeof(result.return.entry_list.item)==='object'){
                    // извлечение конкретных полей с данными
                    rS.items[moduleName]={};
                    rS.items[moduleName]=setItems(result,rSstep);
                }else{
    //                delete rS.items;
                    rS.noData=true;
                }
                // удаление контроля работы функии, так как ответ от сервера получен
                soapcontrol=true;
            });
        }else{
            this.createError(mess,rS);
        }
    }
};
module.exports={Integration};

