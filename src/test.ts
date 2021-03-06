import express, { Request } from "express";
import { expressDispatcher } from "./express";
import { Action, Dispatcher } from "./event"
const app = express();
const dispatcher = new Dispatcher({
    delimiter:"*"
});

dispatcher.register("",new Action((event)=>{
    console.log(event);
    // default fall back
    return event.con(
        `WELCOME TO USSD TEST FRAMEWORK`,
        `1 SIGNUP`,
        "2 HELP"
    );
}));
dispatcher.register("a",new Action((event)=>{
 console.log(event);
 return event.end("i was here");
}));
dispatcher.register("1",new Action((event)=>{
    console.log(event);
    return event.con(`What is Your Name`);
}));
dispatcher.register("1*<name:integer>",new Action((event)=>{
    console.log(event);
    return event.end(`You have entered an invalid name`);
}));
dispatcher.register("1*<name:string>",new Action((event)=>{
    console.log(event);
    return event.con(`What is Your Email`);
}));

dispatcher.register("1*<name:string>*<email:string>",new Action((event)=>{
    console.log(event);
    return event.end(
        `YOUR PROFILE HAS BEEN CREATED`,
        `NAME:${event.params.name}`,
        `EMAIL:${event.params.email}`);
}));
dispatcher.register("2",new Action((event)=>{
    console.log(event);
    return event.con(`WELCOME TO YOUR HELP PAGE`,`PELASE ENTER YOUR USERNAME:`);
}));
dispatcher.register("2*:user",new Action((event)=>{
    console.log(event);
    return event.con(`YOUR USERNAME IS`, `${event.params.user}`);
}));
dispatcher.register(
    "2*:user*(.?)",
    new Action((event) => {
      console.log(event);
      return event.con(
        `YOUR USERNAME IS`,
        `${event.params.user} => ${event.name}`,
        `last input => ${event.events[event.events.length-1]}`

      );
    })
  );
dispatcher.register("(.?)",new Action((event)=>{
    return event.end(`THANK YOU FOR USING USSD TEST FRAMEWORK`);
}).on('before',(event)=>{
    console.log("Event BEFORE START");
    if(event.data){
        return event.end(`AN ERROR OCCURE WHILE TRYING TO COMPLETE YOUR REQUEST`);
    }
}).on('after',(event)=>{
    console.log(event,"Event Ended");
}));
dispatcher.on('request',(req:Request)=>{
    // push data to event through (params|query|body).content
    const user = {
        action: "1*Michael",
        remember: false,
        msisdn:req.query.msisdn
    };
    /**
     *  req.params.action = req.body.text as string; 
     *  or
     *  req.params.action = req.query.text as string;
     *  not that the req.(query|body)[your action] can be any keyword
     */
    req.params.action = req.query.text as string || '';
    // remember to save to session while using remember me
    if(user.remember){
        req.params.action = user.action;
    }
    req.params.content = user as any;
    
});

dispatcher.on('response',(data:any)=>{
    // transform data to match ussd provider
    console.log({data});
    return data;
});
app.use(expressDispatcher(dispatcher,"params"));
app.listen(process.env.PORT || 3000,()=>{
    console.log(`Application listening on port ${process.env.PORT || 3000}`);
})