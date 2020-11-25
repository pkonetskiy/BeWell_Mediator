/* 
 * BizForce 25.11.2020
 * Company: BizForce
 * Name: BeWell Mediator
 * version: 0.19 alpha
 */
class queryString {
    fields={}
    query=''
    currentUser=''
    conditionsDateTime={
        'today':0,'previousday':-1,'tomorrow':+1,'beforeweek':-7,'nextweek':+7
    }
    toDayStr=''
    startDay=''
    stopDay=''
    constructor(step){
        this.fields=step.queryFields;
        if(typeof(step.currentUser)==='object'){
            this.currentUser=step.currentUser.value;
        }
    }
    setDays(num,k){
        // подготовка массивов для начальной и конечной даты и символов "<" и ">"
        this.fields[k].value=[];
        this.fields[k].mark=[];
        // текущая дата
        let date=new Date();
        this.toDayStr=date.getFullYear()+'-'+Math.abs(date.getMonth()+1)+'-'+date.getDate();
        // изменение даты в соответсвии с выбранным значение объекта "conditionsDateTime"
        let day=date.getFullYear()+'-'+Math.abs(date.getMonth()+1)+'-'+Math.abs(date.getDate()+num);
        // установка параметров в соответсвии с выбраннм периодом: прошлый, будущий, сегодняшняя дата
        if(num!==0){
            this.fields[k].mark[0]='>';
            this.fields[k].mark[1]='<';
            if(num<0){
                this.fields[k].value[0]=day;
                this.fields[k].value[1]=this.toDayStr;
            }else{
                if(num>0){
                    this.fields[k].value[0]=this.toDayStr;
                    this.fields[k].value[1]=day;
                }
            }
        }else{
            this.fields[k].mark[0]='';
            this.fields[k].value[0]=this.toDayStr;
        }
    }
    createQuery(){
        let queryVal=[];
        // перебор всех запросов из объекта "queryFields" config файла для текущего шага - "step"
        for(let k in this.fields){
            // определение типа запроса
            switch(this.fields[k].type){
                case 'currentUser':
                    this.fields[k].value=this.currentUser;
                    queryVal.push(this.setCommandLIKE(this.fields[k]));
                    break;
                case 'datetime':
                    let condition=this.fields[k].condition;
                    if(Object.keys(this.conditionsDateTime).indexOf(condition)>-1){
                        this.setDays(this.conditionsDateTime[condition],k);
                        let querySubArr=[];
                        for(let n=0;this.fields[k].mark.length>n;n++){
                            let mass={
                                table:this.fields[k].table,
                                field:this.fields[k].field,
                                mark:this.fields[k].mark[n],
                                value:this.fields[k].value[n]
                            };
                            querySubArr.push(this.setCommandCONDITION(mass));
                        }
                        queryVal.push(this.setCommandAND(querySubArr));
                    };
                    break;
                case 'list':
                    if(typeof(this.fields[k].value)==='string'){
                        let v=this.fields[k].value;
                        this.fields[k].value=[];
                        this.fields[k].value.push(v);
                    };
                    queryVal.push(this.setCommandIN(this.fields[k]));
                    break;
                default:
                    break;
            }
        }
        this.query=this.setCommandAND(queryVal);
        return '';
    }
    // возврат текущего значения 
    getQuery(){
        if(typeof(this.query)!=='string'){
            this.query='';
        }
        return this.query;
    }
    setCommandIN(mass){
        let queryStr=' '+mass.table+'.'+mass.field+' IN (';
        let l=mass.value.length-1;
        for(let k=0;l>=k;k++){
            queryStr=queryStr+'"'+mass.value[k]+'"';
            if(k<l){
                queryStr=queryStr+',';
            }
        }
        queryStr=queryStr+')';
        return queryStr;
    }
    setCommandLIKE(mass){
        return ' '+mass.table+'.'+mass.field+' LIKE '+'"'+mass.value+'"';
    }
    setCommandCONDITION(mass){
        return ' '+mass.table+'.'+mass.field+mass.mark+'='+'"'+mass.value+'"';
    }
    setCommandAND(mass){
        let val='(';
        for(let k=0;mass.length>k;k++){
            val=val+mass[k];
            if((mass.length-1)!==k){
                val=val+' AND ';
            }
        }
        val=val+')';
        return val;
    }
};
module.exports={queryString};

