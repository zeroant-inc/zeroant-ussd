# zeroant

THE JS WEAPON

# sample

<pre>
    import express from "express";
    import { expressDispatcher , Action, Dispatcher} from "zeroant-ussd";
    const app = express();
    const dispatcher = new Dispatcher({
        delimiter:"\*"
    });

    dispatcher.register("",new Action((event)=>{
        console.log(event);
        // default fall back
        return [
        `CON WELCOME TO USSD TEST FRAMEWORK`,
        `1 SIGNUP`,
        "2 HELP"
        ];
    }));
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
        // default fall back
        return [`END THANK YOU FOR USING USSD TEST FRAMEWORK`];
    }));
    app.use(expressDispatcher(dispatcher));
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`Application listening on port ${process.env.PORT || 3000}`);
    })
</pre>
