import { Request, Response } from "express";
import { Dispatcher, EventPayload, EventText } from "./event";

export const expressDispatcher = (dispatcher:Dispatcher,source:"query"|"body"|"params"="params") => async (req:Request,res:Response) =>{
    const listeners = dispatcher.listener.request;
    if(listeners) await listeners(req);
    let result = await dispatcher.run<EventText|EventPayload>(req[source].action as string, req[source].content);
    if(result instanceof EventText){ 
       return res.send(result.toString());
    }
    res.send(result);  
}
