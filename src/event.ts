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
        if(actions.indexOf('(.?)')!==-1){
            return true; 
        }
        if(this.events.length !== actions.length){
            return false;
        }
        for(let i=0;i<actions.length ;i++){
            const action = actions[i];
            const event =  this.events[i];

            if(typeof event === "undefined"){
                return false;
            }
            else if(action.startsWith("(") && action.endsWith(')') && !(new RegExp(action).test(event))){
                return false; 
            }
            else if(action.startsWith(':')){
                this.event.params[action.substr(1)] = event;
            }
            else if(action.startsWith('<') && action.endsWith(">")){
                const [key,type,fallback=""] =  action.substr(1).substring(-1).split(":");
                if(!key || !type){
                    throw new EventError(`action.startsWith < must contain a key with a valid format of <key:value> or <key:value:default>\n default are using incase of empty string like ""  example <id:string> or <id:string:2>`);
                }
                if(!event){
                    this.event.params[key] = this.valueParser(fallback,type);
                }else{
                    this.event.params[key] = this.valueParser(event,type);
                } 
            }
            else if(action !==event){
                return false; 
            }  
        }
        return true; 
    }
    valueParser(value:string,type:string){
        switch(type){
            case "string":
                return String(value);
            case "number":
                return Number(value);
            case "float":
                return parseFloat(value);
            case "integer":
                return parseInt(value);
            default:
                return value;
        }
    }
}
export interface DispatcherOptions{
    delimiter?:string;
}
type DispatcherOnReq = (req:any)=>unknown;
type DispatcherOnRes = (data:any)=>unknown;
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
    async run<T>(event:string,data:string|Record<any,any>):Promise<T>{
        if(event === undefined){
           throw new EventError("Event can't be empty");
        }
        const actions = this.registry.keys();
        const events = event.split(this.delimiter);
        for (const action of actions){
            const eventHandler =  new EventHandler(events,action, this.delimiter);
            // event.
            if(eventHandler.isValid()){
                const actionHandler = this.registry.get(action) as Action;
                eventHandler.event.data = data;
                return await actionHandler.run<Promise<T>>(eventHandler.event)
            }
        } 
        throw new EventError("No action found for this event"); 
    }
}
class Event{
    constructor(public events: string[],public delimiter:string){}
    params:Record<string,string|number> = {};
    data:string|Record<string,any> = {}; 
    get name(){
       return this.events.join(this.delimiter);
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