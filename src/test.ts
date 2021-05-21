import express from "express";
import {Action, Dispatcher} from "."
const app = express();
const dispatcher = new Dispatcher({
    delimiter:"*"
});

dispatcher.register("a",new Action((event)=>{
 console.log(event);
 return "END i was here";
}));
dispatcher.register("1",new Action((event)=>{
    console.log(event);
    return `What is Your Name`;
}));
dispatcher.register("1*<name:string>",new Action((event)=>{
    console.log(event);
    return `What is Your Email`;
}));
dispatcher.register("1*<name:string>*<email:string>",new Action((event)=>{
    console.log(event);
    return [
        `YOUR PROFILE HAVE BEEN CREATED`,
    `NAME:${event.params.name}`,
    `EMAIL:${event.params.email}`
];
}));
dispatcher.register("(.?)",new Action((event)=>{
    console.log(event);
    return [
        `CON WELCOME TO USSD TEST FRAMEWORK`,
        `1 SIGNUP`
    ];
}));
app.use((req,res)=>{
    const result =dispatcher.run(req.query.action as string, req.query.content as string);
    if(Array.isArray(result)){
        return res.send(result.join("\n"));
    }
    res.send(result);
});
app.listen(process.env.PORT || 3000,()=>{
    console.log(`Application listening on port ${process.env.PORT || 3000}`);
})