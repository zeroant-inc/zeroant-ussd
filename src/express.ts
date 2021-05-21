import { Request, Response } from "express";
import { Dispatcher } from "./event";

export const expressDispatcher = (dispatcher:Dispatcher,source:"query"|"body"="query") => (req:Request,res:Response) =>{
    const result =dispatcher.run(req[source].action as string, req[source].content);
    if(Array.isArray(result)){
        return res.send(result.join("\n"));
    }
    if(typeof result!=="string"){
        res.json(result);
    }
    res.send(result);
}
