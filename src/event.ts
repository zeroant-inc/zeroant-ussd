type ActionHandler = (event:Event)=>any;
type  AsyncActionHandler = (event:Event)=>any;
class  EventError extends Error{

}
class EventHandler{
    event!:Event;
    constructor(private events:string[],private action:string, private explode:string){
        this.event = new Event(events,explode);
    }
    isValid(){
        const actions = this.action.split(this.explode);
        const eventsNotEqAction = this.events.length !== actions.length;
        const allowAction = actions.indexOf('(.?)')!==-1;
        for(let i=0;i<actions.length ;i++){
            const action = actions[i];
            const event = this.events[i];
            if(action==='(.?)'){
                return true; 
            }
            if(typeof event === "undefined"){
                return false;
            }
            if(eventsNotEqAction && !allowAction){
                return false;
            }
            else if(action.startsWith("(") && action.endsWith(')') && !(new RegExp(action).test(event))){
                return false; 
            }
            else if(action.startsWith(':')){
                this.event.params[action.substr(1)] = event;
            }
            else if(action.startsWith('<') && action.endsWith(">")){
                const [key,type,fallback] =  action.substr(1,action.length-2).split(":");
                if(!key || !type){
                    throw new EventError(`action.startsWith < must contain a key with a valid format of <key:value> or <key:value:default>\n default are using incase of empty string like ""  example <id:string> or <id:string:2>`);
                }
                if(!event){
                    this.event.params[key] = this.valueParser(fallback,type);
                }else{
                    this.event.params[key] = this.valueParser(event,type);
                } 
                if(!this.validType(key,type)){
                    return false;
                }
            }
            else if(action !==event){
                return false; 
            }  
        }
        return true; 
    }
    validType(key:string,keyType:string){
        const type = this.typeParser(keyType);
        if( typeof this.event.params[key]!==type){
            return false; 
        }
        if(type==="number" && Number.isNaN(this.event.params[key])){
            return false;
        }
        return true;
    }
    typeParser(type:string){
        switch(type){
            case "number":
            case "float":
            case "integer":
                return "number";
            case "string":
            default:
                return "string";
        } 
    }
    valueParser(value:string,type:string){
        switch(type){
            case "string":
                return String(value);
            case "number":
                return Number(value);
            case "float":
                return parseFloat(Number(value).toString());
            case "integer":
                return parseInt(Number(value).toString());
            case "boolean":
                if(value==="true" || value=== "yes"){
                    return true;
                }
                if(value==="false" || value === "no"){
                    return false;
                }
                return undefined;
            default:
                return undefined;
        }
    }
}
export interface DispatcherOptions{
    delimiter?:string;
}
type DispatcherOnReq = (req:any)=>unknown;
type DispatcherOnRes = (data:EventText|EventPayload,event:Event)=>Promise<EventText|EventPayload>|EventText|EventPayload;
export interface Dispatcher{
    on(type:'request',handler:DispatcherOnReq):Dispatcher;
    on(type:'response',handler:DispatcherOnRes):Dispatcher;
}
export class Dispatcher{
    private registry = new Map<string,Action>();
    private delimiter = "*";
    private listener_request?: DispatcherOnReq;
    private listener_response?: DispatcherOnRes;
    constructor(options:DispatcherOptions = {}){
     this.init(options);
    }
    private init(options:DispatcherOptions){
        if(options.delimiter){
            this.delimiter=options.delimiter;
        }
    }
    get listener(){
        return {
            request:this.listener_request,
            response:this.listener_response,
        }
    }
    on(type:'request'|'response',handler:DispatcherOnReq|DispatcherOnRes){
        if(type ==='request' ){
            this.listener_request=handler as DispatcherOnReq;
        }
        if(type ==='response'){
            this.listener_response=handler as DispatcherOnRes; 
        }
        return this;
    }
    register(name:string,action:Action){
        this.registry.set(name,action);
    }
    async run<T=unknown>(event:string,data:Record<any,any>):Promise<T>{
        if(event === undefined){
           throw new EventError("Event can't be empty");
        }
        const actions = this.registry.keys();
        const events = event.split(this.delimiter);
        for (const action of actions){
            const eventHandler =  new EventHandler(events,action, this.delimiter);
            if(eventHandler.isValid()){
                const actionHandler = this.registry.get(action) as Action;
                eventHandler.event.data = data;
                let result = await actionHandler.run<Promise<T>>(eventHandler.event)
                if(Array.isArray(result)){
                    result = result.join("\n") as unknown as T;
                }
                if(typeof result ==="string"){
                    result = new EventText(result) as unknown as T;
                }
                if(this.listener_response) {
                    result = await this.listener_response(result as any,eventHandler.event) as unknown as T;
                }
                return result;
            }
        } 
        throw new EventError("No action found for this event"); 
    }
}
export interface Event{
    con(arg:string,...args:string[]):string[];
    con(arg:Record<string,any>):EventPayload;
    end(arg:string,...args:string[]):string[];
    end(arg:Record<string,any>):EventPayload;
}
export class Event{
    constructor(public events: string[],public delimiter:string){}
    params:Record<string,string|number|boolean|undefined> = {};
    data:Record<string,any> = {}; 
    get name(){
       return this.events.join(this.delimiter);
    }
    con(arg:string|Record<string,any>,...args:string[]):string[]|Record<string,any>{
        if(typeof arg ==="string"){
            return  ["CON ".concat(arg), ...args];
        }
        return new EventPayload("CON",arg);
    }
    end(arg:string|Record<string,any>,...args:string[]):string[]|Record<string,any>{
        if(typeof arg ==="string"){
            return  ["END ".concat(arg), ...args];
        }
        return new EventPayload("END",arg);
    }
}

export class Action{
    private listener: Record<'before'|'after', ActionHandler|AsyncActionHandler> = {
        'before': ()=>{},
        'after': ()=>{} 
    };
    constructor(public handler:ActionHandler|AsyncActionHandler){
    }
    on(type:'before'|'after',handler:ActionHandler|AsyncActionHandler|undefined|null){
        if(handler===undefined || handler==null){
           this.listener[type]=()=>{};
           return this;
        }
        this.listener[type]=handler;
        return this;
    }
    async run<T>(event:Event):Promise<T>{
        let result = await this.listener.before(event) as T;
        if(result !==undefined)return result;
        result = await this.handler(event) as T;
        await this.listener.after(event);
        return result;    
    }
}
export interface  EventText{
    type:"CON"|"END";
}
export class EventText extends String{
    constructor(value:any){
        super(value);
        const type = this.substr(0,3).trim();
        Object.defineProperty(this,'type',{
            get:function(){
                return type;
            }
        })
    }
    get isCon(){
        return this.type==="CON";
    }
    get isEnd(){
        return this.type==="END";
    }
    get text(){
        return this.substr(4);
    }
}
export interface EventPayload{
    type:"CON"|"END";
    contentType:string;
    payload:any;
}
export class EventPayload{
    constructor( type:"CON"|"END",payload:Record<string,any>|string,contentType?:string){
       Object.defineProperty(this,'type',{
           get:function(){
               return type;
           }
       });
       Object.defineProperty(this,'payload',{
        get:function(){
            return payload;
        }
    });
    
    Object.defineProperty(this,'contentType',{
        get:function(){
            if(contentType)return contentType;
            if(typeof payload === "string"){
                return "text/pain";
            }
            return  "application/json";
        }
    });
   
    }
    get isCon(){
        return this.type==="CON";
    }
    get isEnd(){
        return this.type==="END";
    }
}