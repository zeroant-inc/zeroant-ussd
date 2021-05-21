import { Request, Response } from "express";
import { Dispatcher } from "./event";

export const expressDispatcher = (dispatcher:Dispatcher,source:"query"|"body"="query") => async (req:Request,res:Response) =>{
    const listeners = dispatcher.listener;
    if(listeners.request) await listeners.request(req);
    let result =await dispatcher.run(req[source].action as string, req[source].content);
    if(Array.isArray(result)){
        result = result.join("\n");
    }
    if(listeners.response) result = await listeners.response(result);
    if(typeof result!=="string"){
        res.json(result);
    }
    res.send(result);
}
