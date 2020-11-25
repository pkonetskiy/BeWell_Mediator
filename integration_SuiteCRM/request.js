/* 
 * BizForce 25.11.2020
 * Company: BizForce
 * Name: BeWell Mediator
 * version: 0.19 alpha
 */
const queryStringObj = require('./query').queryString;
class oneRequest{
    formatFiled={}
    noData=false
    elem={}
    items={}
    res={}
    queryString={}
    outString=[]
    colorBorder=''
    constructor(c,num){
        this.formatFiled=c.formatFiled;
        this.elem=c.resConfig[num];
        this.colorBorder=c.colorBorder;
    }
    init(robot,res){
        this.res=res;
        this.user={name:this.res.envelope.user.name,id:this.res.envelope.user.id,email:'',roomID:this.res.envelope.user.roomID};
        this.setAdditionParams();
    }
    setAdditionParams(){
        this.setTimeDate();
    }
    setTimeDate(){
        let text=this.res.envelope.message.text;
    }
    setActiveSession(id){
        let sts=this.elem.steps;
        for(let st in sts){
            sts[st].reqFields.session=id;
        }
    }
    initStep(i){
        let st=this.elem.steps[i];
        // если на шаге используется анализ текущего пользователя установить его значение
        if(typeof(st.currentUser)==='object'){
            // проверка наличия поля fieldID
            if(typeof(st.currentUser.fieldID)==='string'){
                // если поле присутсвует 
                let fieldID=st.currentUser.fieldID;
                // проверяется наличие полей из которых нужно ID CRM 
                if(typeof(st.currentUser.module)==='string'&&typeof(this.items[st.currentUser.module])==='object'&&typeof(st.currentUser.fieldName)==='string'){
                    let fieldName=st.currentUser.fieldName;
                    let module=st.currentUser.module;
                    // перебираются все полученные записи для соответсвующего модуля
                    // не обязательно из списка пользователей
                    for (let records in this.items[module]){
                        // берется соответсвие имени пользователя в чате и имени, указнном в соотвествующем поле в CRM 
                        if (this.items[module][records][fieldName]===this.user.name){
                            // при совпадении имени выбирается соответсвующее ID
                            this.elem.steps[i].currentUser.value=this.items[module][records][fieldID];
                            break;
                        }
                    }
                    return '';
                }else{
                    // если нехватает каких-то полей, формируется сообщение об ошибке
                    this.noData=true;
                    return {'errorConfig':[this.elem.res]};
                }
            }else{
                // если поле отсутствует берется имя пользователя из чата
                this.elem.steps[i].currentUser.value=this.res.envelope.user.name;
                return '';
            }
        }
    }
    setQueryFields(i){
        let step=this.elem.steps[i];
        if(typeof(this.items)!=='undefined' && typeof(step.queryFields)==='object'){
            this.queryString= new queryStringObj(step);
            let mess=this.queryString.createQuery();
            if(mess===''){
                this.elem.steps[i].reqFields.query=this.queryString.getQuery();
            }else{
                // если query вернуло сообщение об ошибке
                this.noData=true;
                return {'errorConfig':mess};
            }
        }
        return '';
    }
    /* 
     * Собирает и форматирует знаечния полей для вывода на экран
     * */
    setOutFields(i){
        this.outFields={};
        // взять список полей для форматирования
        let formatFields=this.elem.steps[i].formatFields;
        let moduleName='';
        // если не указан parent_type взять последнего загруженного объека
        if(typeof(this.elem.steps[i].parent_type)==='undefined'){
            let keys=Object.keys(this.items);
            moduleName=keys[keys.length - 1];
        }else{
            moduleName=this.elem.steps[i].parent_type;
        }
        // взять загруженные объекта выбранного модуля
        for(let item in this.items[moduleName]){
            this.outFields[item]={};
            // взять поля согласно списку форматирования
            for(let formatField in formatFields){
                let fn='';
                if(typeof(formatFields[formatField].name)==='undefined'){
                    fn=formatField;
                }else{
                    fn=formatFields[formatField].name;
                }
                if(typeof(formatFields[formatField].module)!=='undefined'&&typeof(formatFields[formatField].parent_id)!=='undefined'){
                    // если текущее поле из другого модуля 
                    // взять список записей другого модуля
                    let childModuleItems=this.items[formatFields[formatField].module];
                    // взять id поле родительского модуля
                    let nameParentID=formatFields[formatField].parent_id;
                    let findField=false;
                    // перебрать записи дочернего модуля
                    for(let childModuleItem in childModuleItems){
                        if(childModuleItems[childModuleItem].id===this.items[moduleName][item][nameParentID]){
                            // если id совпадает, то сохранить нужное поле
                            this.outFields[item][formatField]=childModuleItems[childModuleItem][fn];
                            // установить, что поле найдено
                            findField=true;
                            // прервать цикл после первого найденного совпадения
                            break;
                        }
                    }
                    if (!findField){
                        // если значение не найдено создать пустое поле
                       this.outFields[item][formatField]='';
                    }
                }else{
                    // если текущее поле этого модуля 
                    // взять это поле
                    this.outFields[item][formatField]=this.items[moduleName][item][fn];
                }
                // отформатировать поле если тип определен
                if(typeof(formatFields[formatField].type)!=='undefined'){
                    // получить имя функции для форматирования
                    let funcName=formatFields[formatField].type+'FormatField';
                    // проверить наличие этой функции
                    if (typeof(this[funcName])==='function'&&typeof(this.outFields[item][formatField])!=='undefined'){
                        // вызвать функцию и перезаписать поле согласно типу формата
                        this.outFields[item][formatField]=this[funcName](this.outFields[item][formatField]);
                    }
                }
            }
        }
    }
    // формат поля - день
    dateFormatField(v){
        if (typeof(this.formatFiled.date)==='object'){
            v=v+'.000Z';
            let date= new Date(v);
            let formatter = new Intl.DateTimeFormat(this.formatFiled.date.lang,this.formatFiled.date.format);
            v=formatter.format(date);
        }else{
            console.log('ERROR there is not object of type date');
        }
        return v;
    }
    // формат поля - ссылка
    linkFormatField(v){
        if (typeof(this.formatFiled.link)==='object'){
            let str=v.match(/^((?:[\w-]+)(?:\.[\w-]+)+)(?:[\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/);
            if (str!==null){
                v=this.formatFiled.link.prefix+str.input;
            }
        }else{
            console.log('ERROR there is not object of type link');
        }
        return v;
    }
    // формат поля - текст
    textFormatField(v){
        if (typeof(this.formatFiled.text)==='object'){
            for(let i in this.formatFiled.text.changes){
                v=v.replace(new RegExp(i,'g'),this.formatFiled.text.changes[i]);
            }
        }else{
            console.log('ERROR there is not object of type text');
        }
        return v;
    }
    // готовит массив для вывода
    setPrintFields(i){
        this.outString=[];
        let printFields=this.elem.steps[i].printFields;
        if(typeof(printFields.string)==='object'){
            let pFs=Object.values(printFields.string);
            let i=0;
            for(let item in this.outFields){
                this.outString.push('*#'+(++i)+'* - '+pFs.reduce((prev,outItem,ind,arr)=>{
                    prev=prev+'*'+outItem.label+'* '+'_'+this.outFields[item][outItem.field]+'_';
                    if(ind<(arr.length-1)){
                        prev=prev+'; ';
                    }
                    return prev;
                },''));
            }
        }else{
            if(typeof(printFields.block)==='object'){
                let i=0;
                for(let item in this.outFields){
                    for(let pb in printFields.block){
                        switch (pb) {
                            case 'name':
                                this.outString.push({
                                    msg:'*#'+(++i)+'* - '+printFields.block[pb].label+' '+'_'+this.outFields[item][printFields.block[pb].field]+'_'
                                });
                                break;
                            case 'link': 
                                this.outString.push({
                                    attachments: [{
                                        collapsed:true,
                                        color:this.colorBorder,
                                        title:this.outFields[item][printFields.block[pb].title],
                                        title_link:this.outFields[item][printFields.block[pb].title_link]
                                    }]
                                });;
                                break;
                            case 'fields': 
                                let arr=[];
                                for(let f in printFields.block.fields){
                                    arr.push({
                                        title:printFields.block.fields[f].label,
                                        value:this.outFields[item][printFields.block.fields[f].field]
                                    },);
                                }
                                this.outString.push({
                                    attachments: [{
                                        collapsed:false,
                                        color:this.colorBorder,
                                        fields:arr
                                    }]
                                });;;
                                break;
                            case 'image_link': ;
                                break;
                        }
                    }
                    i++;
                }
            }else{
                return {'errorConfig':'printFields'};
            }
        }
        return '';
    }
}
module.exports={oneRequest};
