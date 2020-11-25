/* 
 * BizForce 25.11.2020
 * Company: BizForce
 * Name: BeWell Mediator
 * version: 0.19 alpha
 * 
 * Description:
 * This is the config file of requests getting from Hubot (further the bot)
 * The request is prepared for sending and getting information from SuiteCRM to use API 4.1
 * The protocol SOAP is used for integration
 * The file describes:
 * 1. General settings, objects - 'server', 'autoAnswers', 'formatFiled' and variable 'colorBorder'
 * 2. The parameters of data processing that are gotten from the bot - 'ress', including:
 * 2.1. The parameters of each request to SuiteCRM
 * 2.2. The data usage rules for the data which was got with previous requests from SuiteCRM
 * 2.3. The parameters of formatting data before sending them to bot
 * 3. Majority of the namings equal to SuiteCRM
 * The majority of the keys cannot be changed
 * The keys can be changed if the information presents in comment
 */
const structRequst={
    // There are parameters of request to server.
    server:{
        // There is lthe ink of wsdl scheme
        url:'http://suitecrm.example.com/service/v4_1/soap.php?wsdl',
        login:{
            // There are login and password to connect to SuiteCRM, the password is in format MD5
            user_auth:{
                user_name:'bot',
                password:'1234567890abcdef1234567890abcdef'}
        }
    },
    // There is the list of messages to chat user and to console
    autoAnswers:{
        firstWait:{toUser:'Now I will find out and tell you...'},
        noDate:{toUser:'No data for your query.'},
        errorServer:{toUser:'An error occurred while receiving data, please try again later.'},
        errorConfig:{
            toUser:'Configuration error, inform administrator.',
            toConsole:'Config.js file format error in object with request: '
        }
    },
    // There are parameters of format data of different types
    formatFiled:{
        // The date format
        date:{
            // Data format is as in the object: Intl.DateTimeFormat
            format:{'hour12':false,'timeZone':'Europe/Moscow','weekday':'long','year':'numeric','month':'long','day':'numeric','hour':'numeric','minute':'numeric','timeZoneName':'short'},
            // The language of date
            lang:'ru'
        },
        // The link format
        link:{
            // There is the prefix for the link if the prefix has not been loaded from SuiteCRM
            prefix:'http://'
        },
        // The text format
        text:{
            // There is the object to change symbols - 'got':'change'
            changes:{
                '&quot;':'"',
                '&#039;':"'"
            }
        }
    },
    // There is the color of the border while sending message to chat
    colorBorder:'#F08377',
    // There is the object of description of bot requests
    ress:{
        // There is the serial number of request
        0:{
            // This is the query of the chat user to bot in Regex javascript format
            res:'/.*(my companies|my clients|my accounts|mine companies|mine clients|mine accounts).*(entered|filled|created|made|done|issued).*(for the last week|for the last 7 days|in last week|last 7 days|for the previous week|for the previous 7 days|).*/i',
            // The request to SuiteCRM is making answer for user query (It is required parameter now with 'true')
            requestServer:true,
            // The object with the consistent requests to SuiteCRM
            // Two types of requests are using now: 'get_entry_list' and 'get_entries', according to documentation "API v4.1 Methods"
            // Look at the information about SuiteCRM methods here:
            // https://docs.suitecrm.com/developer/api/api-v4.1-methods/
            // The last function ('func') must be 'stop' every time
            // The methods of 'login' and 'logout' are called automatically by default 
            steps:{
                // There is the serial number of the step
                1:{
                    // The name of the method (full list is above)
                    func:'get_entry_list',
                    // This is the name of the module for request
                    module:'Users',
                    // This is the maximum of records in array of answers (If the parameter doesn't present the value is 50 by default)
                    max_results:100,
                    // This is the list of received fields
                    // The key is the name of the field in SuiteCRM
                    // The value of the record should be empty, it will be used in the future
                    resultFields:{'name':'','user_name':'','id':''}
                },
                2:{
                    func:'get_entry_list',
                    module:'Accounts',
                    max_results:100,
                    // The request to SuiteCRM is used for current chat user
                    // "currentUser" is a special object to select records from SuiteCRM for the current user of chat only
                    // Comparison of the users is made by the login name of SuiteCRM and Rocket.chat
                    // Don't change the format of this parameter!!! It will be used in the future
                    // The object should be included if you select the records of the current user from SuiteCRM only
                    // Make 'currentUser' object while using in the 'queryFields' object below:
                    // func:'get_entry_list',
                    // module:'Users',
                    // resultFields:{'user_name':'','id':''}
                    currentUser:{module:'Users',fieldName:'user_name',fieldID:'id',value:''},
                    // The list of the filters used in the method
                    // This is the commentary of the parameter from documentation in SuiteCRM: "An SQL WHERE clause to apply to the query."
                    // All filters are aggregated by 'AND'
                    // The format of filter:
                    // You can use 3 formats now: 'currentUser', 'datetime', 'list'
                    // You can find the description of each filter format in the place of using
                    queryFields:{
                        // There is the serial number of the filter
                        0:{
                            // This is name of the table from DB SuiteCRM
                            // Code is using module name of this step if the parameter 'table' is absent 
                            table:'accounts',
                            // The name of the field used for filter
                            field:'assigned_user_id',
                            // Select the records from SuiteCRM for the current Rocket.chat user only
                            type:'currentUser'
                        },
                        1:{
                            table:'accounts',
                            field:'date_entered',
                            // The value 'datetime' will be calculated based on data from the parametr 'condition' (see below) 
                            type:'datetime',
                            // The 'condition' supports 5 values now: 'today':0,'previousday':-1,'tomorrow':+1,'beforeweek':-7,'nextweek':+7
                            // Matching is made by range 'start date' and 'finish date' relatively to the current date
                            condition:'beforeweek'
                        }
                    },
                    resultFields:{
                        'name':'','date_entered':'','website':'','assigned_user_id':''
                    }
                },
                3:{
                    func:'get_entries',
                    module:'Employees',
                    // The name of module which is the source for parametr 'ids' of the current method of the request
                    // The data for the module should be received at one of the previous steps
                    parent_type:'Accounts',
                    // The field which is the source for 'ids'
                    parent_id:'assigned_user_id',
                    resultFields:{
                        'id':'',
                        'full_name':''
                    }
                },
                4:{
                    // The special function of this integration, it isn't a part of API
                    // The function should be the last step in the list
                    // The function does formatting and printing data
                    func:'stop',
                    // The name of module which will be the main for formatting data 
                    parent_type:'Accounts',
                    // The rules of formatting fields for preparation to output
                    formatFields:{
                        // The key can be any because the fields of different modules can be equal
                        'full_name':{
                            // This is the real field name for the module
                            // If the parameter 'name' is absent it is equal to the key of the object
                            name:'full_name',
                            // This is the module name if it isn't equal to parent module 'parent_type'
                            module:'Employees',
                            // The name of field of parent module where key for current module is stored 
                            parent_id:'assigned_user_id',
                            // The type of formatting of the field
                            // The list of available formats is mentioned in the object 'formatFiled' before
                            type:'text'
                        },
                        'name':{type:'text'},
                        'date_entered':{type:'date'},
                        'website':{type:'link'}
                    },
                    printFields:{
                        // The format of output results
                        // 2 variants are available: 'block' and 'string'
                        // The format 'string' has more priority
                        // There is example for 'string'
                        // There are 4 sections for 'block'
                        // The 'block' is used for output of links and images but can be used for fields only
                        block:{
                            // The header
                            // label - text is similar to the field label in SuiteCRM (LBL_...)
                            // filed - the name of the key from 'formatFields' previous object
                            name:{label:'Account:',field:'name'},
                            // The link
                            // title - the name of the key from 'formatFields' previous object
                            // title_link - The key name with type 'link' from 'formatFields' previous object
                            link:{title:'name',title_link:'website'},
                            // This is the list of addition fields
                            fields:{
                                // label - text is similar to the field label in SuiteCRM (LBL_...)
                                // filed - the name of the key from 'formatFields' previous object
                                1:{label:'date entered:',field:'date_entered'},
                                2:{label:'assigned to:',field:'full_name'}
                            },
                            // The link to the image
                            // filed - The key name with type 'link' which have link to image from 'formatFields' previous object
                            image_link:{filed:''}
                        }
                    }
                }
            }
        },
        1:{
            res:'/.*((all|overall|total|summary|general).*(open tasks|to do list|tasks in progress|tasks status in progress|list of tasks|to be done))|((where|how).*(to see all tasks)).*/i',
            requestServer:true,
            steps:{
                1:{
                    func:'get_entry_list',
                    module:'Tasks',
                    max_results:100,
                    queryFields:{
                        0:{
                            table:'tasks',
                            field:'status',
                            // list - the type is similar to 'enum' type of SuiteCRM
                            type:'list',
                            // value - the array must have equal values as 'options' parameter for the field of SuiteCRM
                            value:['In Progress']
                        }
                    },
                    resultFields:{'name':'','date_entered':'','date_due_date':'','assigned_user_name':''
                    }
                },
                2:{
                    func:'stop',
                    formatFields:{
                        'name':{type:'text'},'date_entered':{type:'date'},'date_due_date':{type:'date'},'assigned_user_name':{type:'text'}
                    },
                    printFields:{
                        // The format of output results
                        // label - text is similar to the field label in SuiteCRM (LBL_...)
                        // filed - the name of the key from 'formatFields' previous object
                        string:{
                            1:{label:'subject:',field:'name'},
                            2:{label:'assigned to:',field:'assigned_user_name'},
                            3:{label:'date entered:',field:'date_entered'}
                        }
                    }
                }
            }
        },
        2:{
            res:'/.*((my).*(open tasks|to do list|tasks in progress|tasks status in progress|list of tasks))|((where|how).*(to see my tasks))|(by me to be done)|(what to do for me).*/i',
            requestServer:true,
            steps:{
                1:{
                    func:'get_entry_list',
                    module:'Users',
                    max_results:100,
                    resultFields:{'name':'','user_name':'','id':''
                    }
                },
                2:{
                    func:'get_entry_list',
                    module:'Tasks',
                    max_results:100,
                    currentUser:{module:'Users',fieldName:'user_name',fieldID:'id',value:''},
                    queryFields:{
                        0:{
                            table:'tasks',field:'assigned_user_id',type:'currentUser'
                        },
                        // The format of filter:
                        1:{
                            table:'tasks',
                            field:'status',
                            // list - the type is similar to 'enum' type of SuiteCRM
                            type:'list',
                            // value - the array must have equal values as 'options' parameter for the field of SuiteCRM
                            value:['In Progress']
                        }
                    },
                    resultFields:{
                        'name':'','contact_name':'','parent_name':'','date_start':'','status':'','contact_id':'','assigned_user_id':''
                    }
                },
                3:{
                    func:'get_entries',
                    module:'Contacts',
                    parent_type:'Tasks',
                    parent_id:'contact_id',
                    resultFields:{
                        'id':'',
                        'email1':''
                    }
                },
                4:{
                    func:'stop',
                    parent_type:'Tasks',
                    formatFields:{
                        'user':{module:'Users','parent_id':'id',type:'text'},
                        'email':{name:'email1',module:'Contacts','parent_id':'contact_id',type:'text'},
                        'name':{type:'text'},
                        'contact_name':{type:'text'},
                        'parent_name':{type:'text'},
                        'date_start':{type:'date'},
                        'status':{type:'text'}
                    },
                    printFields:{
                        string:{
                            1:{label:'subject:',field:'name'},
                            2:{label:'related to:',field:'parent_name'},
                            3:{label:'contsct:',field:'contact_name'},
                            4:{label:'email:',field:'email'},
                            5:{label:'date start:',field:'date_start'}
                        }
                    }
                }
            }
        }
    }
};
module.exports={structRequst};

